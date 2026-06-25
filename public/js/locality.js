// public/js/locality.js
// Powers the locality landing pages (e.g. /janakpuri.html).
// Each page sets window.LOCALITY_NAME before loading this script,
// and this file fetches + renders only properties/testimonials matching that locality.

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

function localityPropertyCardHTML(property) {
  const firstImage = property.images && property.images.length > 0 ? property.images[0].url : null;
  const isSold = property.status === 'Sold';

  return `
    <div class="property-card">
      <div class="property-media">
        ${firstImage
          ? `<img src="${firstImage}" alt="${property.title}" loading="lazy">`
          : `<div class="no-image">No photo yet</div>`}
        ${property.is_featured ? '<span class="property-badge">Featured</span>' : ''}
        ${isSold ? '<span class="property-badge sold">Sold</span>' : ''}
      </div>
      <div class="property-body">
        <div class="property-locality">${property.locality}</div>
        <div class="property-title">${property.title}</div>
        <div class="property-price">&#8377; ${property.price_label}</div>
        ${buildSpecStrip(property)}
        <div class="property-actions">
          <a href="/properties.html?id=${property.id}" class="btn btn-outline">View Details</a>
          <a href="/contact.html?property=${property.id}" class="btn btn-gold">Enquire</a>
        </div>
      </div>
    </div>
  `;
}

function starString(rating) {
  const r = Math.max(0, Math.min(5, rating || 5));
  return '&#9733;'.repeat(r) + '&#9734;'.repeat(5 - r);
}

async function loadLocalityPage() {
  const localityName = window.LOCALITY_NAME;
  if (!localityName) return;

  // Properties in this locality
  try {
    const properties = await apiGet(`/properties?locality=${encodeURIComponent(localityName)}&status=Available`);
    const grid = document.getElementById('locality-property-grid');
    const countEl = document.getElementById('locality-results-count');

    if (countEl) {
      countEl.textContent = properties.length > 0
        ? `${properties.length} ${properties.length === 1 ? 'home' : 'homes'} currently available in ${localityName}`
        : `No active listings in ${localityName} right now`;
    }

    grid.innerHTML = properties.length > 0
      ? properties.map(localityPropertyCardHTML).join('')
      : `<div class="empty-state" style="grid-column:1/-1;">
           <p>We don't have a live listing in ${localityName} at this exact moment, but we regularly get new homes here before they're publicly listed. Message us your requirement and we'll notify you first.</p>
         </div>`;
  } catch (e) {
    console.error('Failed to load locality properties', e);
    document.getElementById('locality-property-grid').innerHTML =
      `<div class="empty-state" style="grid-column:1/-1;"><p>Could not load listings right now. Please refresh the page.</p></div>`;
  }

  // Testimonials filtered to this locality (fallback to general ones if none match)
  try {
    const testimonials = await apiGet('/testimonials');
    const matching = testimonials.filter(t =>
      t.locality && t.locality.toLowerCase().includes(localityName.toLowerCase().split(',')[0].trim())
    );
    const toShow = matching.length > 0 ? matching : testimonials.slice(0, 3);
    const section = document.getElementById('locality-testimonials-section');
    const grid = document.getElementById('locality-testimonial-grid');

    if (toShow.length === 0) {
      section.style.display = 'none';
      return;
    }

    grid.innerHTML = toShow.map(t => `
      <div class="testimonial-card">
        <div style="color:var(--color-gold);margin-bottom:12px;">${starString(t.rating)}</div>
        <p class="testimonial-quote">&ldquo;${t.quote}&rdquo;</p>
        <div class="testimonial-name">${t.name}</div>
        ${t.locality ? `<div class="testimonial-locality">${t.locality}</div>` : ''}
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load testimonials', e);
  }

  // WhatsApp CTA prefilled with locality name
  try {
    const settings = await getSettings();
    const ctaWhatsapp = document.getElementById('locality-cta-whatsapp');
    if (ctaWhatsapp) {
      ctaWhatsapp.href = whatsappLink(settings.whatsapp_1, `Hi, I'm looking for a home in ${localityName}. Can you help?`);
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
}

document.addEventListener('DOMContentLoaded', loadLocalityPage);
