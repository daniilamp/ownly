/**
 * Business Notification Service
 * Handles email notifications for the business application lifecycle.
 * Uses fire-and-forget pattern — email failures are logged but never block main operations.
 *
 * Note: Currently logs notifications to console. To enable real email delivery,
 * configure an email provider (e.g., Resend, SendGrid) and update the sendEmail helper.
 */

import { supabase } from './databaseService.js';

/**
 * Send an email (internal helper).
 * Currently logs the email. Replace with a real provider when ready.
 * @param {object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - Email body (HTML)
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, html }) {
  // TODO: Replace with real email provider (Resend, SendGrid, etc.)
  // Example with Resend:
  //   import { Resend } from 'resend';
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ from: 'Ownly <noreply@ownly.io>', to, subject, html });

  console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);

  // If an email provider URL is configured, attempt delivery
  if (process.env.EMAIL_PROVIDER_URL) {
    const response = await fetch(process.env.EMAIL_PROVIDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!response.ok) {
      throw new Error(`Email provider returned ${response.status}`);
    }
  }
}

/**
 * Send confirmation email to applicant after registration.
 * Fire-and-forget — errors are logged but do not propagate.
 * @param {object} application - The business application record
 * @param {string} application.contact_email - Applicant email
 * @param {string} application.contact_name - Applicant name
 * @param {string} application.company_name - Company name
 */
export async function sendConfirmationEmail(application) {
  try {
    const { contact_email, contact_name, company_name } = application;

    await sendEmail({
      to: contact_email,
      subject: 'Ownly — Application Received',
      html: `
        <h2>Application Received</h2>
        <p>Hi ${contact_name},</p>
        <p>Thank you for registering <strong>${company_name}</strong> with Ownly. 
        We have received your application and it is currently under review.</p>
        <p>Our team will review your application and get back to you shortly. 
        You will receive an email once a decision has been made.</p>
        <p>Best regards,<br/>The Ownly Team</p>
      `,
    });

    console.log(`[NOTIFICATION] Confirmation email sent to ${contact_email}`);
  } catch (error) {
    console.error(`[NOTIFICATION ERROR] Failed to send confirmation email to ${application.contact_email}:`, error.message);
  }
}

/**
 * Send approval email to applicant with portal access instructions.
 * Fire-and-forget — errors are logged but do not propagate.
 * @param {object} application - The business application record
 * @param {string} application.contact_email - Applicant email
 * @param {string} application.contact_name - Applicant name
 * @param {string} application.company_name - Company name
 * @param {string} loginUrl - URL for the business user to access the portal
 */
export async function sendApprovalEmail(application, loginUrl) {
  try {
    const { contact_email, contact_name, company_name } = application;

    await sendEmail({
      to: contact_email,
      subject: 'Ownly — Application Approved!',
      html: `
        <h2>Application Approved</h2>
        <p>Hi ${contact_name},</p>
        <p>Great news! Your application for <strong>${company_name}</strong> has been approved.</p>
        <p>You can now access the Ownly Business Portal to:</p>
        <ul>
          <li>Generate your API key</li>
          <li>View interactive API documentation</li>
          <li>Monitor your API usage</li>
        </ul>
        <p><a href="${loginUrl}">Access the Business Portal</a></p>
        <p>If you have any questions, don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br/>The Ownly Team</p>
      `,
    });

    console.log(`[NOTIFICATION] Approval email sent to ${contact_email}`);
  } catch (error) {
    console.error(`[NOTIFICATION ERROR] Failed to send approval email to ${application.contact_email}:`, error.message);
  }
}

/**
 * Send rejection email to applicant with the reason.
 * Fire-and-forget — errors are logged but do not propagate.
 * @param {object} application - The business application record
 * @param {string} application.contact_email - Applicant email
 * @param {string} application.contact_name - Applicant name
 * @param {string} application.company_name - Company name
 * @param {string} reason - Rejection reason provided by the reviewer
 */
export async function sendRejectionEmail(application, reason) {
  try {
    const { contact_email, contact_name, company_name } = application;

    await sendEmail({
      to: contact_email,
      subject: 'Ownly — Application Update',
      html: `
        <h2>Application Update</h2>
        <p>Hi ${contact_name},</p>
        <p>After careful review, we are unable to approve the application for 
        <strong>${company_name}</strong> at this time.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>If you believe this decision was made in error or if your circumstances have changed, 
        you are welcome to submit a new application in the future.</p>
        <p>Best regards,<br/>The Ownly Team</p>
      `,
    });

    console.log(`[NOTIFICATION] Rejection email sent to ${contact_email}`);
  } catch (error) {
    console.error(`[NOTIFICATION ERROR] Failed to send rejection email to ${application.contact_email}:`, error.message);
  }
}

/**
 * Notify all admin users of a new business application.
 * Fire-and-forget — errors are logged but do not propagate.
 * @param {object} application - The business application record
 * @param {string} application.company_name - Company name
 * @param {string} application.contact_email - Applicant email
 * @param {string} application.use_case - Use case description
 * @param {string} application.id - Application ID
 */
export async function notifyAdminsNewApplication(application) {
  try {
    // Fetch all admin users
    const { data: admins, error } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to fetch admin users: ${error.message}`);
    }

    if (!admins || admins.length === 0) {
      console.warn('[NOTIFICATION] No active admin users found to notify');
      return;
    }

    const { company_name, contact_email, use_case, id } = application;

    // Send notification to each admin
    const emailPromises = admins.map(admin =>
      sendEmail({
        to: admin.email,
        subject: `Ownly — New Business Application: ${company_name}`,
        html: `
          <h2>New Business Application</h2>
          <p>A new business application has been submitted and requires review.</p>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; font-weight: bold;">Company:</td><td style="padding: 8px;">${company_name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Contact:</td><td style="padding: 8px;">${contact_email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Use Case:</td><td style="padding: 8px;">${use_case || 'Not specified'}</td></tr>
          </table>
          <p>Please review this application in the Admin Panel.</p>
          <p>Application ID: ${id}</p>
        `,
      }).catch(err => {
        console.error(`[NOTIFICATION ERROR] Failed to notify admin ${admin.email}:`, err.message);
      })
    );

    await Promise.allSettled(emailPromises);

    console.log(`[NOTIFICATION] Admin notification sent to ${admins.length} admin(s) for application ${id}`);
  } catch (error) {
    console.error(`[NOTIFICATION ERROR] Failed to notify admins of new application:`, error.message);
  }
}
