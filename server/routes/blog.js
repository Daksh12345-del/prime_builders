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
router.get('/', (req, res) => {
  const rows = store.getAll('blog_posts')
    .filter(p => p.published)
    .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
  res.json(rows);
});

// ---------- ADMIN ----------

// List all posts (including unpublished) for the admin panel
// NOTE: defined before "/:slug" so "/admin/all" isn't swallowed by the slug route.
router.get('/admin/all', requireAdmin, (req, res) => {
  const rows = [...store.getAll('blog_posts')].sort((a, b) => b.id - a.id);
  res.json(rows);
});

// Single post by slug
router.get('/:slug', (req, res) => {
  const post = store.getAll('blog_posts').find(p => p.slug === req.params.slug && p.published);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  res.json(post);
});

router.post('/', requireAdmin, (req, res) => {
  const { title, excerpt, body, cover_url, published } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  let slug = slugify(title);
  const existingSlugs = new Set(store.getAll('blog_posts').map(p => p.slug));
  if (existingSlugs.has(slug)) {
    let i = 2;
    while (existingSlugs.has(`${slug}-${i}`)) i++;
    slug = `${slug}-${i}`;
  }

  const now = new Date().toISOString();
  const created = store.insert('blog_posts', {
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
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = store.getById('blog_posts', req.params.id);
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

  const updated = store.update('blog_posts', req.params.id, updates);
  res.json(updated);
});

router.delete('/:id', requireAdmin, (req, res) => {
  store.remove('blog_posts', req.params.id);
  res.json({ success: true });
});

module.exports = router;
