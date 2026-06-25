// server/routes/properties.js
const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { requireAdmin } = require('../middleware/auth');
const { uploadPropertyImages, cloudinary } = require('../middleware/upload');

function formatProperty(property) {
  const images = (property.images || []).map(img => ({
    id: img.id,
    url: img.url,          // Cloudinary URL stored directly
    public_id: img.public_id
  }));
  return { ...property, images };
}

// ---------- PUBLIC ROUTES ----------

router.get('/', (req, res) => {
  const { bhk, locality, sort, status, search } = req.query;
  let rows = store.getAll('properties');

  if (bhk) rows = rows.filter(p => p.bhk === bhk);
  if (status) rows = rows.filter(p => p.status === status);
  if (locality) rows = rows.filter(p => p.locality.toLowerCase().includes(locality.toLowerCase()));
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(p => p.title.toLowerCase().includes(s) || p.locality.toLowerCase().includes(s));
  }

  if (sort === 'price_asc') rows = [...rows].sort((a, b) => a.price_value - b.price_value);
  else if (sort === 'price_desc') rows = [...rows].sort((a, b) => b.price_value - a.price_value);
  else if (sort === 'newest') rows = [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  else rows = [...rows].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));

  res.json(rows.map(formatProperty));
});

router.get('/:id', (req, res) => {
  const property = store.getById('properties', req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found.' });
  res.json(formatProperty(property));
});

// ---------- ADMIN ROUTES ----------

router.post('/', requireAdmin, (req, res) => {
  const {
    title, bhk, locality, price_value, price_label,
    area_sqft, floor, facing, bathrooms, status,
    is_featured, description, amenities, units_available
  } = req.body;

  if (!title || !bhk || !locality || !price_value || !price_label || !area_sqft) {
    return res.status(400).json({ error: 'Title, BHK, locality, price, and area are required.' });
  }

  const created = store.insert('properties', {
    title, bhk, locality,
    price_value: Number(price_value),
    price_label,
    area_sqft: Number(area_sqft),
    floor: floor || null,
    facing: facing || null,
    bathrooms: bathrooms ? Number(bathrooms) : 2,
    status: status || 'Available',
    is_featured: !!is_featured,
    description: description || null,
    amenities: Array.isArray(amenities) ? amenities : [],
    units_available: units_available !== undefined ? Number(units_available) : null,
    images: [],
    created_at: new Date().toISOString()
  });

  res.status(201).json(formatProperty(created));
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = store.getById('properties', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Property not found.' });

  const {
    title, bhk, locality, price_value, price_label,
    area_sqft, floor, facing, bathrooms, status,
    is_featured, description, amenities, units_available
  } = req.body;

  const updates = {
    title: title ?? existing.title,
    bhk: bhk ?? existing.bhk,
    locality: locality ?? existing.locality,
    price_value: price_value !== undefined ? Number(price_value) : existing.price_value,
    price_label: price_label ?? existing.price_label,
    area_sqft: area_sqft !== undefined ? Number(area_sqft) : existing.area_sqft,
    floor: floor ?? existing.floor,
    facing: facing ?? existing.facing,
    bathrooms: bathrooms !== undefined ? Number(bathrooms) : existing.bathrooms,
    status: status ?? existing.status,
    is_featured: is_featured !== undefined ? !!is_featured : existing.is_featured,
    description: description ?? existing.description,
    amenities: Array.isArray(amenities) ? amenities : existing.amenities,
    units_available: units_available !== undefined ? (units_available === '' || units_available === null ? null : Number(units_available)) : existing.units_available
  };

  const updated = store.update('properties', req.params.id, updates);
  res.json(formatProperty(updated));
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const existing = store.getById('properties', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Property not found.' });

  // Delete images from Cloudinary
  for (const img of (existing.images || [])) {
    if (img.public_id) {
      try { await cloudinary.uploader.destroy(img.public_id); } catch (e) { /* ignore */ }
    }
  }

  store.remove('properties', req.params.id);
  res.json({ success: true });
});

// POST /api/properties/:id/images
router.post('/:id/images', requireAdmin, uploadPropertyImages.array('images', 10), (req, res) => {
  const property = store.getById('properties', req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found.' });
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No image files were uploaded.' });

  let nextImgId = 1;
  (property.images || []).forEach(img => { if (img.id >= nextImgId) nextImgId = img.id + 1; });

  const newImages = req.files.map((file, i) => ({
    id: nextImgId + i,
    url: file.path,           // Cloudinary returns full URL in file.path
    public_id: file.filename  // Cloudinary public_id stored in file.filename
  }));

  const updatedImages = [...(property.images || []), ...newImages];
  const updated = store.update('properties', req.params.id, { images: updatedImages });
  res.status(201).json(formatProperty(updated));
});

// DELETE /api/properties/:id/images/:imageId
router.delete('/:id/images/:imageId', requireAdmin, async (req, res) => {
  const property = store.getById('properties', req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found.' });

  const image = (property.images || []).find(img => String(img.id) === String(req.params.imageId));
  if (!image) return res.status(404).json({ error: 'Image not found.' });

  // Delete from Cloudinary
  if (image.public_id) {
    try { await cloudinary.uploader.destroy(image.public_id); } catch (e) { /* ignore */ }
  }

  const updatedImages = property.images.filter(img => String(img.id) !== String(req.params.imageId));
  store.update('properties', req.params.id, { images: updatedImages });
  res.json({ success: true });
});

module.exports = router;
