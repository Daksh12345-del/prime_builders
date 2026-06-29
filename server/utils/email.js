// server/utils/email.js
// Sends transactional emails via Resend (https://resend.com).
// Resend's free tier covers 3,000 emails/month — plenty for an enquiry form.
//
// Setup:
//   1. Create a free account at resend.com
//   2. Get an API key from the dashboard, put it in .env as RESEND_API_KEY
//   3. (Optional but recommended) Verify your own domain in Resend's dashboard
//      so emails come from e.g. enquiry@primebuilder.in instead of a shared
//      Resend test address. Until then, FROM_EMAIL can stay as the Resend
//      test sender and everything still works.
//
// No SMTP host/port/password to dig up, no native packages — just one HTTPS
// call per email, using Node's built-in fetch (Node 18+).

const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Prime Builder <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set in .env — skipping email send. Add it to enable email confirmations.');
    return { skipped: true };
  }

  const payload = {
    from: fromEmail,
    to: [to],
    subject,
    html
  };
  if (replyTo) payload.reply_to = replyTo;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Resend email failed:', data);
      return { error: data.message || 'Email send failed', status: res.status };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error('Resend email request failed:', err.message);
    return { error: err.message };
  }
}

// ---------- Email templates ----------

function customerConfirmationEmail({ name, propertyTitle }) {
  const subject = 'We received your enquiry — Prime Builder';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color: #8B1E1E;">Thank you, ${escapeHtml(name)}!</h2>
      <p>We've received your enquiry${propertyTitle ? ` about <strong>${escapeHtml(propertyTitle)}</strong>` : ''} and one of our team members will contact you shortly to discuss further details and arrange a visit if needed.</p>
      <p>If your enquiry is urgent, you can also reach us directly on WhatsApp:</p>
      <p>
        <a href="https://wa.me/919310812957" style="color: #25D366; font-weight: bold;">+91 93108 12957</a><br>
        <a href="https://wa.me/918587820230" style="color: #25D366; font-weight: bold;">+91 85878 20230</a>
      </p>
      <p style="margin-top: 24px; color: #666; font-size: 13px;">— Prime Builder<br>West Delhi Residential Specialists</p>
    </div>
  `;
  return { subject, html };
}

function ownerNotificationEmail({ name, phone, email, budget, message, propertyTitle }) {
  const subject = `New Enquiry: ${name}${propertyTitle ? ` — ${propertyTitle}` : ''}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color: #8B1E1E;">New Website Enquiry</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">Name</td><td style="padding: 8px 0;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Phone</td><td style="padding: 8px 0;">${escapeHtml(phone)}</td></tr>
        ${email ? `<tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td style="padding: 8px 0;">${escapeHtml(email)}</td></tr>` : ''}
        ${budget ? `<tr><td style="padding: 8px 0; font-weight: bold;">Budget</td><td style="padding: 8px 0;">${escapeHtml(budget)}</td></tr>` : ''}
        ${propertyTitle ? `<tr><td style="padding: 8px 0; font-weight: bold;">Property</td><td style="padding: 8px 0;">${escapeHtml(propertyTitle)}</td></tr>` : ''}
        ${message ? `<tr><td style="padding: 8px 0; font-weight: bold;">Message</td><td style="padding: 8px 0;">${escapeHtml(message)}</td></tr>` : ''}
      </table>
      <p style="margin-top: 20px;">
        <a href="https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}" style="background: #25D366; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">Reply on WhatsApp</a>
      </p>
      <p style="margin-top: 16px; color: #666; font-size: 13px;">View and manage this enquiry in your admin panel.</p>
    </div>
  `;
  return { subject, html };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendEmail, customerConfirmationEmail, ownerNotificationEmail };
