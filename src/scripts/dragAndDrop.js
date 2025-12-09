import { showToast, extractRealConversationIdFromCurrentUrl } from './utils.js';

export default class DragAndDrop {
    constructor(storage, folderManager) {
        this.storage = storage;
        this.folderManager = folderManager;
    }

    handleDragStart(event) {
        const geminiConversationElement = event.target.closest('.chat-history-list .conversation[data-test-id="conversation"]');
        const savedConversationElement = event.target.closest('.conversation-item-wrapper[draggable="true"]');
        let conversationData;

        if (geminiConversationElement) {
            const titleElement = geminiConversationElement.querySelector('.conversation-title');
            const convTitle = titleElement ? titleElement.textContent.trim() : 'Conversación sin título';
            let realConversationId = null;
            let convUrl = '';

            const jslogAttribute = geminiConversationElement.getAttribute('jslog');
            if (jslogAttribute) {
                // More robust regex to match "c_..." anywhere in the string, inside quotes
                const match = jslogAttribute.match(/["']c_([^"']+)["']/);
                if (match && match[1]) {
                    realConversationId = match[1];
                    convUrl = `https://gemini.google.com/app/${realConversationId}`;
                }
            }

            if (!realConversationId && geminiConversationElement.classList.contains('selected')) {
                realConversationId = extractRealConversationIdFromCurrentUrl();
                if (realConversationId) {
                    convUrl = `https://gemini.google.com/app/${realConversationId}`;
                }
            }

            if (!realConversationId) {
                realConversationId = 'fallback_' + Date.now().toString();
            }

            conversationData = {
                id: realConversationId,
                title: convTitle,
                url: convUrl || window.location.href,
                folder_from: null,
                original_index: -1
            };
            geminiConversationElement.classList.add('is-dragging');
        } else if (savedConversationElement) {
            conversationData = {
                id: savedConversationElement.dataset.convId,
                title: savedConversationElement.dataset.convTitle,
                url: savedConversationElement.dataset.convUrl,
                folder_from: savedConversationElement.dataset.folderName,
                original_index: parseInt(savedConversationElement.dataset.originalIndex)
            };
            savedConversationElement.classList.add('is-dragging');
        } else {
            event.preventDefault();
            return;
        }

        event.dataTransfer.setData('application/json', JSON.stringify(conversationData));
        event.dataTransfer.effectAllowed = 'move';
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
            event.currentTarget.classList.add('drag-over');
        }
    }

    handleDragLeave(event) {
        if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
            event.currentTarget.classList.remove('drag-over');
        }
        event.currentTarget.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
    }

    async handleDrop(event) {
        event.preventDefault();
        if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
            event.currentTarget.classList.remove('drag-over');
        }

        const droppedData = event.dataTransfer.getData('application/json');
        if (!droppedData) return;

        const conversation = JSON.parse(droppedData);
        const targetFolderName = event.currentTarget.dataset.folderName;
        const sourceFolderName = conversation.folder_from;

        if (!targetFolderName) return;

        const storedFolders = await this.storage.getFolders();

        if (sourceFolderName && sourceFolderName !== targetFolderName) {
            storedFolders[sourceFolderName] = storedFolders[sourceFolderName].filter(c => c.id !== conversation.id);
        }

        if (!storedFolders[targetFolderName].some(c => c.id === conversation.id)) {
            storedFolders[targetFolderName].push({ id: conversation.id, title: conversation.title, url: conversation.url, timestamp: new Date().toLocaleString() });
        }

        await this.storage.saveFolders(storedFolders);
        showToast(`Conversación movida a "${targetFolderName}"`, 'success');
    }

    handleConversationListDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const targetItem = event.target.closest('.conversation-item-wrapper');
        const conversationList = event.currentTarget;
        conversationList.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));

        if (targetItem) {
            const boundingBox = targetItem.getBoundingClientRect();
            const offset = event.clientY - boundingBox.top;
            if (offset < boundingBox.height / 2) {
                targetItem.classList.add('drag-over-top');
            } else {
                targetItem.classList.add('drag-over-bottom');
            }
        } else {
            conversationList.classList.add('drag-over-bottom');
        }
    }

    async handleConversationListDrop(event) {
        event.preventDefault();
        event.currentTarget.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));

        const droppedData = event.dataTransfer.getData('application/json');
        if (!droppedData) return;

        const conversation = JSON.parse(droppedData);
        const targetFolderName = event.currentTarget.dataset.folderName;
        const sourceFolderName = conversation.folder_from;
        const originalIndex = conversation.original_index;

        if (!targetFolderName) return;

        const storedFolders = await this.storage.getFolders();
        const targetItem = event.target.closest('.conversation-item-wrapper');
        let newIndex;

        if (targetItem) {
            const boundingBox = targetItem.getBoundingClientRect();
            const offset = event.clientY - boundingBox.top;
            const targetIndex = Array.from(targetItem.parentNode.children).indexOf(targetItem);
            newIndex = (offset < boundingBox.height / 2) ? targetIndex : targetIndex + 1;
        } else {
            newIndex = storedFolders[targetFolderName].length;
        }

        if (sourceFolderName === targetFolderName) {
            const [movedConversation] = storedFolders[targetFolderName].splice(originalIndex, 1);
            storedFolders[targetFolderName].splice(newIndex > originalIndex ? newIndex - 1 : newIndex, 0, movedConversation);
        } else {
            if (sourceFolderName) {
                storedFolders[sourceFolderName] = storedFolders[sourceFolderName].filter(c => c.id !== conversation.id);
            }
            if (!storedFolders[targetFolderName].some(c => c.id === conversation.id)) {
                storedFolders[targetFolderName].splice(newIndex, 0, { id: conversation.id, title: conversation.title, url: conversation.url, timestamp: new Date().toLocaleString() });
            }
        }

        await this.storage.saveFolders(storedFolders);
        showToast('Conversación reordenada', 'success');
    }

    async setupDraggableConversations() {
        const recentConversations = document.querySelectorAll('.chat-history-list .conversation[data-test-id="conversation"]');

        const allSavedConversations = await this.storage.getFolders();
        const savedIds = new Set();
        for (const folderName in allSavedConversations) {
            allSavedConversations[folderName].forEach(conv => savedIds.add(conv.id));
        }

        recentConversations.forEach(convElement => {
            if (!convElement.hasAttribute('data-draggable-setup')) {
                convElement.setAttribute('draggable', 'true');
                convElement.addEventListener('dragstart', this.handleDragStart.bind(this));
                convElement.addEventListener('dragend', (event) => event.target.classList.remove('is-dragging'));
                convElement.setAttribute('data-draggable-setup', 'true');
            }

            const jslogAttribute = convElement.getAttribute('jslog');
            let realConversationId = null;
            if (jslogAttribute) {
                 // More robust regex to match "c_..." anywhere in the string, inside quotes
                const match = jslogAttribute.match(/["']c_([^"']+)["']/);
                if (match && match[1]) {
                    realConversationId = match[1];
                }
            }

            const titleElement = convElement.querySelector('.conversation-title');

            if (realConversationId && savedIds.has(realConversationId)) {
                convElement.classList.add('is-saved');
                
                let icon = titleElement.querySelector('.gemini-organizer-saved-icon');
                if (!icon) {
                    icon = document.createElement('span');
                    icon.classList.add('gemini-organizer-saved-icon');
                    icon.textContent = '📁';
                    titleElement.insertBefore(icon, titleElement.firstChild);
                }
            } else {
                convElement.classList.remove('is-saved');
                const icon = titleElement.querySelector('.gemini-organizer-saved-icon');
                if (icon) {
                    icon.remove();
                }
            }
        });
    }
}