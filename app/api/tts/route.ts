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
  'zh_male_taocheng_uranus_bigtts': 'zh_male_taocheng',
  'zh_male_m191_uranus_bigtts': 'zh_male_m191',
  'zh_female_vv_uranus_bigtts': 'zh_female_vv',
};

async function fetchEdgeTTS(text: string, speaker: string): Promise<string> {
  const voice = EDGE_VOICES[speaker] || 'zh-CN-YunxiNeural';
  
  const response = await fetch('https://edge.microsoft.com/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    },
    body: JSON.stringify({
      text,
      voiceName: voice,
      language: 'zh-CN',
      outputFormat: 'audio-16khz-32kbitrate-mono-mp3',
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Edge TTS request failed: ${response.status}`);
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

  const voice = VOLC_VOICES[speaker] || 'zh_male_taocheng';

  const response = await fetch(`https://openspeech.bytedance.net/api/v1/tts?voice_name=${voice}&language=zh&encoding=mp3`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-App-Id': appId,
      'X-Api-Access-Key': accessKey,
    },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Volc TTS request failed: ${response.status} - ${errorBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:audio/mp3;base64,${base64}`;
}

async function fetchAzureTTS(text: string, speaker: string): Promise<string> {
  const azureKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
  const azureRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION || 'eastasia';

  if (!azureKey) {
    throw new Error('Azure TTS credentials not configured');
  }

  const voice = EDGE_VOICES[speaker] || 'zh-CN-YunxiNeural';

  const response = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
      'Ocp-Apim-Subscription-Key': azureKey,
    },
    body: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="${voice}">${text}</voice></speak>`,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Azure TTS request failed: ${response.status}`);
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

    const useAzure = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
    const useVolc = process.env.NEXT_PUBLIC_VOLC_APP_ID && process.env.NEXT_PUBLIC_VOLC_ACCESS_KEY;

    let audioUri: string;

    if (useAzure) {
      try {
        audioUri = await fetchAzureTTS(text, speaker);
      } catch (azureError) {
        console.warn('Azure TTS failed:', azureError);
        audioUri = await fetchEdgeTTS(text, speaker);
      }
    } else if (useVolc) {
      try {
        audioUri = await fetchVolcTTS(text, speaker);
      } catch (volcError) {
        console.warn('Volc TTS failed:', volcError);
        audioUri = await fetchEdgeTTS(text, speaker);
      }
    } else {
      audioUri = await fetchEdgeTTS(text, speaker);
    }

    return NextResponse.json({
      audioUri,
      audioSize: audioUri.length,
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ audioUri: '', audioSize: 0, error: (error as Error).message });
  }
}