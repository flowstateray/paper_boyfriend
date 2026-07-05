import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID, randomBytes } from 'crypto';
import WebSocket from 'ws';

interface TTSRequest {
  text: string;
  speaker: string;
  uid: string;
}

// 角色 speaker ID → Edge 神经音色映射
const EDGE_VOICES: Record<string, string> = {
  'zh_male_taocheng_uranus_bigtts': 'zh-CN-YunxiNeural',
  'zh_male_m191_uranus_bigtts': 'zh-CN-YunjianNeural',
  'zh_female_vv_uranus_bigtts': 'zh-CN-XiaoxiaoNeural',
};

// Edge TTS 免费服务（speech.platform.bing.com WebSocket 协议）
// 常量与算法对齐 rany2/edge-tts 最新源码
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WIN_EPOCH = 11644473600;
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0];
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`;

// 生成 Sec-MS-GEC 鉴权 token：5分钟时间窗口 + 固定密钥的 SHA256
function generateSecMsGec(): string {
  let ticks = Math.floor(Date.now() / 1000) + WIN_EPOCH;
  ticks -= ticks % 300; // 对齐到 5 分钟窗口
  ticks = ticks * 10000000; // 转 100ns 单位（Windows file time）
  const strToHash = `${ticks}${TRUSTED_CLIENT_TOKEN}`;
  return createHash('sha256').update(strToHash).digest('hex').toUpperCase();
}

// 生成随机 MUID（Cookie 用，对齐 secrets.token_hex(16).upper()）
function generateMuid(): string {
  return randomBytes(16).toString('hex').toUpperCase();
}

// JS 风格日期字符串（对齐 edge-tts date_to_string）
function jsDateString(): string {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${days[d.getUTCDay()]} ${months[d.getUTCMonth()]} ${pad(d.getUTCDate())} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

async function fetchEdgeTTS(text: string, speaker: string): Promise<string> {
  const voice = EDGE_VOICES[speaker] || 'zh-CN-YunxiNeural';
  const connectionId = randomUUID().replace(/-/g, '');
  const wsUrl = `${WSS_URL}&ConnectionId=${connectionId}&Sec-MS-GEC=${generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;
  const muid = generateMuid();

  return new Promise<string>((resolve, reject) => {
    // 对齐 edge-tts WSS_HEADERS + DRM.headers_with_muid
    // 微软服务校验 Origin/UA/muid，缺失则握手 403
    const ws = new WebSocket(wsUrl, {
      headers: {
        'User-Agent': UA,
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'Sec-WebSocket-Version': '13',
        'Cookie': `muid=${muid};`,
      },
    });

    const audioChunks: Buffer[] = [];
    const requestId = randomUUID().replace(/-/g, '');
    const ts = jsDateString();

    const timeout = setTimeout(() => {
      try { ws.close(); } catch { /* noop */ }
      reject(new Error('Edge TTS timeout (15s)'));
    }, 15000);

    ws.on('open', () => {
      // 1. 配置消息：声明输出格式
      const config =
        `X-Timestamp:${ts}\r\n` +
        'Content-Type:application/json; charset=utf-8\r\n' +
        'Path:speech.config\r\n\r\n' +
        '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}';
      ws.send(config);

      // 2. SSML 合成消息（X-Timestamp 末尾加 Z 是 Edge 的 bug，照搬源码）
      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
        `<voice name='${voice}'>` +
        `<prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(text)}</prosody>` +
        `</voice></speak>`;
      const ssmlMsg =
        `X-RequestId:${requestId}\r\n` +
        'Content-Type:application/ssml+xml\r\n' +
        `X-Timestamp:${ts}Z\r\n` +
        'Path:ssml\r\n\r\n' +
        ssml;
      ws.send(ssmlMsg);
    });

    ws.on('message', (data: Buffer, isBinary: boolean) => {
      if (isBinary) {
        // 二进制帧：前 2 字节是头长度（big-endian uint16），其后是音频数据
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        if (buf.length < 2) return;
        const headerLen = buf.readUInt16BE(0);
        const audio = buf.subarray(2 + headerLen);
        if (audio.length > 0) audioChunks.push(audio);
      } else {
        // 文本帧：检查是否结束
        const str = data.toString('utf8');
        if (str.includes('Path:turn.end')) {
          clearTimeout(timeout);
          try { ws.close(); } catch { /* noop */ }
          if (audioChunks.length === 0) {
            reject(new Error('Edge TTS: no audio received'));
            return;
          }
          const fullAudio = Buffer.concat(audioChunks);
          const base64 = fullAudio.toString('base64');
          resolve(`data:audio/mp3;base64,${base64}`);
        }
      }
    });

    ws.on('error', (err: Error) => {
      clearTimeout(timeout);
      reject(new Error(`Edge TTS WebSocket error: ${err.message}`));
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const { text, speaker }: TTSRequest = await request.json();

    if (!text.trim()) {
      return NextResponse.json({ audioUri: '', audioSize: 0 });
    }

    // 采用微软 Edge 免费音频（云端部署主用方案，走 speech.platform.bing.com WebSocket）
    const audioUri = await fetchEdgeTTS(text, speaker);

    return NextResponse.json({
      audioUri,
      audioSize: audioUri.length,
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ audioUri: '', audioSize: 0, error: (error as Error).message });
  }
}
