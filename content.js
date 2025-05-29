// ID único para el contenedor de nuestro complemento
const SIDEBAR_ID = 'gemini-organizer-sidebar';
const STORAGE_KEY = 'geminiConversations';
const TOGGLE_BUTTON_ID = 'gemini-organizer-toggle-btn';

// Función para inicializar la interfaz del complemento
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
        
        <div id="conversation-display" class="hidden">
            <h4>Conversación Guardada</h4>
            <pre id="displayed-conversation-content"></pre>
            <button class="close-conversation-btn">Cerrar</button>
        </div>
    `;

    document.body.appendChild(sidebar);

    // Adjuntar eventos a los botones y campos
    document.getElementById('create-folder-btn').addEventListener('click', createFolder);
    document.getElementById('save-conversation-btn').addEventListener('click', saveCurrentConversation);
    document.querySelector(`#${SIDEBAR_ID} .close-conversation-btn`).addEventListener('click', closeDisplayedConversation);

    // Cargar y mostrar las carpetas al iniciar (aunque la sidebar esté oculta)
    loadAndDisplayFolders();
}

// NUEVA FUNCIÓN: Para agregar el botón de invocación
function addToggleButton() {
    // Si el botón ya existe, no lo agregamos de nuevo
    if (document.getElementById(TOGGLE_BUTTON_ID)) {
        return;
    }

    // Identificar el elemento de referencia: "Descubrir Gems"
    // Es un side-nav-action-button con data-test-id="manage-instructions-control"
    const discoverGemsButtonWrapper = document.querySelector('side-nav-action-button[data-test-id="manage-instructions-control"]');

    // El contenedor principal para las acciones del top, donde queremos insertar nuestro botón
    // Es el mat-action-list que contiene "Descubrir Gems"
    const topActionList = discoverGemsButtonWrapper?.closest('mat-action-list');


    if (discoverGemsButtonWrapper && topActionList) {
        // Creamos un nuevo elemento side-nav-action-button para nuestro botón
        // Esto ayudará a que se integre visualmente con los demás
        const ourButtonWrapper = document.createElement('side-nav-action-button');
        ourButtonWrapper.id = 'gemini-organizer-wrapper'; // Un ID para nuestro wrapper
        ourButtonWrapper.setAttribute('icon', 'folder_open'); // Puedes elegir un ícono de Google Symbols aquí
        ourButtonWrapper.setAttribute('arialabel', 'Organizador de Conversaciones');
        ourButtonWrapper.setAttribute('data-test-id', 'gemini-organizer-button');
        ourButtonWrapper.classList.add('mat-mdc-tooltip-trigger', 'ia-redesign', 'ng-star-inserted'); // Copiamos clases relevantes

        const button = document.createElement('button');
        button.id = TOGGLE_BUTTON_ID;
        // Copiamos las clases que hacen que los botones de navegación se vean bien
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
        // Nota: la ruta del ícono en mat-icon se basa en la fuente de Google Symbols,
        // no en tu archivo de ícono local. Usaremos "folder_open" como ejemplo.
        // Si quieres usar tu propio PNG, tendrías que cambiar la estructura del <img>.

        ourButtonWrapper.appendChild(button);
        
        // Insertar nuestro wrapper justo después del wrapper de "Descubrir Gems"
        discoverGemsButtonWrapper.after(ourButtonWrapper);

        button.addEventListener('click', toggleSidebarVisibility);
    } else {
        console.warn('No se pudo encontrar el lugar para insertar el botón "Organizador" en la barra lateral de Gemini.');
    }
}

// NUEVA FUNCIÓN: Para alternar la visibilidad de la barra lateral
function toggleSidebarVisibility() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (sidebar) {
        sidebar.classList.toggle('hidden'); // Alterna la clase 'hidden'
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
            // Usamos un título corto o las primeras palabras de la conversación
            const convTitle = conv.content.split('\n')[0].substring(0, 50) + '...'; 
            convLi.textContent = convTitle;
            convLi.dataset.folderName = folderName;
            convLi.dataset.convIndex = index; // Para saber qué conversación mostrar
            conversationsUl.appendChild(convLi);
            convLi.addEventListener('click', displayConversationContent);
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

// Función para guardar la conversación actual (sin cambios)
async function saveCurrentConversation() {
    const folderSelector = document.getElementById('folder-selector');
    const selectedFolderName = folderSelector.value;

    if (!selectedFolderName) {
        alert("Por favor, selecciona una carpeta para guardar la conversación.");
        return;
    }

    const conversationContent = extractConversationContent();

    if (!conversationContent) {
        alert("No se pudo extraer el contenido de la conversación. Asegúrate de que haya una conversación activa.");
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
            content: conversationContent
        });
        await chrome.storage.local.set({ [STORAGE_KEY]: storedFolders });
        alert("Conversación guardada exitosamente en la carpeta: " + selectedFolderName);
        loadAndDisplayFolders(); // Recargar la lista para mostrar la conversación guardada
    } else {
        alert("La carpeta seleccionada no existe. Por favor, recarga el complemento.");
    }
}

// Función para extraer el contenido de la conversación de la página de Gemini (sin cambios)
function extractConversationContent() {
    // ESTA ES LA PARTE CLAVE Y PUEDE REQUERIR AJUSTES SI LA ESTRUCTURA DE GEMINI CAMBIA.
    // Necesitamos encontrar los elementos HTML que contienen las burbujas de chat.
    // Un enfoque común es buscar divs con roles o clases específicas.

    let fullConversationText = '';
    // Ejemplo de un selector CSS que podría funcionar para las burbujas de diálogo en Gemini.
    // Esto es un ejemplo y NECESITARÁ ser verificado y ajustado.
    // Abre las herramientas de desarrollador (F12), inspecciona los elementos del chat de Gemini
    // para encontrar los selectores CSS correctos.
    const chatBubbles = document.querySelectorAll('.message-content, .query-text, .answer-text'); 
    // Los nombres de clase pueden variar, como 'message-bubble', 'user-message', 'gemini-response', etc.
    // Busca divs que contengan el texto de la conversación.

    if (chatBubbles.length === 0) {
        // Intento más genérico si no se encuentran los anteriores
        const potentialChatElements = document.querySelectorAll('[data-text-content], [aria-label*="mensaje"], [data-message-id]');
        // Usa spread operator para convertir NodeList a Array y luego concatenar
        const allPotentialBubbles = [...document.querySelectorAll('[data-text-content]'), ...document.querySelectorAll('[aria-label*="mensaje"]'), ...document.querySelectorAll('[data-message-id]')];
        
        // Filtra elementos que realmente tienen contenido de texto significativo.
        chatBubbles = allPotentialBubbles.filter(el => el.innerText.trim().length > 0);
    }


    chatBubbles.forEach(bubble => {
        // Nos aseguramos de extraer solo texto visible y relevante
        let text = bubble.innerText.trim();
        if (text) {
            // Añadir el rol del hablante (User/Gemini) si es posible inferirlo de la estructura
            // Esto es más complejo y requeriría inspeccionar el DOM en vivo de Gemini.
            // Por ahora, solo añadimos el texto.
            fullConversationText += text + '\n---\n'; // Separador para cada burbuja
        }
    });

    // Eliminar el último separador si existe
    if (fullConversationText.endsWith('\n---\n')) {
        fullConversationText = fullConversationText.slice(0, -5); 
    }

    return fullConversationText;
}

// Función para mostrar el contenido de una conversación guardada (sin cambios)
async function displayConversationContent(event) {
    const folderName = event.target.dataset.folderName;
    const convIndex = parseInt(event.target.dataset.convIndex);

    const data = await chrome.storage.local.get(STORAGE_KEY);
    const storedFolders = data[STORAGE_KEY] || {};

    if (storedFolders[folderName] && storedFolders[folderName][convIndex]) {
        const conversation = storedFolders[folderName][convIndex];
        const conversationDisplay = document.getElementById('conversation-display');
        const displayedContent = document.getElementById('displayed-conversation-content');

        displayedContent.textContent = conversation.content;
        conversationDisplay.classList.remove('hidden');

        // Ocultar la barra lateral principal mientras se muestra la conversación
        document.getElementById(SIDEBAR_ID).classList.add('hidden');
        conversationDisplay.classList.remove('hidden');
    }
}

// Función para cerrar la vista de la conversación guardada (sin cambios)
function closeDisplayedConversation() {
    document.getElementById('conversation-display').classList.add('hidden');
    document.getElementById(SIDEBAR_ID).classList.remove('hidden'); // Mostrar de nuevo la barra lateral
    document.getElementById('displayed-conversation-content').textContent = ''; // Limpiar contenido
}


// Ejecutar la inicialización cuando el DOM esté cargado
// Usamos requestIdleCallback para no bloquear el renderizado inicial de la página
window.requestIdleCallback(() => {
    initializeSidebar();
    addToggleButton(); // Agrega el botón de invocación
});

// Opcional: Observar cambios en el DOM de Gemini para asegurar que la barra lateral esté siempre visible
// Si Gemini recarga partes de la página, nuestro sidebar podría ser eliminado.
// Un MutationObserver puede ayudar a reinicializarlo.
const observer = new MutationObserver((mutationsList, observer) => {
    // Si se detectan cambios significativos en el cuerpo o en la parte principal de la interfaz de Gemini
    // Podrías refinar esto para ser más específico.
    const sidebar = document.getElementById(SIDEBAR_ID);
    const toggleButton = document.getElementById(TOGGLE_BUTTON_ID);

    if (!sidebar || !document.body.contains(sidebar)) {
        initializeSidebar();
    }
    if (!toggleButton || !document.body.contains(toggleButton)) {
        addToggleButton();
    }
});

// Observar el cuerpo del documento para cambios en el DOM.
observer.observe(document.body, { childList: true, subtree: true });