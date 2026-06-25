// server/db/store.js
// A tiny file-based database. No native compiling required (unlike better-sqlite3),
// so it works on any computer the moment Node.js is installed — nothing else needed.
//
// All data lives in one JSON file (prime_builder_data.json) in the project root.
// This is plenty for a single real-estate site's traffic. If you ever outgrow it,
// the data shape here maps cleanly onto a real SQL database later.

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', '..', 'prime_builder_data.json');

const DEFAULT_DATA = {
  properties: [],       // { id, title, bhk, locality, price_value, price_label, area_sqft, floor, facing, bathrooms, status, is_featured, description, amenities: [], images: [{id, filename}], created_at }
  gallery_items: [],     // { id, type, filename, youtube_id, caption, sort_order, created_at }
  homepage_videos: [],   // { id, title, video_filename, cover_filename, sort_order, created_at }
  testimonials: [],      // { id, name, locality, quote, rating, sort_order }
  blog_posts: [],        // { id, title, slug, excerpt, body, cover_url, published, created_at, published_at }
  inquiries: [],         // { id, name, phone, email, budget, message, property_id, status, created_at }
  site_settings: {},     // { key: value }
  _next_id: 1            // counter used to generate unique IDs across all tables
};

let cache = null;

function load() {
  if (cache) return cache;

  if (!fs.existsSync(DATA_FILE)) {
    cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
    save();
    return cache;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    cache = JSON.parse(raw);
    // Fill in any missing keys (e.g. if the file is from an older version)
    for (const key of Object.keys(DEFAULT_DATA)) {
      if (!(key in cache)) cache[key] = JSON.parse(JSON.stringify(DEFAULT_DATA[key]));
    }
  } catch (err) {
    console.error('Could not read database file, starting fresh:', err.message);
    cache = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  return cache;
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function nextId() {
  const data = load();
  const id = data._next_id;
  data._next_id += 1;
  return id;
}

// ---------- Generic table helpers ----------

function getAll(table) {
  return load()[table];
}

function getById(table, id) {
  return load()[table].find(row => String(row.id) === String(id)) || null;
}

function insert(table, row) {
  const data = load();
  const newRow = { id: nextId(), ...row };
  data[table].push(newRow);
  save();
  return newRow;
}

function update(table, id, updates) {
  const data = load();
  const index = data[table].findIndex(row => String(row.id) === String(id));
  if (index === -1) return null;
  data[table][index] = { ...data[table][index], ...updates };
  save();
  return data[table][index];
}

function remove(table, id) {
  const data = load();
  const index = data[table].findIndex(row => String(row.id) === String(id));
  if (index === -1) return false;
  data[table].splice(index, 1);
  save();
  return true;
}

// ---------- Settings (key-value, not a list) ----------

function getSettings() {
  return load().site_settings;
}

function setSetting(key, value) {
  const data = load();
  data.site_settings[key] = String(value);
  save();
}

function setSettings(updates) {
  const data = load();
  for (const [key, value] of Object.entries(updates)) {
    data.site_settings[key] = String(value);
  }
  save();
}

module.exports = {
  getAll,
  getById,
  insert,
  update,
  remove,
  getSettings,
  setSetting,
  setSettings
};
