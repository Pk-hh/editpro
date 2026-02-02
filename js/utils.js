// Shared Utilities for EditPro

// 1. Toast Notifications
window.showToast = (message, isError = false) => {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-check-circle'}"></i> ${message}`;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// 2. Clipboard Share
window.copyToShare = (id) => {
    // If id looks like a URL, use it, otherwise build the tool URL
    const url = id.includes('http') ? id : `${window.location.origin}/tool.html?id=${id}`;

    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy link', true);
    });
};

// 3. New Badge Check (7 days)
window.isNew = (timestamp) => {
    if (!timestamp) return false;
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
};

// 4. Favorites Storage Helper
window.getFavorites = () => JSON.parse(localStorage.getItem('editProFavorites') || '[]');

window.toggleFavoriteStorage = (id) => {
    const favs = window.getFavorites();
    const index = favs.indexOf(id);
    let isAdded = false;

    if (index === -1) {
        favs.push(id);
        isAdded = true;
    } else {
        favs.splice(index, 1);
        isAdded = false;
    }

    localStorage.setItem('editProFavorites', JSON.stringify(favs));
    return isAdded; // Returns true if added, false if removed
};
