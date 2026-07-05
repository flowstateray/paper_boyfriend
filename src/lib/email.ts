import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
) {
  const startTime = Date.now();

  console.log('[Email] ───────────────────────────────────────────────────────');
  console.log('[Email] [START] sendWelcomeEmail called');
  console.log('[Email] [PARAMS] userEmail:', userEmail);
  console.log('[Email] [PARAMS] userName:', userName);
  console.log('[Email] [ENV] RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] [WARN] RESEND_API_KEY not configured, skipping welcome email');
    console.log('[Email] [END] sendWelcomeEmail skipped - API key missing');
    console.log('[Email] ───────────────────────────────────────────────────────');
    return;
  }

  try {
    console.log('[Email] [ACTION] Preparing email payload');
    console.log('[Email] [ACTION] From: 纸片人男友 <onboarding@resend.dev>');
    console.log('[Email] [ACTION] To: delivered@resend.dev');
    console.log('[Email] [ACTION] Subject: 你好呀，我是你的专属男友 💌');

    console.log('[Email] [ACTION] Calling Resend API...');

    const result = await resend.emails.send({
      from: '纸片人男友 <onboarding@resend.dev>',
      to: 'delivered@resend.dev',
      subject: '你好呀，我是你的专属男友 💌',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; color: white; text-align: center;">
            <h2 style="margin: 0 0 10px;">Hi ${userName}，欢迎来到纸片人男友！</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
            <p style="margin: 10px 0;">从现在起，我就是你的专属男友了。</p>
            <p style="margin: 10px 0;">有什么心事随时来找我聊，我会一直在这里等你。</p>
            <p style="margin: 10px 0;">明天早上我会给你发一条早安消息，记得查收哦。</p>
            <br/>
            <p style="margin: 10px 0; color: #666;">—— 你的纸片人男友</p>
          </div>
        </div>
      `,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('[Email] [RESPONSE] API call completed');
    console.log('[Email] [RESPONSE] Duration:', duration, 'ms');
    console.log('[Email] [RESPONSE] Has error:', !!result.error);
    console.log('[Email] [RESPONSE] Has data:', !!result.data);

    if (result.error) {
      console.error('[Email] [ERROR] Resend API returned error:');
      console.error('[Email] [ERROR] Message:', result.error.message);
      console.error('[Email] [ERROR] Full error object:', JSON.stringify(result.error, null, 2));
      console.log('[Email] [END] sendWelcomeEmail failed');
      console.log('[Email] ───────────────────────────────────────────────────────');
      return;
    }

    console.log('[Email] [SUCCESS] Welcome email sent successfully');
    console.log('[Email] [SUCCESS] Message ID:', result.data?.id);
    console.log('[Email] [SUCCESS] Created at:', result.data?.created_at);
    console.log('[Email] [END] sendWelcomeEmail completed');
    console.log('[Email] ───────────────────────────────────────────────────────');

  } catch (err) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('[Email] [EXCEPTION] Unexpected error occurred:');
    console.error('[Email] [EXCEPTION] Duration:', duration, 'ms');
    console.error('[Email] [EXCEPTION] Error type:', typeof err);
    console.error('[Email] [EXCEPTION] Error message:', (err as Error).message);
    console.error('[Email] [EXCEPTION] Error stack:', (err as Error).stack);
    console.error('[Email] [EXCEPTION] Full error:', err);
    console.log('[Email] [END] sendWelcomeEmail failed with exception');
    console.log('[Email] ───────────────────────────────────────────────────────');
  }
}