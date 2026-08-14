import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Get configured Nodemailer transporter for Gmail / SMTP
 */
function getTransporter() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || '';
  const pass = process.env.GMAIL_PASS || process.env.SMTP_PASS || '';
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;

  if (host.includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

function getSenderEmail(): string {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (user) return `"EduFix AI Smart System" <${user}>`;
  return '"EduFix AI Smart System" <noreply@edufix.campus.edu>';
}

/**
 * Send Welcome Email to newly registered user
 */
export async function sendWelcomeEmail(toEmail: string, fullName: string, userIdCode: string) {
  try {
    const user = process.env.GMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.GMAIL_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
      console.log(`ℹ️ [Email Simulation] Welcome email for ${toEmail} (${userIdCode}). Set GMAIL_USER & GMAIL_PASS in backend/.env to send real Gmail emails.`);
      return true;
    }

    console.log(`📧 Sending Welcome Email to ${toEmail} via Gmail SMTP (${user})...`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">✨ EduFix AI Platform</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Smart Campus Complaint & Facility Management System</p>
        </div>
        
        <div style="padding: 24px 0;">
          <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Welcome, ${fullName}! 🎉</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Your account has been successfully created. You can now submit facility complaints, track maintenance dispatch in real-time, upvote active issues, and receive live resolution updates.
          </p>

          <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #334155;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">Your Account Credentials</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #38bdf8;"><strong>Email:</strong> ${toEmail}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #38bdf8;"><strong>Campus ID Code:</strong> ${userIdCode}</p>
          </div>

          <p style="color: #94a3b8; font-size: 12px;">If you did not request this account, please notify our campus IT administration.</p>
        </div>

        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
          &copy; ${new Date().getFullYear()} EduFix AI Smart Complaint System • Campus Facilities Management
        </div>
      </div>
    `;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: getSenderEmail(),
      to: toEmail,
      subject: '🎉 Welcome to EduFix AI Smart Complaint System',
      html: htmlContent
    });

    console.log(`✅ Welcome Email sent successfully to ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send welcome email to ${toEmail}:`, err);
    return false;
  }
}

/**
 * Send 6-digit Password Reset PIN to Gmail
 */
export async function sendPasswordResetPinEmail(toEmail: string, pin: string): Promise<{ sent: boolean; isSimulated: boolean; error?: string }> {
  try {
    const user = process.env.GMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.GMAIL_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
      console.log(`🔑 [Email Simulation] Password Reset PIN for ${toEmail} is: ${pin}. Set GMAIL_USER & GMAIL_PASS in backend/.env to send real emails.`);
      return { sent: true, isSimulated: true };
    }

    console.log(`📧 Sending Password Reset PIN Email to ${toEmail} via Gmail (${user})...`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">🔒 EduFix AI Password Security</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Smart Complaint Management System</p>
        </div>

        <div style="padding: 24px 0; text-align: center;">
          <h2 style="color: #f8fafc; font-size: 18px; margin-top: 0;">Password Reset Verification PIN</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            We received a request to reset your password. Use the 6-digit PIN below to complete your reset request:
          </p>

          <div style="display: inline-block; background-color: #1e293b; padding: 16px 36px; border-radius: 14px; margin: 20px 0; border: 2px solid #3b82f6; letter-spacing: 8px; font-size: 32px; font-weight: 900; color: #38bdf8;">
            ${pin}
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 10px;">
            ⏰ This verification PIN expires in <strong>15 minutes</strong>. Do not share this PIN with anyone.
          </p>
        </div>

        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
          &copy; ${new Date().getFullYear()} EduFix AI Smart Complaint System • Security Center
        </div>
      </div>
    `;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: getSenderEmail(),
      to: toEmail,
      subject: `🔑 ${pin} - Your EduFix Password Reset PIN`,
      html: htmlContent
    });

    console.log(`✅ Password Reset PIN Email sent successfully to ${toEmail}`);
    return { sent: true, isSimulated: false };
  } catch (err: any) {
    console.error(`❌ Failed to send password reset PIN email to ${toEmail}:`, err);
    return { sent: false, isSimulated: false, error: err.message || 'Gmail SMTP send failed.' };
  }
}

/**
 * Send Notification Alert Email to Gmail
 */
export async function sendNotificationEmail(toEmail: string, title: string, message: string) {
  try {
    if (!toEmail) return false;
    const user = process.env.GMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.GMAIL_PASS || process.env.SMTP_PASS;

    if (!user || !pass) {
      console.log(`🔔 [Email Simulation] Notification for ${toEmail}: "${title}" - ${message}`);
      return true;
    }

    console.log(`📧 Sending Notification Email to ${toEmail}...`);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
        <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #1e293b;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 22px;">🔔 Complaint Update Alert</h1>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">EduFix AI Smart Complaint System</p>
        </div>

        <div style="padding: 20px 0;">
          <h3 style="color: #f8fafc; font-size: 16px; margin-top: 0;">${title}</h3>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; background-color: #1e293b; padding: 14px; border-radius: 10px; border-left: 4px solid #3b82f6;">
            ${message}
          </p>
          <p style="color: #94a3b8; font-size: 12px;">You can view full details and timeline tracking by logging into your EduFix dashboard.</p>
        </div>

        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
          &copy; ${new Date().getFullYear()} EduFix AI Smart Complaint System
        </div>
      </div>
    `;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: getSenderEmail(),
      to: toEmail,
      subject: `🔔 EduFix Alert: ${title}`,
      html: htmlContent
    });

    return true;
  } catch (err) {
    console.error(`❌ Failed to send notification email to ${toEmail}:`, err);
    return false;
  }
}

