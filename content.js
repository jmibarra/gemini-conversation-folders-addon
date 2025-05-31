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

            <div class="save-controls">
                <h4>Guardar Conversación Actual</h4>
                <select id="folder-selector">
                    <option value="">Selecciona una carpeta</option>
                </select>
                <button id="save-conversation-btn">Guardar Conversación</button>
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
        }
        // Asegurarse de que el listener del botón principal esté siempre adjunto
        if (button && !button.hasAttribute('data-listener-attached')) { // Check again after sidebar logic
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

// Función para cargar y mostrar las carpetas y conversaciones (MODIFICADA: Agrega eventos de Drop)
async function loadAndDisplayFolders() {
    const foldersListUl = document.getElementById('folders-list-ul');
    const folderSelector = document.getElementById('folder-selector');
    foldersListUl.innerHTML = '';
    folderSelector.innerHTML = '<option value="">Selecciona una carpeta</option>';

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    const sortedFolderNames = Object.keys(storedFolders).sort();

    for (const folderName of sortedFolderNames) {
        const option = document.createElement('option');
        option.value = folderName;
        option.textContent = folderName;
        folderSelector.appendChild(option);

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
        folderHeader.dataset.folderName = folderName; // Para saber en qué carpeta se soltó

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

        folderHeader.appendChild(folderTitle);
        folderHeader.appendChild(expandIcon);
        
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
            convTitle.dataset.convId = conv.id;
            convTitle.dataset.conversationUrl = conv.url;
            convTitle.style.flexGrow = '1'; 
            convTitle.style.cursor = 'pointer'; 
            
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

// Función para guardar la conversación actual (sin cambios)
async function saveCurrentConversation() {
    const folderSelector = document.getElementById('folder-selector');
    const selectedFolderName = folderSelector.value;

    if (!selectedFolderName) {
        alert("Por favor, selecciona una carpeta para guardar la conversación.");
        return;
    }

    const conversationTitle = extractConversationTitle();
    const conversationUrl = window.location.href;

    if (!conversationTitle || conversationTitle === "Conversación sin título") {
        alert("No se pudo extraer el título de la conversación o no hay una conversación activa. Por favor, asegúrate de que estás en un chat con un título para guardar.");
        return;
    }
    
    const conversationId = Date.now().toString() + Math.random().toString(36).substring(2, 9); 

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[selectedFolderName]) {
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
        alert("La carpeta seleccionada no existe. Por favor, recarga el complemento.");
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

// Función para abrir la URL de la conversación guardada (sin cambios)
function openGeminiChat(event) {
    const conversationUrl = event.target.dataset.conversationUrl;
    if (conversationUrl) {
        window.location.href = conversationUrl;
        document.getElementById(SIDEBAR_ID).classList.add('hidden');
    } else {
        alert("No se pudo encontrar la URL de esta conversación.");
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

// --- NUEVAS FUNCIONES PARA DRAG AND DROP ---

// 1. Manejador para el inicio del arrastre (dragstart)
function handleDragStart(event) {
    // Selector más preciso basado en tu HTML
    const conversationElement = event.target.closest('.conversation[data-test-id="conversation"]'); 

    if (conversationElement) {
        const titleElement = conversationElement.querySelector('.conversation-title');
        let convTitle = titleElement ? titleElement.textContent.trim() : 'Conversación sin título';
        let convUrl = '';

        // --- Lógica para extraer la URL de la conversación ---
        // La URL de Gemini sigue un patrón como: https://gemini.google.com/gem/ID_CONVERSACION
        // El ID de conversación puede estar en el jslog o en la URL cuando la conversación está activa.
        
        // Primero, intentar obtener el ID de conversación del jslog, si está presente y bien estructurado
        const jslogAttribute = conversationElement.getAttribute('jslog');
        if (jslogAttribute) {
            const match = jslogAttribute.match(/BardVeMetadataKey:\[[^\]]+,null,null,null,null,null,null,\["([^"]+)"/);
            if (match && match[1]) {
                const conversationId = match[1];
                convUrl = `https://gemini.google.com/gem/${conversationId}`;
            }
        }

        // Si la URL no se pudo extraer del jslog, y la conversación actual ES la arrastrada,
        // usar la URL de la ventana.
        // Esto cubre el caso de la conversación "selected".
        if (!convUrl && conversationElement.classList.contains('selected')) {
             convUrl = window.location.href.split('?')[0]; // Tomar solo la URL base, sin parámetros UTM
             // Asegurarse de que la URL contenga '/gem/'
             if (!convUrl.includes('/gem/')) {
                 // Si no es una URL de chat específica, entonces no podemos arrastrarla como tal.
                 // Podrías poner una URL por defecto o abortar el drag.
                 console.warn("No se pudo obtener una URL de chat específica para la conversación arrastrada.");
                 // Puedes hacer event.preventDefault() aquí para cancelar el drag si no hay URL.
                 // event.preventDefault(); 
                 // return;
             }
        }
        
        // Si aún no tenemos una URL, o si es una URL genérica de Gemini (ej. https://gemini.google.com/),
        // podríamos simplemente usar la URL de la página actual como último recurso, o dar un error.
        if (!convUrl || convUrl === 'https://gemini.google.com/') {
            convUrl = window.location.href.split('?')[0]; // Considerar la URL actual si no se pudo extraer una específica
        }

        const conversationData = JSON.stringify({
            title: convTitle,
            url: convUrl
        });

        event.dataTransfer.setData('application/json', conversationData);
        event.dataTransfer.effectAllowed = 'move';

        conversationElement.classList.add('is-dragging');
    }
}

// 2. Manejador para el elemento que recibe el arrastre (dragover)
function handleDragOver(event) {
    event.preventDefault(); // Esto es CRUCIAL para permitir el drop
    event.dataTransfer.dropEffect = 'move'; // Cambiar el cursor a "mover"

    // Feedback visual a la carpeta al pasar el ratón por encima
    if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
        event.currentTarget.classList.add('drag-over');
    }
}

// 3. Manejador cuando el arrastre sale del elemento (dragleave)
function handleDragLeave(event) {
    if (event.currentTarget && event.currentTarget.classList.contains('title-container')) {
        event.currentTarget.classList.remove('drag-over');
    }
}

// 4. Manejador para el soltado (drop)
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

    if (!conversation.title || !conversation.url) {
        alert('La información de la conversación arrastrada está incompleta.');
        return;
    }

    // Lógica para guardar la conversación en la carpeta
    const data = await chrome.storage.local.get(STORAGE_KEY);
    let storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[folderName]) {
        // Verificar si la conversación ya existe en la carpeta (opcional, para evitar duplicados)
        const exists = storedFolders[folderName].some(conv => conv.url === conversation.url);
        if (exists) {
            alert(`La conversación "${conversation.title}" ya está en la carpeta "${folderName}".`);
            return;
        }

        const newConvId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        storedFolders[folderName].push({
            id: newConvId,
            timestamp: new Date().toLocaleString(),
            title: conversation.title,
            url: conversation.url
        });

        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        alert(`Conversación "${conversation.title}" guardada en "${folderName}" exitosamente.`);
        loadAndDisplayFolders(); // Actualizar la lista de carpetas
    } else {
        alert("La carpeta de destino no existe.");
    }
}


// --- NUEVA LÓGICA DE OBSERVACIÓN Y EVENTOS PARA CONVERSACIONES "RECIENTES" ---
function setupDraggableConversations() {
    // Selector para las conversaciones en la sección "Recientes"
    // .conversation[data-test-id="conversation"] es el selector más robusto de tu HTML
    const recentConversations = document.querySelectorAll('.chat-history-list .conversation[data-test-id="conversation"]');

    recentConversations.forEach(convElement => {
        if (!convElement.hasAttribute('data-draggable-setup')) { // Usar un atributo para marcar que ya se configuró
            convElement.setAttribute('draggable', 'true');
            convElement.addEventListener('dragstart', handleDragStart);
            convElement.addEventListener('dragend', (event) => {
                event.target.classList.remove('is-dragging');
            });
            convElement.setAttribute('data-draggable-setup', 'true'); // Marcar como configurado
        }
    });
}


// Ejecutar la inicialización cuando el DOM esté cargado
window.requestIdleCallback(() => {
    addToggleButton();
    setupDraggableConversations(); // Configurar arrastre en conversaciones recientes
});

// Observar cambios en el DOM de Gemini para asegurar que el botón y el sidebar persistan
const observer = new MutationObserver((mutationsList, observer) => {
    const toggleButtonWrapper = document.getElementById(TOGGLE_BUTTON_WRAPPER_ID);
    const sidebar = document.getElementById(SIDEBAR_ID);
    const discoverGemsButtonWrapper = document.querySelector('side-nav-action-button[data-test-id="manage-instructions-control"]');

    // Condición para reinicializar:
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
    // Siempre intentamos configurar las conversaciones arrastrables, ya que pueden aparecer nuevas.
    setupDraggableConversations(); 
});

observer.observe(document.body, { childList: true, subtree: true });