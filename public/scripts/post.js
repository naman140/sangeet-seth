/**
 * Portable Text to HTML Parser
 * A lightweight parser for Sanity's Portable Text AST.
 */
function blocksToHtml(blocks) {
    if (!blocks || !Array.isArray(blocks)) return '';

    return blocks.map(block => {
        if (block._type === 'image') {
            const src = urlForImage(block);
            return src ? `<img src="${src}?w=800&fit=max" loading="lazy" alt="Blog Image">` : '';
        }

        if (block._type !== 'block' || !block.children) {
            return '';
        }

        // Parse children (marks and spans)
        let html = block.children.map(child => {
            if (child._type !== 'span') return '';
            let text = child.text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

            if (child.marks && child.marks.length > 0) {
                child.marks.forEach(mark => {
                    if (mark === 'strong') text = `<strong>${text}</strong>`;
                    if (mark === 'em') text = `<em>${text}</em>`;
                    if (mark === 'code') text = `<code>${text}</code>`;
                    if (mark === 'underline') text = `<u>${text}</u>`;

                    // Simple links: finding markDefs matching this mark is needed for full support,
                    // but we will do simple strong/em formatting for now.
                    if (block.markDefs) {
                        const def = block.markDefs.find(m => m._key === mark);
                        if (def && def._type === 'link') {
                            text = `<a href="${def.href}" target="${def.blank ? '_blank' : '_self'}">${text}</a>`;
                        }
                    }
                });
            }
            return text;
        }).join('');

        // Wrap in appropriate tag
        const style = block.style || 'normal';
        switch (style) {
            case 'h1': return ''; // Skip H1 since it's already in the hero header
            case 'h2': return `<h2>${html}</h2>`;
            case 'h3': return `<h3>${html}</h3>`;
            case 'h4': return `<h4>${html}</h4>`;
            case 'blockquote': return `<blockquote>${html}</blockquote>`;
            case 'normal':
                // Detect markdown tables (starts with | and has newline/br)
                if (html.trim().startsWith('|') && (html.includes('<br>') || html.includes('\n'))) {
                    const rows = html.split(/<br>|\n/).filter(row => row.trim().startsWith('|'));
                    if (rows.length >= 2 && html.includes('|-')) {
                        let tableHtml = '<div class="table-responsive"><table class="custom-table">';
                        rows.forEach((row, index) => {
                            // Skip alignment/separator rows
                            if (row.includes('---')) return;

                            // Split by | and remove empty first/last elements
                            const cols = row.split('|').map(c => c.trim());
                            if (cols[0] === '') cols.shift();
                            if (cols[cols.length - 1] === '') cols.pop();

                            tableHtml += '<tr>';
                            cols.forEach(col => {
                                if (index === 0) {
                                    tableHtml += `<th>${col}</th>`;
                                } else {
                                    let cellContent = col;
                                    if (cellContent === '✓') cellContent = '<span style="color: #10B981; font-weight: bold;">✓</span>';
                                    if (cellContent === '✗') cellContent = '<span style="color: #EF4444; font-weight: bold;">✗</span>';
                                    tableHtml += `<td>${cellContent}</td>`;
                                }
                            });
                            tableHtml += '</tr>';
                        });
                        tableHtml += '</table></div>';
                        return tableHtml;
                    }
                }

                // Check if it's a list item
                if (block.listItem === 'bullet') return `<li>${html}</li>`; // Wrapped externally
                if (block.listItem === 'number') return `<li>${html}</li>`;
                return `<p>${html}</p>`;
            default: return `<p>${html}</p>`;
        }
    }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Extract slug from URL: ?slug=my-post-title
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const postContainer = document.getElementById('post-container');

    if (!slug) {
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        return;
    }

    try {
        // Fetch post data
        const query = `*[_type == "post" && slug.current == $slug][0] {
            title,
            excerpt,
            publishedAt,
            mainImage,
            body,
            "categories": categories[]->title
        }`;

        const post = await sanityFetch(query, { slug: slug });

        loadingState.style.display = 'none';

        if (!post) {
            errorState.style.display = 'block';
            return;
        }

        // Render metadata
        document.title = `${post.title} — Sangeet AI Automation`;

        const date = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '';
        const category = post.categories && post.categories.length > 0 ? post.categories[0] : 'Article';

        // Update DOM
        document.getElementById('post-meta').textContent = `${category} ${date ? '· ' + date : ''}`;
        document.getElementById('post-title').textContent = post.title;

        const heroWrapper = document.getElementById('hero-wrapper');
        const heroEl = document.getElementById('post-hero');
        if (post.mainImage) {
            heroEl.style.backgroundImage = `url('${urlForImage(post.mainImage)}?w=1600&h=900&fit=crop')`;
        } else {
            heroWrapper.style.display = 'none';
        }

        // Render Portable Text body
        document.getElementById('post-body').innerHTML = blocksToHtml(post.body);

        postContainer.style.display = 'block';

    } catch (error) {
        console.error('Failed to load post:', error);
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
    }
});
