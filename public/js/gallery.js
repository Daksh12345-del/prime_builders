// public/js/gallery.js
// Renders admin-uploaded gallery photos/videos plus client testimonials.

function galleryItemHTML(item) {
  if (item.type === 'video') {
    const thumbSrc = item.youtube_id
      ? `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`
      : null;
    return `
      <div class="gallery-item" data-action="open-item" data-item-id="${item.id}">
        ${thumbSrc
          ? `<img src="${thumbSrc}" alt="${item.caption || 'Video'}">`
          : `<video src="${item.url}" muted></video>`}
        <div class="gallery-play">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
    `;
  }
  return `
    <div class="gallery-item" data-action="open-item" data-item-id="${item.id}">
      <img src="${item.url}" alt="${item.caption || 'Prime Builder property photo'}" loading="lazy">
    </div>
  `;
}

let galleryItems = [];

async function loadGallery() {
  try {
    galleryItems = await apiGet('/gallery');
    const grid = document.getElementById('gallery-grid');

    if (galleryItems.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <p>No photos or videos uploaded yet. Check back soon — or follow up with us directly for current project photos.</p>
        </div>`;
      return;
    }

    grid.innerHTML = galleryItems.map(galleryItemHTML).join('');
    grid.querySelectorAll('[data-action="open-item"]').forEach(el => {
      el.addEventListener('click', () => openGalleryModal(el.dataset.itemId));
    });
  } catch (e) {
    console.error('Failed to load gallery', e);
    document.getElementById('gallery-grid').innerHTML =
      `<div class="empty-state" style="grid-column:1/-1;"><p>Could not load the gallery right now. Please refresh.</p></div>`;
  }
}

function openGalleryModal(itemId) {
  const item = galleryItems.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const slot = document.getElementById('gallery-modal-slot');

  let mediaHTML;
  if (item.type === 'video') {
    mediaHTML = item.youtube_id
      ? `<div style="position:relative;padding-bottom:56.25%;height:0;">
           <iframe src="https://www.youtube.com/embed/${item.youtube_id}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:var(--radius-md);" allowfullscreen></iframe>
         </div>`
      : `<video src="${item.url}" controls autoplay style="width:100%;border-radius:var(--radius-md);"></video>`;
  } else {
    mediaHTML = `<img src="${item.url}" alt="${item.caption || ''}" style="width:100%;border-radius:var(--radius-md);">`;
  }

  slot.innerHTML = `
    <div class="modal-overlay" id="gallery-modal-overlay">
      <div class="modal-content" style="max-width:760px;">
        <button class="modal-close" id="gallery-modal-close" aria-label="Close">&times;</button>
        ${mediaHTML}
        ${item.caption ? `<p style="color:var(--color-grey);margin-top:16px;">${item.caption}</p>` : ''}
      </div>
    </div>
  `;

  document.getElementById('gallery-modal-close').addEventListener('click', closeGalleryModal);
  document.getElementById('gallery-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'gallery-modal-overlay') closeGalleryModal();
  });
  document.body.style.overflow = 'hidden';
}

function closeGalleryModal() {
  document.getElementById('gallery-modal-slot').innerHTML = '';
  document.body.style.overflow = '';
}

function starString(rating) {
  const r = Math.max(0, Math.min(5, rating || 5));
  return '&#9733;'.repeat(r) + '&#9734;'.repeat(5 - r);
}

async function loadTestimonials() {
  try {
    const testimonials = await apiGet('/testimonials');
    const grid = document.getElementById('testimonial-grid');

    if (testimonials.length === 0) {
      grid.innerHTML = `<p style="color:var(--color-grey);">No testimonials added yet.</p>`;
      return;
    }

    grid.innerHTML = testimonials.map(t => `
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
}

async function loadGoogleReviewCTA() {
  const slot = document.getElementById('google-review-cta');
  if (!slot) return;
  try {
    const settings = await getSettings();
    if (!settings.google_review_url) return;

    slot.innerHTML = `
      <a href="${settings.google_review_url}" target="_blank" rel="noopener" class="google-review-badge">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
        <span>${settings.google_rating ? `${settings.google_rating} stars` : 'Rated'} on Google${settings.google_review_count ? ` &middot; ${settings.google_review_count} reviews` : ''}</span>
      </a>
    `;
  } catch (e) {
    console.error('Failed to load Google review settings', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  loadTestimonials();
  loadGoogleReviewCTA();
});
