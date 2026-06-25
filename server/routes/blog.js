// server/routes/blog.js
// Public blog: simple posts with a title, slug, cover image (optional), excerpt,
// body (basic HTML/markdown-ish), and published flag.

const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { requireAdmin } = require('../middleware/auth');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------- PUBLIC ----------

// List published posts (newest first)
router.get('/', async (req, res) => {
  try {
    const all = await store.getAll('blog_posts');
    const rows = all
      .filter(p => p.published)
      .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load blog posts.' });
  }
});

// ---------- ADMIN ----------

// List all posts (including unpublished) for the admin panel
// NOTE: defined before "/:slug" so "/admin/all" isn't swallowed by the slug route.
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const all = await store.getAll('blog_posts');
    const rows = [...all].sort((a, b) => b.id - a.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load blog posts.' });
  }
});

// Single post by slug
router.get('/:slug', async (req, res) => {
  try {
    const all = await store.getAll('blog_posts');
    const post = all.find(p => p.slug === req.params.slug && p.published);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load post.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, excerpt, body, cover_url, published } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }

    let slug = slugify(title);
    const all = await store.getAll('blog_posts');
    const existingSlugs = new Set(all.map(p => p.slug));
    if (existingSlugs.has(slug)) {
      let i = 2;
      while (existingSlugs.has(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    }

    const now = new Date().toISOString();
    const created = await store.insert('blog_posts', {
      title,
      slug,
      excerpt: excerpt || '',
      body,
      cover_url: cover_url || null,
      published: !!published,
      created_at: now,
      published_at: published ? now : null
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create post.' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await store.getById('blog_posts', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    const { title, excerpt, body, cover_url, published } = req.body;

    const updates = {
      title: title ?? existing.title,
      excerpt: excerpt ?? existing.excerpt,
      body: body ?? existing.body,
      cover_url: cover_url ?? existing.cover_url
    };

    if (published !== undefined) {
      updates.published = !!published;
      if (updates.published && !existing.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    const updated = await store.update('blog_posts', req.params.id, updates);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update post.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await store.remove('blog_posts', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete post.' });
  }
});

module.exports = router;
