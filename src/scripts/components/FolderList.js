import { fetchTemplate } from '../utils/templateUtils.js';
import ConversationList from './ConversationList.js';

export default class FolderList {
    constructor() {
        this.conversationList = new ConversationList();
    }

    async render(folders, openFolderStates, eventHandler, dragAndDropHandler) {
        const foldersListUl = document.getElementById('folders-list-ul');
        if (!foldersListUl) return;

        foldersListUl.innerHTML = '';
        const sortedFolderNames = Object.keys(folders).sort();

        const folderElements = await Promise.all(sortedFolderNames.map(folderName => {
            const folder = folders[folderName];
            return this.createFolderElement(folderName, folder, openFolderStates, eventHandler, dragAndDropHandler);
        }));

        folderElements.forEach(folderContainer => foldersListUl.appendChild(folderContainer));
    }

    async createFolderElement(folderName, folder, openFolderStates, eventHandler, dragAndDropHandler) {
        const folderContainer = document.createElement('li');
        folderContainer.classList.add('gemini-folder-item');

        const folderHeader = await this.createFolderHeader(folderName, dragAndDropHandler);
        const conversationsWrapper = await this.conversationList.createWrapper(folderName, folder, eventHandler, dragAndDropHandler);

        folderContainer.appendChild(folderHeader);
        folderContainer.appendChild(conversationsWrapper);

        const [folderTitle, editButton, deleteButton, expandIcon] = folderHeader.children;

        eventHandler.addFolderInteractionListeners(folderHeader, conversationsWrapper, expandIcon, editButton, deleteButton, folderName, folderTitle);

        if (!openFolderStates[folderName]) {
            conversationsWrapper.classList.add('hidden');
            expandIcon.setAttribute('fonticon', 'expand_more');
            expandIcon.setAttribute('data-mat-icon-name', 'expand_more');
        } else {
            conversationsWrapper.classList.remove('hidden');
            expandIcon.setAttribute('fonticon', 'expand_less');
            expandIcon.setAttribute('data-mat-icon-name', 'expand_less');
        }

        return folderContainer;
    }

    async createFolderHeader(folderName, dragAndDropHandler) {
        const folderHeader = document.createElement('div');
        folderHeader.classList.add('title-container');
        folderHeader.setAttribute('role', 'button');
        folderHeader.setAttribute('tabindex', '0');
        folderHeader.dataset.folderName = folderName;
        folderHeader.addEventListener('dragover', dragAndDropHandler.handleDragOver.bind(dragAndDropHandler));
        folderHeader.addEventListener('dragleave', dragAndDropHandler.handleDragLeave.bind(dragAndDropHandler));
        folderHeader.addEventListener('drop', dragAndDropHandler.handleDrop.bind(dragAndDropHandler));

        const template = await fetchTemplate('src/templates/folderHeader.html');
        folderHeader.innerHTML = template.replace(/{{folderName}}/g, folderName);

        return folderHeader;
    }

    enableEditMode(folderName, folderTitleElement, deleteBtn, editBtn, expandIcon, eventHandler) {
        const originalFolderName = folderName;
        folderTitleElement.style.display = 'none';
        deleteBtn.style.display = 'none';
        editBtn.style.display = 'none';
        expandIcon.style.display = 'none';

        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.value = originalFolderName;
        inputField.classList.add('folder-rename-input');
        inputField.dataset.originalFolderName = originalFolderName;

        folderTitleElement.parentNode.insertBefore(inputField, folderTitleElement);
        inputField.focus();
        inputField.select();

        eventHandler.addFolderRenameListeners(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon);
    }

    filter(searchTerm) {
        const foldersListUl = document.getElementById('folders-list-ul');
        const folderItems = foldersListUl.querySelectorAll('.gemini-folder-item');

        folderItems.forEach(folderItem => {
            const folderTitleElement = folderItem.querySelector('.gemini-folder-title');
            const folderName = folderTitleElement.textContent.toLowerCase();
            const conversationsWrapper = folderItem.querySelector('.conversations-list-wrapper');
            const conversationItems = conversationsWrapper.querySelectorAll('.conversation-item-wrapper');
            const expandIcon = folderItem.querySelector('.gemini-expand-icon');

            let folderMatches = folderName.includes(searchTerm);
            let anyConversationMatches = false;

            conversationItems.forEach(convItem => {
                const convTitle = convItem.querySelector('.conversation-title').textContent.toLowerCase();
                if (convTitle.includes(searchTerm)) {
                    convItem.style.display = '';
                    anyConversationMatches = true;
                } else {
                    convItem.style.display = 'none';
                }
            });

            if (searchTerm === '') {
                folderItem.style.display = '';
                conversationsWrapper.classList.add('hidden');
                expandIcon.setAttribute('fonticon', 'expand_more');
                expandIcon.setAttribute('data-mat-icon-name', 'expand_more');
                conversationItems.forEach(convItem => convItem.style.display = '');
                return;
            }

            if (folderMatches || anyConversationMatches) {
                folderItem.style.display = '';
                conversationsWrapper.classList.remove('hidden');
                expandIcon.setAttribute('fonticon', 'expand_less');
                expandIcon.setAttribute('data-mat-icon-name', 'expand_less');
            } else {
                folderItem.style.display = 'none';
            }
        });
    }
}
