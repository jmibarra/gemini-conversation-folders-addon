// Importa los módulos necesarios
import { getActiveConversationId } from './utils.js';
import UI from './ui.js';
import Storage from './storage.js';
import FolderManager from './folderManager.js';
import DragAndDrop from './dragAndDrop.js';
import EventHandler from './eventHandler.js';

if (window.geminiOrganizerAppInstance) {
    console.warn("Gemini Organizer: Intento de re-inicialización bloqueado. La instancia ya existe.");
} else {

    /**
     * Clase principal de la aplicación que inicializa y coordina todos los módulos.
     */
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

            this.lastUrl = window.location.href;
            this.isHandlingMutations = false; // Flag para evitar bucles en el observer
        }

        /**
         * Inicializa la aplicación.
         */
        async init() {
            // Asegura que el contenedor de notificaciones (toast) exista
            if (!document.getElementById('gemini-organizer-toast-container')) {
                const toastContainer = document.createElement('div');
                toastContainer.id = 'gemini-organizer-toast-container';
                document.body.appendChild(toastContainer);
            }
            
            // Configura el área de almacenamiento (sync o local) y carga las carpetas
            await this.initializeSync();

            // Muestra el indicador de carpeta para la conversación actual (si existe)
            await this.updateFolderIndicator(); 

            // Espera a que la página esté inactiva para añadir la UI principal
            window.requestIdleCallback(async () => {
                await this.ui.addToggleButton(this.eventHandler, this.folderManager);
                this.dragAndDropHandler.setupDraggableConversations();
                // Inicia el observador para detectar cambios en la UI de Gemini
                this.observer.observe(document.body, { childList: true, subtree: true });
            });
        }

        /**
         * Configura el almacenamiento (sync/local) y carga/renderiza las carpetas.
         */
        async initializeSync() {
            const syncEnabled = await this.storage.getSyncEnabled();
            await this.storage.setStorageArea(syncEnabled ? 'sync' : 'local');
            await this.folderManager.loadAndDisplayFolders();

            // Retrasa la configuración de la UI del sidebar para asegurar que el DOM esté listo
            const setupUI = async () => {
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

        /**
         * Maneja las mutaciones del DOM para re-inyectar la UI si Gemini la elimina
         * y para actualizar el estado de "guardado" de las conversaciones.
         */
        async handleMutations() {
            if (this.isHandlingMutations) return;
            this.isHandlingMutations = true;
            
            // Desconectamos el observador temporalmente mientras hacemos nuestros propios cambios.
            this.observer.disconnect();

            try {
                // Comprueba si nuestro botón principal sigue en el DOM
                const toggleButtonWrapper = document.getElementById('gemini-organizer-wrapper');
                if (!toggleButtonWrapper || !document.body.contains(toggleButtonWrapper)) {
                    // Si no está, Gemini ha refrescado la UI. Lo re-inyectamos todo.
                    await this.ui.addToggleButton(this.eventHandler, this.folderManager);
                    await this.initializeSync(); // Esto recarga las carpetas
                }
                
                // Actualiza los listeners de arrastrar y soltar y los iconos de "guardado"
                this.dragAndDropHandler.setupDraggableConversations();

                // Comprueba si la URL ha cambiado (navegación SPA)
                if (window.location.href !== this.lastUrl) {
                    this.lastUrl = window.location.href;
                    // Actualiza el indicador de carpeta para la nueva conversación
                    await this.updateFolderIndicator();
                }

            } catch (error) {
                console.error("Error en handleMutations:", error);
            } finally {
                // Volvemos a conectar el observador para detectar futuros cambios de Gemini
                this.observer.observe(document.body, { childList: true, subtree: true });
                this.isHandlingMutations = false;
            }
        }

        /**
         * Actualiza el indicador que muestra si la conversación actual está en una carpeta.
         */
        async updateFolderIndicator() {
            try {
                const currentConvId = getActiveConversationId();
                const folderName = await this.folderManager.findFolderForConversation(currentConvId);
                await this.ui.displayFolderIndicator(folderName);
            } catch (error) {
                console.error('Error al actualizar el indicador de carpeta:', error);
                this.ui.displayFolderIndicator(null);
            }
        }

        /**
         * Escucha cambios en el almacenamiento (local o sync).
         */
        handleStorageChange(changes, namespace) {
            // Si la configuración de sync cambia, o los datos de sync cambian
            if (namespace === 'sync' && (changes.syncEnabled || changes[this.storage.key])) {
                console.log('La configuración de Sync ha cambiado. Recargando la extensión...');
                this.initializeSync();
            } 
            // Si los datos locales cambian (y sync está deshabilitado)
            else if (namespace === 'local' && changes[this.storage.key]) {
                console.log('El almacenamiento local ha cambiado. Recargando las carpetas.');
                this.folderManager.loadAndDisplayFolders();
            }
        }

        /**
         * Maneja mensajes de otras partes de la extensión (como el menú contextual).
         */
        handleMessage(request, sender, sendResponse) {
            if (request.action === "save_current_conversation_to_folder") {
                this.folderManager.saveCurrentConversation(request.folderName);
            }
            // Indica que la respuesta puede ser asíncrona (aunque aquí no lo sea, es buena práctica)
            return true; 
        }
    }
    // Crea y almacena la instancia única en el objeto window
    window.geminiOrganizerAppInstance = new App();
    window.geminiOrganizerAppInstance.init();

}