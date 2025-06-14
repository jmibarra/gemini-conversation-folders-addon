// ID único para el contenedor de nuestro complemento
const SIDEBAR_ID = 'gemini-organizer-sidebar';
const STORAGE_KEY = 'geminiConversations';
const TOGGLE_BUTTON_ID = 'gemini-organizer-toggle-btn';
const TOGGLE_BUTTON_WRAPPER_ID = 'gemini-organizer-wrapper';

// Función para inicializar la interfaz del complemento (sin cambios)
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
        `;
    }
    return sidebar;
}

// Función para agregar el botón de invocación y adjuntar/configurar el sidebar (sin cambios significativos)
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
            const saveConversationBtn = document.getElementById('save-conversation-btn'); // Considera si necesitas este botón con drag-and-drop

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

            // NUEVO: Listener para el campo de búsqueda
            const searchInput = document.getElementById('search-conversations-input');
            if (searchInput && !searchInput.hasAttribute('data-listener-attached')) {
                searchInput.addEventListener('input', filterConversationsAndFolders);
                searchInput.setAttribute('data-listener-attached', 'true');
            }
        }
        // Asegurarse de que el listener del botón principal esté siempre adjunto
        if (button && !button.hasAttribute('data-listener-attached')) {
             button.addEventListener('click', toggleSidebarVisibility);
             button.setAttribute('data-listener-attached', 'true');
        }

    } else {
        console.warn('No se pudo encontrar el lugar para insertar el botón "Organizador" en la barra lateral de Gemini. Selector usado: side-nav-action-button[data-test-id="manage-instructions-control"]');
    }
}

// Función para alternar la visibilidad de la barra lateral (sin cambios)
function toggleSidebarVisibility() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}

// Función para cargar y mostrar las carpetas y conversaciones (actualizada para usar ID de Gemini)
async function loadAndDisplayFolders() {
    const foldersListUl = document.getElementById('folders-list-ul');
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

        // Agregar eventos de drag and drop a la cabecera de la carpeta
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
        deleteFolderButton.dataset.folderName = folderName; // Guardamos el nombre de la carpeta

        // NUEVO: Botón de editar carpeta
        const editFolderButton = document.createElement('button');
        editFolderButton.classList.add('edit-folder-btn');
        editFolderButton.innerHTML = `<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="edit" fonticon="edit"></mat-icon>`;
        editFolderButton.title = `Renombrar carpeta: "${folderName}"`;
        editFolderButton.dataset.folderName = folderName;

        folderHeader.appendChild(folderTitle);
        folderHeader.appendChild(editFolderButton);
        folderHeader.appendChild(deleteFolderButton);
        folderHeader.appendChild(expandIcon); // El ícono de expandir va al final

        const conversationsWrapper = document.createElement('div');
        conversationsWrapper.classList.add('conversations-list-wrapper', 'hidden');

        const conversationsUl = document.createElement('ul');
        conversationsUl.classList.add('conversation-items-container', 'side-nav-opened');

        storedFolders[folderName].forEach((conv) => {
            const convItem = document.createElement('li');
            convItem.classList.add('conversation-item-wrapper');

            const convContentFlex = document.createElement('div');
            convContentFlex.classList.add('conversation-item-content');

            const convTitle = document.createElement('div');
            convTitle.classList.add('conversation-title', 'gds-body-m');
            convTitle.textContent = conv.title;
            convTitle.dataset.folderName = folderName;
            convTitle.dataset.convId = conv.id; // ¡Este es el ID de Gemini real, sin "c_"!
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
            // Detenemos la propagación para que no active el click de expandir/contraer
            event.stopPropagation();
            // Llamamos a la función que maneja el modo de edición
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
    }
}

// Función para crear una nueva carpeta (sin cambios)
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
            alert(`Carpeta "${folderName}" creada exitosamente.`);
        } else {
            alert(`La carpeta "${folderName}" ya existe.`);
        }
    } else {
        alert("Por favor, ingresa un nombre para la carpeta.");
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

    // Si el campo ya ha sido procesado o eliminado, no hacer nada
    if (!inputField.parentNode) {
        return;
    }

    // Remover los listeners para evitar múltiples llamadas
    inputField.removeEventListener('keypress', saveFolderRename);
    inputField.removeEventListener('blur', saveFolderRename);

    // Si el nombre es el mismo, simplemente restaurar la UI
    if (newFolderName === originalFolderName) {
        inputField.remove();
        folderTitleElement.style.display = 'block';
        deleteBtn.style.display = 'block';
        editBtn.style.display = 'block';
        expandIcon.style.display = 'block';
        return;
    }

    if (!newFolderName) {
        alert("El nombre de la carpeta no puede estar vacío. Se restaurará el nombre original.");
        inputField.remove();
        folderTitleElement.style.display = 'block';
        deleteBtn.style.display = 'block';
        editBtn.style.display = 'block';
        expandIcon.style.display = 'block';
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    // Verificar si el nuevo nombre ya existe (y no es la misma carpeta)
    if (storedFolders[newFolderName] && newFolderName !== originalFolderName) {
        alert(`Ya existe una carpeta con el nombre "${newFolderName}". Por favor, elige un nombre diferente.`);
        // Restaurar la UI al estado original
        inputField.remove();
        folderTitleElement.style.display = 'block';
        deleteBtn.style.display = 'block';
        editBtn.style.display = 'block';
        expandIcon.style.display = 'block';
        return;
    }

    // Realizar el renombrado
    const folderContent = storedFolders[originalFolderName];
    delete storedFolders[originalFolderName]; // Eliminar la carpeta antigua
    storedFolders[newFolderName] = folderContent; // Asignar el contenido al nuevo nombre

    await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
    alert(`Carpeta "${originalFolderName}" renombrada a "${newFolderName}" exitosamente.`);

    // Eliminar el campo de entrada y restaurar la UI
    inputField.remove();
    loadAndDisplayFolders(); // Recargar toda la lista para actualizar los nombres y datasets
}

async function deleteFolder(event) {
    // Detenemos la propagación del evento para que no se active el click de expandir/contraer la carpeta
    event.stopPropagation();

    const folderName = event.currentTarget.dataset.folderName;

    if (!folderName) {
        console.error('Error: No se pudo obtener el nombre de la carpeta para eliminar.');
        alert('Hubo un error al intentar eliminar la carpeta. Por favor, inténtalo de nuevo.');
        return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la carpeta "${folderName}"? Todas las conversaciones dentro de ella también se eliminarán.`)) {
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[folderName]) {
        delete storedFolders[folderName]; // Elimina la carpeta del objeto

        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        alert(`Carpeta "${folderName}" y sus conversaciones eliminadas exitosamente.`);
        loadAndDisplayFolders(); // Recargar la lista para que la carpeta desaparezca
    } else {
        alert("La carpeta especificada no existe.");
    }
}

// Función para guardar la conversación actual (Considera si la sigues necesitando con el drag-and-drop)
async function saveCurrentConversation() {
    const folderSelector = document.getElementById('folder-selector'); // Asegúrate de que este elemento exista
    const selectedFolderName = folderSelector.value;

    if (!selectedFolderName) {
        alert("Por favor, selecciona una carpeta para guardar la conversación.");
        return;
    }

    const conversationTitle = extractConversationTitle();
    // Nuevo: Extraer el ID real de la conversación activa
    const conversationId = extractRealConversationIdFromCurrentUrl();

    if (!conversationTitle || conversationTitle === "Conversación sin título" || !conversationId) {
        alert("No se pudo extraer el título o ID de la conversación actual. Por favor, asegúrate de que estás en un chat con un título para guardar.");
        return;
    }

    const conversationUrl = `https://gemini.google.com/app/${conversationId}`; // URL con el ID real

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[selectedFolderName]) {
        // Verificar si la conversación ya existe en la carpeta (por ID real)
        const exists = storedFolders[selectedFolderName].some(conv => conv.id === conversationId);
        if (exists) {
            alert(`La conversación "${conversationTitle}" ya está en la carpeta "${selectedFolderName}".`);
            return;
        }

        storedFolders[selectedFolderName].push({
            id: conversationId,
            timestamp: new Date().toLocaleString(),
            title: conversationTitle,
            url: conversationUrl
        });
        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        alert("Conversación guardada exitosamente en la carpeta: " + selectedFolderName);
        loadAndDisplayFolders();
    } else {
        alert("La carpeta seleccionada no existe.");
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
        // Buscar el elemento de conversación nativa usando el conversationId en el jslog
        const targetConversationElement = document.querySelector(`.chat-history-list .conversation[jslog*="\\x22c_${conversationId}\\x22"]`);

        if (targetConversationElement) {
            console.log(`Simulando clic en elemento nativo con ID: c_${conversationId}`);
            // Simular un evento MouseEvent completo
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                buttons: 1 // Indica que el botón primario del ratón está presionado
            });
            const mouseDownEvent = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true,
                buttons: 1
            });
            const mouseUpEvent = new MouseEvent('mouseup', {
                view: window,
                bubbles: true,
                cancelable: true,
            });

            // Disparar los eventos en orden
            targetConversationElement.dispatchEvent(mouseDownEvent);
            targetConversationElement.dispatchEvent(mouseUpEvent);
            targetConversationElement.dispatchEvent(clickEvent); // El evento 'click' final

            // Ocultar el sidebar después de la acción, con un pequeño retraso
            setTimeout(() => {
                document.getElementById(SIDEBAR_ID).classList.add('hidden');
            }, 100); // Dar un poco de tiempo para que la SPA responda

        } else {
            console.warn(`No se encontró el elemento de conversación nativa con ID: c_${conversationId}. Intentando navegación directa como fallback.`);
            // Fallback: Si no se encuentra el elemento, navega directamente. Esto causará una recarga.
            window.location.href = `https://gemini.google.com/app/${conversationId}`;
            document.getElementById(SIDEBAR_ID).classList.add('hidden');
        }
    } else {
        alert("No se pudo encontrar el ID de esta conversación.");
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
        alert('Hubo un error al intentar eliminar la conversación. Por favor, inténtalo de nuevo.');
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[folderName]) {
        const initialLength = storedFolders[folderName].length;
        storedFolders[folderName] = storedFolders[folderName].filter(conv => conv.id !== convId);

        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });

        if (storedFolders[folderName].length < initialLength) {
            alert("Conversación eliminada exitosamente.");
        } else {
            alert("La conversación no se encontró en la carpeta.");
        }

        loadAndDisplayFolders();
    } else {
        alert("La carpeta especificada no existe.");
    }
}

// 1. Manejador para el inicio del arrastre (dragstart) (¡MODIFICADA para ID y URL correctos!)
function handleDragStart(event) {
    const conversationElement = event.target.closest('.conversation[data-test-id="conversation"]');

    if (conversationElement) {
        const titleElement = conversationElement.querySelector('.conversation-title');
        const convTitle = titleElement ? titleElement.textContent.trim() : 'Conversación sin título';

        let realConversationId = null;
        let convUrl = '';

        // Extraer el ID real del jslog, quitando el prefijo "c_"
        const jslogAttribute = conversationElement.getAttribute('jslog');
        if (jslogAttribute) {
            // Ajustar la regex para capturar el ID *después* de "c_"
            const match = jslogAttribute.match(/BardVeMetadataKey:\[[^\]]*\x22c_([^\x22]+)\x22/);
            if (match && match[1]) {
                realConversationId = match[1]; // Este es el ID sin el "c_"
                convUrl = `https://gemini.google.com/app/${realConversationId}`; // URL con el formato /app/
            }
        }

        // Si no se encontró el ID del jslog, y la conversación actual ES la arrastrada,
        // intentar obtenerlo de la URL actual.
        if (!realConversationId && conversationElement.classList.contains('selected')) {
            realConversationId = extractRealConversationIdFromCurrentUrl(); // Usa la nueva función
            if (realConversationId) {
                convUrl = `https://gemini.google.com/app/${realConversationId}`;
            }
        }

        if (!realConversationId || !convUrl) {
            console.warn("No se pudo obtener un ID de conversación o URL válida para la conversación arrastrada.");
            // Si no se puede obtener el ID real, es mejor no arrastrar o usar un ID temporal y la URL actual.
            // Para evitar problemas con la navegación, forzaremos un ID de fallback y la URL actual.
            // Aunque lo ideal es que siempre se extraiga el ID real.
            if (!convUrl) {
                convUrl = window.location.href.split('?')[0];
                if (!convUrl.includes('/app/') && !convUrl.includes('/gem/')) {
                    // Si la URL actual tampoco es una URL de chat específica, dale una por defecto
                    convUrl = 'https://gemini.google.com/app/';
                }
            }
            if (!realConversationId) {
                realConversationId = 'fallback_' + Date.now().toString() + Math.random().toString(36).substring(2, 9);
            }
        }

        const conversationData = JSON.stringify({
            id: realConversationId, // Guardar el ID real de Gemini
            title: convTitle,
            url: convUrl // Guardar la URL completa con el ID real y formato /app/
        });

        event.dataTransfer.setData('application/json', conversationData);
        event.dataTransfer.effectAllowed = 'move';

        conversationElement.classList.add('is-dragging');
    }
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

// 3. Manejador cuando el arrastre sale del elemento (dragleave) (sin cambios)
function handleDragLeave(event) {
    if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
        event.currentTarget.classList.remove('drag-over');
    }
}

// 4. Manejador para el soltado (drop) (actualizada para usar ID de Gemini)
async function handleDrop(event) {
    event.preventDefault(); // CRUCIAL

    // Remover feedback visual
    if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
        event.currentTarget.classList.remove('drag-over');
    }

    const droppedData = event.dataTransfer.getData('application/json');
    if (!droppedData) {
        alert('No se pudo recuperar la información de la conversación arrastrada.');
        return;
    }

    const conversation = JSON.parse(droppedData);
    const folderName = event.currentTarget.dataset.folderName; // La carpeta donde se soltó

    if (!folderName) {
        alert('No se pudo identificar la carpeta de destino.');
        return;
    }

    // Ahora verificamos también el ID de conversación real
    if (!conversation.title || !conversation.url || !conversation.id) {
        alert('La información de la conversación arrastrada está incompleta (falta título, URL o ID real).');
        return;
    }

    // Lógica para guardar la conversación en la carpeta
    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[folderName]) {
        // Verificar si la conversación ya existe en la carpeta usando el ID real de Gemini
        const exists = storedFolders[folderName].some(conv => conv.id === conversation.id);
        if (exists) {
            alert(`La conversación "${conversation.title}" ya está en la carpeta "${folderName}".`);
            return;
        }

        storedFolders[folderName].push({
            id: conversation.id, // Usamos el ID real de Gemini para identificarla
            timestamp: new Date().toLocaleString(),
            title: conversation.title,
            url: conversation.url // La URL debería ser correcta ahora (con /app/ y ID real)
        });

        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        alert(`Conversación "${conversation.title}" guardada en "${folderName}" exitosamente.`);
        loadAndDisplayFolders(); // Actualizar la lista de carpetas
    } else {
        alert("La carpeta de destino no existe.");
    }
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
    setupDraggableConversations();
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