document.addEventListener('DOMContentLoaded', () => {
    const toolsGrid = document.querySelector('.tools-grid');
    const searchInput = document.querySelector('.search-input');
    const categoryContainer = document.getElementById('category-chips');

    let allTools = [];
    let currentCategory = 'all';

    // Favorites Logic (Global Utils)
    const toggleFavorite = (id) => {
        const isAdded = window.toggleFavoriteStorage(id);

        // Re-render to update UI
        if (currentCategory === 'favorites') applyFilters();
        else renderTools(currentTools); // Re-render current list to update icons
    };
    window.toggleFavorite = toggleFavorite; // Expose to global for onclick

    let currentTools = []; // Store currently displayed tools for re-rendering

    // Fetch Tools
    const fetchTools = async () => {
        if (!db) return;
        try {
            const snapshot = await db.collection('tools').orderBy('createdAt', 'desc').get();
            allTools = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(t => t.status !== 'pending'); // Hide pending tools

            // Initial Render
            currentTools = allTools;
            setupCategories(allTools);
            renderTools(allTools);
        } catch (error) {
            console.error("Error:", error);
            toolsGrid.innerHTML = '<div class="loading">Error loading tools.</div>';
        }
    };

    // Setup Category Chips
    const setupCategories = (tools) => {
        const categories = new Set(['all']);
        tools.forEach(t => {
            if (t.category) t.category.split(',').forEach(c => categories.add(c.trim()));
        });

        // Add Favorites Chip manually after 'All'
        let chipsHTML = `
            <button class="chip active" onclick="filterByCategory('all')">All</button>
            <button class="chip" onclick="filterByCategory('favorites')"><i class="fa-solid fa-heart"></i> Favorites</button>
        `;

        Array.from(categories).filter(c => c !== 'all').forEach(cat => {
            chipsHTML += `
                <button class="chip" onclick="filterByCategory('${cat}')">
                    ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
            `;
        });

        categoryContainer.innerHTML = chipsHTML;
    };

    // Filter Logic
    window.filterByCategory = (cat) => {
        currentCategory = cat;

        // Update active chip
        document.querySelectorAll('.chip').forEach(c => {
            const text = c.textContent.trim().toLowerCase();
            if (cat === 'favorites') {
                c.classList.toggle('active', text.includes('favorites'));
            } else {
                c.classList.toggle('active', text === cat.toLowerCase());
            }
        });

        applyFilters();
    };

    const applyFilters = () => {
        const query = searchInput.value.toLowerCase();
        const favs = window.getFavorites();

        const filtered = allTools.filter(tool => {
            const matchesSearch =
                tool.name.toLowerCase().includes(query) ||
                tool.description.toLowerCase().includes(query);

            let matchesCategory = true;
            if (currentCategory === 'favorites') {
                matchesCategory = favs.includes(tool.id);
            } else if (currentCategory !== 'all') {
                matchesCategory = tool.category && tool.category.toLowerCase().includes(currentCategory.toLowerCase());
            }

            return matchesSearch && matchesCategory;
        });

        currentTools = filtered; // Update state
        renderTools(filtered);
    };

    // --- NEW FEATURES --- (Now using global utility functions)

    // Render Logic
    const renderTools = (tools) => {
        const favs = window.getFavorites();

        if (tools.length === 0) {
            toolsGrid.innerHTML = currentCategory === 'favorites'
                ? '<div class="loading">No favorites yet. Click the heart on tools to save them!</div>'
                : '<div class="loading">No tools found for this criteria.</div>';
            return;
        }

        toolsGrid.innerHTML = tools.map((tool, index) => {
            const isFav = favs.includes(tool.id);
            const newBadge = window.isNew(tool.createdAt) ? `<div class="new-badge">NEW</div>` : '';

            return `
            <div class="tool-card" style="animation: fadeInUp 0.5s ease forwards ${index * 0.1}s; opacity: 0; transform: translateY(20px);">
                ${newBadge}
                <div class="card-top">
                    <div class="tool-icon">
                        ${tool.iconUrl ? `<img src="${tool.iconUrl}" alt="${tool.name}">` : `<i class="fa-solid fa-shapes" style="font-size:1.5rem; color:#06b6d4; display:flex; justify-content:center; align-items:center; height:100%;"></i>`}
                    </div>
                    
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;">
                         <div class="action-buttons" style="display:flex; gap:0.5rem;">
                            <button onclick="copyToShare('${tool.id}')" class="icon-btn share-btn" title="Share Tool">
                                <i class="fa-solid fa-share-nodes"></i>
                            </button>
                            <button onclick="toggleFavorite('${tool.id}')" class="icon-btn fav-btn ${isFav ? 'active' : ''}" title="Add to Favorites">
                                <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                            </button>
                         </div>
                        ${tool.category ? `<span class="tool-category-tag">${tool.category.split(',')[0]}</span>` : ''}
                    </div>
                </div>
                
                <div class="tool-info">
                    <h3>${tool.name}</h3>
                    <p class="tool-desc">${tool.description.substring(0, 100)}${tool.description.length > 100 ? '...' : ''}</p>
                </div>

                <div class="tool-actions" style="display:flex; gap:0.5rem;">
                    <a href="tool.html?id=${tool.id}" class="tool-link secondary">
                        Details
                    </a>
                    <a href="${tool.url}" target="_blank" class="tool-link primary">
                        Visit <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8em;"></i>
                    </a>
                </div>
            </div>
        `}).join('');
    };

    // Add animation styles dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeInUp {
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    searchInput.addEventListener('input', applyFilters);
    fetchTools();
});
