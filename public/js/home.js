// public/js/home.js
// Loads dynamic content for the homepage: live stats, BHK breakdown, featured properties.

function animateCount(el, target, duration = 1200) {
  const start = 0;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(start + (target - start) * progress);
    el.textContent = value + '+';
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function priceShortLabel(property) {
  return property.price_label;
}

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
        <div class="property-price">&#8377; ${priceShortLabel(property)}</div>
        ${buildSpecStrip(property)}
        <div class="property-actions">
          <a href="/properties.html?id=${property.id}" class="btn btn-outline">View Details</a>
          <a href="/contact.html?property=${property.id}" class="btn btn-gold">Enquire</a>
        </div>
      </div>
    </div>
  `;
}

async function loadHomePage() {
  // Stats + WhatsApp CTA
  try {
    const settings = await getSettings();
    animateCount(document.getElementById('stat-properties'), parseInt(settings.properties_sold_count || '200', 10));
    animateCount(document.getElementById('stat-families'), parseInt(settings.families_count || '850', 10));
    animateCount(document.getElementById('stat-years'), parseInt(settings.years_experience || '12', 10));

    const ctaWhatsapp = document.getElementById('cta-whatsapp');
    if (ctaWhatsapp) {
      ctaWhatsapp.href = whatsappLink(settings.whatsapp_1, 'Hi, I am looking for a property in West Delhi. Can you help?');
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }

  // Properties: featured + BHK breakdown
  try {
    const properties = await apiGet('/properties?status=Available');

    // BHK breakdown panel
    const breakdown = { '2BHK': 0, '3BHK': 0, '4BHK': 0 };
    properties.forEach(p => { if (breakdown[p.bhk] !== undefined) breakdown[p.bhk]++; });

    const breakdownEl = document.getElementById('hero-bhk-breakdown');
    breakdownEl.innerHTML = Object.entries(breakdown).map(([bhk, count]) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--color-line);">
        <span style="color:var(--color-paper);font-weight:500;">${bhk}</span>
        <span class="mono" style="color:var(--color-gold);">${count} listed</span>
      </div>
    `).join('') || '<p style="color:var(--color-grey);">No listings available right now. Check back soon.</p>';

    // Featured properties (or fallback to first 3 available)
    let featured = properties.filter(p => p.is_featured);
    if (featured.length === 0) featured = properties.slice(0, 3);
    featured = featured.slice(0, 3);

    const grid = document.getElementById('featured-properties');
    grid.innerHTML = featured.length > 0
      ? featured.map(propertyCardHTML).join('')
      : `<div class="empty-state" style="grid-column:1/-1;">
           <p>No properties listed yet. Please check back soon, or contact us directly for current availability.</p>
         </div>`;

  } catch (e) {
    console.error('Failed to load properties', e);
    document.getElementById('featured-properties').innerHTML =
      `<div class="empty-state" style="grid-column:1/-1;"><p>Could not load properties right now. Please refresh the page.</p></div>`;
  }

  // Homepage video marquee
  await loadVideoMarquee();
}

// ---------- Video Marquee ----------

let marqueeVideos = [];

function videoCardHTML(video, idIndex) {
  return `
    <div class="video-marquee-card">
      <div class="video-marquee-media">
        ${video.cover_url
          ? `<video src="${video.video_url}" poster="${video.cover_url}" autoplay muted loop playsinline></video>`
          : `<video src="${video.video_url}" autoplay muted loop playsinline></video>`}
        <span class="mute-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-9.5-8.75-1 1.01L11 6.66v2.97L9.5 8.13 7.66 5.91 4.27 2.5 3 3.77l3.91 3.91L4.27 9.27v5.45h3.07L12 19.18v-7.91l4.18 4.18c-.34.21-.7.39-1.18.55v2.05a6.99 6.99 0 0 0 2.65-1.27l1.83 1.83 1.27-1.27L9.5 3.25z"/></svg>
        </span>
      </div>
      <button class="btn btn-outline" data-action="view-marquee-video" data-index="${idIndex}">View</button>
    </div>
  `;
}

async function loadVideoMarquee() {
  const section = document.getElementById('video-marquee-section');
  const track = document.getElementById('video-marquee-track');
  if (!section || !track) return;

  try {
    marqueeVideos = await apiGet('/homepage-videos');

    if (!marqueeVideos || marqueeVideos.length === 0) {
      section.style.display = 'none';
      return;
    }

    // Build cards once, then duplicate the set so the CSS scroll loop (-50%) is seamless
    const cardsHTML = marqueeVideos.map((v, i) => videoCardHTML(v, i)).join('');
    track.innerHTML = cardsHTML + cardsHTML;

    track.querySelectorAll('[data-action="view-marquee-video"]').forEach(btn => {
      btn.addEventListener('click', () => openVideoModal(parseInt(btn.dataset.index, 10)));
    });
  } catch (e) {
    console.error('Failed to load homepage videos', e);
    section.style.display = 'none';
  }
}

function openVideoModal(index) {
  const video = marqueeVideos[index];
  if (!video) return;

  const slot = document.getElementById('video-modal-slot');
  slot.innerHTML = `
    <div class="modal-overlay" id="video-modal-overlay">
      <div class="modal-content" style="max-width:480px;padding:var(--space-4);">
        <button class="modal-close" id="video-modal-close" aria-label="Close">&times;</button>
        <video src="${video.video_url}" controls autoplay style="width:100%;border-radius:var(--radius-md);max-height:78vh;"></video>
        ${video.title ? `<p style="color:var(--color-grey);margin-top:14px;">${video.title}</p>` : ''}
      </div>
    </div>
  `;

  document.getElementById('video-modal-close').addEventListener('click', closeVideoModal);
  document.getElementById('video-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'video-modal-overlay') closeVideoModal();
  });
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  document.getElementById('video-modal-slot').innerHTML = '';
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', loadHomePage);
