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
        
        // Escuchamos cambios en la configuración de sync para recargar si es necesario.
        chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
        
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }


    async init() {
        // 1. Añadimos el contenedor de notificaciones
        if (!document.getElementById('gemini-organizer-toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'gemini-organizer-toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // 2. Esperamos a que la configuración de sync esté lista
        await this.initializeSync();

        // 3. Una vez configurado el storage, añadimos los botones y cargamos las carpetas
        window.requestIdleCallback(() => {
            this.ui.addToggleButton(this.eventHandler, this.folderManager);
            this.dragAndDropHandler.setupDraggableConversations();
            this.observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    async initializeSync() {
        const syncEnabled = await this.storage.getSyncEnabled();
        await this.storage.setStorageArea(syncEnabled ? 'sync' : 'local');

        // La carga de carpetas se llama aquí, DESPUÉS de configurar el storage.
        await this.folderManager.loadAndDisplayFolders();

        // Configuramos el listener para el botón de opciones
        const setupOptionsButton = () => {
            const optionsBtn = document.getElementById('open-options-btn');
            if (optionsBtn) {
                optionsBtn.addEventListener('click', () => {
                    chrome.runtime.sendMessage({ action: 'openOptionsPage' });
                });
            }
        };
        // Esperamos un poco a que la UI se renderice para añadir el listener
        setTimeout(setupOptionsButton, 500);
    }

    handleMutations() {
        const toggleButtonWrapper = document.getElementById('gemini-organizer-wrapper');
        if (!toggleButtonWrapper || !document.body.contains(toggleButtonWrapper)) {
            this.ui.addToggleButton(this.eventHandler, this.folderManager);
            this.initializeSync();
        }
        this.dragAndDropHandler.setupDraggableConversations();
    }

    handleStorageChange(changes, namespace) {
        // Si cambia la configuración de sync O las carpetas en sync, recargamos todo
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

// Inicializamos la aplicación
const app = new App();
app.init();