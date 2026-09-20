import nodemailer from 'nodemailer';

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  recipientEmails: string; // comma separated
}

export async function sendEmail(
  config: EmailConfig,
  subject: string,
  content: {
    title: string;
    monitorName: string;
    target: string;
    status: 'DOWN' | 'UP';
    time: string;
    reason?: string;
    duration?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!config.smtpHost || !config.smtpUser || !config.recipientEmails) {
    return { success: false, error: 'SMTP configuration is incomplete' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort) || 587,
      secure: Boolean(config.smtpSecure),
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const isDown = content.status === 'DOWN';
    const statusColor = isDown ? '#ef4444' : '#10b981';
    const badgeText = isDown ? 'CRITICAL ALERT: SERVICE DOWN' : 'RECOVERY ALERT: SERVICE RESTORED';

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; color: #ffffff; background-color: ${statusColor}; margin-bottom: 16px;">
          ${badgeText}
        </div>
        <h2 style="margin-top: 0; color: #111827; font-size: 20px;">${content.title}</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280; width: 140px;">Monitor:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 600;">${content.monitorName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280;">Target:</td>
            <td style="padding: 10px 0; color: #111827;"><code>${content.target}</code></td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280;">Time:</td>
            <td style="padding: 10px 0; color: #111827;">${content.time}</td>
          </tr>
          ${content.reason ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280;">Reason:</td>
            <td style="padding: 10px 0; color: #ef4444; font-weight: 500;">${content.reason}</td>
          </tr>` : ''}
          ${content.duration ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; color: #6b7280;">Downtime Duration:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 600;">${content.duration}</td>
          </tr>` : ''}
        </table>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
          Sent automatically by <strong>PulseGuard Uptime Monitor</strong>.
        </p>
      </div>
    `;

    const recipients = config.recipientEmails.split(',').map((e) => e.trim()).filter(Boolean);

    await transporter.sendMail({
      from: config.fromEmail || `"PulseGuard Monitor" <${config.smtpUser}>`,
      to: recipients.join(', '),
      subject: subject,
      html: htmlBody
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function testEmail(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
  return sendEmail(config, '[Test] PulseGuard Alert System Verification', {
    title: 'PulseGuard Email Notification Test',
    monitorName: 'Sample Test Service',
    target: 'https://example.com',
    status: 'UP',
    time: new Date().toLocaleString(),
    reason: 'This is a test notification confirming your email setup works properly.'
  });
}
