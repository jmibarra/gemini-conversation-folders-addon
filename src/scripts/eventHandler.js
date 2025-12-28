import { showToast } from './utils.js';

export default class EventHandler {
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
            createFolderBtn.addEventListener('click', this.handleCreateFolder.bind(this));
        }

        const searchInput = document.getElementById('search-conversations-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.ui.filterConversationsAndFolders.bind(this.ui));
        }

        if (this.ui.toggleButton) {
            this.ui.toggleButton.addEventListener('click', this.ui.toggleSidebarVisibility.bind(this.ui));
        }
    }

    async handleCreateFolder() {
        const newFolderNameInput = document.getElementById('new-folder-name');
        const folderName = newFolderNameInput.value.trim();

        try {
            await this.folderManager.createFolder(folderName);
             newFolderNameInput.value = '';
            showToast(`Carpeta "${folderName}" creada exitosamente.`, 'success');
            // We might need to refresh the list here?
            // FolderManager usually called loadAndDisplayFolders, but now it's decoupled.
            // We should probably trigger a refresh.
            // The previous implementation relied on storage listener -> handleStorageChange -> loadAndDisplayFolders.
            // So saving folders in FolderManager should trigger that listener in App.js!
            // Yes, Application has chrome.storage.onChanged. So we rely on that.
            
        } catch (error) {
            showToast(error.message, 'warning');
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

        deleteButton.addEventListener('click', (event) => this.handleDeleteFolder(event, folderName));
    }

    async handleDeleteFolder(event, folderName) {
        event.stopPropagation();
        if (!confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folderName}"?`)) {
            return;
        }

        try {
            await this.folderManager.deleteFolder(folderName);
            showToast(`Carpeta "${folderName}" eliminada.`, 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    addFolderRenameListeners(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon) {
        const handleRename = async () => {
            // Prevent double firing if both blur and enter happen
             if (inputField.dataset.processing === 'true') return;
             
             const newFolderName = inputField.value.trim();
             
             // Quick check for no change or empty to UI restoration
             if (!newFolderName || newFolderName === originalFolderName) {
                if (!newFolderName) showToast("El nombre de la carpeta no puede estar vacío.", 'warning');
                this.restoreFolderTitleUI(inputField, folderTitleElement, deleteBtn, editBtn, expandIcon);
                return;
             }

             inputField.dataset.processing = 'true';

             try {
                 await this.folderManager.renameFolder(originalFolderName, newFolderName);
                 showToast(`Carpeta "${originalFolderName}" renombrada a "${newFolderName}" exitosamente.`, 'success');
                 // UI restoration is handled by re-render from storage listener?
                 // Or we should manually restore?
                 // Usually storage change triggers re-render, so the input field will disappear and be replaced by new list.
                 // But if we want smooth transition or if storage listener is slow... 
                 // Actually, if we rely on storage listener, the whole list might rerender.
                 // Let's just remove the input to be safe/clean.
                 if (inputField.parentNode) inputField.remove();
             } catch (error) {
                 showToast(error.message, 'warning');
                 this.restoreFolderTitleUI(inputField, folderTitleElement, deleteBtn, editBtn, expandIcon);
             } finally {
                inputField.dataset.processing = 'false';
             }
        };

        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleRename();
            }
        });

        inputField.addEventListener('blur', () => {
            // Delay slightly to allow Enter key to work first if pressed
             setTimeout(handleRename, 100);
        });
        
        // Focus the input
        inputField.focus();
    }
    
    restoreFolderTitleUI(inputField, folderTitleElement, deleteBtn, editBtn, expandIcon) {
        if (inputField.parentNode) inputField.remove();
        folderTitleElement.style.display = 'block';
        deleteBtn.style.display = 'block';
        editBtn.style.display = 'block';
        expandIcon.style.display = 'block';
    }

    addConversationListeners(convItem) {
        const convTitle = convItem.querySelector('.conversation-title');
        if (convTitle) {
            convTitle.addEventListener('click', this.ui.openGeminiChat.bind(this.ui));
        }

        const deleteButton = convItem.querySelector('.delete-conversation-btn');
        if (deleteButton) {
            const folderName = convItem.closest('.gemini-folder-item').querySelector('.gemini-folder-title').dataset.folderName;
            const convId = convItem.dataset.convId;
            deleteButton.addEventListener('click', (event) => this.handleDeleteConversation(event, folderName, convId));
        }
    }

    async handleDeleteConversation(event, folderName, convId) {
        event.stopPropagation();
         if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
            return;
        }

        try {
            await this.folderManager.deleteConversation(folderName, convId);
            showToast("Conversación eliminada.", 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
}