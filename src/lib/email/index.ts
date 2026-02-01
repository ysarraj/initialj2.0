import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { emailConfig } from './config';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport(emailConfig.smtp);
    }
    return this.transporter;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.getTransporter().verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email connection verification failed', error);
      return false;
    }
  }

  async sendEmail(options: SendEmailOptions & { replyTo?: string }): Promise<boolean> {
    const { to, subject, text, html, replyTo } = options;

    try {
      const result = await this.getTransporter().sendMail({
        from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
        replyTo: replyTo || emailConfig.replyTo,
        to,
        subject,
        text,
        html,
      });

      console.log('Email sent successfully', { to, subject, messageId: result.messageId });
      return true;
    } catch (error) {
      console.error('Failed to send email', error, { to, subject });
      return false;
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    const subject = 'Your InitialJ Verification Code';
    const text = `
Welcome to InitialJ!

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
The InitialJ Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #1F2922; background-color: #f5f5f5;">
  <div style="width: 100%; background-color: #f5f5f5; padding: 40px 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
      <div style="background-color: #1F2922; padding: 32px 40px; text-align: center;">
        <h1 style="font-size: 24px; font-weight: 300; color: #ffffff; letter-spacing: 0.1em; margin: 0;">InitialJ</h1>
      </div>
      <div style="padding: 40px;">
        <h2 style="font-size: 20px; font-weight: 300; color: #1F2922; margin: 0 0 20px 0;">Welcome to InitialJ!</h2>
        <p style="color: #4B5563; margin: 0 0 24px 0;">Your verification code is:</p>
        <div style="background-color: #f9fafb; border: 2px solid #1F2922; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <div style="font-size: 32px; font-weight: 600; color: #1F2922; letter-spacing: 8px; font-family: monospace;">${code}</div>
        </div>
        <p style="color: #6B7280; font-size: 14px; margin: 0 0 24px 0;">This code will expire in 10 minutes.</p>
        <p style="color: #6B7280; font-size: 14px; margin: 0;">If you didn't request this code, please ignore this email.</p>
      </div>
      <div style="background-color: #fafafa; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="font-size: 13px; color: #737373; margin: 0;">Best regards,<br>The InitialJ Team</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({ to: email, subject, text, html });
  }

  async sendWelcomeEmail(email: string, username?: string | null): Promise<boolean> {
    const subject = 'Welcome to InitialJ!';
    const displayName = username || email.split('@')[0];
    
    const text = `
Thank you for registering with InitialJ!

Hi ${displayName},

We're thrilled to have you join our community of Japanese learners. You're now ready to start your journey mastering kanji and vocabulary through our spaced repetition system.

What's next?
- Complete your first lesson to unlock your learning path
- Track your progress as you master each JLPT level
- Review kanji and vocabulary at optimal intervals

Currently in beta, all levels (N5-N1) are completely free. Enjoy full access to 2000+ kanji and relevant vocabulary for each JLPT level.

If you have any questions or need help getting started, don't hesitate to reach out.

Happy learning!

Best regards,
The InitialJ Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #1F2922; background-color: #f5f5f5;">
  <div style="width: 100%; background-color: #f5f5f5; padding: 40px 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
      <div style="background: linear-gradient(135deg, #1F2922 0%, #C73E1D 100%); padding: 32px 40px; text-align: center;">
        <h1 style="font-size: 24px; font-weight: 300; color: #ffffff; letter-spacing: 0.1em; margin: 0;">InitialJ</h1>
      </div>
      <div style="padding: 40px;">
        <h2 style="font-size: 20px; font-weight: 300; color: #1F2922; margin: 0 0 20px 0;">Thank you for registering!</h2>
        <p style="color: #4B5563; margin: 0 0 16px 0;">Hi <strong>${displayName}</strong>,</p>
        <p style="color: #4B5563; margin: 0 0 24px 0;">We're thrilled to have you join our community of Japanese learners. You're now ready to start your journey mastering kanji and vocabulary through our spaced repetition system.</p>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #1F2922; padding: 20px; margin: 24px 0;">
          <h3 style="font-size: 16px; font-weight: 500; color: #1F2922; margin: 0 0 12px 0;">What's next?</h3>
          <ul style="color: #4B5563; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Complete your first lesson to unlock your learning path</li>
            <li style="margin-bottom: 8px;">Track your progress as you master each JLPT level</li>
            <li style="margin-bottom: 8px;">Review kanji and vocabulary at optimal intervals</li>
          </ul>
        </div>

        <p style="color: #4B5563; margin: 0 0 24px 0;">Currently in <strong>beta</strong>, all levels (N5-N1) are completely free. Enjoy full access to 2000+ kanji and relevant vocabulary for each JLPT level.</p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #1F2922; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 300; letter-spacing: 0.05em;">Start Learning</a>
        </div>

        <p style="color: #6B7280; font-size: 14px; margin: 24px 0 0 0;">If you have any questions or need help getting started, don't hesitate to reach out.</p>
        <p style="color: #6B7280; font-size: 14px; margin: 8px 0 0 0;">Happy learning!</p>
      </div>
      <div style="background-color: #fafafa; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="font-size: 13px; color: #737373; margin: 0;">Best regards,<br>The InitialJ Team</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({ to: email, subject, text, html });
  }

  async sendContactEmail(data: {
    fromName: string;
    fromEmail: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const { fromName, fromEmail, subject, message } = data;
    const emailSubject = `[Contact Form] ${subject}`;
    const supportEmail = 'support@initialj.com';

    const text = `
New contact form submission from InitialJ

From: ${fromName} <${fromEmail}>
Subject: ${subject}

Message:
${message}

---
You can reply directly to this email to respond to ${fromName} at ${fromEmail}
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: #1F2922; background-color: #f5f5f5;">
  <div style="width: 100%; background-color: #f5f5f5; padding: 40px 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
      <div style="background-color: #1F2922; padding: 32px 40px; text-align: center;">
        <h1 style="font-size: 24px; font-weight: 300; color: #ffffff; letter-spacing: 0.1em; margin: 0;">InitialJ Contact</h1>
      </div>
      <div style="padding: 40px;">
        <h2 style="font-size: 20px; font-weight: 300; color: #1F2922; margin: 0 0 20px 0;">New Contact Form Submission</h2>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #1F2922; padding: 20px; margin: 24px 0;">
          <p style="color: #4B5563; margin: 0 0 8px 0;"><strong>From:</strong> ${fromName}</p>
          <p style="color: #4B5563; margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${fromEmail}" style="color: #1F2922; text-decoration: none;">${fromEmail}</a></p>
          <p style="color: #4B5563; margin: 0;"><strong>Subject:</strong> ${subject}</p>
        </div>

        <div style="margin: 24px 0;">
          <h3 style="font-size: 16px; font-weight: 500; color: #1F2922; margin: 0 0 12px 0;">Message:</h3>
          <div style="color: #4B5563; white-space: pre-wrap; background-color: #fafafa; padding: 16px; border-radius: 8px; border: 1px solid #e5e5e5;">${message.replace(/\n/g, '<br>')}</div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="color: #6B7280; font-size: 14px; margin: 0;">You can reply directly to this email to respond to <strong>${fromName}</strong> at <a href="mailto:${fromEmail}" style="color: #1F2922; text-decoration: none;">${fromEmail}</a></p>
        </div>
      </div>
      <div style="background-color: #fafafa; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
        <p style="font-size: 13px; color: #737373; margin: 0;">InitialJ Contact Form</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to: supportEmail,
      subject: emailSubject,
      text,
      html,
      replyTo: fromEmail, // Allow replying directly to the user
    });
  }
}

export const emailService = new EmailService();
