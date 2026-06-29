// public/js/admin.js
// Drives the entire admin panel: login, navigation between views, and all
// create/edit/delete operations against the backend API.

const API_BASE = '/api';
let authToken = localStorage.getItem('pb_admin_token') || null;

// ---------- API helpers (auth-aware) ----------

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
  });
  if (res.status === 401) { handleAuthExpired(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Request failed: ${res.status}`);
  return res.json();
}

async function apiSend(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) { handleAuthExpired(); throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

async function apiUpload(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: formData
  });
  if (res.status === 401) { handleAuthExpired(); throw new Error('Session expired'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
  return data;
}

function handleAuthExpired() {
  localStorage.removeItem('pb_admin_token');
  authToken = null;
  showLogin('Your session expired. Please log in again.');
}

// ---------- Toast ----------

function showToast(message, isError) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('error', !!isError);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ---------- Login / Logout ----------

function showLogin(errorMsg) {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-app').classList.add('hidden');
  const errEl = document.getElementById('login-error');
  if (errorMsg) {
    errEl.textContent = errorMsg;
    errEl.classList.remove('hidden');
  } else {
    errEl.classList.add('hidden');
  }
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-app').classList.remove('hidden');
  loadDashboard();
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    authToken = data.token;
    localStorage.setItem('pb_admin_token', authToken);
    showApp();
  } catch (err) {
    showLogin(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
}

function handleLogout() {
  localStorage.removeItem('pb_admin_token');
  authToken = null;
  showLogin();
}

// ---------- Navigation between views ----------

function switchView(viewName) {
  document.querySelectorAll('.admin-view').forEach(v => v.classList.add('hidden'));
  document.getElementById(`view-${viewName}`).classList.remove('hidden');

  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });

  if (viewName === 'dashboard') loadDashboard();
  else if (viewName === 'properties') loadPropertiesView();
  else if (viewName === 'gallery') loadGalleryView();
  else if (viewName === 'homepage-videos') loadHomepageVideosView();
  else if (viewName === 'inquiries') loadInquiriesView();
  else if (viewName === 'testimonials') loadTestimonialsView();
  else if (viewName === 'blog') loadBlogView();
  else if (viewName === 'settings') loadSettingsView();
}

// ---------- Dashboard ----------

async function loadDashboard() {
  try {
    const [properties, inquiries] = await Promise.all([
      apiGet('/properties'),
      apiGet('/inquiries')
    ]);

    document.getElementById('stat-total-properties').textContent = properties.length;
    document.getElementById('stat-available').textContent = properties.filter(p => p.status === 'Available').length;
    document.getElementById('stat-sold').textContent = properties.filter(p => p.status === 'Sold').length;
    document.getElementById('stat-new-inquiries').textContent = inquiries.filter(i => i.status === 'New').length;

    const recent = inquiries.slice(0, 5);
    const wrap = document.getElementById('dashboard-recent-inquiries');
    wrap.innerHTML = recent.length > 0 ? renderInquiriesTable(recent, false) : `<div class="admin-table-empty">No inquiries yet.</div>`;
    wireInquiryActions(wrap);
  } catch (e) {
    console.error(e);
  }
}

// ---------- Properties view ----------

let cachedProperties = [];

async function loadPropertiesView() {
  const wrap = document.getElementById('admin-properties-list');
  wrap.innerHTML = `<div class="admin-table-empty">Loading...</div>`;
  try {
    cachedProperties = await apiGet('/properties');
    wrap.innerHTML = cachedProperties.length > 0 ? renderPropertiesTable(cachedProperties) : `<div class="admin-table-empty">No properties yet. Click "+ Add Property" to create one.</div>`;
    wirePropertyActions(wrap);
  } catch (e) {
    wrap.innerHTML = `<div class="admin-table-empty">Could not load properties.</div>`;
  }
}

function renderPropertiesTable(properties) {
  return `
    <table class="admin-table">
      <thead>
        <tr><th>Title</th><th>BHK</th><th>Locality</th><th>Price</th><th>Units Available</th><th>Status</th><th>Photos</th><th></th></tr>
      </thead>
      <tbody>
        ${properties.map(p => `
          <tr>
            <td>${p.title}${p.is_featured ? ' <span class="badge new">Featured</span>' : ''}</td>
            <td>${p.bhk}</td>
            <td>${p.locality}</td>
            <td class="mono">&#8377; ${p.price_label}</td>
            <td style="text-align:center;">${p.units_available != null ? `<span class="badge new">${p.units_available} units</span>` : '<span style="color:var(--color-grey);">—</span>'}</td>
            <td><span class="badge ${p.status.toLowerCase()}">${p.status}</span></td>
            <td>${p.images.length}</td>
            <td>
              <button class="icon-btn" data-action="edit-property" data-id="${p.id}">Edit</button>
              <button class="icon-btn danger" data-action="delete-property" data-id="${p.id}">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function wirePropertyActions(container) {
  container.querySelectorAll('[data-action="edit-property"]').forEach(btn => {
    btn.addEventListener('click', () => openPropertyEditor(btn.dataset.id));
  });
  container.querySelectorAll('[data-action="delete-property"]').forEach(btn => {
    btn.addEventListener('click', () => confirmDeleteProperty(btn.dataset.id));
  });
}

async function confirmDeleteProperty(id) {
  if (!confirm('Delete this property? This also removes its photos. This cannot be undone.')) return;
  try {
    await apiSend('DELETE', `/properties/${id}`);
    showToast('Property deleted.');
    loadPropertiesView();
  } catch (e) {
    showToast(e.message, true);
  }
}

// ---------- Property Add/Edit Modal ----------

let editingPropertyId = null;
let pendingNewImages = []; // File objects queued before property exists (for "add" flow)

function openPropertyEditor(id) {
  editingPropertyId = id || null;
  pendingNewImages = [];
  const property = id ? cachedProperties.find(p => String(p.id) === String(id)) : null;

  const slot = document.getElementById('property-modal-slot');
  slot.innerHTML = `
    <div class="modal-overlay" id="prop-modal-overlay">
      <div class="modal-content" style="max-width:680px;">
        <button class="modal-close" id="prop-modal-close">&times;</button>
        <h2 style="font-size:var(--text-xl);color:var(--color-white);margin-bottom:20px;">${property ? 'Edit Property' : 'Add New Property'}</h2>

        <form id="property-form">
          <div class="form-row">
            <div class="form-group">
              <label for="p-title">Title *</label>
              <input type="text" id="p-title" required value="${property ? escapeAttr(property.title) : ''}" placeholder="e.g. Spacious 3BHK Builder Floor">
            </div>
            <div class="form-group">
              <label for="p-bhk">Configuration *</label>
              <select id="p-bhk" required>
                <option value="2BHK" ${property?.bhk === '2BHK' ? 'selected' : ''}>2BHK</option>
                <option value="3BHK" ${property?.bhk === '3BHK' ? 'selected' : ''}>3BHK</option>
                <option value="4BHK" ${property?.bhk === '4BHK' ? 'selected' : ''}>4BHK</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="p-locality">Locality *</label>
            <input type="text" id="p-locality" required value="${property ? escapeAttr(property.locality) : ''}" placeholder="e.g. Uttam Nagar West, South West Delhi">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="p-down-pct">Down Payment (%)</label>
              <input type="number" id="p-down-pct" min="0" max="100" step="0.1" value="${property ? (property.down_payment_pct ?? '') : ''}" placeholder="e.g. 20">
            </div>
            <div class="form-group">
              <label for="p-down-amt">Down Payment Amount (&#8377;)</label>
              <input type="number" id="p-down-amt" min="0" value="${property ? (property.down_payment_amount ?? '') : ''}" placeholder="e.g. 1900000">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="p-area">Area (sq.ft) *</label>
              <input type="number" id="p-area" required value="${property ? property.area_sqft : ''}">
            </div>
            <div class="form-group">
              <label for="p-bathrooms">Bathrooms</label>
              <input type="number" id="p-bathrooms" value="${property ? property.bathrooms : 2}">
            </div>
          </div>

          <div class="form-group">
            <label for="p-floor">Floor</label>
            <select id="p-floor">
              <option value="" ${!property?.floor ? 'selected' : ''}>— Select Floor —</option>
              <option value="Upper Ground Floor" ${property?.floor === 'Upper Ground Floor' ? 'selected' : ''}>Upper Ground Floor</option>
              <option value="First Floor" ${property?.floor === 'First Floor' ? 'selected' : ''}>First Floor</option>
              <option value="Second Floor" ${property?.floor === 'Second Floor' ? 'selected' : ''}>Second Floor</option>
              <option value="Third Floor" ${property?.floor === 'Third Floor' ? 'selected' : ''}>Third Floor</option>
              <option value="Third Floor with Roof" ${property?.floor === 'Third Floor with Roof' ? 'selected' : ''}>Third Floor with Roof</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="p-status">Status</label>
              <select id="p-status">
                <option value="Available" ${property?.status === 'Available' ? 'selected' : ''}>Available</option>
                <option value="Sold" ${property?.status === 'Sold' ? 'selected' : ''}>Sold</option>
              </select>
            </div>
            <div class="form-group">
              <label for="p-units">Units Available <span style="color:var(--color-grey);font-weight:400;font-size:var(--text-xs);">(optional — shows badge on card)</span></label>
              <input type="number" id="p-units" min="0" value="${property?.units_available ?? ''}" placeholder="e.g. 5">
            </div>
          </div>

          <div class="form-group" style="display:flex;align-items:center;gap:10px;">
            <input type="checkbox" id="p-featured" style="width:auto;" ${property?.is_featured ? 'checked' : ''}>
            <label for="p-featured" style="margin:0;">Show as Featured on homepage</label>
          </div>

          <div class="form-group">
            <label for="p-description">Description</label>
            <textarea id="p-description" placeholder="Short description for the property detail page...">${property ? escapeHTML(property.description || '') : ''}</textarea>
          </div>

          <div class="form-group">
            <label for="p-amenities">Amenities (comma-separated)</label>
            <input type="text" id="p-amenities" value="${property ? escapeAttr((property.amenities || []).join(', ')) : ''}" placeholder="e.g. Lift, Power Backup, Parking">
          </div>

          <div class="form-group">
            <label>Photos (up to 10 total)</label>
            <div class="photo-manager-grid" id="photo-manager-grid">
              ${property ? property.images.map(img => `
                <div class="photo-manager-item" data-existing-image-id="${img.id}">
                  <img src="${img.url}">
                  <button type="button" class="remove-btn" data-action="remove-existing-image" data-image-id="${img.id}">&times;</button>
                </div>
              `).join('') : ''}
            </div>
            <input type="file" id="p-photos" accept="image/*" multiple>
            <p class="admin-help-text" style="margin-top:8px;margin-bottom:0;">Select multiple photos at once (hold Ctrl/Cmd while clicking, or Shift for a range). ${property ? 'New photos are added to the existing ones below.' : 'Photos will upload after you save this property.'}</p>
          </div>

          <button type="submit" class="btn btn-gold btn-block" id="property-save-btn">${property ? 'Save Changes' : 'Create Property'}</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('prop-modal-close').addEventListener('click', closePropertyEditor);
  document.getElementById('prop-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'prop-modal-overlay') closePropertyEditor();
  });
  document.getElementById('property-form').addEventListener('submit', handlePropertySave);

  if (property) {
    document.querySelectorAll('[data-action="remove-existing-image"]').forEach(btn => {
      btn.addEventListener('click', () => removeExistingImage(property.id, btn.dataset.imageId));
    });
  }

  document.body.style.overflow = 'hidden';
}

function closePropertyEditor() {
  document.getElementById('property-modal-slot').innerHTML = '';
  document.body.style.overflow = '';
  editingPropertyId = null;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
function escapeHTML(str) {
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function removeExistingImage(propertyId, imageId) {
  if (!confirm('Remove this photo?')) return;
  try {
    await apiSend('DELETE', `/properties/${propertyId}/images/${imageId}`);
    document.querySelector(`[data-existing-image-id="${imageId}"]`)?.remove();
    showToast('Photo removed.');
  } catch (e) {
    showToast(e.message, true);
  }
}

async function handlePropertySave(e) {
  e.preventDefault();
  const btn = document.getElementById('property-save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const amenitiesRaw = document.getElementById('p-amenities').value.trim();
  const amenities = amenitiesRaw ? amenitiesRaw.split(',').map(a => a.trim()).filter(Boolean) : [];

  const unitsRaw = document.getElementById('p-units').value.trim();

  const payload = {
    title: document.getElementById('p-title').value.trim(),
    bhk: document.getElementById('p-bhk').value,
    locality: document.getElementById('p-locality').value.trim(),
    area_sqft: parseInt(document.getElementById('p-area').value, 10),
    bathrooms: parseInt(document.getElementById('p-bathrooms').value, 10) || 2,
    floor: document.getElementById('p-floor').value,
    down_payment_pct: document.getElementById('p-down-pct').value !== '' ? parseFloat(document.getElementById('p-down-pct').value) : null,
    down_payment_amount: document.getElementById('p-down-amt').value !== '' ? parseFloat(document.getElementById('p-down-amt').value) : null,
    status: document.getElementById('p-status').value,
    is_featured: document.getElementById('p-featured').checked,
    description: document.getElementById('p-description').value.trim(),
    amenities,
    units_available: unitsRaw !== '' ? parseInt(unitsRaw, 10) : null
  };

  const photoInput = document.getElementById('p-photos');
  const files = photoInput.files;

  try {
    let savedProperty;
    if (editingPropertyId) {
      savedProperty = await apiSend('PUT', `/properties/${editingPropertyId}`, payload);
    } else {
      savedProperty = await apiSend('POST', '/properties', payload);
    }

    if (files && files.length > 0) {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('images', f));
      await apiUpload(`/properties/${savedProperty.id}/images`, formData);
    }

    showToast(editingPropertyId ? 'Property updated.' : 'Property created.');
    closePropertyEditor();
    loadPropertiesView();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = editingPropertyId ? 'Save Changes' : 'Create Property';
  }
}

// ---------- Gallery view ----------

let cachedGallery = [];

async function loadGalleryView() {
  const grid = document.getElementById('admin-gallery-grid');
  grid.innerHTML = `<div class="admin-table-empty">Loading...</div>`;
  try {
    cachedGallery = await apiGet('/gallery');
    grid.innerHTML = cachedGallery.length > 0 ? cachedGallery.map(adminGalleryItemHTML).join('') : `<div class="admin-table-empty">No gallery items yet.</div>`;
    wireGalleryActions();
  } catch (e) {
    grid.innerHTML = `<div class="admin-table-empty">Could not load gallery.</div>`;
  }
}

function adminGalleryItemHTML(item) {
  let media;
  if (item.type === 'video') {
    media = item.youtube_id
      ? `<img src="https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg" alt="">`
      : `<video src="${item.url}" muted></video>`;
  } else {
    media = `<img src="${item.url}" alt="">`;
  }
  return `
    <div class="admin-gallery-item">
      ${media}
      <span class="type-tag">${item.type}</span>
      <button class="remove-btn" data-action="delete-gallery-item" data-id="${item.id}">&times;</button>
    </div>
  `;
}

function wireGalleryActions() {
  document.querySelectorAll('[data-action="delete-gallery-item"]').forEach(btn => {
    btn.addEventListener('click', () => confirmDeleteGalleryItem(btn.dataset.id));
  });
}

async function confirmDeleteGalleryItem(id) {
  if (!confirm('Delete this gallery item?')) return;
  try {
    await apiSend('DELETE', `/gallery/${id}`);
    showToast('Removed from gallery.');
    loadGalleryView();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function handleGalleryUpload(e) {
  e.preventDefault();
  const fileInput = document.getElementById('gallery-file');
  const caption = document.getElementById('gallery-caption').value.trim();
  if (!fileInput.files || fileInput.files.length === 0) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('caption', caption);

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  try {
    await apiUpload('/gallery/upload', formData);
    showToast('Uploaded! It is now live on the Gallery page.');
    document.getElementById('gallery-upload-form').reset();
    loadGalleryView();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload';
  }
}

async function handleYoutubeAdd(e) {
  e.preventDefault();
  const youtube_id = document.getElementById('youtube-id').value.trim();
  const caption = document.getElementById('youtube-caption').value.trim();

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {
    await apiSend('POST', '/gallery/youtube', { youtube_id, caption });
    showToast('YouTube video added to gallery.');
    document.getElementById('youtube-add-form').reset();
    loadGalleryView();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add YouTube Video';
  }
}

// ---------- Homepage Videos view ----------

let cachedHomepageVideos = [];

async function loadHomepageVideosView() {
  const grid = document.getElementById('admin-homepage-videos-grid');
  grid.innerHTML = `<div class="admin-table-empty">Loading...</div>`;
  try {
    cachedHomepageVideos = await apiGet('/homepage-videos');
    document.getElementById('hv-count').textContent = cachedHomepageVideos.length;
    grid.innerHTML = cachedHomepageVideos.length > 0
      ? cachedHomepageVideos.map(adminHomepageVideoHTML).join('')
      : `<div class="admin-table-empty">No homepage videos yet. Add one above — it will appear in the floating row on the homepage.</div>`;
    wireHomepageVideoActions();
    updateHomepageVideoFormState();
  } catch (e) {
    grid.innerHTML = `<div class="admin-table-empty">Could not load homepage videos.</div>`;
  }
}

function adminHomepageVideoHTML(item) {
  const media = item.cover_url
    ? `<img src="${item.cover_url}" alt="">`
    : `<video src="${item.video_url}" muted></video>`;
  return `
    <div class="admin-gallery-item">
      ${media}
      <span class="type-tag">video</span>
      <button class="remove-btn" data-action="delete-homepage-video" data-id="${item.id}">&times;</button>
    </div>
  `;
}

function wireHomepageVideoActions() {
  document.querySelectorAll('[data-action="delete-homepage-video"]').forEach(btn => {
    btn.addEventListener('click', () => confirmDeleteHomepageVideo(btn.dataset.id));
  });
}

function updateHomepageVideoFormState() {
  const submitBtn = document.getElementById('hv-submit-btn');
  const atLimit = cachedHomepageVideos.length >= 7;
  submitBtn.disabled = atLimit;
  submitBtn.textContent = atLimit ? 'Limit reached (7/7) — delete one first' : 'Upload Video';
}

async function confirmDeleteHomepageVideo(id) {
  if (!confirm('Remove this video from the homepage row?')) return;
  try {
    await apiSend('DELETE', `/homepage-videos/${id}`);
    showToast('Removed from homepage.');
    loadHomepageVideosView();
  } catch (e) {
    showToast(e.message, true);
  }
}

async function handleHomepageVideoUpload(e) {
  e.preventDefault();
  const videoInput = document.getElementById('hv-video');
  const coverInput = document.getElementById('hv-cover');
  const title = document.getElementById('hv-title').value.trim();

  if (!videoInput.files || videoInput.files.length === 0) {
    showToast('Please choose a video file.', true);
    return;
  }

  const formData = new FormData();
  formData.append('video', videoInput.files[0]);
  if (coverInput.files && coverInput.files.length > 0) {
    formData.append('cover', coverInput.files[0]);
  }
  formData.append('title', title);

  const btn = document.getElementById('hv-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  try {
    await apiUpload('/homepage-videos', formData);
    showToast('Video added! It is now live on the homepage row.');
    document.getElementById('homepage-video-form').reset();
    loadHomepageVideosView();
  } catch (err) {
    showToast(err.message, true);
    btn.disabled = false;
    btn.textContent = 'Upload Video';
  }
}

// ---------- Inquiries view ----------

async function loadInquiriesView() {
  const wrap = document.getElementById('admin-inquiries-list');
  wrap.innerHTML = `<div class="admin-table-empty">Loading...</div>`;
  try {
    const inquiries = await apiGet('/inquiries');
    wrap.innerHTML = inquiries.length > 0 ? renderInquiriesTable(inquiries, true) : `<div class="admin-table-empty">No inquiries yet.</div>`;
    wireInquiryActions(wrap);
  } catch (e) {
    wrap.innerHTML = `<div class="admin-table-empty">Could not load inquiries.</div>`;
  }
}

function renderInquiriesTable(inquiries, showDelete) {
  return `
    <table class="admin-table">
      <thead>
        <tr><th>Name</th><th>Phone</th><th>Property</th><th>Budget</th><th>Status</th><th>Date</th><th></th></tr>
      </thead>
      <tbody>
        ${inquiries.map(i => `
          <tr>
            <td>${i.name}</td>
            <td>${i.phone}</td>
            <td>${i.property_title || '&mdash;'}</td>
            <td>${i.budget || '&mdash;'}</td>
            <td>
              <select class="status-select" data-action="update-status" data-id="${i.id}" style="background:var(--color-ink);color:var(--color-paper);border:1px solid var(--color-line);border-radius:4px;padding:2px 6px;font-size:var(--text-xs);">
                <option value="New" ${i.status === 'New' ? 'selected' : ''}>New</option>
                <option value="Contacted" ${i.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                <option value="Closed" ${i.status === 'Closed' ? 'selected' : ''}>Closed</option>
              </select>
            </td>
            <td>${new Date(i.created_at).toLocaleDateString('en-IN')}</td>
            <td>
              <a class="icon-btn" href="https://wa.me/91${i.phone.replace(/\D/g,'').slice(-10)}" target="_blank" rel="noopener">WhatsApp</a>
              ${showDelete ? `<button class="icon-btn danger" data-action="delete-inquiry" data-id="${i.id}">Delete</button>` : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function wireInquiryActions(container) {
  container.querySelectorAll('[data-action="update-status"]').forEach(select => {
    select.addEventListener('change', async () => {
      try {
        await apiSend('PUT', `/inquiries/${select.dataset.id}`, { status: select.value });
        showToast('Status updated.');
      } catch (e) {
        showToast(e.message, true);
      }
    });
  });
  container.querySelectorAll('[data-action="delete-inquiry"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this inquiry?')) return;
      try {
        await apiSend('DELETE', `/inquiries/${btn.dataset.id}`);
        showToast('Inquiry deleted.');
        loadInquiriesView();
      } catch (e) {
        showToast(e.message, true);
      }
    });
  });
}

// ---------- Testimonials view ----------

async function loadTestimonialsView() {
  const wrap = document.getElementById('admin-testimonials-list');
  wrap.innerHTML = `<div class="admin-table-empty">Loading...</div>`;
  try {
    const testimonials = await apiGet('/testimonials');
    wrap.innerHTML = testimonials.length > 0 ? `
      <table class="admin-table">
        <thead><tr><th>Name</th><th>Locality</th><th>Quote</th><th>Rating</th><th></th></tr></thead>
        <tbody>
          ${testimonials.map(t => `
            <tr>
              <td>${t.name}</td>
              <td>${t.locality || '&mdash;'}</td>
              <td style="max-width:300px;">${t.quote}</td>
              <td>${t.rating} &#9733;</td>
              <td><button class="icon-btn danger" data-action="delete-testimonial" data-id="${t.id}">Delete</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `<div class="admin-table-empty">No testimonials yet.</div>`;

    wrap.querySelectorAll('[data-action="delete-testimonial"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this testimonial?')) return;
        try {
          await apiSend('DELETE', `/testimonials/${btn.dataset.id}`);
          showToast('Testimonial deleted.');
          loadTestimonialsView();
        } catch (e) {
          showToast(e.message, true);
        }
      });
    });
  } catch (e) {
    wrap.innerHTML = `<div class="admin-table-empty">Could not load testimonials.</div>`;
  }
}

async function handleTestimonialAdd(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('t-name').value.trim(),
    locality: document.getElementById('t-locality').value.trim(),
    quote: document.getElementById('t-quote').value.trim(),
    rating: parseInt(document.getElementById('t-rating').value, 10)
  };
  try {
    await apiSend('POST', '/testimonials', payload);
    showToast('Testimonial added.');
    document.getElementById('testimonial-form').reset();
    loadTestimonialsView();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ---------- Blog view ----------

let editingBlogId = null;

async function loadBlogView() {
  const wrap = document.getElementById('admin-blog-list');
  wrap.innerHTML = `<div class="admin-table-empty">Loading...</div>`;
  try {
    const posts = await apiGet('/blog/admin/all');
    wrap.innerHTML = posts.length > 0 ? `
      <table class="admin-table">
        <thead><tr><th>Title</th><th>Status</th><th>Published</th><th></th></tr></thead>
        <tbody>
          ${posts.map(p => `
            <tr>
              <td>${escapeHTML(p.title)}</td>
              <td>${p.published ? '<span style="color:var(--color-success);">Published</span>' : '<span style="color:var(--color-grey);">Draft</span>'}</td>
              <td>${p.published_at ? new Date(p.published_at).toLocaleDateString('en-IN') : '&mdash;'}</td>
              <td style="white-space:nowrap;">
                <button class="icon-btn" data-action="edit-blog" data-id="${p.id}">Edit</button>
                <button class="icon-btn danger" data-action="delete-blog" data-id="${p.id}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `<div class="admin-table-empty">No blog posts yet.</div>`;

    wrap.querySelectorAll('[data-action="delete-blog"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this blog post? This cannot be undone.')) return;
        try {
          await apiSend('DELETE', `/blog/${btn.dataset.id}`);
          showToast('Post deleted.');
          loadBlogView();
        } catch (e) {
          showToast(e.message, true);
        }
      });
    });

    wrap.querySelectorAll('[data-action="edit-blog"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const post = posts.find(p => String(p.id) === btn.dataset.id);
        if (post) startEditBlogPost(post);
      });
    });
  } catch (e) {
    wrap.innerHTML = `<div class="admin-table-empty">Could not load blog posts.</div>`;
  }
}

function startEditBlogPost(post) {
  editingBlogId = post.id;
  document.getElementById('b-id').value = post.id;
  document.getElementById('b-title').value = post.title;
  document.getElementById('b-excerpt').value = post.excerpt || '';
  document.getElementById('b-cover-url').value = post.cover_url || '';
  document.getElementById('b-body').value = post.body;
  document.getElementById('b-published').checked = !!post.published;

  document.getElementById('blog-form-heading').textContent = 'Edit Post';
  document.getElementById('blog-submit-btn').textContent = 'Save Changes';
  document.getElementById('blog-cancel-edit-btn').style.display = 'inline-block';
  document.getElementById('blog-form').scrollIntoView({ behavior: 'smooth' });
}

function resetBlogForm() {
  editingBlogId = null;
  document.getElementById('blog-form').reset();
  document.getElementById('b-id').value = '';
  document.getElementById('blog-form-heading').textContent = 'Add Post';
  document.getElementById('blog-submit-btn').textContent = 'Add Post';
  document.getElementById('blog-cancel-edit-btn').style.display = 'none';
}

async function handleBlogSave(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('b-title').value.trim(),
    excerpt: document.getElementById('b-excerpt').value.trim(),
    cover_url: document.getElementById('b-cover-url').value.trim() || null,
    body: document.getElementById('b-body').value.trim(),
    published: document.getElementById('b-published').checked
  };

  try {
    if (editingBlogId) {
      await apiSend('PUT', `/blog/${editingBlogId}`, payload);
      showToast('Post updated.');
    } else {
      await apiSend('POST', '/blog', payload);
      showToast('Post added.');
    }
    resetBlogForm();
    loadBlogView();
  } catch (err) {
    showToast(err.message, true);
  }
}



async function loadSettingsView() {
  try {
    const settings = await apiGet('/settings');
    document.getElementById('s-whatsapp1').value = settings.whatsapp_1 || '';
    document.getElementById('s-whatsapp2').value = settings.whatsapp_2 || '';
    document.getElementById('s-instagram').value = settings.instagram_url || '';
    document.getElementById('s-facebook').value = settings.facebook_url || '';
    document.getElementById('s-address').value = settings.office_address || '';
    document.getElementById('s-hours').value = settings.office_hours || '';
    document.getElementById('s-email').value = settings.contact_email || '';
    document.getElementById('s-properties-count').value = settings.properties_sold_count || '';
    document.getElementById('s-families-count').value = settings.families_count || '';
    document.getElementById('s-years-count').value = settings.years_experience || '';
    document.getElementById('s-rera').value = settings.rera_number || '';
    document.getElementById('s-google-url').value = settings.google_review_url || '';
    document.getElementById('s-google-rating').value = settings.google_rating || '';
    document.getElementById('s-google-count').value = settings.google_review_count || '';
  } catch (e) {
    showToast('Could not load settings.', true);
  }
}

async function handleSettingsSave(e) {
  e.preventDefault();
  const payload = {
    whatsapp_1: document.getElementById('s-whatsapp1').value.trim(),
    whatsapp_2: document.getElementById('s-whatsapp2').value.trim(),
    instagram_url: document.getElementById('s-instagram').value.trim(),
    facebook_url: document.getElementById('s-facebook').value.trim(),
    office_address: document.getElementById('s-address').value.trim(),
    office_hours: document.getElementById('s-hours').value.trim(),
    contact_email: document.getElementById('s-email').value.trim(),
    properties_sold_count: document.getElementById('s-properties-count').value,
    families_count: document.getElementById('s-families-count').value,
    years_experience: document.getElementById('s-years-count').value,
    rera_number: document.getElementById('s-rera').value.trim(),
    google_review_url: document.getElementById('s-google-url').value.trim(),
    google_rating: document.getElementById('s-google-rating').value.trim(),
    google_review_count: document.getElementById('s-google-count').value
  };
  try {
    await apiSend('PUT', '/settings', payload);
    showToast('Settings saved.');
  } catch (err) {
    showToast(err.message, true);
  }
}

// ---------- Init ----------

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', () => switchView(link.dataset.view));
  });

  document.getElementById('add-property-btn').addEventListener('click', () => openPropertyEditor(null));
  document.getElementById('gallery-upload-form').addEventListener('submit', handleGalleryUpload);
  document.getElementById('youtube-add-form').addEventListener('submit', handleYoutubeAdd);
  document.getElementById('homepage-video-form').addEventListener('submit', handleHomepageVideoUpload);
  document.getElementById('testimonial-form').addEventListener('submit', handleTestimonialAdd);
  document.getElementById('blog-form').addEventListener('submit', handleBlogSave);
  document.getElementById('blog-cancel-edit-btn').addEventListener('click', resetBlogForm);
  document.getElementById('settings-form').addEventListener('submit', handleSettingsSave);

  // Check if already logged in (token in localStorage)
  if (authToken) {
    showApp();
  } else {
    showLogin();
  }
});
