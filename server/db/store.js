// server/db/store.js
// Data layer backed by Supabase (Postgres). Keeps the exact same function
// names/signatures as the old file-based store, so nothing in server/routes/*.js
// needs to change.
//
// IMPORTANT: this file exposes synchronous-LOOKING functions but they are
// actually async under the hood (network calls to Supabase). Every call site
// in routes/*.js must `await` these — that update was made alongside this file.

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables. ' +
    'Set these in your .env file (local) or your hosting provider\'s environment variables (live).'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

// Tables that are simple row lists (everything except site_settings,
// which is a key-value table handled separately below).
const TABLES = [
  'properties',
  'gallery_items',
  'homepage_videos',
  'testimonials',
  'blog_posts',
  'inquiries'
];

function assertKnownTable(table) {
  if (!TABLES.includes(table)) {
    throw new Error(`Unknown table "${table}". Known tables: ${TABLES.join(', ')}`);
  }
}

// ---------- Generic table helpers ----------
// NOTE: all of these are now async — call sites must use await.

async function getAll(table) {
  assertKnownTable(table);
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('id', { ascending: true });
  if (error) throw new Error(`getAll(${table}) failed: ${error.message}`);
  return data;
}

async function getById(table, id) {
  assertKnownTable(table);
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getById(${table}) failed: ${error.message}`);
  return data || null;
}

async function insert(table, row) {
  assertKnownTable(table);
  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`insert(${table}) failed: ${error.message}`);
  return data;
}

async function update(table, id, updates) {
  assertKnownTable(table);
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`update(${table}) failed: ${error.message}`);
  return data || null;
}

async function remove(table, id) {
  assertKnownTable(table);
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  if (error) throw new Error(`remove(${table}) failed: ${error.message}`);
  return true;
}

// ---------- Settings (key-value, not a list) ----------
// Stored as rows in site_settings(key text primary key, value text).
// Exposed the same way as before: a single flat object of { key: value }.

async function getSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');
  if (error) throw new Error(`getSettings() failed: ${error.message}`);

  const settings = {};
  for (const row of data) {
    settings[row.key] = row.value;
  }
  return settings;
}

async function setSetting(key, value) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value: String(value) }, { onConflict: 'key' });
  if (error) throw new Error(`setSetting(${key}) failed: ${error.message}`);
}

async function setSettings(updates) {
  const rows = Object.entries(updates).map(([key, value]) => ({
    key,
    value: String(value)
  }));
  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(`setSettings() failed: ${error.message}`);
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
