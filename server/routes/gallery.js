// server/routes/gallery.js
const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { requireAdmin } = require('../middleware/auth');
const { uploadGalleryMedia, cloudinary } = require('../middleware/upload');

function formatItem(item) {
  return {
    id: item.id,
    type: item.type,
    caption: item.caption,
    sort_order: item.sort_order,
    url: item.url || null,
    public_id: item.public_id || null,
    youtube_id: item.youtube_id || null,
    created_at: item.created_at
  };
}

async function sortedGallery() {
  const all = await store.getAll('gallery_items');
  return [...all].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

// ---------- PUBLIC ----------
router.get('/', async (req, res) => {
  try {
    const items = await sortedGallery();
    res.json(items.map(formatItem));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load gallery.' });
  }
});

// ---------- ADMIN ----------

// Upload a photo or video to Cloudinary
router.post('/upload', requireAdmin, uploadGalleryMedia.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const isVideo = req.file.mimetype.startsWith('video/');
    const existing = await store.getAll('gallery_items');
    const maxOrder = existing.reduce((max, item) => Math.max(max, item.sort_order ?? -1), -1);

    const created = await store.insert('gallery_items', {
      type: isVideo ? 'video' : 'photo',
      url: req.file.path,           // Cloudinary full URL
      public_id: req.file.filename, // Cloudinary public_id
      youtube_id: null,
      caption: req.body.caption || null,
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString()
    });

    res.status(201).json(formatItem(created));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not upload gallery item.' });
  }
});

// Add YouTube video
router.post('/youtube', requireAdmin, async (req, res) => {
  try {
    const { youtube_id, caption } = req.body;
    if (!youtube_id) return res.status(400).json({ error: 'YouTube video ID is required.' });

    const existing = await store.getAll('gallery_items');
    const maxOrder = existing.reduce((max, item) => Math.max(max, item.sort_order ?? -1), -1);

    const created = await store.insert('gallery_items', {
      type: 'video',
      url: null,
      public_id: null,
      youtube_id,
      caption: caption || null,
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString()
    });

    res.status(201).json(formatItem(created));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add YouTube video.' });
  }
});

// Delete gallery item
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await store.getById('gallery_items', req.params.id);
    if (!item) return res.status(404).json({ error: 'Gallery item not found.' });

    // Delete from Cloudinary if it was an uploaded file
    if (item.public_id) {
      const resourceType = item.type === 'video' ? 'video' : 'image';
      try { await cloudinary.uploader.destroy(item.public_id, { resource_type: resourceType }); } catch (e) { /* ignore */ }
    }

    await store.remove('gallery_items', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete gallery item.' });
  }
});

// Reorder
router.put('/reorder', requireAdmin, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of IDs.' });
    await Promise.all(order.map((id, index) => store.update('gallery_items', id, { sort_order: index })));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reorder gallery.' });
  }
});

module.exports = router;
