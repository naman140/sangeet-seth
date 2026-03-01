document.addEventListener('DOMContentLoaded', async () => {
    const featuredContainer = document.getElementById('featured-post-container');
    const postsGrid = document.getElementById('posts-grid');

    if (!postsGrid) return; // Not on the blog index

    try {
        // Fetch all blog posts ordered by publish date
        const query = `*[_type == "post"] | order(publishedAt desc) {
            _id,
            title,
            slug,
            excerpt,
            publishedAt,
            mainImage,
            "categories": categories[]->title
        }`;

        const posts = await sanityFetch(query);

        if (!posts || posts.length === 0) {
            postsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">No articles published yet. Check back soon.</p>';
            if (featuredContainer) featuredContainer.innerHTML = '';
            return;
        }

        // The first post is featured
        const featuredPost = posts[0];
        const regularPosts = posts.slice(1);

        if (featuredContainer) {
            featuredContainer.innerHTML = renderFeaturedPost(featuredPost);
        }

        postsGrid.innerHTML = regularPosts.map(post => renderPostCard(post)).join('');

        // Trigger reveal animations for dynamically injected elements
        setTimeout(() => {
            document.querySelectorAll('#featured-post-container .reveal, #posts-grid .reveal').forEach((el, index) => {
                setTimeout(() => el.classList.add('visible'), index * 100);
            });
        }, 50);
    } catch (error) {
        console.error('Failed to load blog posts:', error);
        postsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Failed to load posts. Please try again later.</p>';
    }
});

function calculateReadTime(text) {
    if (!text) return '3 min';
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / 225); // 225 wpm reading speed
    return `${time} min`;
}

function renderPostCard(post) {
    const imageHtml = post.mainImage ? `<div style="height: 160px; background: url('${urlForImage(post.mainImage)}?h=300&w=500&fit=crop') center/cover; margin-bottom: 24px; border-radius: 8px;"></div>` : '';

    const readTime = calculateReadTime(post.body ? post.body.map(b => b.children ? b.children.map(c => c.text).join(' ') : '').join(' ') : post.excerpt);
    const category = post.categories && post.categories.length > 0 ? post.categories[0] : 'Article';

    return `
        <a href="/post.html?slug=${post.slug.current}" class="post-card">
            ${imageHtml}
            <div class="post-meta">${category} · ${readTime}</div>
            <h3 class="post-title">${post.title}</h3>
            <p style="flex-grow: 1; font-size: 0.9rem;">${post.excerpt || ''}</p>
            <span class="read-more">Read Breakdown</span>
        </a>
    `;
}

function renderFeaturedPost(post) {
    const imageUrl = post.mainImage ? urlForImage(post.mainImage) + '?h=500&w=800&fit=crop' : '';
    const imageBlock = post.mainImage
        ? `<div class="featured-image" style="background: url('${imageUrl}') center/cover;"></div>`
        : `<div class="featured-image"><div class="geo-shape"></div></div>`;

    const readTime = calculateReadTime(post.body ? post.body.map(b => b.children ? b.children.map(c => c.text).join(' ') : '').join(' ') : post.excerpt);
    const category = post.categories && post.categories.length > 0 ? post.categories[0] : 'Article';

    return `
        <a href="/post.html?slug=${post.slug.current}" class="featured-post">
            ${imageBlock}
            <div class="featured-content">
                <div class="post-meta">${category} · ${readTime}</div>
                <h2 class="post-title">${post.title}</h2>
                <p style="margin-bottom: 0;">${post.excerpt || ''}</p>
                <span class="read-more">Read Breakdown</span>
            </div>
        </a>
    `;
}
