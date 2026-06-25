// server/index.js
// Main entry point. Starts the Express server, connects all routes,
// and serves the frontend (public/) plus uploaded images/videos.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db/store'); // connects to Supabase and validates env vars are present

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const galleryRoutes = require('./routes/gallery');
const inquiryRoutes = require('./routes/inquiries');
const settingsRoutes = require('./routes/settings');
const homepageVideoRoutes = require('./routes/homepage-videos');
const blogRoutes = require('./routes/blog');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve uploaded images/videos as plain static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/homepage-videos', homepageVideoRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api', settingsRoutes); // exposes /api/settings and /api/testimonials

// Convenience redirect: typing /admin (no .html) still reaches the admin panel
app.get('/admin', (req, res) => res.redirect('/admin.html'));

// Serve the frontend (public/ folder) — main site and admin panel
app.use(express.static(path.join(__dirname, '..', 'public')));

// Friendly fallback for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// Any other route serves the main site's index.html (so refreshing
// /properties or /contact in the browser doesn't break)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\nPrime Builder server running at http://localhost:${PORT}`);
  console.log(`Admin panel available at  http://localhost:${PORT}/admin.html\n`);
});
