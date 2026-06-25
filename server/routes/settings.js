// server/routes/settings.js
// Site-wide settings (WhatsApp numbers, office address, stats shown on homepage)
// and testimonials, both editable from the admin panel.

const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { requireAdmin } = require('../middleware/auth');

// ---------- SETTINGS: PUBLIC ----------

router.get('/settings', (req, res) => {
  const saved = store.getSettings();
  // Merge .env fallbacks so phone numbers, email etc. always have a value
  const merged = {
    whatsapp_1: process.env.WHATSAPP_NUMBER_1 || '919310812957',
    whatsapp_2: process.env.WHATSAPP_NUMBER_2 || '918587820230',
    contact_email: process.env.OWNER_EMAIL || 'info@primebuilders.co.in',
    instagram_url: 'https://www.instagram.com/primebuilders230',
    facebook_url: 'https://www.facebook.com/people/Prime-Builders/61590449296500/',
    office_address: 'West Delhi, New Delhi, India',
    office_hours: 'Mon - Sat: 10:00 AM - 7:00 PM',
    ...saved   // admin-saved values override the above defaults
  };
  res.json(merged);
});

// ---------- SETTINGS: ADMIN ----------

router.put('/settings', requireAdmin, (req, res) => {
  store.setSettings(req.body);
  res.json({ success: true });
});

// ---------- TESTIMONIALS: PUBLIC ----------

router.get('/testimonials', (req, res) => {
  const rows = [...store.getAll('testimonials')].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  res.json(rows);
});

// ---------- TESTIMONIALS: ADMIN ----------

router.post('/testimonials', requireAdmin, (req, res) => {
  const { name, locality, quote, rating } = req.body;
  if (!name || !quote) return res.status(400).json({ error: 'Name and quote are required.' });

  const existing = store.getAll('testimonials');
  const maxOrder = existing.reduce((max, t) => Math.max(max, t.sort_order ?? -1), -1);

  const created = store.insert('testimonials', {
    name,
    locality: locality || null,
    quote,
    rating: rating || 5,
    sort_order: maxOrder + 1
  });

  res.status(201).json(created);
});

router.delete('/testimonials/:id', requireAdmin, (req, res) => {
  store.remove('testimonials', req.params.id);
  res.json({ success: true });
});

module.exports = router;
