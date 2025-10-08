import { showToast } from './utils.js';

export default class FolderManager {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
    }

    async loadAndDisplayFolders() {
        const openFolderStates = this.getOpenFolderStates();
        const folders = await this.storage.getFolders();
        this.ui.renderFolders(folders, openFolderStates, this.eventHandler, this.dragAndDropHandler);
    }

    async createFolder() {
        const newFolderNameInput = document.getElementById('new-folder-name');
        const folderName = newFolderNameInput.value.trim();

        if (folderName) {
            const storedFolders = await this.storage.getFolders();

            if (!storedFolders[folderName]) {
                storedFolders[folderName] = [];
                await this.storage.saveFolders(storedFolders);
                newFolderNameInput.value = '';
                showToast(`Carpeta "${folderName}" creada exitosamente.`, 'success');
            } else {
                showToast(`La carpeta "${folderName}" ya existe.`, 'warning');
            }
        } else {
            showToast("Por favor, ingresa un nombre para la carpeta.", 'warning');
        }
    }

    async saveFolderRename(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon) {
        const newFolderName = inputField.value.trim();

        if (!inputField.parentNode) {
            return;
        }

        if (newFolderName === originalFolderName) {
            inputField.remove();
            folderTitleElement.style.display = 'block';
            deleteBtn.style.display = 'block';
            editBtn.style.display = 'block';
            expandIcon.style.display = 'block';
            return;
        }

        if (!newFolderName) {
            showToast("El nombre de la carpeta no puede estar vacío. Se restaurará el nombre original.", 'warning');
            inputField.remove();
            folderTitleElement.style.display = 'block';
            deleteBtn.style.display = 'block';
            editBtn.style.display = 'block';
            expandIcon.style.display = 'block';
            return;
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[newFolderName] && newFolderName !== originalFolderName) {
            showToast(`Ya existe una carpeta con el nombre "${newFolderName}". Por favor, elige un nombre diferente.`, 'warning');
            inputField.remove();
            folderTitleElement.style.display = 'block';
            deleteBtn.style.display = 'block';
            editBtn.style.display = 'block';
            expandIcon.style.display = 'block';
            return;
        }

        const folderContent = storedFolders[originalFolderName];
        delete storedFolders[originalFolderName];
        storedFolders[newFolderName] = folderContent;

        await this.storage.saveFolders(storedFolders);
        showToast(`Carpeta "${originalFolderName}" renombrada a "${newFolderName}" exitosamente.`, 'success');

        inputField.remove();
    }

    async deleteFolder(event) {
        event.stopPropagation();
        const folderName = event.currentTarget.dataset.folderName;

        if (!folderName) {
            showToast('Hubo un error al intentar eliminar la carpeta.', 'error');
            return;
        }

        if (!confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folderName}"?`)) {
            return;
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[folderName]) {
            delete storedFolders[folderName];
            await this.storage.saveFolders(storedFolders);
            showToast(`Carpeta "${folderName}" eliminada.`, 'success');
        } else {
            showToast("La carpeta especificada no existe.", 'error');
        }
    }

    async deleteConversation(event) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
            return;
        }

        const folderName = event.currentTarget.dataset.folderName;
        const convId = event.currentTarget.dataset.convId;

        if (!folderName || !convId) {
            showToast('Hubo un error al intentar eliminar la conversación.', 'error');
            return;
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[folderName]) {
            storedFolders[folderName] = storedFolders[folderName].filter(conv => conv.id !== convId);
            await this.storage.saveFolders(storedFolders);
            showToast("Conversación eliminada.", 'success');
        } else {
            showToast("La carpeta especificada no existe.", 'error');
        }
    }

    getOpenFolderStates() {
        const openFolderStates = {};
        const foldersListUl = document.getElementById('folders-list-ul');
        if (foldersListUl) {
            foldersListUl.querySelectorAll('.gemini-folder-item').forEach(folderItem => {
                const folderName = folderItem.querySelector('.gemini-folder-title').dataset.folderName;
                const conversationsWrapper = folderItem.querySelector('.conversations-list-wrapper');
                if (conversationsWrapper && !conversationsWrapper.classList.contains('hidden')) {
                    openFolderStates[folderName] = true;
                }
            });
        }
        return openFolderStates;
    }

    async saveCurrentConversation(targetFolderName) {
        const url = window.location.href;
        const convId = extractRealConversationIdFromCurrentUrl();
        const convTitle = extractConversationTitle();

        if (!convId || !convTitle) {
            showToast("No se pudo obtener la información de la conversación actual.", 'error');
            return;
        }

        const storedFolders = await this.storage.getFolders();
        
        if (!storedFolders[targetFolderName]) {
             showToast(`La carpeta "${targetFolderName}" no existe.`, 'error');
             return;
        }

        const existingConversation = storedFolders[targetFolderName].find(c => c.id === convId);
        if (existingConversation) {
            showToast("Esta conversación ya está guardada en esta carpeta.", 'info');
            return;
        }

        storedFolders[targetFolderName].push({ id: convId, title: convTitle, url: url, timestamp: new Date().toLocaleString() });

        await this.storage.saveFolders(storedFolders);
        showToast(`Conversación guardada en la carpeta "${targetFolderName}".`, 'success');
    }

async findFolderForConversation(convId) {
        if (!convId) {
            return null;
        }

        try {
            // Verificamos si el runtime de chrome sigue activo antes de hacer la llamada.
            if (!chrome.runtime?.id) {
                console.warn("Gemini Organizer: Context invalidated, skipping folder check.");
                return null;
            }

            const storedFolders = await this.storage.getFolders();
            
            // Una segunda verificación por si el contexto se invalidó durante la llamada asíncrona.
            if (chrome.runtime.lastError) {
                console.warn("Gemini Organizer: Context invalidated during storage access.", chrome.runtime.lastError.message);
                return null;
            }

            for (const folderName in storedFolders) {
                const conversationExists = storedFolders[folderName].some(conv => conv.id === convId);
                if (conversationExists) {
                    return folderName;
                }
            }
            return null;
            
        } catch (error) {
            console.warn("Gemini Organizer: Could not check for folder (context likely invalidated).", error.message);
            return null; // En caso de error, simplemente no mostramos el indicador.
        }
    }

    setEventHandler(eventHandler) {
        this.eventHandler = eventHandler;
    }

    setDragAndDropHandler(dragAndDropHandler) {
        this.dragAndDropHandler = dragAndDropHandler;
    }
}