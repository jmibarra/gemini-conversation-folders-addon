export default class  Storage {
    constructor(key) {
        this.key = key;
        this.storageArea = null; 
    }

/**
     * Establece el área de almacenamiento y devuelve la instancia para encadenar.
     * @param {string} area - 'local' o 'sync'.
     */
    async setStorageArea(area) {
        this.storageArea = (area === 'sync') ? chrome.storage.sync : chrome.storage.local;
        console.log(`Área de almacenamiento establecida en: ${this.storageArea === chrome.storage.sync ? 'sync' : 'local'}`);
        return this; // Devolvemos la instancia
    }

    async getFolders() {
        // Usamos la propiedad dinámica 'storageArea'
        const data = await this.storageArea.get(this.key);
        return data[this.key] || {};
    }

    async saveFolders(folders) {
        // Usamos la propiedad dinámica 'storageArea'
        return this.storageArea.set({ [this.key]: folders });
    }

    /**
     * Obtiene la configuración de sincronización del usuario.
     * @returns {Promise<boolean>} - true si la sincronización está habilitada, false en caso contrario.
     */
    async getSyncEnabled() {
        const data = await chrome.storage.sync.get('syncEnabled');
        return data.syncEnabled || false;
    }

    /**
     * Guarda la configuración de sincronización del usuario.
     * @param {boolean} enabled - El estado de la sincronización.
     */
    async setSyncEnabled(enabled) {
        return chrome.storage.sync.set({ syncEnabled: enabled });
    }
}