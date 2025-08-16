// Variable para almacenar el ID del menú principal de carpetas
let parentFolderMenuId = null;

async function createFolderMenus() {
    // Si ya existe, lo eliminamos para recrearlo con la lista actualizada
    if (parentFolderMenuId) {
        chrome.contextMenus.remove(parentFolderMenuId);
    }

    // Crea el menú padre
    parentFolderMenuId = chrome.contextMenus.create({
        id: "saveToFolderParent",
        title: "Guardar en carpeta",
        contexts: ["page"],
        documentUrlPatterns: ["https://gemini.google.com/*"]
    });

    const storedFolders = await chrome.storage.local.get("geminiConversations");
    const folders = storedFolders.geminiConversations || {};

    const folderNames = Object.keys(folders).sort();

    if (folderNames.length > 0) {
        // Itera sobre las carpetas para crear submenús
        folderNames.forEach(folderName => {
            chrome.contextMenus.create({
                id: `save-to-folder-${folderName}`,
                title: folderName,
                parentId: parentFolderMenuId,
                contexts: ["page"],
            });
        });
    } else {
        // Crea una opción para cuando no hay carpetas
        chrome.contextMenus.create({
            id: "noFolders",
            title: "No hay carpetas creadas",
            parentId: parentFolderMenuId,
            contexts: ["page"],
            enabled: false // Deshabilita la opción
        });
    }
}

// Al instalar/actualizar, creamos los menús
chrome.runtime.onInstalled.addListener(() => {
    createFolderMenus();
});

// Listener para los clics en el menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
    // Verifica si el clic fue en un submenú de carpeta
    if (info.menuItemId.startsWith("save-to-folder-")) {
        const folderName = info.menuItemId.replace("save-to-folder-", "");
        // Envía un mensaje al script de contenido con el nombre de la carpeta
        chrome.tabs.sendMessage(tab.id, { action: "save_current_conversation_to_folder", folderName: folderName });
    }
});

// Escuchamos los cambios en el almacenamiento para actualizar los menús
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.geminiConversations) {
        createFolderMenus();
    }
});