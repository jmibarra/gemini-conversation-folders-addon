let parentFolderMenuId = null;

async function createFolderMenus() {
    if (parentFolderMenuId) {
        try {
            await chrome.contextMenus.remove(parentFolderMenuId);
        } catch (e) {
        }
    }
    parentFolderMenuId = null;

    // Crea el menú padre
    parentFolderMenuId = chrome.contextMenus.create({
        id: "saveToFolderParent",
        title: "Guardar en carpeta",
        contexts: ["page"],
        documentUrlPatterns: ["https://gemini.google.com/*"]
    });

    const syncPrefs = await chrome.storage.sync.get('syncEnabled');
    const storageArea = syncPrefs.syncEnabled ? chrome.storage.sync : chrome.storage.local;

    const storedData = await storageArea.get("geminiConversations");
    const folders = storedData.geminiConversations || {};
    const folderNames = Object.keys(folders).sort();

    if (folderNames.length > 0) {
        folderNames.forEach(folderName => {
            chrome.contextMenus.create({
                id: `save-to-folder-${folderName}`,
                title: folderName,
                parentId: parentFolderMenuId,
                contexts: ["page"],
            });
        });
    } else {
        chrome.contextMenus.create({
            id: "noFolders",
            title: "No hay carpetas creadas",
            parentId: parentFolderMenuId,
            contexts: ["page"],
            enabled: false
        });
    }
}

chrome.runtime.onInstalled.addListener(() => {
    createFolderMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId.startsWith("save-to-folder-")) {
        const folderName = info.menuItemId.replace("save-to-folder-", "");
        chrome.tabs.sendMessage(tab.id, { action: "save_current_conversation_to_folder", folderName: folderName });
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.geminiConversations) {
        console.log('Storage changed, updating context menus.');
        createFolderMenus();
    }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
    }
    return true;
});