// Importamos la clase Storage desde el archivo correspondiente.
import Storage from '../src/scripts/storage.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        // La clave 'geminiConversations' ahora se pasa al crear la instancia
        const storage = new Storage('geminiConversations'); 
        const syncToggle = document.getElementById('sync-toggle-checkbox');
        const statusMessage = document.getElementById('status-message');
        const versionElement = document.getElementById('extension-version');

        // --- Lógica para guardar y restaurar opciones ---
        const saveOptions = async () => {
            try {
                const syncEnabled = syncToggle.checked;
                await storage.setSyncEnabled(syncEnabled);
                
                statusMessage.textContent = '¡Configuración guardada!';
                statusMessage.classList.add('show');
                setTimeout(() => {
                    statusMessage.classList.remove('show');
                }, 2000);
            } catch (error) {
                console.error('Error al guardar las opciones:', error);
            }
        };

        const restoreOptions = async () => {
            try {
                if (!syncToggle) {
                    console.error('El elemento del interruptor de sincronización no fue encontrado.');
                    return;
                }
                const syncEnabled = await storage.getSyncEnabled();
                syncToggle.checked = syncEnabled;
            } catch (error) {
                console.error('Error al restaurar las opciones:', error);
            }
        };
        
        if (syncToggle) {
            syncToggle.addEventListener('change', saveOptions);
        }
        restoreOptions();

        // --- Lógica para mostrar la versión ---
        const displayVersion = () => {
            try {
                if (!versionElement) {
                    console.error('El elemento para mostrar la versión no fue encontrado.');
                    return;
                }
                const manifest = chrome.runtime.getManifest();
                const version = manifest.version;
                versionElement.textContent = `Versión instalada: ${version}`;
            } catch (error) {
                console.error('Error al mostrar la versión:', error);
                if (versionElement) {
                    versionElement.textContent = 'Error al cargar la versión.';
                }
            }
        };

        displayVersion();

    } catch (error) {
        console.error('Ocurrió un error general en el script de opciones:', error);
        const versionElement = document.getElementById('extension-version');
        if (versionElement) {
            versionElement.textContent = 'Error al cargar el script.';
        }
    }
});