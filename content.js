// ID único para el contenedor de nuestro complemento
const SIDEBAR_ID = 'gemini-organizer-sidebar';
const STORAGE_KEY = 'geminiConversations';
const TOGGLE_BUTTON_ID = 'gemini-organizer-toggle-btn';

// Función para inicializar la interfaz del complemento (sin cambios)
function initializeSidebar() {
    // Si la barra lateral ya existe, no la creamos de nuevo
    if (document.getElementById(SIDEBAR_ID)) {
        return;
    }

    const sidebar = document.createElement('div');
    sidebar.id = SIDEBAR_ID;
    sidebar.classList.add('hidden'); 
    sidebar.innerHTML = `
        <h3>Organizador de Conversaciones</h3>

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
            <h4>Tus Carpetas</h4>
            <ul id="folders-list-ul">
                </ul>
        </div>
    `;

    document.body.appendChild(sidebar);

    // Adjuntar eventos a los botones y campos
    document.getElementById('create-folder-btn').addEventListener('click', createFolder);
    document.getElementById('save-conversation-btn').addEventListener('click', saveCurrentConversation);

    // Cargar y mostrar las carpetas al iniciar (aunque la sidebar esté oculta)
    loadAndDisplayFolders();
}

// Función para agregar el botón de invocación (sin cambios)
function addToggleButton() {
    if (document.getElementById(TOGGLE_BUTTON_ID)) {
        return;
    }

    const discoverGemsButtonWrapper = document.querySelector('side-nav-action-button[data-test-id="manage-instructions-control"]');

    if (discoverGemsButtonWrapper) {
        const ourButtonWrapper = document.createElement('side-nav-action-button');
        ourButtonWrapper.id = 'gemini-organizer-wrapper';
        ourButtonWrapper.setAttribute('icon', 'folder_open');
        ourButtonWrapper.setAttribute('arialabel', 'Organizador de Conversaciones');
        ourButtonWrapper.setAttribute('data-test-id', 'gemini-organizer-button');
        ourButtonWrapper.classList.add('mat-mdc-tooltip-trigger', 'ia-redesign', 'ng-star-inserted');

        const button = document.createElement('button');
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
            <div matlistitemicon="" class="mat-mdc-list-item-icon icon-container mdc-list-item__start" style="
                margin-left: 13px;
                margin-right: 0px;
            ">
                <mat-icon role="img" class="mat-icon notranslate gds-icon-l google-symbols mat-ligature-font mat-icon-no-color ng-star-inserted" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="folder_open" fonticon="folder_open"></mat-icon>
            </div>
            <span class="mdc-list-item__content">
                <span class="mat-mdc-list-item-unscoped-content mdc-list-item__primary-text">
                    <span data-test-id="side-nav-action-button-content" class="gds-body-m">Organizador de conversaciones</span>
                </span>
            </span>
            <div class="mat-focus-indicator"></div>
        `;
        
        ourButtonWrapper.appendChild(button);
        discoverGemsButtonWrapper.after(ourButtonWrapper);
        button.addEventListener('click', toggleSidebarVisibility);
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

// Función para cargar y mostrar las carpetas y conversaciones (MODIFICADA)
async function loadAndDisplayFolders() {
    const foldersListUl = document.getElementById('folders-list-ul');
    const folderSelector = document.getElementById('folder-selector');
    foldersListUl.innerHTML = ''; // Limpiar lista actual
    folderSelector.innerHTML = '<option value="">Selecciona una carpeta</option>'; // Limpiar selector

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    for (const folderName in storedFolders) {
        const option = document.createElement('option');
        option.value = folderName;
        option.textContent = folderName;
        folderSelector.appendChild(option);

        const folderLi = document.createElement('li');
        const folderTitle = document.createElement('strong');
        folderTitle.textContent = folderName;
        folderTitle.dataset.folderName = folderName; 
        folderLi.appendChild(folderTitle);

        const conversationsUl = document.createElement('ul');
        conversationsUl.classList.add('hidden'); 
        
        storedFolders[folderName].forEach((conv, index) => {
            const convLi = document.createElement('li');
            convLi.classList.add('conversation-item');
            
            // Contenedor para el título y el botón de eliminar
            const convContentWrapper = document.createElement('div');
            convContentWrapper.style.display = 'flex';
            convContentWrapper.style.justifyContent = 'space-between';
            convContentWrapper.style.alignItems = 'center';
            convContentWrapper.style.width = '100%';

            const titleSpan = document.createElement('span');
            titleSpan.textContent = conv.title; 
            titleSpan.dataset.folderName = folderName;
            titleSpan.dataset.convId = conv.id; // Usar el ID único de la conversación
            titleSpan.dataset.conversationUrl = conv.url; 
            titleSpan.classList.add('conversation-title-text'); // Nueva clase para el texto del título
            titleSpan.style.flexGrow = '1'; // Permite que el título ocupe el espacio
            titleSpan.style.cursor = 'pointer'; // Para indicar que se puede hacer clic

            // Botón de eliminar
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-conversation-btn'); // Clase para estilos
            deleteButton.innerHTML = `<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="delete" fonticon="delete"></mat-icon>`;
            deleteButton.title = `Eliminar conversación: "${conv.title}"`; // Tooltip
            deleteButton.dataset.folderName = folderName;
            deleteButton.dataset.convId = conv.id; // Usar el ID único para identificarla

            convContentWrapper.appendChild(titleSpan);
            convContentWrapper.appendChild(deleteButton);
            convLi.appendChild(convContentWrapper);

            // Evento para abrir el chat original al hacer clic en el título
            titleSpan.addEventListener('click', openGeminiChat);
            // Evento para eliminar la conversación al hacer clic en el botón
            deleteButton.addEventListener('click', deleteConversation);

            conversationsUl.appendChild(convLi);
        });
        folderLi.appendChild(conversationsUl);
        foldersListUl.appendChild(folderLi);

        folderTitle.addEventListener('click', (event) => {
            conversationsUl.classList.toggle('hidden');
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
    
    // Generar un ID único para la conversación
    // Usamos timestamp + un número aleatorio para mayor unicidad
    const conversationId = Date.now().toString() + Math.random().toString(36).substring(2, 9); 

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[selectedFolderName]) {
        storedFolders[selectedFolderName].push({
            id: conversationId, // Guardar el ID único
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
        return pageTitle.replace('Gemini - ', '').trim();
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

// NUEVA FUNCIÓN: Para borrar una conversación
async function deleteConversation(event) {
    // Usamos confirm para pedir confirmación al usuario
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación de tu organizador? Esta acción no se puede deshacer.')) {
        return; // Si el usuario cancela, no hacemos nada
    }

    const folderName = event.currentTarget.dataset.folderName;
    const convId = event.currentTarget.dataset.convId; // Obtenemos el ID de la conversación

    if (!folderName || !convId) {
        console.error('Error: Faltan datos para eliminar la conversación (carpeta o ID).', { folderName, convId });
        alert('Hubo un error al intentar eliminar la conversación. Por favor, inténtalo de nuevo.');
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[folderName]) {
        // Filtramos el array de conversaciones para remover la que tenga el ID coincidente
        const initialLength = storedFolders[folderName].length;
        storedFolders[folderName] = storedFolders[folderName].filter(conv => conv.id !== convId);

        // Si la carpeta queda vacía y ya no tiene sentido, podrías considerar eliminarla también.
        // Por ahora, simplemente la dejamos como un array vacío.
        
        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });

        if (storedFolders[folderName].length < initialLength) {
            alert("Conversación eliminada exitosamente.");
        } else {
            alert("La conversación no se encontró en la carpeta.");
        }
        
        loadAndDisplayFolders(); // Recargar la interfaz para mostrar los cambios
    } else {
        alert("La carpeta especificada no existe.");
    }
}


// Ejecutar la inicialización cuando el DOM esté cargado
window.requestIdleCallback(() => {
    initializeSidebar();
    addToggleButton();
});

// Observar cambios en el DOM de Gemini
const observer = new MutationObserver((mutationsList, observer) => {
    const sidebar = document.getElementById(SIDEBAR_ID);
    const toggleButton = document.getElementById(TOGGLE_BUTTON_ID);

    if (!sidebar || !document.body.contains(sidebar)) {
        initializeSidebar();
    }
    if (!toggleButton || !document.body.contains(toggleButton)) {
        addToggleButton();
    }
});

observer.observe(document.body, { childList: true, subtree: true });