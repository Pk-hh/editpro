document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('public-submit-form');
    const submitBtn = document.getElementById('submit-btn');
    const formContainer = document.getElementById('submit-form-container');
    const successView = document.getElementById('success-view');

    // Helper to clear error styles
    const clearErrors = () => {
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        // Basic Validation
        const nameInput = document.getElementById('tool-name');
        const urlInput = document.getElementById('tool-url');
        const descInput = document.getElementById('tool-desc');

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        const category = document.getElementById('tool-category').value;
        const desc = descInput.value.trim();
        const iconUrl = document.getElementById('tool-icon-url').value;

        let isValid = true;

        if (!name) { nameInput.classList.add('error'); isValid = false; }
        if (!url) { urlInput.classList.add('error'); isValid = false; }
        if (!desc) { descInput.classList.add('error'); isValid = false; }

        if (!isValid) {
            window.showToast('Please fill in all required fields.', true);
            return;
        }

        // UI Loading State
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            await db.collection('tools').add({
                name: name,
                url: url,
                category: category,
                description: desc,
                iconUrl: iconUrl || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending', // Pending review
                userSubmitted: true
            });

            // Show Success
            window.showToast('Tool submitted successfully!');
            formContainer.style.display = 'none';
            successView.style.display = 'block';

        } catch (error) {
            console.error("Error submitting tool:", error);
            window.showToast("Something went wrong. Please try again.", true);
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Tool';
            submitBtn.disabled = false;
        }
    });
});
