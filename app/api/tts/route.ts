import { NextRequest, NextResponse } from 'next/server';

interface TTSRequest {
  text: string;
  speaker: string;
  uid: string;
}

const EDGE_VOICES: Record<string, string> = {
  'zh_male_taocheng_uranus_bigtts': 'zh-CN-YunxiNeural',
  'zh_male_m191_uranus_bigtts': 'zh-CN-YunjianNeural',
  'zh_female_vv_uranus_bigtts': 'zh-CN-XiaoxiaoNeural',
};

const VOLC_VOICES: Record<string, string> = {
  'zh_male_taocheng_uranus_bigtts': 'zh_male_taocheng_uranus_bigtts',
  'zh_male_m191_uranus_bigtts': 'zh_male_m191_uranus_bigtts',
  'zh_female_vv_uranus_bigtts': 'zh_female_vv_uranus_bigtts',
};

async function fetchEdgeTTS(text: string, speaker: string): Promise<string> {
  const voice = EDGE_VOICES[speaker] || 'zh-CN-YunxiNeural';
  const response = await fetch('https://api.tts.edge.microsoft.com/cognitiveservices/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
    },
    body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="${voice}">${text}</voice></speak>`,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error('Edge TTS request failed');
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:audio/mp3;base64,${base64}`;
}

async function fetchVolcTTS(text: string, speaker: string): Promise<string> {
  const appId = process.env.NEXT_PUBLIC_VOLC_APP_ID;
  const accessKey = process.env.NEXT_PUBLIC_VOLC_ACCESS_KEY;

  if (!appId || !accessKey) {
    throw new Error('Volc TTS credentials not configured');
  }

  const voice = VOLC_VOICES[speaker] || 'zh_male_taocheng_uranus_bigtts';

  const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-App-Id': appId,
      'X-Api-Access-Key': accessKey,
      'X-Api-Resource-Id': 'seed-tts-2.0',
    },
    body: JSON.stringify({
      text,
      speaker: voice,
      audio_params: {
        audio_format: 'mp3',
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error('Volc TTS request failed');
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:audio/mp3;base64,${base64}`;
}

export async function POST(request: NextRequest) {
  try {
    const { text, speaker }: TTSRequest = await request.json();

    if (!text.trim()) {
      return NextResponse.json({ audioUri: '', audioSize: 0 });
    }

    const useVolc = process.env.NEXT_PUBLIC_VOLC_APP_ID && process.env.NEXT_PUBLIC_VOLC_ACCESS_KEY;
    let audioUri: string;

    if (useVolc) {
      audioUri = await fetchVolcTTS(text, speaker);
    } else {
      audioUri = await fetchEdgeTTS(text, speaker);
    }

    return NextResponse.json({
      audioUri,
      audioSize: audioUri.length,
    });
  } catch {
    return NextResponse.json({ audioUri: '', audioSize: 0 });
  }
}