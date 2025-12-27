import Component from '../core/Component.js';
import { showToast } from '../utils.js';

export default class ConversationList extends Component {
    constructor(props) {
        super(props);
        this.openChat = this.openChat.bind(this);
    }

    render() {
        const { folderName, conversations } = this.props;

        const listItemsFn = (conv, index) => `
            <li class="conversation-item-wrapper" draggable="true" 
                data-folder-name="${folderName}" 
                data-conv-id="${conv.id}" 
                data-conv-title="${conv.title}" 
                data-conv-url="${conv.url}" 
                data-original-index="${index}">
                <div class="conversation-item-content">
                    <div class="conversation-title gds-body-m" data-folder-name="${folderName}" data-conv-id="${conv.id}" style="flex-grow: 1; cursor: pointer;" title="${conv.title}">${conv.title}</div>
                    <button class="delete-conversation-btn" title="Eliminar conversación: &quot;${conv.title}&quot;" data-folder-name="${folderName}" data-conv-id="${conv.id}"><mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="delete" fonticon="delete"></mat-icon></button>
                </div>
            </li>
        `;

        return `
            <div class="conversations-list-wrapper">
                <ul class="conversation-items-container side-nav-opened" data-folder-name="${folderName}">
                    ${conversations.map(listItemsFn).join('')}
                </ul>
            </div>
        `;
    }

    afterRender() {
        const { eventHandler, dragAndDropHandler } = this.props;
        const ul = this.element.querySelector('ul');
        
        if (dragAndDropHandler && ul) {
            ul.addEventListener('dragover', dragAndDropHandler.handleConversationListDragOver.bind(dragAndDropHandler));
            ul.addEventListener('drop', dragAndDropHandler.handleConversationListDrop.bind(dragAndDropHandler));
        }

        const items = this.element.querySelectorAll('.conversation-item-wrapper');
        items.forEach(item => {
            if (dragAndDropHandler) {
                item.addEventListener('dragstart', dragAndDropHandler.handleDragStart.bind(dragAndDropHandler));
                item.addEventListener('dragend', (event) => event.target.classList.remove('is-dragging'));
            }
            if (eventHandler) {
                eventHandler.addConversationListeners(item);
            }
        });
    }

    async openChat(conversationId, sidebar) {
        if (conversationId) {
            const selector = '.chat-history-list .conversation[jslog*="\\"c_' + conversationId + '\\""]';
            let targetConversationElement = document.querySelector(selector);

            if (!targetConversationElement) {
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
