// Importamos la clase Storage desde el archivo correspondiente.
import Storage from '../src/scripts/storage.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        const storageKey = 'geminiConversations';
        const syncToggle = document.getElementById('sync-toggle-checkbox');
        const statusMessage = document.getElementById('status-message');
        const versionElement = document.getElementById('extension-version');
        
        // --- Nuevos elementos para Importar/Exportar ---
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
        const importFileInput = document.getElementById('import-file-input');

        /**
         * Muestra un mensaje temporal en la parte inferior de la pantalla.
         * @param {string} message - El texto a mostrar.
         * @param {string} type - 'success' o 'error' para el estilo (opcional).
         */
        const showStatus = (message, type = 'success') => {
            statusMessage.textContent = message;
            statusMessage.className = `show ${type}`;
            setTimeout(() => {
                statusMessage.classList.remove('show');
            }, 3000);
        };

        /**
         * Obtiene una instancia de Storage ya configurada (sync o local)
         * según la preferencia del usuario.
         */
        const getStorageInstance = async () => {
            const storage = new Storage(storageKey);
            const syncEnabled = await storage.getSyncEnabled();
            await storage.setStorageArea(syncEnabled ? 'sync' : 'local');
            return storage;
        };

        // --- Lógica para guardar y restaurar opciones ---
        const saveOptions = async () => {
            try {
                const syncEnabled = syncToggle.checked;
                // Usamos una instancia temporal solo para guardar esta configuración
                const tempStorage = new Storage(storageKey);
                await tempStorage.setSyncEnabled(syncEnabled);
                
                showStatus('¡Configuración guardada!');
            } catch (error) {
                console.error('Error al guardar las opciones:', error);
                showStatus('Error al guardar la configuración.', 'error');
            }
        };

        const restoreOptions = async () => {
            try {
                if (!syncToggle) {
                    console.error('El elemento del interruptor de sincronización no fue encontrado.');
                    return;
                }
                // Usamos una instancia temporal solo para leer esta configuración
                const tempStorage = new Storage(storageKey);
                const syncEnabled = await tempStorage.getSyncEnabled();
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

        // --- Lógica de Exportación ---
        const handleExport = async () => {
            try {
                const storage = await getStorageInstance();
                const folders = await storage.getFolders();
                const dataStr = JSON.stringify(folders, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gemini_organizer_backup.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showStatus('Datos exportados exitosamente.', 'success');
            } catch (error) {
                console.error('Error al exportar los datos:', error);
                showStatus('Error al exportar los datos.', 'error');
            }
        };

        // --- Lógica de Importación ---
        const handleFileSelect = (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }
            if (file.type !== 'application/json') {
                showStatus('Por favor, selecciona un archivo .json válido.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedFolders = JSON.parse(e.target.result);
                    // Aquí llamamos a la función de fusión
                    mergeData(importedFolders);
                } catch (error) {
                    console.error('Error al parsear el archivo JSON:', error);
                    showStatus('El archivo está dañado o no es un JSON válido.', 'error');
                }
            };
            reader.onerror = () => {
                showStatus('Error al leer el archivo.', 'error');
            };
            reader.readAsText(file);

            // Resetea el input para permitir importar el mismo archivo de nuevo
            event.target.value = null;
        };

        /**
         * Fusiona o sobrescribe los datos de las carpetas existentes con los importados.
         * @param {object} importedFolders - El objeto de carpetas parseado del archivo JSON.
         */
        const mergeData = async (importedFolders) => {
            if (typeof importedFolders !== 'object' || Array.isArray(importedFolders)) {
                showStatus('El archivo JSON no tiene el formato de carpetas esperado.', 'error');
                return;
            }

            const overwrite = confirm(
                "¿Deseas sobrescribir tus carpetas actuales?\n\n" +
                "· OK (Aceptar) = Reemplazar todo.\n" +
                "· Cancelar = Fusionar (combinar carpetas y conversaciones)."
            );

            try {
                const storage = await getStorageInstance();
                let finalFolders = {};

                if (overwrite) {
                    // --- Modo Sobrescribir ---
                    finalFolders = importedFolders;
                    showStatus('Datos sobrescritos exitosamente.', 'success');

                } else {
                    // --- Modo Fusión (Merge) ---
                    const currentFolders = await storage.getFolders();
                    finalFolders = { ...currentFolders }; // Empezamos con las carpetas actuales

                    for (const folderName in importedFolders) {
                        if (!importedFolders.hasOwnProperty(folderName)) continue;

                        const importedConversations = importedFolders[folderName];
                        if (!Array.isArray(importedConversations)) continue; // Ignorar si no es un array

                        if (!finalFolders[folderName]) {
                            // La carpeta no existe, la añadimos
                            finalFolders[folderName] = importedConversations;
                        } else {
                            // La carpeta existe, fusionamos conversaciones
                            const existingConvIds = new Set(finalFolders[folderName].map(conv => conv.id));
                            importedConversations.forEach(importedConv => {
                                if (importedConv && importedConv.id && !existingConvIds.has(importedConv.id)) {
                                    finalFolders[folderName].push(importedConv);
                                }
                            });
                        }
                    }
                    showStatus('Datos fusionados exitosamente.', 'success');
                }

                await storage.saveFolders(finalFolders);

            } catch (error) {
                console.error('Error al importar/fusionar datos:', error);
                showStatus('Ocurrió un error al guardar los datos importados.', 'error');
            }
        };

        // Asignar los nuevos listeners
        if (exportBtn) {
            exportBtn.addEventListener('click', handleExport);
        }
        if (importBtn) {
            importBtn.addEventListener('click', () => importFileInput.click());
        }
        if (importFileInput) {
            importFileInput.addEventListener('change', handleFileSelect);
        }

    } catch (error) {
        console.error('Ocurrió un error general en el script de opciones:', error);
        const versionElement = document.getElementById('extension-version');
        if (versionElement) {
            versionElement.textContent = 'Error al cargar el script.';
        }
    }
});