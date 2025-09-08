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
        
        // Nuevo: Oyente para mensajes del background script
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }

    init() {
        if (!document.getElementById('gemini-organizer-toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'gemini-organizer-toast-container';
            document.body.appendChild(toastContainer);
        }
        
        window.requestIdleCallback(() => {
            this.ui.addToggleButton(this.eventHandler, this.folderManager);
            this.dragAndDropHandler.setupDraggableConversations();
            this.observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    async initializeSync() {
        const syncEnabled = await this.storage.getSyncEnabled();
        this.storage.setStorageArea(syncEnabled ? 'sync' : 'local');
        
        // Actualizamos el interruptor en la UI
        const syncToggle = document.getElementById('sync-toggle-checkbox');
        if (syncToggle) {
            syncToggle.checked = syncEnabled;
            syncToggle.addEventListener('change', this.handleSyncToggle.bind(this));
        }

        // Cargamos las carpetas desde el área de almacenamiento correcta
        this.folderManager.loadAndDisplayFolders();
    }

    async handleSyncToggle(event) {
        const enabled = event.target.checked;
        await this.storage.setSyncEnabled(enabled);
        this.storage.setStorageArea(enabled ? 'sync' : 'local');

        showToast(`Sincronización ${enabled ? 'activada' : 'desactivada'}.`, 'info');
        
        // Advertencia: Cambiar esto no migra los datos automáticamente.
        // Debo implementar una migración, pero por ahora solo recargamos.
        showToast('Recargando carpetas desde la nueva ubicación.', 'info');
        this.folderManager.loadAndDisplayFolders(); // Recargamos las carpetas
    }

    handleMutations() {
        const toggleButtonWrapper = document.getElementById('gemini-organizer-wrapper');
        if (!toggleButtonWrapper || !document.body.contains(toggleButtonWrapper)) {
            this.ui.addToggleButton(this.eventHandler, this.folderManager);
            this.initializeSync(); // Re-inicializamos si el botón se recrea
        }
        this.dragAndDropHandler.setupDraggableConversations();
    }

    handleStorageChange(changes, namespace) {
        if (namespace === 'local' && changes[this.storage.key]) {
            console.log('El almacenamiento ha cambiado. Recargando las carpetas para mantener la sincronización.');
            this.folderManager.loadAndDisplayFolders();
        }
    }

    handleMessage(request, sender, sendResponse) {
        // Nuevo: la acción ahora incluye el nombre de la carpeta
        if (request.action === "save_current_conversation_to_folder") {
            this.folderManager.saveCurrentConversation(request.folderName);
        }
    }
}