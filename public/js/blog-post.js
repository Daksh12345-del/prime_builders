// public/js/blog-post.js
// Renders a single blog post based on the ?slug= query param.

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function loadBlogPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const contentEl = document.getElementById('post-content');

  if (!slug) {
    contentEl.innerHTML = `<div class="empty-state"><p>No post specified. <a href="/blog.html">Back to blog</a>.</p></div>`;
    return;
  }

  try {
    const post = await apiGet(`/blog/${encodeURIComponent(slug)}`);

    document.getElementById('post-title-tag').textContent = `${post.title} — Prime Builder Blog`;
    document.getElementById('post-description-tag').setAttribute('content', post.excerpt || post.title);

    contentEl.innerHTML = `
      ${post.cover_url ? `<img src="${post.cover_url}" alt="${post.title}" style="width:100%;border-radius:var(--radius-md);margin-bottom:28px;">` : ''}
      <div class="blog-post-date">${formatDate(post.published_at || post.created_at)}</div>
      <h1 class="blog-post-title">${post.title}</h1>
      <div class="blog-post-body">${post.body}</div>
    `;

    const settings = await getSettings();
    const cta = document.getElementById('post-cta-whatsapp');
    if (cta) {
      cta.href = whatsappLink(settings.whatsapp_1, `Hi, I read your blog post "${post.title}" and have a question.`);
    }
  } catch (e) {
    console.error('Failed to load blog post', e);
    contentEl.innerHTML = `<div class="empty-state"><p>This post couldn't be found. <a href="/blog.html">Back to blog</a>.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadBlogPost);
