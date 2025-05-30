// ID único para el contenedor de nuestro complemento
const SIDEBAR_ID = 'gemini-organizer-sidebar';
const STORAGE_KEY = 'geminiConversations';
const TOGGLE_BUTTON_ID = 'gemini-organizer-toggle-btn';
const TOGGLE_BUTTON_WRAPPER_ID = 'gemini-organizer-wrapper'; // ID para el wrapper del botón

// Función para inicializar la interfaz del complemento (solo crea/obtiene el DIV)
function initializeSidebar() {
    let sidebar = document.getElementById(SIDEBAR_ID);
    if (!sidebar) {
        sidebar = document.createElement('div');
        sidebar.id = SIDEBAR_ID;
        // Solo añadimos la clase 'hidden' si la creamos nosotros.
        // Si ya existe, su visibilidad será controlada por el CSS que ya aplicamos.
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

        // --- Lógica para el Wrapper del Botón (your side-nav-action-button) ---
        if (!ourButtonWrapper) {
            // Si el wrapper no existe, lo creamos y adjuntamos
            ourButtonWrapper = document.createElement('side-nav-action-button');
            ourButtonWrapper.id = TOGGLE_BUTTON_WRAPPER_ID;
            ourButtonWrapper.setAttribute('icon', 'folder_open');
            ourButtonWrapper.setAttribute('arialabel', 'Organizador de Conversaciones');
            ourButtonWrapper.setAttribute('data-test-id', 'gemini-organizer-button');
            // Añadir clases para que se parezca a los demás side-nav-action-button
            ourButtonWrapper.classList.add('mat-mdc-tooltip-trigger', 'ia-redesign', 'ng-star-inserted');

            // --- Lógica para el Botón Interno (button) ---
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
                <div matlistitemicon="" class="mat-mdc-list-item-icon icon-container mdc-list-item__start">
                    <mat-icon role="img" class="mat-icon notranslate gds-icon-l google-symbols mat-ligature-font mat-icon-no-color ng-star-inserted" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="folder_open" fonticon="folder_open"></mat-icon>
                </div>
                <span class="mdc-list-item__content">
                    <span class="mat-mdc-list-item-unscoped-content mdc-list-item__primary-text">
                        <span data-test-id="side-nav-action-button-content" class="gds-body-m">Organizador</span>
                    </span>
                </span>
                <div class="mat-focus-indicator"></div>
            `;
            
            ourButtonWrapper.appendChild(button); // Adjuntar el botón al wrapper
            discoverGemsButtonWrapper.after(ourButtonWrapper); // Adjuntar el wrapper al DOM
        }

        // --- Lógica para la Barra Lateral (sidebar) ---
        if (!sidebar) {
            // Si la barra lateral no existe, la creamos
            sidebar = initializeSidebar(); 
            ourButtonWrapper.appendChild(sidebar); // Y la adjuntamos al wrapper
        } else if (!ourButtonWrapper.contains(sidebar)) {
            // Si existe pero no es hijo de nuestro wrapper (ej. se movió), la re-adjuntamos
            ourButtonWrapper.appendChild(sidebar);
        }

        // --- Adjuntar Event Listeners y Cargar Datos (Solo si no están ya adjuntos) ---
        // Esto previene el error "Cannot read properties of null"
        // y también el error de "listener duplicado" si el observer re-ejecuta esto.

        // Adjuntar event listener al botón principal (si aún no tiene uno)
        if (button && !button.hasAttribute('data-listener-attached')) {
            button.addEventListener('click', toggleSidebarVisibility);
            button.setAttribute('data-listener-attached', 'true'); // Marcar que el listener está adjunto
        }
        
        // Adjuntar event listeners a los botones internos del sidebar (solo si el sidebar está en el DOM)
        if (sidebar && document.body.contains(sidebar)) { // Asegurarse de que el sidebar es parte del DOM
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
            
            // Cargar los datos solo una vez o cuando sea necesario
            if (!sidebar.hasAttribute('data-loaded-once')) {
                loadAndDisplayFolders();
                sidebar.setAttribute('data-loaded-once', 'true');
            }
        }

    } else {
        console.warn('No se pudo encontrar el lugar para insertar el botón "Organizador" en la barra lateral de Gemini. Selector usado: side-nav-action-button[data-test-id="manage-instructions-control"]');
    }
}

// Función para alternar la visibilidad de la barra lateral
function toggleSidebarVisibility() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    const buttonWrapper = document.getElementById(TOGGLE_BUTTON_WRAPPER_ID);

    if (sidebar && buttonWrapper) {
        // Alternar la clase 'hidden' en el sidebar
        sidebar.classList.toggle('hidden');

        // Ya no necesitamos ajustar el margin-bottom dinámicamente aquí.
        // El CSS con height: 0 / height: auto y padding/border transitions se encarga.
        // Las clases 'sidebar-visible' tampoco son necesarias en JS si no hay CSS que dependa de ellas.
    }
}


// Función para cargar y mostrar las carpetas y conversaciones (sin cambios)
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
            
            const convContentWrapper = document.createElement('div');
            convContentWrapper.style.display = 'flex';
            convContentWrapper.style.justifyContent = 'space-between';
            convContentWrapper.style.alignItems = 'center';
            convContentWrapper.style.width = '100%';

            const titleSpan = document.createElement('span');
            titleSpan.textContent = conv.title; 
            titleSpan.dataset.folderName = folderName;
            titleSpan.dataset.convId = conv.id; 
            titleSpan.dataset.conversationUrl = conv.url; 
            titleSpan.classList.add('conversation-title-text'); 
            titleSpan.style.flexGrow = '1'; 
            titleSpan.style.cursor = 'pointer'; 

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-conversation-btn'); 
            deleteButton.innerHTML = `<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="delete" fonticon="delete"></mat-icon>`;
            deleteButton.title = `Eliminar conversación: "${conv.title}"`; 
            deleteButton.dataset.folderName = folderName;
            deleteButton.dataset.convId = conv.id; 

            convContentWrapper.appendChild(titleSpan);
            convContentWrapper.appendChild(deleteButton);
            convLi.appendChild(convContentWrapper);

            titleSpan.addEventListener('click', openGeminiChat);
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


// Ejecutar la inicialización cuando el DOM esté cargado
window.requestIdleCallback(() => {
    addToggleButton();
});

// Observar cambios en el DOM de Gemini para asegurar que el botón y el sidebar persistan
const observer = new MutationObserver((mutationsList, observer) => {
    const toggleButtonWrapper = document.getElementById(TOGGLE_BUTTON_WRAPPER_ID);
    const sidebar = document.getElementById(SIDEBAR_ID);
    const discoverGemsButtonWrapper = document.querySelector('side-nav-action-button[data-test-id="manage-instructions-control"]');

    // Condición para reinicializar:
    // 1. Si no se encuentra el wrapper de nuestro botón.
    // 2. Si el wrapper del botón existe, pero no está en el DOM del body (fue removido).
    // 3. Si el sidebar no existe.
    // 4. Si el sidebar existe, pero no es hijo de nuestro wrapper (fue movido o desadjuntado).
    // 5. Si el elemento de referencia (Descubrir Gems) no está en el DOM (toda la barra lateral se recargó).
    if (!toggleButtonWrapper || !document.body.contains(toggleButtonWrapper) ||
        !sidebar || !toggleButtonWrapper.contains(sidebar) ||
        !discoverGemsButtonWrapper || !document.body.contains(discoverGemsButtonWrapper)) {
        
        console.log('Detectado cambio en la estructura de la barra lateral de Gemini. Reinicializando el complemento.');
        
        // Limpiar elementos existentes para una reinicialización limpia, si están en el DOM.
        if (toggleButtonWrapper && document.body.contains(toggleButtonWrapper)) {
            toggleButtonWrapper.remove();
        }
        if (sidebar && document.body.contains(sidebar)) {
            sidebar.remove(); 
        }

        addToggleButton(); // Intentar añadir de nuevo el botón y el sidebar
    }
});

observer.observe(document.body, { childList: true, subtree: true });