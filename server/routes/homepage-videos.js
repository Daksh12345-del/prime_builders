// server/routes/homepage-videos.js
const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { requireAdmin } = require('../middleware/auth');
const { uploadHomepageVideo, cloudinary } = require('../middleware/upload');

function formatVideo(item) {
  return {
    id: item.id,
    title: item.title || null,
    video_url: item.video_url,
    video_public_id: item.video_public_id || null,
    cover_url: item.cover_url || null,
    cover_public_id: item.cover_public_id || null,
    sort_order: item.sort_order,
    created_at: item.created_at
  };
}

async function sortedVideos() {
  const all = await store.getAll('homepage_videos');
  return [...all].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

// ---------- PUBLIC ----------
router.get('/', async (req, res) => {
  try {
    const videos = await sortedVideos();
    res.json(videos.map(formatVideo));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load homepage videos.' });
  }
});

// ---------- ADMIN ----------

// POST /api/homepage-videos
router.post('/', requireAdmin, uploadHomepageVideo, async (req, res) => {
  try {
    const videoFile = req.files && req.files.video ? req.files.video[0] : null;
    const coverFile = req.files && req.files.cover ? req.files.cover[0] : null;

    if (!videoFile) return res.status(400).json({ error: 'A video file is required.' });

    const existing = await store.getAll('homepage_videos');
    if (existing.length >= 7) {
      // Delete just-uploaded files from Cloudinary since we're rejecting
      if (videoFile.filename) cloudinary.uploader.destroy(videoFile.filename, { resource_type: 'video' }).catch(() => {});
      if (coverFile && coverFile.filename) cloudinary.uploader.destroy(coverFile.filename).catch(() => {});
      return res.status(400).json({ error: 'Maximum of 7 homepage videos reached. Delete one before adding another.' });
    }

    const maxOrder = existing.reduce((max, v) => Math.max(max, v.sort_order ?? -1), -1);

    const created = await store.insert('homepage_videos', {
      title: req.body.title || null,
      video_url: videoFile.path,           // Cloudinary full URL
      video_public_id: videoFile.filename, // Cloudinary public_id
      cover_url: coverFile ? coverFile.path : null,
      cover_public_id: coverFile ? coverFile.filename : null,
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString()
    });

    res.status(201).json(formatVideo(created));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save homepage video.' });
  }
});

// DELETE /api/homepage-videos/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await store.getById('homepage_videos', req.params.id);
    if (!item) return res.status(404).json({ error: 'Video not found.' });

    if (item.video_public_id) {
      try { await cloudinary.uploader.destroy(item.video_public_id, { resource_type: 'video' }); } catch (e) {}
    }
    if (item.cover_public_id) {
      try { await cloudinary.uploader.destroy(item.cover_public_id); } catch (e) {}
    }

    await store.remove('homepage_videos', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete video.' });
  }
});

// PUT /api/homepage-videos/reorder
router.put('/reorder', requireAdmin, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of IDs.' });
    await Promise.all(order.map((id, index) => store.update('homepage_videos', id, { sort_order: index })));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reorder videos.' });
  }
});

module.exports = router;
