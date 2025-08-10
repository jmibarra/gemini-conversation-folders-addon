function extractConversationTitle() {
    const selectedConversationTitleElement = document.querySelector('.conversation.selected .conversation-title');
    if (selectedConversationTitleElement) {
        return selectedConversationTitleElement.textContent.trim();
    }

    const currentGemTitleElement = document.querySelector('.bot-item.selected .bot-name');
    if (currentGemTitleElement) {
        return currentGemTitleElement.textContent.trim();
    }

    const pageTitle = document.title;
    if (pageTitle && pageTitle.includes('Gemini')) {
        const cleanTitle = pageTitle.replace(/^(.*?) - Gemini.*$/, '$1').trim();
        if (cleanTitle && cleanTitle !== "Gemini") {
            return cleanTitle;
        }
    }

    return "Conversación sin título";
}

function extractRealConversationIdFromCurrentUrl() {
    const url = window.location.href;
    const match = url.match(/\/app\/([a-zA-Z0-9_-]+)/) || url.match(/\/gem\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}

function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('gemini-organizer-toast-container');
    if (!toastContainer) {
        console.error('Contenedor de toast no encontrado.');
        return;
    }

    const toast = document.createElement('div');
    toast.classList.add('gemini-organizer-toast', `gemini-organizer-toast-${type}`);
    toast.textContent = message;

    toastContainer.appendChild(toast);
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, { once: true });
    }, duration);
}
