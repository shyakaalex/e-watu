import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

export type EmailTemplate =
  | 'verify-email'
  | 'tenant-approved'
  | 'tenant-rejected'
  | 'generic';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly log = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) {
      this.log.warn(
        '[EmailService] SMTP_HOST not set — emails will be logged to console only. ' +
          'Set SMTP_HOST in .env for real email sending.',
      );
    } else {
      this.log.log(`[EmailService] SMTP configured → ${host}`);
    }
  }

  private fromAddress(): string {
    const address =
      this.config.get<string>('MAIL_FROM_ADDRESS') ??
      this.config.get<string>('EMAIL_FROM', 'noreply@ewatu.local');
    const name = this.config.get<string>('MAIL_FROM_NAME');
    if (name?.trim()) {
      return `"${name.trim()}" <${address}>`;
    }
    return address;
  }

  private render(template: EmailTemplate, payload: Record<string, unknown>) {
    switch (template) {
      case 'verify-email':
        return {
          subject: 'Verify your E-Watu administrator email',
          text: `Hello,\n\nPlease verify your email to continue setting up your company workspace:\n\n${payload.verifyUrl}\n\n— E-Watu`,
          html: `<p>Hello,</p><p>Please verify your email to continue setting up your company workspace:</p><p><a href="${payload.verifyUrl}">Verify email</a></p><p>— E-Watu</p>`,
        };
      case 'tenant-approved':
        return {
          subject: `Your company ${payload.companyName} is approved on E-Watu`,
          text: `Your workspace for ${payload.companyName} is now active. Sign in at ${payload.loginUrl}`,
          html: `<p>Your workspace for <strong>${payload.companyName}</strong> is now active.</p><p><a href="${payload.loginUrl}">Sign in</a></p>`,
        };
      case 'tenant-rejected':
        return {
          subject: `Update on your E-Watu registration`,
          text: `Your registration for ${payload.companyName} was not approved.${payload.reason ? ` Reason: ${payload.reason}` : ''}`,
          html: `<p>Your registration for <strong>${payload.companyName}</strong> was not approved.</p>${payload.reason ? `<p>Reason: ${payload.reason}</p>` : ''}`,
        };
      default:
        return {
          subject: String(payload.subject ?? 'E-Watu notification'),
          text: String(payload.text ?? payload.body ?? ''),
          html: String(payload.html ?? `<p>${payload.body ?? ''}</p>`),
        };
    }
  }

  async send(to: string, template: EmailTemplate, payload: Record<string, unknown>) {
    const { subject, text, html } = this.render(template, payload);
    const from = this.fromAddress();
    const host = this.config.get<string>('SMTP_HOST');

    if (!host?.trim()) {
      this.log.log(`[email console] To: ${to} | ${subject}\n${text}`);
      return { sent: false, mode: 'console' as const };
    }

    const transporter = createTransport({
      host,
      port: Number(this.config.get('SMTP_PORT', 587)),
      secure: this.config.get('SMTP_SECURE') === 'true',
      auth:
        this.config.get('SMTP_USER') && this.config.get('SMTP_PASS')
          ? {
              user: this.config.get('SMTP_USER'),
              pass: this.config.get('SMTP_PASS'),
            }
          : undefined,
    });

    await transporter.sendMail({ from, to, subject, text, html });
    this.log.log(`[email sent] To: ${to} | ${subject}`);
    return { sent: true, mode: 'smtp' as const };
  }
}
