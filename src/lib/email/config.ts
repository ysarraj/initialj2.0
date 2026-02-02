export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'mail.infomaniak.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'support@initialj.com',
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: true,
    },
  },
  from: {
    name: 'InitialJ',
    email: process.env.SMTP_FROM || 'support@initialj.com',
  },
  replyTo: 'support@initialj.com',
} as const;

export type EmailConfig = typeof emailConfig;
