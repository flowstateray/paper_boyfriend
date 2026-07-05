import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { uploadToR2 } from '../src/lib/r2';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const TEST_USER_ID = 'test-image-user';
const TEST_CHARACTER_ID = 'warm-boy';

async function runTest() {
  console.log('\n=== 图片生成与 R2 上传流程测试 ===\n');

  try {
    const testPrompt = '一个帅气的男生在海边散步，夕阳西下';
    console.log(`📝 测试 Prompt: ${testPrompt}`);

    console.log('\n--- 步骤1: 调用 AI 图片生成 ---');
    const pollinationsBase = process.env.NEXT_PUBLIC_POLLINATIONS_BASE || 'https://image.pollinations.ai';
    const enhancedPrompt = `male character, ${testPrompt}。anime style, high quality, detailed, full body or portrait, 8k resolution。不要出现文字。`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const tempImageUrl = `${pollinationsBase}/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
    console.log(`🌐 临时图片链接: ${tempImageUrl}`);

    console.log('\n--- 步骤2: 下载图片 ---');
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`图片下载失败: ${imageResponse.status}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    console.log(`📥 图片下载成功，大小: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    console.log('\n--- 步骤3: 上传到 R2 ---');
    const fileName = `images/${nanoid()}.png`;
    const permanentUrl = await uploadToR2(imageBuffer, fileName, 'image/png');
    console.log(`☁️ 上传到 R2 成功`);
    console.log(`🔗 永久链接: ${permanentUrl}`);

    console.log('\n--- 步骤4: 验证 R2 链接可访问 ---');
    const r2Response = await fetch(permanentUrl);
    if (!r2Response.ok) {
      throw new Error(`R2 链接访问失败: ${r2Response.status}`);
    }
    const r2Buffer = Buffer.from(await r2Response.arrayBuffer());
    console.log(`✅ R2 链接可正常访问，图片大小: ${(r2Buffer.length / 1024).toFixed(2)} KB`);

    console.log('\n--- 步骤5: 保存到数据库 ---');
    let session = await prisma.session.findFirst({
      where: { userId: TEST_USER_ID, characterId: TEST_CHARACTER_ID },
    });

    if (!session) {
      session = await prisma.session.create({
        data: {
          userId: TEST_USER_ID,
          characterId: TEST_CHARACTER_ID,
          characterName: '林屿',
        },
      });
      console.log(`📋 创建新会话: ${session.id}`);
    }

    const imageMessage = await prisma.message.create({
      data: {
        id: `img-${Date.now()}`,
        sessionId: session.id,
        role: 'assistant',
        type: 'image',
        content: testPrompt,
        imageUri: permanentUrl,
      },
    });
    console.log(`✅ 图片消息已保存到数据库`);
    console.log(`   messageId: ${imageMessage.id}`);
    console.log(`   imageUri: ${imageMessage.imageUri}`);

    console.log('\n--- 步骤6: 从数据库读取验证 ---');
    const savedMessage = await prisma.message.findFirst({
      where: { id: imageMessage.id },
    });
    if (savedMessage && savedMessage.imageUri === permanentUrl) {
      console.log(`✅ 数据库读取验证通过`);
    } else {
      throw new Error('数据库读取验证失败');
    }

    console.log('\n=== 测试结果 ===');
    console.log('🎉 所有测试通过！图片生成与 R2 上传流程正常');
    console.log(`\n📊 流程总结:`);
    console.log(`  - AI 生成: ✅ 成功`);
    console.log(`  - 图片下载: ✅ 成功 (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
    console.log(`  - R2 上传: ✅ 成功`);
    console.log(`  - R2 访问: ✅ 成功`);
    console.log(`  - 数据库保存: ✅ 成功`);
    console.log(`\n🔗 最终图片链接: ${permanentUrl}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 测试失败:', (error as Error).message);
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('❌ 测试出错:', error);
  process.exit(1);
});