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
    // La barra lateral estará oculta por defecto al iniciar
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
    // document.querySelector(`#${SIDEBAR_ID} .close-conversation-btn`).addEventListener('click', closeDisplayedConversation); 
    // ^^^ Esta línea ya no es necesaria si eliminamos la visualización interna

    // Cargar y mostrar las carpetas al iniciar (aunque la sidebar esté oculta)
    loadAndDisplayFolders();
}

// Función para agregar el botón de invocación (sin cambios, asumiendo que la última corrección funcionó)
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
            <div matlistitemicon="" class="mat-mdc-list-item-icon icon-container mdc-list-item__start">
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

// Función para cargar y mostrar las carpetas y conversaciones
async function loadAndDisplayFolders() {
    const foldersListUl = document.getElementById('folders-list-ul');
    const folderSelector = document.getElementById('folder-selector');
    foldersListUl.innerHTML = ''; // Limpiar lista actual
    folderSelector.innerHTML = '<option value="">Selecciona una carpeta</option>'; // Limpiar selector

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    // Iterar sobre las carpetas y mostrarlas
    for (const folderName in storedFolders) {
        // Añadir al selector de carpetas
        const option = document.createElement('option');
        option.value = folderName;
        option.textContent = folderName;
        folderSelector.appendChild(option);

        // Añadir a la lista de carpetas
        const folderLi = document.createElement('li');
        const folderTitle = document.createElement('strong');
        folderTitle.textContent = folderName;
        folderTitle.dataset.folderName = folderName; // Para identificar la carpeta al hacer clic
        folderLi.appendChild(folderTitle);

        // Mostrar las conversaciones dentro de la carpeta (inicialmente ocultas)
        const conversationsUl = document.createElement('ul');
        conversationsUl.classList.add('hidden'); // Ocultar por defecto
        
        storedFolders[folderName].forEach((conv, index) => {
            const convLi = document.createElement('li');
            convLi.classList.add('conversation-item');
            // Ahora mostramos el título guardado
            convLi.textContent = conv.title; 
            convLi.dataset.folderName = folderName;
            convLi.dataset.convIndex = index; // Para saber qué conversación abrir
            // Guardamos la URL en un data attribute para fácil acceso
            convLi.dataset.conversationUrl = conv.url; 
            conversationsUl.appendChild(convLi);
            // El evento ahora llama a openGeminiChat
            convLi.addEventListener('click', openGeminiChat); 
        });
        folderLi.appendChild(conversationsUl);
        foldersListUl.appendChild(folderLi);

        // Evento para expandir/colapsar la carpeta
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
            storedFolders[folderName] = []; // Inicializar la carpeta como un array vacío
            await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
            newFolderNameInput.value = ''; // Limpiar el input
            loadAndDisplayFolders(); // Recargar la lista para mostrar la nueva carpeta
            alert(`Carpeta "${folderName}" creada exitosamente.`);
        } else {
            alert(`La carpeta "${folderName}" ya existe.`);
        }
    } else {
        alert("Por favor, ingresa un nombre para la carpeta.");
    }
}

// Función para guardar la conversación actual (MODIFICADA)
async function saveCurrentConversation() {
    const folderSelector = document.getElementById('folder-selector');
    const selectedFolderName = folderSelector.value;

    if (!selectedFolderName) {
        alert("Por favor, selecciona una carpeta para guardar la conversación.");
        return;
    }

    const conversationTitle = extractConversationTitle(); // Nueva función para extraer el título
    const conversationUrl = window.location.href; // Obtener la URL actual de la página

    if (!conversationTitle) {
        alert("No se pudo extraer el título de la conversación. Asegúrate de que haya una conversación activa con un título.");
        return;
    }

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[selectedFolderName]) {
        // Generar un ID único para la conversación
        const conversationId = Date.now().toString(); // Timestamp como ID simple
        storedFolders[selectedFolderName].push({
            id: conversationId,
            timestamp: new Date().toLocaleString(),
            title: conversationTitle, // Guardar el título
            url: conversationUrl // Guardar la URL
        });
        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        alert("Conversación guardada exitosamente en la carpeta: " + selectedFolderName);
        loadAndDisplayFolders(); // Recargar la lista para mostrar la conversación guardada
    } else {
        alert("La carpeta seleccionada no existe. Por favor, recarga el complemento.");
    }
}

// NUEVA FUNCIÓN: Para extraer el título de la conversación actual
function extractConversationTitle() {
    // Buscamos el elemento que contiene el título de la conversación en la barra lateral izquierda
    // Basado en el HTML que me diste, el título de la conversación seleccionada está en:
    // <div _ngcontent-ng-c976314112="" class="conversation-title ng-tns-c976314112-48 gds-label-l">
    // O si es un Gem, podría ser en <span _ngcontent-ng-c963043495="" class="bot-name gds-body-m">Asistente de programación</span>
    
    // Primero, intenta obtener el título de una conversación del historial
    const selectedConversationTitleElement = document.querySelector('.conversation.selected .conversation-title');
    if (selectedConversationTitleElement) {
        return selectedConversationTitleElement.textContent.trim();
    }

    // Si no es una conversación del historial, podría ser un "Gem"
    const currentGemTitleElement = document.querySelector('.bot-item.selected .bot-name');
    if (currentGemTitleElement) {
        return currentGemTitleElement.textContent.trim();
    }

    // Como último recurso, si no hay un título específico, podrías intentar con el título de la página
    // o un valor por defecto.
    const pageTitle = document.title;
    if (pageTitle && pageTitle.includes('Gemini')) {
        return pageTitle.replace('Gemini - ', '').trim();
    }
    
    return "Conversación sin título"; // Si no se encuentra ningún título
}


// NUEVA FUNCIÓN: Para abrir la URL de la conversación guardada
function openGeminiChat(event) {
    const conversationUrl = event.target.dataset.conversationUrl;
    if (conversationUrl) {
        // Abrir la URL en la misma pestaña
        window.location.href = conversationUrl;
        // Ocultar la barra lateral si está visible
        document.getElementById(SIDEBAR_ID).classList.add('hidden');
    } else {
        alert("No se pudo encontrar la URL de esta conversación.");
    }
}

// Ya no es necesaria, ya que abrimos el chat original
// function displayConversationContent() { ... } 
// function closeDisplayedConversation() { ... }


// Ejecutar la inicialización cuando el DOM esté cargado (sin cambios)
window.requestIdleCallback(() => {
    initializeSidebar();
    addToggleButton();
});

// Observar cambios en el DOM de Gemini (sin cambios)
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