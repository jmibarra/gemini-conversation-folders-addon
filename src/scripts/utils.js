export function extractConversationTitle() {
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

export function showToast(message, type = 'info', duration = 3000) {
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

/**
 * Espera a que un elemento que coincida con el selector aparezca en el DOM.
 * @param {string} selector - El selector CSS del elemento a esperar.
 * @param {number} timeout - El tiempo máximo de espera en milisegundos.
 * @returns {Promise<Element|null>} El elemento encontrado o null si se agota el tiempo.
 */
export function waitForElement(selector, timeout = 3000) {
    return new Promise(resolve => {
        const startTime = Date.now();

        function check() {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                resolve(null);
            } else {
                requestAnimationFrame(check);
            }
        }
        check();
    });
}

/**
 * Obtiene el ID de la conversación directamente desde el final de la URL.
 * Funciona para /app/ID y /gem/GEM_NAME/ID.
 * @returns {string|null}
 */
export function extractRealConversationIdFromCurrentUrl() {
    try {
        const pathParts = new URL(window.location.href).pathname.split('/');
        // Toma el último elemento, manejando un posible '/' al final.
        const convId = pathParts.pop() || pathParts.pop(); 
        // Verificación simple para asegurarse de que parece un ID válido.
        if (convId && convId.length > 15) {
            return convId;
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Obtiene el ID de la conversación activa de la forma más fiable posible.
 * Primero busca en el DOM el elemento seleccionado y, si falla, usa la URL.
 * @returns {string|null} El ID de la conversación o null si no se encuentra.
 */
export function getActiveConversationId() {
    // 1. Método Principal: Desde el elemento seleccionado en la lista de chats
    const selectedConversation = document.querySelector('.conversation.selected');
    if (selectedConversation) {
        const jslog = selectedConversation.getAttribute('jslog');
        if (jslog) {
            const match = jslog.match(/BardVeMetadataKey:\[[^\]]*\\x22c_([^\x22]+)\\x22/);
            if (match && match[1]) {
                return match[1];
            }
        }
    }

    return extractRealConversationIdFromCurrentUrl();
}