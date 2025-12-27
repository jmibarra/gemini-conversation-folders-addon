import Component from '../core/Component.js';
import ConversationList from './ConversationList.js';
// We don't strictly need fetchTemplate if we hardcode the simple header, or we can fetch it.
// To keep it simple and consistent with Sidebar, I'll template string the header too.

export default class FolderList extends Component {
    constructor(props) {
        super(props);
        this.conversationList = new ConversationList({}); // Placeholder or utility access
    }

    render() {
        // We render the container. Content is added in afterRender to support child components.
        return `<ul id="folders-list-ul"></ul>`;
    }

    async afterRender() {
        // This is called when we create the list. 
        // However, ui.js often calls render(folders, ...) explicitly.
        // So we might need a method "updateList(folders, ...)" instead of relying on constructor props only?
        // Or we rely on ui.js calling setState or re-creating it.
        // For compatibility with ui.js which calls "renderFolders", I should implement that method.
    }
    
    /**
     * Main method called by UI to update the list.
     * Replaces the logic of the old render().
     */
    async renderFolders(folders, openFolderStates, eventHandler, dragAndDropHandler) {
        // Logic similar to old render() but using Component structure where possible
        
        let listContainer = document.getElementById('folders-list-ul');
        if (!listContainer) {
            // Should be in Sidebar, but if missing (detached), we can't do much.
            return;
        }

        listContainer.innerHTML = ''; // Clear

        if (!folders || Object.keys(folders).length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state-container">
                    <div class="empty-state-icon-wrapper">
                        <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color"
                            aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="folder_open"
                            fonticon="folder_open"></mat-icon>
                    </div>
                    <p class="empty-state-text">No tienes carpetas aún.</p>
                    <p class="empty-state-subtext">¡Crea una para empezar a organizar!</p>
                </div>`;
            return;
        }

        const sortedFolderNames = Object.keys(folders).sort();

        for (const folderName of sortedFolderNames) {
            const folder = folders[folderName];
            const folderEl = await this.createFolderElement(folderName, folder, openFolderStates, eventHandler, dragAndDropHandler);
            listContainer.appendChild(folderEl);
        }
    }

    async createFolderElement(folderName, folder, openFolderStates, eventHandler, dragAndDropHandler) {
        const folderContainer = document.createElement('li');
        folderContainer.classList.add('gemini-folder-item');

        const folderHeader = this.createFolderHeader(folderName, dragAndDropHandler);
        
        // Use ConversationList component
        const convListComponent = new ConversationList({
            folderName,
            conversations: folder,
            eventHandler,
            dragAndDropHandler
        });
        const conversationsWrapper = convListComponent.create(); // This calls render and afterRender (listeners attached)

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

    createFolderHeader(folderName, dragAndDropHandler) {
        const folderHeader = document.createElement('div');
        folderHeader.classList.add('title-container');
        folderHeader.setAttribute('role', 'button');
        folderHeader.setAttribute('tabindex', '0');
        folderHeader.dataset.folderName = folderName;
        
        // We can add listeners immediately if we have the handler
        folderHeader.addEventListener('dragover', dragAndDropHandler.handleDragOver.bind(dragAndDropHandler));
        folderHeader.addEventListener('dragleave', dragAndDropHandler.handleDragLeave.bind(dragAndDropHandler));
        folderHeader.addEventListener('drop', dragAndDropHandler.handleDrop.bind(dragAndDropHandler));

        folderHeader.innerHTML = `
            <span class="title gds-label-l gemini-folder-title" data-folder-name="${folderName}">${folderName}</span>
            <button class="edit-folder-btn" title="Renombrar carpeta: &quot;${folderName}&quot;" data-folder-name="${folderName}"><mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="edit" fonticon="edit"></mat-icon></button>
            <button class="delete-folder-btn" title="Eliminar carpeta: &quot;${folderName}&quot;" data-folder-name="${folderName}"><mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="delete" fonticon="delete"></mat-icon></button>
            <mat-icon role="img" class="mat-icon notranslate gds-icon-l google-symbols mat-ligature-font mat-icon-no-color gemini-expand-icon" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="expand_more" fonticon="expand_more"></mat-icon>
        `;

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
        if (!foldersListUl) return;

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
                const convTitle = convItem.dataset.convTitle.toLowerCase(); // Use dataset since we set it
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
