import { fetchTemplate } from '../utils/templateUtils.js';
import { showToast } from '../utils.js';

export default class ConversationList {
    constructor() {
    }

    async createWrapper(folderName, conversations, eventHandler, dragAndDropHandler) {
        const conversationsWrapper = document.createElement('div');
        conversationsWrapper.classList.add('conversations-list-wrapper');

        const conversationsUl = document.createElement('ul');
        conversationsUl.classList.add('conversation-items-container', 'side-nav-opened');
        conversationsUl.dataset.folderName = folderName;
        conversationsUl.addEventListener('dragover', dragAndDropHandler.handleConversationListDragOver.bind(dragAndDropHandler));
        conversationsUl.addEventListener('drop', dragAndDropHandler.handleConversationListDrop.bind(dragAndDropHandler));

        const conversationItems = await Promise.all(conversations.map((conv, index) =>
            this.createItem(conv, folderName, index, eventHandler, dragAndDropHandler)
        ));

        conversationItems.forEach(convItem => conversationsUl.appendChild(convItem));

        conversationsWrapper.appendChild(conversationsUl);
        return conversationsWrapper;
    }

    async createItem(conv, folderName, index, eventHandler, dragAndDropHandler) {
        const convItem = document.createElement('li');
        convItem.classList.add('conversation-item-wrapper');
        convItem.setAttribute('draggable', 'true');
        convItem.dataset.folderName = folderName;
        convItem.dataset.convId = conv.id;
        convItem.dataset.convTitle = conv.title;
        convItem.dataset.convUrl = conv.url;
        convItem.dataset.originalIndex = index;
        convItem.addEventListener('dragstart', dragAndDropHandler.handleDragStart.bind(dragAndDropHandler));
        convItem.addEventListener('dragend', (event) => event.target.classList.remove('is-dragging'));

        const template = await fetchTemplate('src/templates/conversationItem.html');
        convItem.innerHTML = template
            .replace(/{{folderName}}/g, folderName)
            .replace(/{{convId}}/g, conv.id)
            .replace(/{{convTitle}}/g, conv.title);

        eventHandler.addConversationListeners(convItem);
        return convItem;
    }

    async openChat(conversationId, sidebar) {
        if (conversationId) {
            const selector = '.chat-history-list .conversation[jslog*="\\"c_' + conversationId + '\\""]';
            let targetConversationElement = document.querySelector(selector);

            if (!targetConversationElement) {
                // Retry once after a short delay
                await new Promise(resolve => setTimeout(resolve, 500));
                targetConversationElement = document.querySelector(selector);
            }

            if (targetConversationElement) {
                const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true, buttons: 1 });
                const mouseDownEvent = new MouseEvent('mousedown', { view: window, bubbles: true, cancelable: true, buttons: 1 });
                const mouseUpEvent = new MouseEvent('mouseup', { view: window, bubbles: true, cancelable: true });

                targetConversationElement.dispatchEvent(mouseDownEvent);
                targetConversationElement.dispatchEvent(mouseUpEvent);
                targetConversationElement.dispatchEvent(clickEvent);

                setTimeout(() => {
                    if (sidebar) sidebar.hide();
                }, 100);

            } else {
                console.warn(`Gemini Organizer: Could not find conversation element for ID ${conversationId}. Fallback to page reload.`);
                showToast(`Conversación no encontrada en la lista reciente. Recargando para buscarla...`, 'warning');
                window.location.href = `https://gemini.google.com/app/${conversationId}`;
                if (sidebar) sidebar.hide();
            }
        } else {
            showToast("No se pudo encontrar el ID de esta conversación.", 'error');
        }
    }
}
