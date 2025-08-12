class EventHandler {
    constructor(ui, folderManager, dragAndDropHandler) {
        this.ui = ui;
        this.folderManager = folderManager;
        this.dragAndDropHandler = dragAndDropHandler;
    }

    addEventListeners() {
        const createFolderSectionBtn = document.getElementById('create-folder-section-btn');
        if (createFolderSectionBtn) {
            createFolderSectionBtn.addEventListener('click', () => this.ui.toggleSectionVisibility('create-folder-container'));
        }

        const searchSectionBtn = document.getElementById('search-section-btn');
        if (searchSectionBtn) {
            searchSectionBtn.addEventListener('click', () => this.ui.toggleSectionVisibility('search-conversations-container'));
        }


        const createFolderBtn = document.getElementById('create-folder-btn');
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', this.folderManager.createFolder.bind(this.folderManager));
        }

        const searchInput = document.getElementById('search-conversations-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.ui.filterConversationsAndFolders.bind(this.ui));
        }

        if (this.ui.toggleButton) {
            this.ui.toggleButton.addEventListener('click', this.ui.toggleSidebarVisibility.bind(this.ui));
        }
    }

    addFolderInteractionListeners(folderHeader, conversationsWrapper, expandIcon, editButton, deleteButton, folderName, folderTitle) {
        folderHeader.addEventListener('click', () => {
            conversationsWrapper.classList.toggle('hidden');
            const isHidden = conversationsWrapper.classList.contains('hidden');
            expandIcon.setAttribute('fonticon', isHidden ? 'expand_more' : 'expand_less');
            expandIcon.setAttribute('data-mat-icon-name', isHidden ? 'expand_more' : 'expand_less');
        });

        editButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.ui.enableFolderEditMode(folderName, folderTitle, deleteButton, editButton, expandIcon, this);
        });

        deleteButton.addEventListener('click', this.folderManager.deleteFolder.bind(this.folderManager));
    }

    addFolderRenameListeners(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon) {
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.folderManager.saveFolderRename(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon);
            }
        });

        inputField.addEventListener('blur', () => {
            this.folderManager.saveFolderRename(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon);
        });
    }

    addConversationListeners(convItem) {
        const convTitle = convItem.querySelector('.conversation-title');
        if (convTitle) {
            convTitle.addEventListener('click', this.ui.openGeminiChat.bind(this.ui));
        }

        const deleteButton = convItem.querySelector('.delete-conversation-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', this.folderManager.deleteConversation.bind(this.folderManager));
        }
    }
}