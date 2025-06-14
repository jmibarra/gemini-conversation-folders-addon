// ID único para el contenedor de nuestro complemento
const SIDEBAR_ID = 'gemini-organizer-sidebar';
const STORAGE_KEY = 'geminiConversations';
const TOGGLE_BUTTON_ID = 'gemini-organizer-toggle-btn';
const TOGGLE_BUTTON_WRAPPER_ID = 'gemini-organizer-wrapper';

// Función para inicializar la interfaz del complemento
function initializeSidebar() {
    let sidebar = document.getElementById(SIDEBAR_ID);
    if (!sidebar) {
        sidebar = document.createElement('div');
        sidebar.id = SIDEBAR_ID;
        sidebar.classList.add('hidden');
        sidebar.innerHTML = `
            <div class="folder-controls">
                <h4>Crear Nueva Carpeta</h4>
                <input type="text" id="new-folder-name" placeholder="Nombre de la carpeta">
                <button id="create-folder-btn">Crear</button>
            </div>
            <div class="search-controls">
                <h4>Buscar Conversaciones</h4>
                <input type="search" id="search-conversations-input" placeholder="Buscar por nombre de carpeta o conversación...">
            </div>
            <div class="folders-list">
                <h4 class="title gds-label-l" style="margin-left: 16px; margin-bottom: 10px;">Tus Carpetas Guardadas</h4>
                <ul id="folders-list-ul">
                    </ul>
            </div>
            <div id="gemini-organizer-toast-container"></div> `;
    }
    return sidebar;
}

// Función para agregar el botón de invocación y adjuntar/configurar el sidebar
function addToggleButton() {
    const discoverGemsButtonWrapper = document.querySelector('side-nav-action-button[data-test-id="manage-instructions-control"]');

    if (discoverGemsButtonWrapper) {
        let ourButtonWrapper = document.getElementById(TOGGLE_BUTTON_WRAPPER_ID);
        let button = document.getElementById(TOGGLE_BUTTON_ID);
        let sidebar = document.getElementById(SIDEBAR_ID);

        if (!ourButtonWrapper) {
            ourButtonWrapper = document.createElement('side-nav-action-button');
            ourButtonWrapper.id = TOGGLE_BUTTON_WRAPPER_ID;
            ourButtonWrapper.setAttribute('icon', 'folder_open');
            ourButtonWrapper.setAttribute('arialabel', 'Organizador de Conversaciones');
            ourButtonWrapper.setAttribute('data-test-id', 'gemini-organizer-button');
            ourButtonWrapper.classList.add('mat-mdc-tooltip-trigger', 'ia-redesign', 'ng-star-inserted');

            button = document.createElement('button');
            button.id = TOGGLE_BUTTON_ID;
            button.classList.add(
                'mat-mdc-list-item', 'mdc-list-item', 'side-nav-action-button',
                'explicit-gmat-override', 'mat-mdc-list-item-interactive',
                'mdc-list-item--with-leading-icon', 'mat-mdc-list-item-single-line',
                'mdc-list-item--with-one-line', 'ng-star-inserted'
            );
            button.type = 'button';
            button.setAttribute('aria-label', 'Organizador de Conversaciones');
            button.setAttribute('aria-disabled', 'false');

            button.innerHTML = `
                <div matlistitemicon="" class="mat-mdc-list-item-icon icon-container mdc-list-item__start" style="margin-left: 0px;margin-right: 0px;">
                    <mat-icon role="img" class="mat-icon notranslate gds-icon-l google-symbols mat-ligature-font mat-icon-no-color ng-star-inserted" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="folder_open" fonticon="folder_open"></mat-icon>
                </div>
                <span class="mdc-list-item__content">
                    <span class="mat-mdc-list-item-unscoped-content mdc-list-item__primary-text">
                        <span data-test-id="side-nav-action-button-content" class="gds-body-m">Organizador de Conversaciones</span>
                    </span>
                </span>
                <div class="mat-focus-indicator"></div>
            `;

            ourButtonWrapper.appendChild(button);
            discoverGemsButtonWrapper.after(ourButtonWrapper);
        }

        if (!sidebar) {
            sidebar = initializeSidebar();
        }
        if (sidebar && !ourButtonWrapper.contains(sidebar)) {
            ourButtonWrapper.appendChild(sidebar);

            const createFolderBtn = document.getElementById('create-folder-btn');
            const saveConversationBtn = document.getElementById('save-conversation-btn');

            if (createFolderBtn && !createFolderBtn.hasAttribute('data-listener-attached')) {
                createFolderBtn.addEventListener('click', createFolder);
                createFolderBtn.setAttribute('data-listener-attached', 'true');
            }

            if (saveConversationBtn && !saveConversationBtn.hasAttribute('data-listener-attached')) {
                saveConversationBtn.addEventListener('click', saveCurrentConversation);
                saveConversationBtn.setAttribute('data-listener-attached', 'true');
            }

            if (!sidebar.hasAttribute('data-loaded-once')) {
                loadAndDisplayFolders();
                sidebar.setAttribute('data-loaded-once', 'true');
            }

            const searchInput = document.getElementById('search-conversations-input');
            if (searchInput && !searchInput.hasAttribute('data-listener-attached')) {
                searchInput.addEventListener('input', filterConversationsAndFolders);
                searchInput.setAttribute('data-listener-attached', 'true');
            }
        }
        if (button && !button.hasAttribute('data-listener-attached')) {
             button.addEventListener('click', toggleSidebarVisibility);
             button.setAttribute('data-listener-attached', 'true');
        }

    } else {
        console.warn('No se pudo encontrar el lugar para insertar el botón "Organizador" en la barra lateral de Gemini. Selector usado: side-nav-action-button[data-test-id="manage-instructions-control"]');
    }
}

function toggleSidebarVisibility() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

// Función para cargar y mostrar las carpetas y conversaciones (actualizada para usar ID de Gemini)
async function loadAndDisplayFolders() {
    const foldersListUl = document.getElementById('folders-list-ul');

    // PASO 1: Capturar el estado actual de las carpetas abiertas antes de limpiar el DOM
    const openFolderStates = {};
    foldersListUl.querySelectorAll('.gemini-folder-item').forEach(folderItem => {
        const folderName = folderItem.querySelector('.gemini-folder-title').dataset.folderName;
        const conversationsWrapper = folderItem.querySelector('.conversations-list-wrapper');
        if (conversationsWrapper && !conversationsWrapper.classList.contains('hidden')) {
            openFolderStates[folderName] = true;
        }
    });


    foldersListUl.innerHTML = ''; // Limpiar la lista actual

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    const sortedFolderNames = Object.keys(storedFolders).sort();

    for (const folderName of sortedFolderNames) {
        const folderContainer = document.createElement('li');
        folderContainer.classList.add('gemini-folder-item');

        const folderHeader = document.createElement('div');
        folderHeader.classList.add('title-container');
        folderHeader.setAttribute('role', 'button');
        folderHeader.setAttribute('tabindex', '0');

        folderHeader.addEventListener('dragover', handleDragOver);
        folderHeader.addEventListener('dragleave', handleDragLeave);
        folderHeader.addEventListener('drop', handleDrop);
        folderHeader.dataset.folderName = folderName;

        const folderTitle = document.createElement('span');
        folderTitle.classList.add('title', 'gds-label-l', 'gemini-folder-title');
        folderTitle.textContent = folderName;
        folderTitle.dataset.folderName = folderName;

        const expandIcon = document.createElement('mat-icon');
        expandIcon.classList.add('mat-icon', 'notranslate', 'gds-icon-l', 'google-symbols', 'mat-ligature-font', 'mat-icon-no-color', 'gemini-expand-icon');
        expandIcon.setAttribute('role', 'img');
        expandIcon.setAttribute('aria-hidden', 'true');
        expandIcon.setAttribute('data-mat-icon-type', 'font');
        expandIcon.setAttribute('data-mat-icon-name', 'expand_more');
        expandIcon.setAttribute('fonticon', 'expand_more');

        const deleteFolderButton = document.createElement('button');
        deleteFolderButton.classList.add('delete-folder-btn');
        deleteFolderButton.innerHTML = `<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="delete" fonticon="delete"></mat-icon>`;
        deleteFolderButton.title = `Eliminar carpeta: "${folderName}"`;
        deleteFolderButton.dataset.folderName = folderName;

        const editFolderButton = document.createElement('button');
        editFolderButton.classList.add('edit-folder-btn');
        editFolderButton.innerHTML = `<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="edit" fonticon="edit"></mat-icon>`;
        editFolderButton.title = `Renombrar carpeta: "${folderName}"`;
        editFolderButton.dataset.folderName = folderName;

        folderHeader.appendChild(folderTitle);
        folderHeader.appendChild(editFolderButton);
        folderHeader.appendChild(deleteFolderButton);
        folderHeader.appendChild(expandIcon);

        const conversationsWrapper = document.createElement('div');
        conversationsWrapper.classList.add('conversations-list-wrapper'); // No añadir 'hidden' por defecto aquí

        const conversationsUl = document.createElement('ul');
        conversationsUl.classList.add('conversation-items-container', 'side-nav-opened');

        conversationsUl.addEventListener('dragover', handleConversationListDragOver);
        conversationsUl.addEventListener('drop', handleConversationListDrop);
        conversationsUl.dataset.folderName = folderName;


        storedFolders[folderName].forEach((conv, index) => {
            const convItem = document.createElement('li');
            convItem.classList.add('conversation-item-wrapper');
            convItem.setAttribute('draggable', 'true');
            convItem.dataset.folderName = folderName;
            convItem.dataset.convId = conv.id;
            convItem.dataset.convTitle = conv.title;
            convItem.dataset.convUrl = conv.url;
            convItem.dataset.originalIndex = index;
            convItem.addEventListener('dragstart', handleDragStart);
            convItem.addEventListener('dragend', (event) => {
                event.target.classList.remove('is-dragging');
            });


            const convContentFlex = document.createElement('div');
            convContentFlex.classList.add('conversation-item-content');

            const convTitle = document.createElement('div');
            convTitle.classList.add('conversation-title', 'gds-body-m');
            convTitle.textContent = conv.title;
            convTitle.dataset.folderName = folderName;
            convTitle.dataset.convId = conv.id;
            convTitle.style.flexGrow = '1';
            convTitle.style.cursor = 'pointer';
            convTitle.title = conv.title;

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-conversation-btn');
            deleteButton.innerHTML = `<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="delete" fonticon="delete"></mat-icon>`;
            deleteButton.title = `Eliminar conversación: "${conv.title}"`;
            deleteButton.dataset.folderName = folderName;
            deleteButton.dataset.convId = conv.id;

            convContentFlex.appendChild(convTitle);
            convContentFlex.appendChild(deleteButton);

            convItem.appendChild(convContentFlex);

            convTitle.addEventListener('click', openGeminiChat);
            deleteButton.addEventListener('click', deleteConversation);

            conversationsUl.appendChild(convItem);
        });

        conversationsWrapper.appendChild(conversationsUl);

        folderContainer.appendChild(folderHeader);
        folderContainer.appendChild(conversationsWrapper);

        foldersListUl.appendChild(folderContainer);

        editFolderButton.addEventListener('click', (event) => {
            event.stopPropagation();
            enableFolderEditMode(event.currentTarget.dataset.folderName, folderTitle, deleteFolderButton, editFolderButton, expandIcon);
        });

        deleteFolderButton.addEventListener('click', deleteFolder);

        folderHeader.addEventListener('click', (event) => {
            conversationsWrapper.classList.toggle('hidden');
            if (conversationsWrapper.classList.contains('hidden')) {
                expandIcon.setAttribute('fonticon', 'expand_more');
                expandIcon.setAttribute('data-mat-icon-name', 'expand_more');
            } else {
                expandIcon.setAttribute('fonticon', 'expand_less');
                expandIcon.setAttribute('data-mat-icon-name', 'expand_less');
            }
        });

        // PASO 2: Restaurar el estado de apertura/cierre
        if (!openFolderStates[folderName]) { // Si no estaba abierta (o no se encontró su estado)
            conversationsWrapper.classList.add('hidden'); // Ocultar
            expandIcon.setAttribute('fonticon', 'expand_more'); // Y poner icono de "expandir"
            expandIcon.setAttribute('data-mat-icon-name', 'expand_more');
        } else { // Si sí estaba abierta
            conversationsWrapper.classList.remove('hidden'); // Asegurarse de que esté visible
            expandIcon.setAttribute('fonticon', 'expand_less'); // Y poner icono de "colapsar"
            expandIcon.setAttribute('data-mat-icon-name', 'expand_less');
        }
    }
}

// Función para crear una nueva carpeta
async function createFolder() {
    const newFolderNameInput = document.getElementById('new-folder-name');
    const folderName = newFolderNameInput.value.trim();

    if (folderName) {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        const storedFolders = data[STORAGE_KEY] || {};

        if (!storedFolders[folderName]) {
            storedFolders[folderName] = [];
            await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
            newFolderNameInput.value = '';
            loadAndDisplayFolders();
            showToast(`Carpeta "${folderName}" creada exitosamente.`, 'success');
        } else {
            showToast(`La carpeta "${folderName}" ya existe.`, 'warning');
        }
    } else {
        showToast("Por favor, ingresa un nombre para la carpeta.", 'warning');
    }
}

// NUEVO: Función para habilitar el modo de edición de una carpeta
function enableFolderEditMode(folderName, folderTitleElement, deleteBtn, editBtn, expandIcon) {
    const originalFolderName = folderName; // Guardamos el nombre original
    folderTitleElement.style.display = 'none'; // Ocultar el span del título
    deleteBtn.style.display = 'none'; // Ocultar el botón de eliminar durante la edición
    editBtn.style.display = 'none'; // Ocultar el botón de editar
    expandIcon.style.display = 'none'; // Ocultar el icono de expandir

    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.value = originalFolderName;
    inputField.classList.add('folder-rename-input');
    inputField.dataset.originalFolderName = originalFolderName; // Guardar el nombre original
    inputField.dataset.folderTitleElementId = folderTitleElement.id || `temp-folder-title-${Date.now()}`; // Para referencia
    folderTitleElement.id = inputField.dataset.folderTitleElementId; // Asegurarse de que tenga ID

    // Insertar el input antes del folderTitleElement (que ahora está oculto)
    folderTitleElement.parentNode.insertBefore(inputField, folderTitleElement);

    inputField.focus();
    inputField.select(); // Seleccionar todo el texto para fácil edición

    // Evento para guardar al presionar Enter
    inputField.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await saveFolderRename(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon);
        }
    });

    // Evento para guardar al perder el foco (click fuera)
    inputField.addEventListener('blur', async () => {
        await saveFolderRename(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon);
    });
}

async function saveFolderRename(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon) {
    const newFolderName = inputField.value.trim();

    if (!inputField.parentNode) {
        return;
    }

    inputField.removeEventListener('keypress', saveFolderRename);
    inputField.removeEventListener('blur', saveFolderRename);

    if (newFolderName === originalFolderName) {
        inputField.remove();
        folderTitleElement.style.display = 'block';
        deleteBtn.style.display = 'block';
        editBtn.style.display = 'block';
        expandIcon.style.display = 'block';
        return;
    }

    if (!newFolderName) {
        showToast("El nombre de la carpeta no puede estar vacío. Se restaurará el nombre original.", 'warning');
        inputField.remove();
        folderTitleElement.style.display = 'block';
        deleteBtn.style.display = 'block';
        editBtn.style.display = 'block';
        expandIcon.style.display = 'block';
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[newFolderName] && newFolderName !== originalFolderName) {
        showToast(`Ya existe una carpeta con el nombre "${newFolderName}". Por favor, elige un nombre diferente.`, 'warning');
        inputField.remove();
        folderTitleElement.style.display = 'block';
        deleteBtn.style.display = 'block';
        editBtn.style.display = 'block';
        expandIcon.style.display = 'block';
        return;
    }

    const folderContent = storedFolders[originalFolderName];
    delete storedFolders[originalFolderName];
    storedFolders[newFolderName] = folderContent;

    await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
    showToast(`Carpeta "${originalFolderName}" renombrada a "${newFolderName}" exitosamente.`, 'success'); // REEMPLAZADO

    inputField.remove();
    loadAndDisplayFolders();
}

async function deleteFolder(event) {
    event.stopPropagation();
    const folderName = event.currentTarget.dataset.folderName;

    if (!folderName) {
        console.error('Error: No se pudo obtener el nombre de la carpeta para eliminar.');
        showToast('Hubo un error al intentar eliminar la carpeta. Por favor, inténtalo de nuevo.', 'error');
        return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folderName}"? Todas las conversaciones dentro de ella también se eliminarán.`)) {
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[folderName]) {
        delete storedFolders[folderName];

        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        showToast(`Carpeta "${folderName}" y sus conversaciones eliminadas exitosamente.`, 'success');
        loadAndDisplayFolders();
    } else {
        showToast("La carpeta especificada no existe.", 'error');
    }
}

// Función para guardar la conversación actual (Considera si la sigues necesitando con el drag-and-drop)
async function saveCurrentConversation() {
    const folderSelector = document.getElementById('folder-selector');
    const selectedFolderName = folderSelector.value;

    if (!selectedFolderName) {
        showToast("Por favor, selecciona una carpeta para guardar la conversación.", 'warning');
        return;
    }

    const conversationTitle = extractConversationTitle();
    const conversationId = extractRealConversationIdFromCurrentUrl();

    if (!conversationTitle || conversationTitle === "Conversación sin título" || !conversationId) {
        showToast("No se pudo extraer el título o ID de la conversación actual. Por favor, asegúrate de que estás en un chat con un título para guardar.", 'warning'); // REEMPLAZADO
        return;
    }

    const conversationUrl = `https://gemini.google.com/app/${conversationId}`;

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[selectedFolderName]) {
        const exists = storedFolders[selectedFolderName].some(conv => conv.id === conversationId);
        if (exists) {
            showToast(`La conversación "${conversationTitle}" ya está en la carpeta "${selectedFolderName}".`, 'info');
            return;
        }

        storedFolders[selectedFolderName].push({
            id: conversationId,
            timestamp: new Date().toLocaleString(),
            title: conversationTitle,
            url: conversationUrl
        });
        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        showToast("Conversación guardada exitosamente en la carpeta: " + selectedFolderName, 'success');
        loadAndDisplayFolders();
    } else {
        showToast("La carpeta seleccionada no existe. Por favor, recarga el complemento.", 'error');
    }
}

// Función para extraer el título de la conversación actual (sin cambios)
function extractConversationTitle() {
    const selectedConversationTitleElement = document.querySelector('.conversation.selected .conversation-title');
    if (selectedConversationTitleElement) {
        return selectedConversationTitleElement.textContent.trim();
    }

    const currentGemTitleElement = document.querySelector('.bot-item.selected .bot-name');
    if (currentGemTitleElement) {
        return currentGemTitleElement.textContent.trim();
    }

    const pageTitle = document.title;
    if (pageTitle && pageTitle.includes('Gemini')) {
        const cleanTitle = pageTitle.replace(/^(.*?) - Gemini.*$/, '$1').trim();
        if (cleanTitle && cleanTitle !== "Gemini") {
            return cleanTitle;
        }
    }

    return "Conversación sin título";
}

// Nueva función para extraer el ID real de la URL (sin el prefijo 'c_')
function extractRealConversationIdFromCurrentUrl() {
    const url = window.location.href;
    // La URL de Gemini puede ser /app/ID_CONVERSACION o /gem/ID_CONVERSACION
    const match = url.match(/\/app\/([a-zA-Z0-9_-]+)/) || url.match(/\/gem\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return match[1]; // Retorna el ID sin prefijo 'c_'
    }
    return null;
}

// Función para abrir la URL de la conversación guardada (¡CRÍTICO: MODIFICADA para simular clic nativo con MouseEvent!)
function openGeminiChat(event) {
    const conversationId = event.target.dataset.convId;
    if (conversationId) {
        const targetConversationElement = document.querySelector(`.chat-history-list .conversation[jslog*="\\x22c_${conversationId}\\x22"]`);

        if (targetConversationElement) {
            console.log(`Simulando clic en elemento nativo con ID: c_${conversationId}`);
            const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true, buttons: 1 });
            const mouseDownEvent = new MouseEvent('mousedown', { view: window, bubbles: true, cancelable: true, buttons: 1 });
            const mouseUpEvent = new MouseEvent('mouseup', { view: window, bubbles: true, cancelable: true });

            targetConversationElement.dispatchEvent(mouseDownEvent);
            targetConversationElement.dispatchEvent(mouseUpEvent);
            targetConversationElement.dispatchEvent(clickEvent);

            setTimeout(() => {
                document.getElementById(SIDEBAR_ID).classList.add('hidden');
            }, 100);

        } else {
            console.warn(`No se encontró el elemento de conversación nativa con ID: c_${conversationId}. Intentando navegación directa como fallback.`);
            showToast(`No se pudo cargar la conversación rápidamente. Recargando página...`, 'info');
            window.location.href = `https://gemini.google.com/app/${conversationId}`;
            document.getElementById(SIDEBAR_ID).classList.add('hidden');
        }
    } else {
        showToast("No se pudo encontrar el ID de esta conversación.", 'error');
    }
}

// Función para borrar una conversación (sin cambios)
async function deleteConversation(event) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación de tu organizador? Esta acción no se puede deshacer.')) {
        return;
    }

    const folderName = event.currentTarget.dataset.folderName;
    const convId = event.currentTarget.dataset.convId;

    if (!folderName || !convId) {
        console.error('Error: Faltan datos para eliminar la conversación (carpeta o ID).', { folderName, convId });
        showToast('Hubo un error al intentar eliminar la conversación. Por favor, inténtalo de nuevo.', 'error');
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[folderName]) {
        const initialLength = storedFolders[folderName].length;
        storedFolders[folderName] = storedFolders[folderName].filter(conv => conv.id !== convId);

        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });

        if (storedFolders[folderName].length < initialLength) {
            showToast("Conversación eliminada exitosamente.", 'success');
        } else {
            showToast("La conversación no se encontró en la carpeta.", 'warning'); 
        }

        loadAndDisplayFolders();
    } else {
        showToast("La carpeta especificada no existe.", 'error');
    }
}


// 1. Manejador para el inicio del arrastre (dragstart) (¡MODIFICADA para incluir folder_from y originalIndex!)
function handleDragStart(event) {
    // Si se arrastra desde la lista de "Recientes" de Gemini
    const geminiConversationElement = event.target.closest('.chat-history-list .conversation[data-test-id="conversation"]');

    // Si se arrastra desde una conversación guardada en el sidebar
    const savedConversationElement = event.target.closest('.conversation-item-wrapper[draggable="true"]');

    let conversationData;

    if (geminiConversationElement) {
        const titleElement = geminiConversationElement.querySelector('.conversation-title');
        const convTitle = titleElement ? titleElement.textContent.trim() : 'Conversación sin título';

        let realConversationId = null;
        let convUrl = '';

        const jslogAttribute = geminiConversationElement.getAttribute('jslog');
        if (jslogAttribute) {
            const match = jslogAttribute.match(/BardVeMetadataKey:\[[^\]]*\x22c_([^\x22]+)\x22/);
            if (match && match[1]) {
                realConversationId = match[1];
                convUrl = `https://gemini.google.com/app/${realConversationId}`;
            }
        }

        if (!realConversationId && geminiConversationElement.classList.contains('selected')) {
            realConversationId = extractRealConversationIdFromCurrentUrl();
            if (realConversationId) {
                convUrl = `https://gemini.google.com/app/${realConversationId}`;
            }
        }

        if (!realConversationId || !convUrl) {
            console.warn("No se pudo obtener un ID de conversación o URL válida para la conversación arrastrada desde Gemini.");
            if (!convUrl) {
                convUrl = window.location.href.split('?')[0];
                if (!convUrl.includes('/app/') && !convUrl.includes('/gem/')) {
                    convUrl = 'https://gemini.google.com/app/';
                }
            }
            if (!realConversationId) {
                realConversationId = 'fallback_' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
            }
        }

        conversationData = {
            id: realConversationId,
            title: convTitle,
            url: convUrl,
            folder_from: null, // Indicar que viene de Gemini (no de una carpeta guardada)
            original_index: -1 // No aplica para arrastres desde Gemini
        };
        geminiConversationElement.classList.add('is-dragging');
    } else if (savedConversationElement) {
        // Si se arrastra desde una conversación guardada
        conversationData = {
            id: savedConversationElement.dataset.convId,
            title: savedConversationElement.dataset.convTitle,
            url: savedConversationElement.dataset.convUrl,
            folder_from: savedConversationElement.dataset.folderName, // ¡Carpeta de origen!
            original_index: parseInt(savedConversationElement.dataset.originalIndex)
        };
        savedConversationElement.classList.add('is-dragging');
    } else {
        // No se está arrastrando un elemento relevante
        event.preventDefault();
        return;
    }

    event.dataTransfer.setData('application/json', JSON.stringify(conversationData));
    event.dataTransfer.effectAllowed = 'move';
}

// 2. Manejador para el elemento que recibe el arrastre (dragover) (sin cambios)
function handleDragOver(event) {
    event.preventDefault(); // Esto es CRUCIAL para permitir el drop
    event.dataTransfer.dropEffect = 'move'; // Cambiar el cursor a "mover"

    // Feedback visual a la carpeta al pasar el ratón por encima
    if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
        event.currentTarget.classList.add('drag-over');
    }
}

// NUEVO: Manejador para el dragover en la lista de conversaciones (para reordenar)
function handleConversationListDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    // Añadir feedback visual al arrastrar sobre un item o el espacio entre ellos
    const targetItem = event.target.closest('.conversation-item-wrapper');
    const conversationList = event.currentTarget; // Es la UL .conversation-items-container

    // Limpiar clases de highlight existentes
    conversationList.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    if (targetItem) {
        const boundingBox = targetItem.getBoundingClientRect();
        const offset = event.clientY - boundingBox.top;

        if (offset < boundingBox.height / 2) {
            targetItem.classList.add('drag-over-top'); // Resaltar encima
        } else {
            targetItem.classList.add('drag-over-bottom'); // Resaltar debajo
        }
    } else {
        // Si no hay un item específico, se arrastra sobre la lista vacía o el final
        conversationList.classList.add('drag-over-bottom'); // Resaltar como añadir al final
    }
}


// 3. Manejador cuando el arrastre sale del elemento (dragleave)
function handleDragLeave(event) {
    if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
        event.currentTarget.classList.remove('drag-over');
    }

    // Limpiar clases de highlight para la lista de conversaciones
    event.currentTarget.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
}


// 4. Manejador para el soltado (drop) (¡MODIFICADA para mover entre y dentro de carpetas!)
async function handleDrop(event) {
    event.preventDefault();

    if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
        event.currentTarget.classList.remove('drag-over');
    }

    const droppedData = event.dataTransfer.getData('application/json');
    if (!droppedData) {
        showToast('No se pudo recuperar la información de la conversación arrastrada.', 'error');
        return;
    }

    const conversation = JSON.parse(droppedData);
    const targetFolderName = event.currentTarget.dataset.folderName;
    const sourceFolderName = conversation.folder_from;
    const originalIndex = conversation.original_index; // Este ya no es tan relevante aquí, pero se mantiene para la estructura.

    if (!targetFolderName) {
        showToast('No se pudo identificar la carpeta de destino.', 'error');
        return;
    }

    if (!conversation.title || !conversation.url || !conversation.id) {
        showToast('La información de la conversación arrastrada está incompleta.', 'error');
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    if (!storedFolders[targetFolderName]) {
        showToast("La carpeta de destino no existe. Por favor, recarga el complemento.", 'error');
        return;
    }

    // Caso de Drag & Drop entre/dentro de carpetas
    if (sourceFolderName !== null) { // La conversación proviene de una carpeta guardada
        if (sourceFolderName === targetFolderName) {
             // Este caso de drop en la cabecera de la misma carpeta no debería reordenar.
             // La reordenación se maneja en handleConversationListDrop
            showToast(`La conversación "${conversation.title}" ya está en la carpeta "${targetFolderName}".`, 'info');
            loadAndDisplayFolders(); // Recargar para limpiar highlights
            return;
        } else {
            // Mover a una carpeta DIFERENTE
            const existsInTarget = storedFolders[targetFolderName].some(conv => conv.id === conversation.id);
            if (existsInTarget) {
                showToast(`La conversación "${conversation.title}" ya está en la carpeta "${targetFolderName}".`, 'info');
                loadAndDisplayFolders();
                return;
            }

            if (storedFolders[sourceFolderName]) {
                storedFolders[sourceFolderName] = storedFolders[sourceFolderName].filter(
                    conv => conv.id !== conversation.id
                );
            } else {
                console.warn(`Carpeta de origen "${sourceFolderName}" no encontrada al intentar mover.`);
            }

            storedFolders[targetFolderName].push({
                id: conversation.id,
                timestamp: new Date().toLocaleString(),
                title: conversation.title,
                url: conversation.url
            });
            await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
            showToast(`Conversación "${conversation.title}" movida a "${targetFolderName}" exitosamente.`, 'success');
        }
    } else {
        // Caso: La conversación viene de Gemini (folder_from es null)
        const existsInTarget = storedFolders[targetFolderName].some(conv => conv.id === conversation.id);
        if (existsInTarget) {
            showToast(`La conversación "${conversation.title}" ya está en la carpeta "${targetFolderName}".`, 'info');
            loadAndDisplayFolders();
            return;
        }
        storedFolders[targetFolderName].push({
            id: conversation.id,
            timestamp: new Date().toLocaleString(),
            title: conversation.title,
            url: conversation.url
        });
        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        showToast(`Conversación "${conversation.title}" guardada en "${targetFolderName}" exitosamente.`, 'success');
    }
    loadAndDisplayFolders();
}


// NUEVO: Manejador para el soltado en la UL de conversaciones (para reordenar)
async function handleConversationListDrop(event) {
    event.preventDefault();

    event.currentTarget.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    const droppedData = event.dataTransfer.getData('application/json');
    if (!droppedData) {
        showToast('No se pudo recuperar la información de la conversación arrastrada.', 'error');
        return;
    }

    const conversation = JSON.parse(droppedData);
    const targetFolderName = event.currentTarget.dataset.folderName;
    const sourceFolderName = conversation.folder_from;
    const originalIndex = conversation.original_index;

    if (!targetFolderName) {
        console.error('Error: No se pudo identificar la carpeta de destino de la lista.');
        showToast('Hubo un error al identificar la carpeta de destino.', 'error');
        return;
    }

    if (!conversation.title || !conversation.url || !conversation.id) {
        showToast('La información de la conversación arrastrada está incompleta.', 'error');
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    if (!storedFolders[targetFolderName]) {
        showToast("La carpeta de destino no existe. Por favor, recarga el complemento.", 'error');
        return;
    }

    const targetItem = event.target.closest('.conversation-item-wrapper');
    let newIndex;

    if (targetItem) {
        const boundingBox = targetItem.getBoundingClientRect();
        const offset = event.clientY - boundingBox.top;
        const targetIndex = Array.from(targetItem.parentNode.children).indexOf(targetItem);

        if (offset < boundingBox.height / 2) {
            newIndex = targetIndex;
        } else {
            newIndex = targetIndex + 1;
        }
    } else {
        newIndex = storedFolders[targetFolderName].length;
    }


    if (sourceFolderName === targetFolderName) {
        if (originalIndex === newIndex || (originalIndex + 1 === newIndex && originalIndex < newIndex && newIndex <= storedFolders[targetFolderName].length) || (originalIndex -1 === newIndex && originalIndex > newIndex && newIndex >= 0)) {
            console.log("No hay cambio de orden significativo. originalIndex:", originalIndex, "newIndex:", newIndex);
            showToast("No se realizó ningún cambio en el orden.", 'info', 2000);
            loadAndDisplayFolders();
            return;
        }

        const [movedConversation] = storedFolders[targetFolderName].splice(originalIndex, 1);
        storedFolders[targetFolderName].splice(newIndex > originalIndex ? newIndex - 1 : newIndex, 0, movedConversation);

        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        console.log(`Conversación "${conversation.title}" reordenada dentro de "${targetFolderName}".`);
        showToast(`Conversación "${conversation.title}" reordenada.`, 'success'); 

    } else {
        const existsInTarget = storedFolders[targetFolderName].some(conv => conv.id === conversation.id);
        if (existsInTarget) {
            showToast(`La conversación "${conversation.title}" ya está en la carpeta "${targetFolderName}".`, 'info');
            loadAndDisplayFolders();
            return;
        }

        if (sourceFolderName) {
            if (storedFolders[sourceFolderName]) {
                storedFolders[sourceFolderName] = storedFolders[sourceFolderName].filter(
                    conv => conv.id !== conversation.id
                );
            } else {
                console.warn(`Carpeta de origen "${sourceFolderName}" no encontrada al intentar mover.`);
            }
        }

        storedFolders[targetFolderName].splice(newIndex, 0, {
            id: conversation.id,
            timestamp: new Date().toLocaleString(),
            title: conversation.title,
            url: conversation.url
        });

        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        showToast(`Conversación "${conversation.title}" movida a "${targetFolderName}" exitosamente.`, 'success');
    }
    loadAndDisplayFolders();
}


// NUEVO: Función para filtrar carpetas y conversaciones
function filterConversationsAndFolders() {
    const searchTerm = document.getElementById('search-conversations-input').value.toLowerCase().trim();
    const foldersListUl = document.getElementById('folders-list-ul');
    const folderItems = foldersListUl.querySelectorAll('.gemini-folder-item');

    folderItems.forEach(folderItem => {
        const folderTitleElement = folderItem.querySelector('.gemini-folder-title');
        const folderName = folderTitleElement.textContent.toLowerCase();
        const conversationsWrapper = folderItem.querySelector('.conversations-list-wrapper');
        const conversationsUl = conversationsWrapper.querySelector('.conversation-items-container');
        const conversationItems = conversationsUl.querySelectorAll('.conversation-item-wrapper');
        const expandIcon = folderItem.querySelector('.gemini-expand-icon');

        let folderMatches = false;
        let anyConversationMatches = false;

        if (searchTerm === '') {
            // Si el término de búsqueda está vacío, mostrar todo y colapsar carpetas
            folderItem.style.display = ''; // Mostrar la carpeta
            conversationsWrapper.classList.add('hidden'); // Colapsar
            expandIcon.setAttribute('fonticon', 'expand_more');
            expandIcon.setAttribute('data-mat-icon-name', 'expand_more');
            conversationItems.forEach(convItem => convItem.style.display = ''); // Mostrar todas las conversaciones
            return;
        }

        // 1. Comprobar si el nombre de la carpeta coincide
        if (folderName.includes(searchTerm)) {
            folderMatches = true;
        }

        // 2. Comprobar si alguna conversación dentro de la carpeta coincide
        conversationItems.forEach(convItem => {
            const convTitleElement = convItem.querySelector('.conversation-title');
            const convTitle = convTitleElement.textContent.toLowerCase();

            if (convTitle.includes(searchTerm)) {
                convItem.style.display = ''; // Mostrar esta conversación
                anyConversationMatches = true;
            } else {
                convItem.style.display = 'none'; // Ocultar esta conversación
            }
        });

        // 3. Decidir si mostrar la carpeta y en qué estado
        if (folderMatches || anyConversationMatches) {
            folderItem.style.display = ''; // Mostrar la carpeta
            // Si la carpeta o alguna de sus conversaciones coincide, expandir
            conversationsWrapper.classList.remove('hidden');
            expandIcon.setAttribute('fonticon', 'expand_less');
            expandIcon.setAttribute('data-mat-icon-name', 'expand_less');
        } else {
            folderItem.style.display = 'none'; // Ocultar la carpeta si no hay coincidencias
        }
    });
}

function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('gemini-organizer-toast-container');
    if (!toastContainer) {
        console.error('Contenedor de toast no encontrado.');
        return;
    }

    const toast = document.createElement('div');
    toast.classList.add('gemini-organizer-toast', `gemini-organizer-toast-${type}`);
    toast.textContent = message;

    // Añadir el toast al contenedor
    toastContainer.appendChild(toast);

    // Forzar un reflow para asegurar que las transiciones CSS se apliquen correctamente
    toast.offsetHeight;

    // Añadir clase para mostrar con animación
    toast.classList.add('show');

    // Programar la eliminación del toast después de 'duration' milisegundos
    setTimeout(() => {
        toast.classList.remove('show');
        // Esperar a que la animación de salida termine antes de remover el elemento del DOM
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, { once: true });
    }, duration);
}

// --- LÓGICA DE OBSERVACIÓN Y EVENTOS PARA CONVERSACIONES "RECIENTES" ---
function setupDraggableConversations() {
    // Selector para las conversaciones en la sección "Recientes"
    const recentConversations = document.querySelectorAll('.chat-history-list .conversation[data-test-id="conversation"]');

    recentConversations.forEach(convElement => {
        if (!convElement.hasAttribute('data-draggable-setup')) {
            convElement.setAttribute('draggable', 'true');
            convElement.addEventListener('dragstart', handleDragStart);
            convElement.addEventListener('dragend', (event) => {
                event.target.classList.remove('is-dragging');
            });
            convElement.setAttribute('data-draggable-setup', 'true');
        }
    });
}


// Ejecutar la inicialización cuando el DOM esté cargado
window.requestIdleCallback(() => {
    addToggleButton();
    loadAndDisplayFolders(); // Asegurarse de que las carpetas se carguen y los listeners de D&D se adjunten
    setupDraggableConversations(); // Configurar arrastre en conversaciones recientes
});

// Observar cambios en el DOM de Gemini para asegurar que el botón y el sidebar persistan
const observer = new MutationObserver((mutationsList, observer) => {
    const toggleButtonWrapper = document.getElementById(TOGGLE_BUTTON_WRAPPER_ID);
    const sidebar = document.getElementById(SIDEBAR_ID);
    const discoverGemsButtonWrapper = document.querySelector('side-nav-action-button[data-test-id="manage-instructions-control"]');

    if (!toggleButtonWrapper || !document.body.contains(toggleButtonWrapper) ||
        !sidebar || !toggleButtonWrapper.contains(sidebar) ||
        !discoverGemsButtonWrapper || !document.body.contains(discoverGemsButtonWrapper)) {

        console.log('Detectado cambio en la estructura de la barra lateral de Gemini. Reinicializando el complemento.');

        if (toggleButtonWrapper && document.body.contains(toggleButtonWrapper)) {
            toggleButtonWrapper.remove();
        }
        if (sidebar && document.body.contains(sidebar)) {
            sidebar.remove();
        }

        addToggleButton();
    }
    setupDraggableConversations();
});

observer.observe(document.body, { childList: true, subtree: true });