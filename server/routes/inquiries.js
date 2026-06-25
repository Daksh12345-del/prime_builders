// server/routes/inquiries.js
// Stores every contact-form / "Enquire Now" submission so the admin can
// follow up later, even if the customer just messaged through the form
// and didn't go straight to WhatsApp.

const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { requireAdmin } = require('../middleware/auth');
const { sendEmail, customerConfirmationEmail, ownerNotificationEmail } = require('../utils/email');

// ---------- PUBLIC ----------

// POST /api/inquiries  (anyone can submit — this is the contact form)
router.post('/', async (req, res) => {
  const { name, phone, email, budget, message, property_id } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  let created;
  try {
    created = await store.insert('inquiries', {
      name,
      phone,
      email: email || null,
      budget: budget || null,
      message: message || null,
      property_id: property_id || null,
      status: 'New',
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to save inquiry:', err.message);
    return res.status(500).json({ error: 'Could not save your enquiry. Please try again.' });
  }

  // Respond to the customer immediately — don't make them wait on email sending.
  res.status(201).json({ success: true, id: created.id });

  // Send emails in the background. Failures here are logged but never block
  // the form submission itself — a slow or misconfigured mail setup should
  // never be the reason a real customer's enquiry gets lost.
  try {
    const property = property_id ? await store.getById('properties', property_id) : null;
    const propertyTitle = property ? property.title : null;
    const settings = await store.getSettings();
    const ownerEmail = settings.contact_email || process.env.OWNER_EMAIL;

    if (email) {
      const { subject, html } = customerConfirmationEmail({ name, propertyTitle });
      sendEmail({ to: email, subject, html }).then(result => {
        if (result.error) console.error('Customer confirmation email failed:', result.error);
      });
    }

    if (ownerEmail) {
      const { subject, html } = ownerNotificationEmail({ name, phone, email, budget, message, propertyTitle });
      sendEmail({ to: ownerEmail, subject, html, replyTo: email || undefined }).then(result => {
        if (result.error) console.error('Owner notification email failed:', result.error);
      });
    }
  } catch (err) {
    console.error('Error preparing enquiry emails:', err.message);
  }
});

// ---------- ADMIN ----------

// GET /api/inquiries  (view all submissions, newest first)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const inquiries = await store.getAll('inquiries');
    const properties = await store.getAll('properties');

    const withPropertyTitle = inquiries.map(inq => {
      const property = inq.property_id ? properties.find(p => String(p.id) === String(inq.property_id)) : null;
      return { ...inq, property_title: property ? property.title : null };
    });

    withPropertyTitle.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(withPropertyTitle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load inquiries.' });
  }
});

// PUT /api/inquiries/:id  (update status: New / Contacted / Closed)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const existing = await store.getById('inquiries', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Inquiry not found.' });

    await store.update('inquiries', req.params.id, { status: status || existing.status });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update inquiry.' });
  }
});

// DELETE /api/inquiries/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await store.remove('inquiries', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete inquiry.' });
  }
});

module.exports = router;
