document.addEventListener('DOMContentLoaded', () => {
    const toolsGrid = document.querySelector('.tools-grid');
    const searchInput = document.querySelector('.search-input');
    const categoryContainer = document.getElementById('category-chips');

    let allTools = [];
    let currentCategory = 'all';

    // Fetch Tools
    const fetchTools = async () => {
        if (!db) return;
        try {
            const snapshot = await db.collection('tools').orderBy('createdAt', 'desc').get();
            allTools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

        categoryContainer.innerHTML = Array.from(categories).map(cat => `
            <button class="chip ${cat === 'all' ? 'active' : ''}" onclick="filterByCategory('${cat}')">
                ${cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
        `).join('');
    };

    // Filter Logic
    window.filterByCategory = (cat) => {
        currentCategory = cat;

        // Update active chip
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        // Find the button (approximate match)
        const buttons = Array.from(document.querySelectorAll('.chip'));
        const btn = buttons.find(b => b.textContent.trim().toLowerCase() === cat.toLowerCase());
        if (btn) btn.classList.add('active');

        applyFilters();
    };

    const applyFilters = () => {
        const query = searchInput.value.toLowerCase();

        const filtered = allTools.filter(tool => {
            const matchesSearch =
                tool.name.toLowerCase().includes(query) ||
                tool.description.toLowerCase().includes(query);

            const matchesCategory =
                currentCategory === 'all' ||
                (tool.category && tool.category.toLowerCase().includes(currentCategory.toLowerCase()));

            return matchesSearch && matchesCategory;
        });

        renderTools(filtered);
    };

    // Render Logic
    const renderTools = (tools) => {
        if (tools.length === 0) {
            toolsGrid.innerHTML = '<div class="loading">No tools found for this criteria.</div>';
            return;
        }

        toolsGrid.innerHTML = tools.map((tool, index) => `
            <div class="tool-card" style="animation: fadeInUp 0.5s ease forwards ${index * 0.1}s; opacity: 0; transform: translateY(20px);">
                <div class="card-top">
                    <div class="tool-icon">
                        ${tool.iconUrl ? `<img src="${tool.iconUrl}" alt="${tool.name}">` : `<i class="fa-solid fa-shapes" style="font-size:1.5rem; color:#06b6d4; display:flex; justify-content:center; align-items:center; height:100%;"></i>`}
                    </div>
                    ${tool.category ? `<span class="tool-category-tag">${tool.category.split(',')[0]}</span>` : ''}
                </div>
                
                <div class="tool-info">
                    <h3>${tool.name}</h3>
                    <p class="tool-desc">${tool.description.substring(0, 100)}${tool.description.length > 100 ? '...' : ''}</p>
                </div>

                <div class="tool-actions">
                    <a href="${tool.url}" target="_blank" class="tool-link">
                        Visit Website <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8em;"></i>
                    </a>
                </div>
            </div>
        `).join('');
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
