import { showToast,extractRealConversationIdFromCurrentUrl,extractConversationTitle } from '../utils.js';

export default class FolderManager {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
    }

    async loadAndDisplayFolders() {
        const openFolderStates = this.ui.getOpenFolderStates();
        const folders = await this.storage.getFolders();
        this.ui.renderFolders(folders, openFolderStates, this.eventHandler, this.dragAndDropHandler);
    }

    async createFolder(folderName) {
        if (!folderName) {
            throw new Error("El nombre de la carpeta no puede estar vacío.");
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[folderName]) {
            throw new Error(`La carpeta "${folderName}" ya existe.`);
        }

        storedFolders[folderName] = [];
        await this.storage.saveFolders(storedFolders);
        return true;
    }

    async renameFolder(originalFolderName, newFolderName) {
        if (!newFolderName) {
             throw new Error("El nombre de la carpeta no puede estar vacío.");
        }

        if (newFolderName === originalFolderName) {
            return false; // No changes needed
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[newFolderName]) {
             throw new Error(`Ya existe una carpeta con el nombre "${newFolderName}".`);
        }

        const folderContent = storedFolders[originalFolderName];
        if (!folderContent) {
             throw new Error(`La carpeta original "${originalFolderName}" no existe.`);
        }

        delete storedFolders[originalFolderName];
        storedFolders[newFolderName] = folderContent;

        await this.storage.saveFolders(storedFolders);
        return true;
    }

    async deleteFolder(folderName) {
        if (!folderName) {
            throw new Error('Hubo un error al intentar eliminar la carpeta.');
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[folderName]) {
            delete storedFolders[folderName];
            await this.storage.saveFolders(storedFolders);
            return true;
        } else {
            throw new Error("La carpeta especificada no existe.");
        }
    }

    async deleteConversation(folderName, convId) {
        if (!folderName || !convId) {
            throw new Error('Hubo un error al intentar eliminar la conversación.');
        }

        const storedFolders = await this.storage.getFolders();

        if (storedFolders[folderName]) {
            storedFolders[folderName] = storedFolders[folderName].filter(conv => conv.id !== convId);
            await this.storage.saveFolders(storedFolders);
            return true;
        } else {
             throw new Error("La carpeta especificada no existe.");
        }
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



    setDragAndDropHandler(dragAndDropHandler) {
        this.dragAndDropHandler = dragAndDropHandler;
    }
}