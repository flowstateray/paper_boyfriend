import { NextResponse } from 'next/server';
import { checkR2Health } from '@/lib/r2';

export async function GET() {
  try {
    const r2Endpoint = process.env.R2_ENDPOINT;
    const r2BucketName = process.env.R2_BUCKET_NAME;
    const r2PublicUrl = process.env.R2_PUBLIC_URL;

    const configStatus = {
      R2_ENDPOINT: !!r2Endpoint,
      R2_BUCKET_NAME: !!r2BucketName,
      R2_PUBLIC_URL: !!r2PublicUrl,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    };

    const health = await checkR2Health();

    let publicUrlAccessible = 'unknown';
    let publicUrlError: string | null = null;

    if (r2PublicUrl) {
      try {
        const response = await fetch(`${r2PublicUrl}/`, { method: 'HEAD' });
        publicUrlAccessible = response.ok ? 'accessible' : 'inaccessible';
        if (!response.ok) {
          publicUrlError = `HTTP ${response.status}`;
        }
      } catch (error) {
        publicUrlAccessible = 'failed';
        publicUrlError = (error as Error).message;
      }
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: Date.now(),
      config: configStatus,
      allConfigured: health.configured,
      connection: {
        status: health.connection,
        error: health.error,
      },
      bucket: {
        name: r2BucketName,
        objectCount: health.objectCount,
        sampleObjects: health.sampleObjects,
      },
      publicUrl: {
        url: r2PublicUrl,
        accessible: publicUrlAccessible,
        error: publicUrlError,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: (error as Error).message },
      { status: 500 }
    );
  }
}