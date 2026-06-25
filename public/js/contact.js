// public/js/contact.js
// Handles the contact form submission and pre-fills property context
// when the user arrives from a property's "Enquire" button.

async function loadContactPageData() {
  // Show fallback numbers immediately so they're always visible
  const fallback1 = '919310812957';
  const fallback2 = '918587820230';
  document.getElementById('whatsapp-link-1').href = whatsappLink(fallback1);
  document.getElementById('whatsapp-link-1').textContent = '+91 ' + formatPhone(fallback1);
  document.getElementById('whatsapp-link-2').href = whatsappLink(fallback2);
  document.getElementById('whatsapp-link-2').textContent = '+91 ' + formatPhone(fallback2);

  const settings = await getSettings();

  document.getElementById('whatsapp-link-1').href = whatsappLink(settings.whatsapp_1);
  document.getElementById('whatsapp-link-1').textContent = '+91 ' + formatPhone(settings.whatsapp_1);

  document.getElementById('whatsapp-link-2').href = whatsappLink(settings.whatsapp_2);
  document.getElementById('whatsapp-link-2').textContent = '+91 ' + formatPhone(settings.whatsapp_2);

  document.getElementById('office-address').textContent = settings.office_address || 'West Delhi, New Delhi';
  document.getElementById('office-hours').textContent = settings.office_hours || 'Mon - Sat: 10:00 AM - 7:00 PM';

  if (settings.rera_number) {
    document.getElementById('rera-number-line').style.display = 'block';
    document.getElementById('rera-number-value').textContent = settings.rera_number;
  }

  const emailLink = document.getElementById('email-link');
  emailLink.href = `mailto:${settings.contact_email || 'info@primebuilder.in'}`;
  emailLink.textContent = settings.contact_email || 'info@primebuilder.in';

  if (settings.google_review_url) {
    document.getElementById('contact-google-review-card').style.display = 'block';
    document.getElementById('contact-google-review-link').href = settings.google_review_url;
    document.getElementById('contact-google-review-text').textContent =
      `${settings.google_rating ? settings.google_rating + ' stars' : 'Rated'} on Google${settings.google_review_count ? ` (${settings.google_review_count} reviews)` : ''} — read what clients say`;
  }

  const socialSlot = document.getElementById('contact-social-links');
  if (socialSlot) {
    socialSlot.innerHTML = `
      ${settings.instagram_url ? `
        <a href="${settings.instagram_url}" target="_blank" rel="noopener" aria-label="Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
        </a>` : ''}
      ${settings.facebook_url ? `
        <a href="${settings.facebook_url}" target="_blank" rel="noopener" aria-label="Facebook">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
        </a>` : ''}
    `;
  }
}

let prefilledPropertyId = null;

async function checkPropertyContext() {
  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get('property');
  if (!propertyId) return;

  try {
    const property = await apiGet(`/properties/${propertyId}`);
    prefilledPropertyId = property.id;

    const contextEl = document.getElementById('property-context');
    contextEl.classList.remove('hidden');
    contextEl.innerHTML = `Enquiring about: <strong style="color:var(--color-gold);">${property.title}</strong> — ${property.locality} (&#8377; ${property.price_label})`;

    document.getElementById('message').value = `Hi, I'm interested in ${property.title} in ${property.locality}. Please share more details.`;
  } catch (e) {
    console.error('Could not load property context', e);
  }
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  const payload = {
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    budget: document.getElementById('budget').value,
    message: document.getElementById('message').value.trim(),
    property_id: prefilledPropertyId
  };

  try {
    await apiPost('/inquiries', payload);
    showToast('Thank you! We will contact you shortly.');
    document.getElementById('contact-form').reset();
    document.getElementById('property-context').classList.add('hidden');
    prefilledPropertyId = null;
  } catch (err) {
    showToast(err.message || 'Something went wrong. Please try WhatsApp instead.', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Enquiry';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadContactPageData();
  checkPropertyContext();
  document.getElementById('contact-form').addEventListener('submit', handleContactSubmit);
});
