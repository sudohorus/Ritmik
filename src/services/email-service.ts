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
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #09090b;
          margin: 0;
          padding: 0;
          color: #e4e4e7;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          overflow: hidden;
        }

        .header {
          padding: 32px 24px;
          text-align: center;
          border-bottom: 1px solid #27272a;
        }

        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
          color: white;
          letter-spacing: -1px;
        }

        .content {
          padding: 32px 24px;
        }

        h2 {
          margin-top: 0;
          font-size: 22px;
          font-weight: 600;
          color: white;
        }

        p {
          line-height: 1.6;
          font-size: 15px;
          color: #a1a1aa;
        }

        .emoji {
          font-size: 42px;
          margin-bottom: 12px;
          text-align: center;
        }

        .info-card {
          background-color: #27272a;
          border-radius: 8px;
          padding: 18px;
          margin: 24px 0;
          border: 1px solid #3f3f46;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #3f3f46;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          color: #71717a;
          font-size: 14px;
        }

        .info-value {
          color: #e4e4e7;
          font-weight: 500;
        }

        .alert {
          background-color: #3b0d0d;
          border: 1px solid #7f1d1d;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }

        .alert p {
          color: #fca5a5;
          margin: 0;
        }

        .button-wrapper {
          text-align: center;
          margin-top: 24px;
        }

        .button {
          display: inline-block;
          background-color: white;
          color: #18181b;
          padding: 12px 26px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
        }

        .footer {
          padding: 24px;
          text-align: center;
          color: #71717a;
          border-top: 1px solid #27272a;
          font-size: 13px;
        }
      </style>
    </head>

    <body>
      <div class="container">
        
        <div class="header">
          <h1>Ritmik</h1>
        </div>

        <div class="content">
          <div class="emoji">🔐</div>

          <h2>New Login Detected</h2>

          <p>We noticed a new login to your Ritmik account. If this was you, everything is fine.</p>

          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Time: </span>
              <span class="info-value">${time}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Device: </span>
              <span class="info-value">${device}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Location: </span>
              <span class="info-value">${location}</span>
            </div>
          </div>

          <div class="alert">
            <p><strong>Not you?</strong> We recommend changing your password immediately.</p>
          </div>

          <div class="button-wrapper">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/account" class="button">
              Security Settings
            </a>
          </div>
        </div>

        <div class="footer">
          <p>You receive this email for account security purposes.</p>
          <p>This is an automated message — please do not reply.</p>
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
    try {
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

    } catch (error) {
    }
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
