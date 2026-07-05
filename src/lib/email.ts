import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping welcome email');
    return;
  }

  try {
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

    if (result.error) {
      console.error('[Email] Resend error:', result.error.message, result.error.code);
      return;
    }

    console.log('[Email] Welcome email sent successfully:', result.data?.id);
  } catch (err) {
    console.error('[Email] Failed to send email:', err);
  }
}
