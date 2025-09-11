import UI from './ui.js';
import Storage from './storage.js';
import FolderManager from './folderManager.js';
import DragAndDrop from './dragAndDrop.js';
import EventHandler from './eventHandler.js';

class App {
    constructor() {
        this.ui = new UI();
        this.storage = new Storage('geminiConversations');
        this.folderManager = new FolderManager(this.storage, this.ui);
        this.dragAndDropHandler = new DragAndDrop(this.storage, this.folderManager);
        this.eventHandler = new EventHandler(this.ui, this.folderManager, this.dragAndDropHandler);

        this.folderManager.setEventHandler(this.eventHandler);
        this.folderManager.setDragAndDropHandler(this.dragAndDropHandler);

        this.observer = new MutationObserver(this.handleMutations.bind(this));
        
        chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
        
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }


    async init() {
        if (!document.getElementById('gemini-organizer-toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'gemini-organizer-toast-container';
            document.body.appendChild(toastContainer);
        }
        
        await this.initializeSync();

        window.requestIdleCallback(async () => {
            await this.ui.addToggleButton(this.eventHandler, this.folderManager);
            this.dragAndDropHandler.setupDraggableConversations();
            this.observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    async initializeSync() {
        const syncEnabled = await this.storage.getSyncEnabled();
        await this.storage.setStorageArea(syncEnabled ? 'sync' : 'local');
        await this.folderManager.loadAndDisplayFolders();

        const setupUI = async () => {
            // Esperamos a que el sidebar se inicialice si es necesario
            if (!this.ui.sidebar) {
                 await this.ui.initializeSidebar();
            }
            this.ui.updateSyncStatusIcon(syncEnabled);
            const optionsBtn = document.getElementById('open-options-btn');
            if (optionsBtn) {
                optionsBtn.addEventListener('click', () => {
                    chrome.runtime.sendMessage({ action: 'openOptionsPage' });
                });
            }
        };
        
        setTimeout(setupUI, 500);
    }

    async handleMutations() {
        const toggleButtonWrapper = document.getElementById('gemini-organizer-wrapper');
        if (!toggleButtonWrapper || !document.body.contains(toggleButtonWrapper)) {
            await this.ui.addToggleButton(this.eventHandler, this.folderManager);
            await this.initializeSync();
        }
        this.dragAndDropHandler.setupDraggableConversations();
    }

    handleStorageChange(changes, namespace) {
        if (namespace === 'sync' && (changes.syncEnabled || changes[this.storage.key])) {
            console.log('La configuración de Sync ha cambiado. Recargando la extensión...');
            this.initializeSync();
        } else if (namespace === 'local' && changes[this.storage.key]) {
            console.log('El almacenamiento local ha cambiado. Recargando las carpetas.');
            this.folderManager.loadAndDisplayFolders();
        }
    }

    handleMessage(request, sender, sendResponse) {
        if (request.action === "save_current_conversation_to_folder") {
            this.folderManager.saveCurrentConversation(request.folderName);
        }
    }
}

const app = new App();
app.init();