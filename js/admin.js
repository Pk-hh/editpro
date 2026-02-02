document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const addToolForm = document.getElementById('add-tool-form');
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const adminToolsList = document.getElementById('admin-tools-list');
    const toast = document.getElementById('toast');

    // Form Elements
    const toolIdInput = document.getElementById('tool-id');
    const submitBtn = document.getElementById('submit-btn');
    const formTitle = document.getElementById('form-title');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const fileInput = document.getElementById('tool-file');
    const previewImg = document.getElementById('preview-img');

    // Storage Reference (if enabled)
    let storage;
    try {
        storage = firebase.storage();
    } catch (e) {
        console.warn("Firebase Storage not available. Uploads will fail if attempted.");
    }

    const showToast = (message, isError = false) => {
        toast.textContent = message;
        toast.style.borderLeft = isError ? '4px solid #ef4444' : '4px solid var(--accent-color)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // File Preview
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Auth Logic
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            loadToolsForAdmin();
        } else {
            loginContainer.style.display = 'block';
            dashboardContainer.style.display = 'none';
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await auth.signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('password').value);
                showToast('Welcome back');
            } catch (error) {
                showToast(error.message, true);
            }
        });
    }

    // Add / Edit Tool Handler
    if (addToolForm) {
        addToolForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';

            const id = toolIdInput.value;
            const file = fileInput.files[0];
            let iconUrl = document.getElementById('tool-icon-url').value;

            try {
                // Upload Image if selected
                if (file) {
                    if (!storage) throw new Error("Storage not enabled");
                    const storageRef = storage.ref(`tool-icons/${Date.now()}_${file.name}`);
                    await storageRef.put(file);
                    iconUrl = await storageRef.getDownloadURL();
                }

                const toolData = {
                    name: document.getElementById('tool-name').value,
                    url: document.getElementById('tool-url').value,
                    description: document.getElementById('tool-desc').value,
                    category: document.getElementById('tool-category').value,
                    iconUrl: iconUrl,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (!id) {
                    // Create
                    toolData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection('tools').add(toolData);
                    showToast('Tool added successfully');
                } else {
                    // Update
                    await db.collection('tools').doc(id).update(toolData);
                    showToast('Tool updated successfully');
                }

                window.resetForm();
                loadToolsForAdmin();
            } catch (error) {
                console.error(error);
                showToast('Error: ' + error.message, true);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = id ? '<i class="fa-solid fa-save"></i> Update Tool' : '<i class="fa-solid fa-plus"></i> Add Tool';
            }
        });
    }

    // Reset Form
    window.resetForm = () => {
        addToolForm.reset();
        toolIdInput.value = '';
        formTitle.textContent = 'Add New Tool';
        submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Tool';
        cancelEditBtn.style.display = 'none';
        previewImg.style.display = 'none';
    };

    // Load List (Active Tools)
    const loadToolsForAdmin = async () => {
        const container = document.getElementById('admin-tools-list');
        try {
            // Only get approved/active tools (status != 'pending')
            // Firestore doesn't support != in normal queries easily without composite indexes sometimes, 
            // but for small apps doing client side filtering or separate queries is fine.
            // Let's just fetch all and separate them, OR simpler: just fetch by status if we index it.
            // Since we didn't add status to old tools, they are 'active' by default.
            // Let's fetch all and filter client side to be safe and simple for now.

            const snapshot = await db.collection('tools').orderBy('createdAt', 'desc').get();
            const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const activeTools = allDocs.filter(t => t.status !== 'pending');
            const pendingTools = allDocs.filter(t => t.status === 'pending');

            renderActiveTools(container, activeTools);
            renderPendingTools(pendingTools);

            // Update Stats
            document.getElementById('stat-total').innerText = allDocs.length;
            document.getElementById('stat-pending').innerText = pendingTools.length;

            // Calculate Categories
            const categories = new Set();
            allDocs.forEach(t => {
                if (t.category) t.category.split(',').forEach(c => categories.add(c.trim().toLowerCase()));
            });
            document.getElementById('stat-categories').innerText = categories.size;

        } catch (e) { console.error(e); }
    };

    const renderActiveTools = (container, tools) => {
        container.innerHTML = tools.map(t => {
            // Escape quotes
            const safeName = t.name.replace(/'/g, "\\'");
            return `
                <div class="admin-tool-item">
                    <div class="tool-info">
                        <h4>${t.name} <span style="font-size:0.8em; opacity:0.7; border:1px solid #333; padding:2px 6px; border-radius:4px;">${t.category}</span></h4>
                        <p>${t.url}</p>
                    </div>
                    <div class="actions">
                        <button class="btn-edit" onclick="startEdit('${t.id}')" style="margin-right:0.5rem; background:#3b82f620; color:#3b82f6; border:1px solid #3b82f640; padding:0.5rem; border-radius:6px; cursor:pointer;">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteTool('${t.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderPendingTools = (tools) => {
        const container = document.getElementById('pending-tools-list');
        const section = document.getElementById('pending-section');

        if (tools.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = tools.map(t => `
            <div class="admin-tool-item" style="border-left: 3px solid var(--accent-secondary);">
                <div class="tool-info">
                    <h4>${t.name} <span style="color:var(--accent-secondary); font-size:0.8em;">(User Submitted)</span></h4>
                    <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:0.3rem;">${t.description.substring(0, 60)}...</p>
                    <a href="${t.url}" target="_blank" style="color:var(--accent-color); font-size:0.8rem;">Visit Link</a>
                </div>
                <div class="actions" style="display:flex; gap:0.5rem;">
                    <button onclick="approveTool('${t.id}')" style="background:#06b6d4; color:#000; border:none; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-weight:600;">
                        Approve
                    </button>
                    <button onclick="deleteTool('${t.id}')" style="background:rgba(239, 68, 68, 0.2); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.3); padding:0.5rem; border-radius:6px; cursor:pointer;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
        `).join('');
    };

    window.approveTool = async (id) => {
        try {
            await db.collection('tools').doc(id).update({
                status: 'active',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Tool Approved!');
            loadToolsForAdmin();
        } catch (e) { showToast(e.message, true); }
    };

    // Start Edit (Available Globally)
    window.startEdit = async (id) => {
        try {
            const doc = await db.collection('tools').doc(id).get();
            if (!doc.exists) return;
            const data = doc.data();

            document.getElementById('tool-name').value = data.name;
            document.getElementById('tool-url').value = data.url;
            document.getElementById('tool-desc').value = data.description;
            document.getElementById('tool-category').value = data.category;
            document.getElementById('tool-icon-url').value = data.iconUrl || '';
            toolIdInput.value = id;

            if (data.iconUrl) {
                previewImg.src = data.iconUrl;
                previewImg.style.display = 'block';
            }

            formTitle.textContent = 'Edit Tool';
            submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Update Tool';
            cancelEditBtn.style.display = 'inline-block';

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) { console.error(e); }
    };

    window.logout = () => auth.signOut();

    window.deleteTool = async (id) => {
        if (confirm('Delete this tool?')) {
            try {
                await db.collection('tools').doc(id).delete();
                showToast('Deleted');
                loadToolsForAdmin();
            } catch (e) { showToast(e.message, true); }
        }
    };
});
