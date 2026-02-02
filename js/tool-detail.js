document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('main-content');

    // Parse ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const toolId = urlParams.get('id');

    if (!toolId) {
        container.innerHTML = '<div class="loading">No tool specified. <a href="index.html" style="color:var(--accent-color)">Go Home</a></div>';
        return;
    }

    try {
        const doc = await db.collection('tools').doc(toolId).get();

        if (!doc.exists) {
            container.innerHTML = '<div class="loading">Tool not found. <a href="index.html" style="color:var(--accent-color)">Go Home</a></div>';
            return;
        }

        const t = doc.data();
        const favs = window.getFavorites();
        const isFav = favs.includes(toolId);

        // Render Content
        container.innerHTML = `
            <div class="breadcrumb">
                <a href="index.html"><i class="fa-solid fa-arrow-left"></i> Back to Tools</a> / <span style="opacity:0.7">${t.name}</span>
            </div>

            <div class="detail-header">
                <div class="detail-icon">
                    ${t.iconUrl ? `<img src="${t.iconUrl}" alt="${t.name}">` : `<i class="fa-solid fa-shapes" style="font-size:3rem; color:#06b6d4;"></i>`}
                </div>
                <div class="detail-info">
                    <h1>${t.name}</h1>
                    <div class="detail-meta">
                        <span class="tag">${t.category}</span>
                        ${t.status === 'pending' ? '<span class="tag" style="background:rgba(234, 179, 8, 0.1); color:#eab308; border-color:rgba(234, 179, 8, 0.2);">Pending Review</span>' : ''}
                    </div>
                </div>
                
                <!-- Favorite Action (Top Right) -->
                <button onclick="toggleDetailFavorite('${toolId}')" id="detail-fav-btn" class="icon-btn fav-btn ${isFav ? 'active' : ''}" style="width:48px; height:48px; font-size:1.2rem; margin-left:auto;">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
            </div>

            <div class="detail-content">
                <h3>About this Tool</h3>
                <p style="white-space: pre-line; margin-top:1rem;">${t.description}</p>

                <div class="action-bar">
                    <a href="${t.url}" target="_blank" class="btn-visit">
                        Visit Website <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                    <button onclick="window.copyToShare('${toolId}')" class="btn-visit" style="background: rgba(255,255,255,0.05); color:white; border:1px solid var(--glass-border);">
                        <i class="fa-solid fa-share-nodes"></i> Share
                    </button>
                </div>
            </div>

            <!-- Related Tools Section -->
            <div id="related-container" style="margin-top: 4rem; display:none;">
                <h3 style="margin-bottom: 1.5rem; font-size:1.5rem; border-bottom:1px solid var(--glass-border); padding-bottom:0.5rem;">
                    More ${t.category ? t.category.split(',')[0] : 'Related'} Tools
                </h3>
                <div class="tools-grid" id="related-grid" style="padding:0; margin:0; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                    <!-- Injected -->
                </div>
            </div>
        `;

        document.title = `${t.name} - EditPro Details`;

        // Fetch Related
        if (t.category) {
            fetchRelatedTools(t.category, toolId);
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="loading">Error loading content.</div>';
    }
});

// Toggle Favorite specific to details page
window.toggleDetailFavorite = (id) => {
    const isAdded = window.toggleFavoriteStorage(id);
    const btn = document.getElementById('detail-fav-btn');
    const icon = btn.querySelector('i');

    if (isAdded) {
        btn.classList.add('active');
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
    } else {
        btn.classList.remove('active');
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
    }
};

// Fetch Related
async function fetchRelatedTools(categoryString, currentId) {
    try {
        const mainCat = categoryString.split(',')[0].trim();
        const snapshot = await db.collection('tools').get();
        const favs = window.getFavorites();

        const tools = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(t => t.id !== currentId && t.status !== 'pending' && t.category && t.category.includes(mainCat))
            .slice(0, 3);

        if (tools.length > 0) {
            document.getElementById('related-container').style.display = 'block';
            document.getElementById('related-grid').innerHTML = tools.map(tool => {
                const isFav = favs.includes(tool.id);
                const newBadge = window.isNew(tool.createdAt) ? `<div class="new-badge">NEW</div>` : '';

                return `
                <div class="tool-card" style="height:auto;">
                    ${newBadge}
                    <div class="card-top">
                        <div class="tool-icon" style="width:48px; height:48px; border-radius:12px;">
                            ${tool.iconUrl ? `<img src="${tool.iconUrl}">` : `<i class="fa-solid fa-shapes"></i>`}
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;">
                            <!-- Recycled Global Function for Favorites on Related Cards -->
                            <button onclick="window.toggleFavoriteStorage('${tool.id}'); this.classList.toggle('active'); this.querySelector('i').classList.toggle('fa-solid'); this.querySelector('i').classList.toggle('fa-regular');" class="icon-btn fav-btn ${isFav ? 'active' : ''}">
                                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                            </button>
                        </div>
                    </div>
                    <div class="tool-info">
                        <h3>${tool.name}</h3>
                         <p class="tool-desc" style="line-clamp:2; -webkit-line-clamp:2; display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden;">${tool.description}</p>
                    </div>
                     <div class="tool-actions" style="display:flex; gap:0.5rem;">
                        <a href="tool.html?id=${tool.id}" class="tool-link secondary">Details</a>
                    </div>
                </div>
            `}).join('');
        }
    } catch (e) { console.error("Error fetching related:", e); }
}
