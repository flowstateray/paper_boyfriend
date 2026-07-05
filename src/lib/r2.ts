import { S3Client, PutObjectCommand, S3ServiceException, ListObjectsV2Command } from '@aws-sdk/client-s3';

const r2Endpoint = process.env.R2_ENDPOINT;
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2PublicUrl = process.env.R2_PUBLIC_URL;

if (!r2Endpoint || !r2BucketName || !r2PublicUrl) {
  console.error('[R2] Missing environment variables');
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Endpoint}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function checkR2Health() {
  const status = {
    configured: !!(r2Endpoint && r2BucketName && r2PublicUrl && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
    connection: 'unknown' as 'unknown' | 'connected' | 'failed',
    error: null as string | null,
    objectCount: 0,
    sampleObjects: [] as Array<{ key: string; url: string }>,
  };

  if (!status.configured) {
    return status;
  }

  try {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: r2BucketName,
        MaxKeys: 5,
      })
    );

    status.connection = 'connected';
    status.objectCount = response.KeyCount || 0;

    if (response.Contents && response.Contents.length > 0) {
      status.sampleObjects = response.Contents.map(item => ({
        key: item.Key || '',
        url: r2PublicUrl ? `${r2PublicUrl}/${item.Key}` : '',
      }));
    }
  } catch (error) {
    status.connection = 'failed';
    status.error = (error as Error).message;
  }

  return status;
}

export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  console.log(`[R2] Attempting to upload: ${fileName}, size: ${fileBuffer.length} bytes`);
  
  try {
    const response = await s3Client.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );
    
    const permanentUrl = `${r2PublicUrl}/${fileName}`;
    console.log(`[R2] Upload successful: ${permanentUrl}, ETag: ${response.ETag}`);
    return permanentUrl;
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error(`[R2] Upload failed - Code: ${error.name}, Message: ${error.message}, Status: ${error.$metadata.httpStatusCode}`);
      console.error(`[R2] Request ID: ${error.$metadata.requestId}`);
    } else {
      console.error(`[R2] Upload failed - Unknown error:`, error);
    }
    throw error;
  }
}