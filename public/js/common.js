// public/js/common.js
// Shared utilities used by every page: API calls, header/footer rendering,
// WhatsApp link building, and small UI helpers.

const API_BASE = '/api';

// ---------- API helper ----------

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ---------- Settings cache ----------

let _settingsCache = null;
async function getSettings() {
  if (_settingsCache) return _settingsCache;
  try {
    _settingsCache = await apiGet('/settings');
  } catch (e) {
    _settingsCache = {
      whatsapp_1: '919310812957',
      whatsapp_2: '918587820230',
      instagram_url: 'https://www.instagram.com/primebuilders230',
      facebook_url: 'https://www.facebook.com/people/Prime-Builders/61590449296500/',
      office_address: 'West Delhi, New Delhi, India',
      office_hours: 'Mon - Sat: 10:00 AM - 7:00 PM',
      contact_email: 'info@primebuilder.in',
      properties_sold_count: '200',
      families_count: '850',
      years_experience: '12',
      rera_number: '',
      google_review_url: '',
      google_rating: '',
      google_review_count: ''
    };
  }
  return _settingsCache;
}

function whatsappLink(number, message) {
  const text = encodeURIComponent(message || 'Hi, I am interested in a property listed by Prime Builder.');
  return `https://wa.me/${number}?text=${text}`;
}

// ---------- Header / Footer injection ----------

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/properties.html', label: 'Properties' },
  { href: '/gallery.html', label: 'Gallery' },
  { href: '/blog.html', label: 'Blog' },
  { href: '/contact.html', label: 'Contact' }
];

function renderHeader(activePath) {
  const slot = document.getElementById('site-header-slot');
  if (!slot) return;

  const links = NAV_ITEMS.map(item => {
    const isActive = item.href === activePath ||
      (activePath === '/index.html' && item.href === '/');
    return `<a href="${item.href}" class="${isActive ? 'active' : ''}">${item.label}</a>`;
  }).join('');

  slot.innerHTML = `
    <header class="site-header">
      <div class="container nav-inner">
        <a href="/" class="brand">
          <img src="/images/logo-navbar.png" alt="Prime Builder logo" width="40" height="40">
          <span class="brand-text">Prime <span>Builder</span></span>
        </a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav class="nav-links" id="nav-links">
          ${links}
          <a href="/contact.html" class="nav-cta">Enquire Now</a>
        </nav>
      </div>
    </header>
  `;

  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

async function renderFooter() {
  const slot = document.getElementById('site-footer-slot');
  if (!slot) return;

  const settings = await getSettings();

  slot.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h4>Prime Builder</h4>
            <p style="max-width:340px;">Helping families in West Delhi find 2BHK, 3BHK and 4BHK homes that fit their life and budget — with honest advice from first visit to final paperwork.</p>
            <div class="footer-social">
              ${settings.instagram_url ? `
                <a href="${settings.instagram_url}" target="_blank" rel="noopener" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                </a>` : ''}
              ${settings.facebook_url ? `
                <a href="${settings.facebook_url}" target="_blank" rel="noopener" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                </a>` : ''}
              <a href="${whatsappLink(settings.whatsapp_1)}" target="_blank" rel="noopener" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.2.5-.5.6-.7.1-.2.1-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.3-.9 1-.9 2.3 0 1.3 1 2.6 1.1 2.8.1.2 1.9 3 4.7 4.1 2.8 1.1 2.8.7 3.3.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.3z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="10"/></svg>
              </a>
            </div>
          </div>
          <div>
            <h4>Quick Links</h4>
            <a href="/">Home</a>
            <a href="/properties.html">Properties</a>
            <a href="/gallery.html">Gallery</a>
            <a href="/blog.html">Blog</a>
            <a href="/contact.html">Contact</a>
          </div>
          <div>
            <h4>Localities</h4>
            <a href="/janakpuri.html">Janakpuri</a>
            <a href="/rajouri-garden.html">Rajouri Garden</a>
            <a href="/tilak-nagar.html">Tilak Nagar</a>
            <a href="/vikaspuri.html">Vikaspuri</a>
            <a href="/paschim-vihar.html">Paschim Vihar</a>
            <a href="/uttam-nagar.html">Uttam Nagar</a>
          </div>
          <div>
            <h4>Contact</h4>
            <p>${settings.office_address || 'West Delhi, New Delhi'}</p>
            <p class="sub">${settings.office_hours || 'Mon - Sat: 10:00 AM - 7:00 PM'}</p>
            <a href="mailto:${settings.contact_email || 'info@primebuilder.in'}">${settings.contact_email || 'info@primebuilder.in'}</a>
            <a href="tel:+${settings.whatsapp_1 || '919310812957'}">+91 ${formatPhone(settings.whatsapp_1)}</a>
            <a href="tel:+${settings.whatsapp_2 || '918587820230'}">+91 ${formatPhone(settings.whatsapp_2)}</a>
            ${settings.rera_number ? `<p class="sub" style="margin-top:10px;">RERA Reg. No: <span class="mono">${settings.rera_number}</span></p>` : ''}
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} Prime Builder. All rights reserved.</span>
          ${settings.google_review_url ? `
            <a href="${settings.google_review_url}" target="_blank" rel="noopener" class="footer-google-rating">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              ${settings.google_rating ? `${settings.google_rating} ` : ''}on Google${settings.google_review_count ? ` (${settings.google_review_count} reviews)` : ''}
            </a>` : ''}
        </div>
      </div>
    </footer>
  `;
}

function formatPhone(fullNumber) {
  if (!fullNumber) return '';
  // Strip leading +, spaces, dashes, then strip country code 91
  let digits = String(fullNumber).replace(/[\s\-\+]/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }
  // Format as XXXXX XXXXX
  const m = digits.match(/^(\d{5})(\d{5})$/);
  if (m) return m[1] + ' ' + m[2];
  return digits; // fallback: return as-is
}

async function renderWhatsAppFloat() {
  const slot = document.getElementById('whatsapp-float-slot');
  if (!slot) return;

  const settings = await getSettings();
  const link = whatsappLink(settings.whatsapp_1, 'Hi, I found your website and I am interested in your properties.');

  slot.innerHTML = `
    <a href="${link}" target="_blank" rel="noopener" class="whatsapp-float" aria-label="Chat on WhatsApp">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.2.5-.5.6-.7.1-.2.1-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.3-.9 1-.9 2.3 0 1.3 1 2.6 1.1 2.8.1.2 1.9 3 4.7 4.1 2.8 1.1 2.8.7 3.3.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.5 5.1L2 22l5.1-1.3C8.5 21.5 10.2 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.3.9.9-3.2-.2-.3C3.9 14.8 3.5 13.4 3.5 12c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5-3.8 8.5-8.5 8.5z"/></svg>
    </a>
  `;
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

// ---------- Init shared chrome on every page ----------

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  renderHeader(path);
  renderFooter();
  renderWhatsAppFloat();
});
