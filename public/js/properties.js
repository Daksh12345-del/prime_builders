// public/js/properties.js
// Handles the properties listing page: search, filters, sorting,
// and a detail modal with a multi-photo slider.

let allProperties = [];
let currentSliderIndex = {}; // propertyId -> current image index, for grid card sliders

function buildSpecStrip(property) {
  return `
    <div class="spec-strip">
      <div><div class="spec-value">${property.bhk}</div><div class="spec-key">Config</div></div>
      <div><div class="spec-value">${property.area_sqft}</div><div class="spec-key">Sq.Ft</div></div>
      <div><div class="spec-value">${property.bathrooms || '-'}</div><div class="spec-key">Baths</div></div>
      <div><div class="spec-value">${(property.floor || '-').split(' ')[0]}</div><div class="spec-key">Floor</div></div>
    </div>
  `;
}

function propertyCardHTML(property) {
  const images = property.images || [];
  const firstImage = images.length > 0 ? images[0].url : null;
  const isSold = property.status === 'Sold';

  return `
    <div class="property-card" data-property-id="${property.id}">
      <div class="property-media" data-slider="${property.id}">
        ${firstImage
          ? `<img src="${firstImage}" alt="${property.title}" loading="lazy" data-img-index="0">`
          : `<div class="no-image">No photo yet</div>`}
        ${property.is_featured ? '<span class="property-badge">Featured</span>' : ''}
        ${isSold ? '<span class="property-badge sold">Sold</span>' : ''}
        ${property.units_available != null && !isSold ? `<span class="property-badge units">${property.units_available} unit${property.units_available === 1 ? '' : 's'} left</span>` : ''}
        ${images.length > 1 ? `
          <button class="slider-arrow prev" data-action="prev" data-property-id="${property.id}" aria-label="Previous photo">&#8249;</button>
          <button class="slider-arrow next" data-action="next" data-property-id="${property.id}" aria-label="Next photo">&#8250;</button>
          <div class="slider-dots">
            ${images.map((_, i) => `<span class="${i === 0 ? 'active' : ''}" data-dot-index="${i}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="property-body">
        <div class="property-locality">${property.locality}</div>
        <div class="property-title">${property.title}</div>
        <div class="property-price">&#8377; ${property.price_label}</div>
        ${buildSpecStrip(property)}
        <div class="property-actions">
          <button class="btn btn-outline btn-block" data-action="view-details" data-property-id="${property.id}">View Details</button>
          <a href="/contact.html?property=${property.id}" class="btn btn-gold">Enquire</a>
        </div>
      </div>
    </div>
  `;
}

function renderPropertyList(properties) {
  const list = document.getElementById('property-list');
  const count = document.getElementById('results-count');

  count.textContent = `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} found`;

  if (properties.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <p>No properties match your filters. Try adjusting the search or configuration.</p>
      </div>`;
    return;
  }

  list.innerHTML = properties.map(propertyCardHTML).join('');

  // Wire up slider arrows/dots for each card
  properties.forEach(p => { currentSliderIndex[p.id] = 0; });

  list.querySelectorAll('[data-action="prev"], [data-action="next"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.propertyId;
      const property = allProperties.find(p => String(p.id) === id);
      if (!property || !property.images || property.images.length < 2) return;

      const dir = btn.dataset.action === 'next' ? 1 : -1;
      const total = property.images.length;
      currentSliderIndex[id] = (currentSliderIndex[id] + dir + total) % total;
      updateCardSlide(id, property);
    });
  });

  list.querySelectorAll('[data-action="view-details"]').forEach(btn => {
    btn.addEventListener('click', () => openPropertyModal(btn.dataset.propertyId));
  });
}

function updateCardSlide(propertyId, property) {
  const mediaEl = document.querySelector(`[data-slider="${propertyId}"]`);
  if (!mediaEl) return;
  const idx = currentSliderIndex[propertyId];
  const img = mediaEl.querySelector('img');
  if (img) img.src = property.images[idx].url;
  mediaEl.querySelectorAll('[data-dot-index]').forEach((dot, i) => {
    dot.classList.toggle('active', i === idx);
  });
}

function applyFiltersAndRender() {
  const search = document.getElementById('search-input').value.trim().toLowerCase();
  const bhk = document.getElementById('bhk-filter').value;
  const units = document.getElementById('units-filter').value;
  const status = document.getElementById('status-filter').value;
  const sort = document.getElementById('sort-filter').value;

  let filtered = [...allProperties];

  if (search) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(search) || p.locality.toLowerCase().includes(search)
    );
  }
  if (bhk) filtered = filtered.filter(p => p.bhk === bhk);
  if (status) filtered = filtered.filter(p => p.status === status);

  // Units available filter
  if (units === 'any') {
    filtered = filtered.filter(p => p.units_available != null && p.units_available > 0);
  } else if (units === '5+') {
    filtered = filtered.filter(p => p.units_available != null && p.units_available >= 5);
  } else if (units !== '') {
    const n = parseInt(units, 10);
    filtered = filtered.filter(p => p.units_available === n);
  }

  if (sort === 'price_asc') filtered.sort((a, b) => a.price_value - b.price_value);
  else if (sort === 'price_desc') filtered.sort((a, b) => b.price_value - a.price_value);
  else if (sort === 'newest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  else filtered.sort((a, b) => b.is_featured - a.is_featured);

  renderPropertyList(filtered);
}

async function loadProperties() {
  try {
    allProperties = await apiGet('/properties');
    applyFiltersAndRender();

    // If a specific property ID is in the URL, open its modal automatically
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) openPropertyModal(id);

  } catch (e) {
    console.error('Failed to load properties', e);
    document.getElementById('property-list').innerHTML =
      `<div class="empty-state" style="grid-column:1/-1;"><p>Could not load properties. Please refresh the page.</p></div>`;
  }
}

// ---------- Detail Modal ----------

let modalImageIndex = 0;

async function openPropertyModal(id) {
  let property = allProperties.find(p => String(p.id) === String(id));
  if (!property) {
    try { property = await apiGet(`/properties/${id}`); } catch (e) { return; }
  }
  if (!property) return;

  modalImageIndex = 0;
  const images = property.images || [];
  const amenities = property.amenities || [];
  const settings = await getSettings();

  const slot = document.getElementById('property-modal-slot');
  slot.innerHTML = `
    <div class="modal-overlay" id="property-modal-overlay">
      <div class="modal-content">
        <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>

        <div class="property-media" style="border-radius:var(--radius-md);margin-bottom:20px;" id="modal-media">
          ${images.length > 0
            ? `<img src="${images[0].url}" alt="${property.title}" id="modal-main-image">`
            : `<div class="no-image">No photos uploaded yet</div>`}
          ${images.length > 1 ? `
            <button class="slider-arrow prev" id="modal-prev" aria-label="Previous photo">&#8249;</button>
            <button class="slider-arrow next" id="modal-next" aria-label="Next photo">&#8250;</button>
            <div class="slider-dots" id="modal-dots">
              ${images.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="property-locality">${property.locality}</div>
        <h2 style="font-size:var(--text-2xl);color:var(--color-white);margin:6px 0 10px;">${property.title}</h2>
        <div class="property-price" style="font-size:var(--text-2xl);margin-bottom:16px;">&#8377; ${property.price_label}</div>

        ${buildSpecStrip(property)}

        ${property.facing ? `<p style="color:var(--color-grey);font-size:var(--text-sm);margin-bottom:16px;"><strong style="color:var(--color-paper);">Facing:</strong> ${property.facing}</p>` : ''}

        ${property.description ? `<p style="color:var(--color-grey);margin-bottom:20px;">${property.description}</p>` : ''}

        ${amenities.length > 0 ? `
          <div style="margin-bottom:24px;">
            <h4 style="font-size:var(--text-sm);color:var(--color-gold);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px;">Amenities</h4>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${amenities.map(a => `<span style="background:var(--color-surface-raised);padding:6px 12px;border-radius:4px;font-size:var(--text-xs);color:var(--color-paper);">${a}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="cta-actions" style="justify-content:flex-start;">
          <a href="${whatsappLink(settings.whatsapp_1, `Hi, I'm interested in ${property.title} (${property.locality}). Is it still available?`)}" target="_blank" rel="noopener" class="btn btn-red">Enquire on WhatsApp</a>
          <a href="/contact.html?property=${property.id}" class="btn btn-outline">Send Enquiry Form</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('modal-close-btn').addEventListener('click', closePropertyModal);
  document.getElementById('property-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'property-modal-overlay') closePropertyModal();
  });

  if (images.length > 1) {
    document.getElementById('modal-prev').addEventListener('click', () => moveModalImage(property, -1));
    document.getElementById('modal-next').addEventListener('click', () => moveModalImage(property, 1));
  }

  document.body.style.overflow = 'hidden';
}

function moveModalImage(property, dir) {
  const images = property.images;
  modalImageIndex = (modalImageIndex + dir + images.length) % images.length;
  document.getElementById('modal-main-image').src = images[modalImageIndex].url;
  document.querySelectorAll('#modal-dots span').forEach((dot, i) => {
    dot.classList.toggle('active', i === modalImageIndex);
  });
}

function closePropertyModal() {
  document.getElementById('property-modal-slot').innerHTML = '';
  document.body.style.overflow = '';
  // Clean the ?id= param from the URL without reloading
  const url = new URL(window.location);
  url.searchParams.delete('id');
  window.history.replaceState({}, '', url);
}

document.addEventListener('DOMContentLoaded', () => {
  loadProperties();
  document.getElementById('search-input').addEventListener('input', debounce(applyFiltersAndRender, 250));
  document.getElementById('bhk-filter').addEventListener('change', applyFiltersAndRender);
  document.getElementById('units-filter').addEventListener('change', applyFiltersAndRender);
  document.getElementById('status-filter').addEventListener('change', applyFiltersAndRender);
  document.getElementById('sort-filter').addEventListener('change', applyFiltersAndRender);
});

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
