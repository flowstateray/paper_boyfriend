import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USER_ID = 'test-automated-user';
const TEST_CHARACTER_ID = 'warm-boy';
const TEST_CHARACTER_NAME = '林屿';

const testMessages = [
  { role: 'user' as const, type: 'text' as const, content: '你好呀，林屿！' },
  { role: 'character' as const, type: 'text' as const, content: '你好！很高兴见到你～' },
  { role: 'user' as const, type: 'text' as const, content: '今天天气怎么样？' },
  { role: 'character' as const, type: 'text' as const, content: '今天阳光明媚，心情也跟着晴朗起来！' },
  { role: 'user' as const, type: 'text' as const, content: '你喜欢做什么？' },
  { role: 'character' as const, type: 'text' as const, content: '我喜欢看书、听音乐，还有陪你聊天呀～' },
];

async function runTest() {
  console.log('\n=== 数据库自动保存和加载测试 ===\n');

  try {
    await prisma.message.deleteMany({
      where: {
        session: {
          userId: TEST_USER_ID,
          characterId: TEST_CHARACTER_ID,
        },
      },
    });
    await prisma.session.deleteMany({
      where: {
        userId: TEST_USER_ID,
        characterId: TEST_CHARACTER_ID,
      },
    });
    console.log('✓ 清理测试数据完成');
  } catch {
    console.log('• 无旧测试数据，跳过清理');
  }

  let session = await prisma.session.findFirst({
    where: { userId: TEST_USER_ID, characterId: TEST_CHARACTER_ID },
  });

  if (!session) {
    session = await prisma.session.create({
      data: {
        userId: TEST_USER_ID,
        characterId: TEST_CHARACTER_ID,
        characterName: TEST_CHARACTER_NAME,
      },
    });
    console.log(`✓ 创建新会话: ${session.id}`);
  } else {
    console.log(`• 使用已有会话: ${session.id}`);
  }

  const sessionId = session.id;

  const messagesToSave = testMessages.map((msg, index) => ({
    id: `msg-${Date.now()}-${index}`,
    sessionId,
    role: msg.role,
    type: msg.type,
    content: msg.content,
    timestamp: new Date(Date.now() + index * 1000),
  }));

  await prisma.message.createMany({
    data: messagesToSave,
  });
  console.log(`✓ 保存 ${messagesToSave.length} 条消息到数据库`);

  const savedMessages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
  });
  console.log(`✓ 从数据库读取到 ${savedMessages.length} 条消息`);

  console.log('\n--- 消息内容验证 ---');
  let allMatch = true;
  for (let i = 0; i < testMessages.length; i++) {
    const expected = testMessages[i];
    const actual = savedMessages[i];
    
    if (!actual) {
      console.log(`✗ 第 ${i + 1} 条消息缺失`);
      allMatch = false;
      continue;
    }

    const match = actual.role === expected.role && 
                  actual.type === expected.type && 
                  actual.content === expected.content;
    
    if (match) {
      console.log(`✓ 消息 ${i + 1}: [${expected.role}] ${expected.content.substring(0, 20)}...`);
    } else {
      console.log(`✗ 消息 ${i + 1}: 内容不匹配`);
      allMatch = false;
    }
  }

  const sessionWithMessages = await prisma.session.findFirst({
    where: { id: sessionId },
    include: { messages: { orderBy: { timestamp: 'asc' } } },
  });

  const loadedMessagesCount = sessionWithMessages?.messages.length || 0;
  console.log(`\n✓ 通过会话加载消息: ${loadedMessagesCount} 条`);

  console.log('\n=== 测试结果 ===');
  if (allMatch && loadedMessagesCount === testMessages.length) {
    console.log('✅ 所有测试通过！数据库自动保存和加载功能正常');
    process.exit(0);
  } else {
    console.log('❌ 测试失败');
    process.exit(1);
  }
}

runTest().catch(error => {
  console.error('❌ 测试出错:', error);
  process.exit(1);
});
