import { config } from 'dotenv';
config({ path: '.env.local' });

import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

async function runTest() {
  console.log('=== R2 Alternative Test ===');
  
  const accountId = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  
  console.log('\n=== Test 1: Using account ID as endpoint ===');
  
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    forcePathStyle: true,
  });

  try {
    const listCommand = new ListBucketsCommand({});
    const response = await s3Client.send(listCommand);
    console.log('✅ List Buckets successful!');
    console.log('Buckets:', response.Buckets?.map(b => b.Name));
  } catch (error) {
    console.error('❌ List Buckets Error:', (error as Error).message);
    if (error instanceof Error && 'code' in error) {
      console.log('Error Code:', (error as any).code);
    }
  }

  console.log('\n=== Test 2: Using public URL as endpoint ===');
  
  const s3Client2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_PUBLIC_URL,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    forcePathStyle: true,
  });

  try {
    const listCommand = new ListBucketsCommand({});
    const response = await s3Client2.send(listCommand);
    console.log('✅ List Buckets successful!');
    console.log('Buckets:', response.Buckets?.map(b => b.Name));
  } catch (error) {
    console.error('❌ List Buckets Error:', (error as Error).message);
    if (error instanceof Error && 'code' in error) {
      console.log('Error Code:', (error as any).code);
    }
  }
}

runTest();