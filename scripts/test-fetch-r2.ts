import { config } from 'dotenv';
config({ path: '.env.local' });

async function runTest() {
  console.log('=== Fetch Test for R2 ===');
  
  const accountId = process.env.R2_ENDPOINT;
  const apiEndpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  
  console.log(`\nTesting API endpoint: ${apiEndpoint}`);
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ Response status:', response.status);
    console.log('Response body:', await response.text());
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    if (error instanceof Error && 'cause' in error) {
      console.log('Cause:', (error as any).cause);
    }
  }
  
  console.log('\nTesting public URL:');
  try {
    const response = await fetch(process.env.R2_PUBLIC_URL!);
    console.log('✅ Response status:', response.status);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
}

runTest();