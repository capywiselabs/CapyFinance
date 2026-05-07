import 'server-only';
import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) sgMail.setApiKey(apiKey);

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(args: SendArgs): Promise<void> {
  if (!apiKey) {
    console.warn('[sendgrid] SENDGRID_API_KEY missing — skipping send', args.subject);
    return;
  }
  await sgMail.send({
    to: args.to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL ?? 'hello@capyfinance.app',
      name: process.env.SENDGRID_FROM_NAME ?? 'CapyFinance',
    },
    subject: args.subject,
    html: args.html,
    text: args.text ?? args.html.replace(/<[^>]+>/g, ''),
  });
}
