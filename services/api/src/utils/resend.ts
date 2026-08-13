import { Resend } from 'resend';
import { logger } from '../logger';

// Try to use environment variable, fallback to dummy for development if not provided
const resendApiKey = process.env.RESEND_API_KEY || 're_dummy_key_12345';
const resend = new Resend(resendApiKey);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    if (resendApiKey.startsWith('re_dummy')) {
      logger.info({ to, subject }, 'Dummy email sent (configure RESEND_API_KEY to send real emails)');
      return { id: 'dummy_id' };
    }
    
    // In production, the "from" address needs to be verified in Resend dashboard
    const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    
    logger.info({ to, subject, id: data.data?.id }, 'Email sent successfully via Resend');
    return data.data;
  } catch (error) {
    logger.error({ to, subject, error }, 'Failed to send email');
    throw error;
  }
};
