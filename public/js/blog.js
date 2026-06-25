// public/js/blog.js
// Renders the blog listing page with published posts only.

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function blogCardHTML(post) {
  return `
    <a href="/blog-post.html?slug=${encodeURIComponent(post.slug)}" class="blog-card">
      <div class="blog-card-media">
        ${post.cover_url
          ? `<img src="${post.cover_url}" alt="${post.title}" loading="lazy">`
          : `<div class="blog-card-media-placeholder"></div>`}
      </div>
      <div class="blog-card-body">
        <div class="blog-card-date">${formatDate(post.published_at || post.created_at)}</div>
        <h3 class="blog-card-title">${post.title}</h3>
        <p class="blog-card-excerpt">${post.excerpt || ''}</p>
        <span class="blog-card-readmore">Read more &rarr;</span>
      </div>
    </a>
  `;
}

async function loadBlogList() {
  const grid = document.getElementById('blog-grid');
  try {
    const posts = await apiGet('/blog');

    if (posts.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <p>No posts published yet. Check back soon.</p>
        </div>`;
      return;
    }

    grid.innerHTML = posts.map(blogCardHTML).join('');
  } catch (e) {
    console.error('Failed to load blog posts', e);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Could not load the blog right now. Please refresh.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadBlogList);
