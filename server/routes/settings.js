// server/routes/settings.js
// Site-wide settings (WhatsApp numbers, office address, stats shown on homepage)
// and testimonials, both editable from the admin panel.

const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { requireAdmin } = require('../middleware/auth');

// ---------- SETTINGS: PUBLIC ----------

router.get('/settings', async (req, res) => {
  try {
    const settings = await store.getSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load settings.' });
  }
});

// ---------- SETTINGS: ADMIN ----------

router.put('/settings', requireAdmin, async (req, res) => {
  try {
    await store.setSettings(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save settings.' });
  }
});

// ---------- TESTIMONIALS: PUBLIC ----------

router.get('/testimonials', async (req, res) => {
  try {
    const all = await store.getAll('testimonials');
    const rows = [...all].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load testimonials.' });
  }
});

// ---------- TESTIMONIALS: ADMIN ----------

router.post('/testimonials', requireAdmin, async (req, res) => {
  try {
    const { name, locality, quote, rating } = req.body;
    if (!name || !quote) return res.status(400).json({ error: 'Name and quote are required.' });

    const existing = await store.getAll('testimonials');
    const maxOrder = existing.reduce((max, t) => Math.max(max, t.sort_order ?? -1), -1);

    const created = await store.insert('testimonials', {
      name,
      locality: locality || null,
      quote,
      rating: rating || 5,
      sort_order: maxOrder + 1
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save testimonial.' });
  }
});

router.delete('/testimonials/:id', requireAdmin, async (req, res) => {
  try {
    await store.remove('testimonials', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete testimonial.' });
  }
});

module.exports = router;
