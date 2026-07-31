import { Resend } from 'resend';
import logger from './logger.js';
import env from '../config/env.js';

/**
 * Send Email via Resend API (with console fallback for dev/testing)
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.otp - 6 digit OTP string
 * @param {string} [options.name] - Recipient name
 */
export const sendOTPEmail = async ({ email, subject, otp, name }) => {
  const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .logo { font-size: 20px; font-weight: 800; color: #2563eb; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
        .title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .text { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-mono: monospace; }
        .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
        .footer { border-t: 1px solid #f1f5f9; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">☁️ CloudDocs</div>
        <div class="title">Verify Your Email Address</div>
        <div class="text">
          Hello ${name || 'User'},<br>
          Thank you for registering with CloudDocs. Please use the 6-digit verification code below:
        </div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="expiry">Expires in 10 minutes</div>
        </div>
        <div class="text">
          If you did not request this email, please ignore it or contact support.
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CloudDocs AI Storage Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: 'CloudDocs <onboarding@resend.dev>',
        to: [email],
        subject: subject || 'Your CloudDocs Verification Code',
        html: htmlContent,
      });

      if (error) {
        logger.error(`Resend API response error for ${email}: ${JSON.stringify(error)}`);
        logger.info(`[DEV OTP FALLBACK] OTP for ${email}: ${otp}`);
        return { success: true, fallback: true, error: error.message };
      }

      logger.info(`OTP Email successfully sent via Resend API to ${email}. ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (error) {
      logger.error(`Resend API Exception sending to ${email}: ${error.message}`);
      logger.info(`[DEV OTP FALLBACK] OTP for ${email}: ${otp}`);
      return { success: true, fallback: true };
    }
  } else {
    logger.info(`[DEV OTP CODE] Resend API key not configured. OTP for ${email} is: ===> [ ${otp} ] <===`);
    return { success: true, fallback: true };
  }
};
