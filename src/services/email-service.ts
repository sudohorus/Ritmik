import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const loginEmailTemplate = (location: string, device: string, time: string) => ({
  subject: "New Login to Your Ritmik Account",
  html: `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0c0d; margin: 0; padding: 0; color: #e5e5e5; }
        .container { max-width: 600px; margin: 32px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 14px; overflow: hidden; box-shadow: 0 0 40px rgba(0,0,0,0.25); }
        .header { background: radial-gradient(circle at top left, #1f1f22 0%, #141416 100%); padding: 40px 28px; text-align: center; border-bottom: 1px solid #27272a; }
        .header h1 { margin: 0; font-size: 34px; font-weight: 700; color: white; letter-spacing: -0.5px; }
        .content { padding: 36px 28px; }
        h2 { margin-top: 0; font-size: 22px; font-weight: 600; color: #fafafa; }
        p { line-height: 1.65; font-size: 15px; color: #a1a1aa; }
        .emoji { font-size: 44px; margin-bottom: 14px; text-align: center; }
        .info-card { background-color: #1f1f22; border-radius: 10px; padding: 20px 18px; margin: 28px 0; border: 1px solid #2f2f32; }
        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #2f2f32; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #8b8b92; font-size: 14px; width: 110px; }
        .info-value { color: #e4e4e7; font-weight: 500; text-align: right; }
        .alert { background-color: #3f0f12; border: 1px solid #7f1d1d; border-radius: 10px; padding: 16px; margin: 28px 0; }
        .alert p { color: #fca5a5; margin: 0; }
        .button-wrapper { text-align: center; margin-top: 28px; }
        .button { display: inline-block; background-color: white; color: #18181b; padding: 13px 30px; border-radius: 10px; font-weight: 600; text-decoration: none; font-size: 15px; }
        .button:hover { background-color: #e4e4e4; }
        .footer { padding: 26px; text-align: center; color: #71717a; border-top: 1px solid #27272a; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Ritmik</h1></div>
        <div class="content">
          <div class="emoji">🔐</div>
          <h2>New Login Detected</h2>
          <p>We detected a new sign-in to your Ritmik account. If this was you, no action is required.</p>
          <div class="info-card">
            <div class="info-row"><span class="info-label">Time:</span><span class="info-value">${time}</span></div>
            <div class="info-row"><span class="info-label">Device:</span><span class="info-value">${device}</span></div>
            <div class="info-row"><span class="info-label">IP Address:</span><span class="info-value">${location}</span></div>
          </div>
          <div class="alert"><p><strong>Didn't sign in?</strong> Change your password immediately to secure your account.</p></div>
          <div class="button-wrapper">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/account" class="button">Open Security Settings</a>
          </div>
        </div>
        <div class="footer">
          <p>This email is related to your account’s security.</p>
          <p>Automated message — please do not reply.</p>
        </div>
      </div>
    </body>
  </html>
  `
});

const resetPasswordEmailTemplate = (resetLink: string) => ({
  subject: "Reset Your Ritmik Password",
  html: `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0c0c0d; margin: 0; padding: 0; color: #e5e5e5; }
        .container { max-width: 600px; margin: 32px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 14px; overflow: hidden; }
        .header { background: #1f1f22; padding: 40px 28px; text-align: center; border-bottom: 1px solid #27272a; }
        .header h1 { margin: 0; font-size: 34px; color: white; }
        .content { padding: 36px 28px; }
        h2 { margin-top: 0; font-size: 22px; color: #fafafa; }
        p { line-height: 1.65; font-size: 15px; color: #a1a1aa; }
        .button { display: inline-block; background-color: white; color: #18181b; padding: 13px 30px; border-radius: 10px; font-weight: 600; text-decoration: none; margin-top: 20px; }
        .button:hover { background-color: #e4e4e4; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Ritmik</h1></div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          <p style="margin-top: 30px; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
  </html>
  `
});

export class EmailService {
  static async sendLoginNotificationEmail(
    toEmail: string,
    location: string,
    device: string
  ): Promise<void> {
    const now = new Date();
    const time = now.toLocaleString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo"
    });

    const template = loginEmailTemplate(location, device, time);

    await transporter.sendMail({
      from: '"Ritmik Security" <ritmiksec@gmail.com>',
      to: toEmail,
      subject: template.subject,
      html: template.html
    });
  }

  static async sendPasswordResetEmail(toEmail: string, token: string): Promise<void> {
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    const resetLink = `${baseUrl}/update-password?token=${token}`;
    const template = resetPasswordEmailTemplate(resetLink);

    await transporter.sendMail({
      from: '"Ritmik Security" <ritmiksec@gmail.com>',
      to: toEmail,
      subject: template.subject,
      html: template.html
    });
  }

  static async verifyConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }
}
