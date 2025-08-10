class Storage {
    constructor(key) {
        this.key = key;
    }

    async getFolders() {
        const data = await chrome.storage.local.get(this.key);
        return data[this.key] || {};
    }

    async saveFolders(folders) {
        return chrome.storage.local.set({ [this.key]: folders });
    }
}
