class UI {
    constructor() {
        this.sidebar = null;
        this.toggleButton = null;
        this.activeSection = null;
    }

    initializeSidebar() {
        let sidebar = document.getElementById('gemini-organizer-sidebar');
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.id = 'gemini-organizer-sidebar';
            sidebar.classList.add('hidden');
            sidebar.innerHTML = `
                <div class="sidebar-actions">
                    <button id="create-folder-section-btn" class="sidebar-action-btn">
                        <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="create_new_folder" fonticon="add"></mat-icon>
                        <span>Carpeta</span>
                    </button>
                    <button id="search-section-btn" class="sidebar-action-btn">
                        <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="search" fonticon="search"></mat-icon>
                        <span>Buscar</span>
                    </button>
                </div>
                <div id="create-folder-container" class="collapsible-section hidden">
                    <div class="folder-controls">
                        <h4>Crear Nueva Carpeta</h4>
                        <div class="input-with-button-wrapper">
                            <input type="text" id="new-folder-name" placeholder="Mi carpeta...">
                            <button id="create-folder-btn" title="Crear Carpeta">
                                <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="add" fonticon="add"></mat-icon>
                            </button>
                        </div>
                        </div>
                </div>
                <div id="search-conversations-container" class="collapsible-section hidden">
                    <div class="search-controls">
                        <h4>Buscar Conversaciones</h4>
                        <div class="input-with-button-wrapper">
                            <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="search" fonticon="search"></mat-icon>
                            <input type="search" id="search-conversations-input" placeholder="Buscar en tus carpetas...">
                        </div>
                        </div>
                </div>
                <div class="folders-list">
                    <h4 class="title gds-label-l" style="margin-left: 16px; margin-bottom: 10px;">Tus Carpetas Guardadas</h4>
                    <ul id="folders-list-ul"></ul>
                </div>`;
        }
        this.sidebar = sidebar;
        return sidebar;
    }


    addToggleButton(eventHandler, folderManager) {
        const discoverGemsButtonWrapper = document.querySelector('side-nav-action-button[data-test-id="manage-instructions-control"]');

        if (discoverGemsButtonWrapper) {
            let ourButtonWrapper = document.getElementById('gemini-organizer-wrapper');

            if (!ourButtonWrapper) {
                ourButtonWrapper = document.createElement('side-nav-action-button');
                ourButtonWrapper.id = 'gemini-organizer-wrapper';
                ourButtonWrapper.setAttribute('icon', 'folder_open');
                ourButtonWrapper.setAttribute('arialabel', 'Organizador de Conversaciones');
                ourButtonWrapper.setAttribute('data-test-id', 'gemini-organizer-button');
                ourButtonWrapper.classList.add('mat-mdc-tooltip-trigger', 'ia-redesign', 'ng-star-inserted');

                const button = document.createElement('button');
                button.id = 'gemini-organizer-toggle-btn';
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
                            <span data-test-id="side-nav-action-button-content" class="gds-body-m">Mis conversaciones</span>
                        </span>
                    </span>
                    <div class="mat-focus-indicator"></div>
                `;

                ourButtonWrapper.appendChild(button);
                discoverGemsButtonWrapper.after(ourButtonWrapper);
                this.toggleButton = button;
                
                if (folderManager) {
                    folderManager.loadAndDisplayFolders();
                }
            }

            if (!this.sidebar) {
                this.initializeSidebar();
            }
            if (this.sidebar && !ourButtonWrapper.contains(this.sidebar)) {
                ourButtonWrapper.appendChild(this.sidebar);
            }
            eventHandler.addEventListeners();
        }
    }

    toggleSidebarVisibility() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('hidden');
            // Si el panel se cierra, también cerramos cualquier sección abierta
            if (this.sidebar.classList.contains('hidden')) {
                this.toggleSectionVisibility(null);
            }
        }
    }

    toggleSectionVisibility(sectionId) {
        const createContainer = document.getElementById('create-folder-container');
        const searchContainer = document.getElementById('search-conversations-container');
        const createBtn = document.getElementById('create-folder-section-btn');
        const searchBtn = document.getElementById('search-section-btn');

        // Si la sección clickeada ya está activa, la cerramos
        if (this.activeSection === sectionId) {
            sectionId = null;
        }

        this.activeSection = sectionId;

        // Actualizamos los contenedores
        if (createContainer && searchContainer) {
            createContainer.classList.toggle('hidden', sectionId !== 'create-folder-container');
            searchContainer.classList.toggle('hidden', sectionId !== 'search-conversations-container');
        }

        if (createBtn && searchBtn) {
            createBtn.classList.toggle('active', sectionId === 'create-folder-container');
            searchBtn.classList.toggle('active', sectionId === 'search-conversations-container');
        }
    }
    
    renderFolders(folders, openFolderStates, eventHandler, dragAndDropHandler) {
        const foldersListUl = document.getElementById('folders-list-ul');
        if (!foldersListUl) return;

        foldersListUl.innerHTML = '';
        const sortedFolderNames = Object.keys(folders).sort();

        for (const folderName of sortedFolderNames) {
            const folder = folders[folderName];
            const folderContainer = this.createFolderElement(folderName, folder, openFolderStates, eventHandler, dragAndDropHandler);
            foldersListUl.appendChild(folderContainer);
        }
    }

    createFolderElement(folderName, folder, openFolderStates, eventHandler, dragAndDropHandler) {
        const folderContainer = document.createElement('li');
        folderContainer.classList.add('gemini-folder-item');

        const folderHeader = this.createFolderHeader(folderName, dragAndDropHandler);
        const conversationsWrapper = this.createConversationsWrapper(folderName, folder, eventHandler, dragAndDropHandler);

        folderContainer.appendChild(folderHeader);
        folderContainer.appendChild(conversationsWrapper);

        const [folderTitle, editButton, deleteButton, expandIcon] = folderHeader.children;

        eventHandler.addFolderInteractionListeners(folderHeader, conversationsWrapper, expandIcon, editButton, deleteButton, folderName, folderTitle);

        if (!openFolderStates[folderName]) {
            conversationsWrapper.classList.add('hidden');
            expandIcon.setAttribute('fonticon', 'expand_more');
            expandIcon.setAttribute('data-mat-icon-name', 'expand_more');
        } else {
            conversationsWrapper.classList.remove('hidden');
            expandIcon.setAttribute('fonticon', 'expand_less');
            expandIcon.setAttribute('data-mat-icon-name', 'expand_less');
        }

        return folderContainer;
    }

    createFolderHeader(folderName, dragAndDropHandler) {
        const folderHeader = document.createElement('div');
        folderHeader.classList.add('title-container');
        folderHeader.setAttribute('role', 'button');
        folderHeader.setAttribute('tabindex', '0');
        folderHeader.dataset.folderName = folderName;
        folderHeader.addEventListener('dragover', dragAndDropHandler.handleDragOver.bind(dragAndDropHandler));
        folderHeader.addEventListener('dragleave', dragAndDropHandler.handleDragLeave.bind(dragAndDropHandler));
        folderHeader.addEventListener('drop', dragAndDropHandler.handleDrop.bind(dragAndDropHandler));

        folderHeader.innerHTML = `
            <span class="title gds-label-l gemini-folder-title" data-folder-name="${folderName}">${folderName}</span>
            <button class="edit-folder-btn" title="Renombrar carpeta: &quot;${folderName}&quot;" data-folder-name="${folderName}"><mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="edit" fonticon="edit"></mat-icon></button>
            <button class="delete-folder-btn" title="Eliminar carpeta: &quot;${folderName}&quot;" data-folder-name="${folderName}"><mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="delete" fonticon="delete"></mat-icon></button>
            <mat-icon role="img" class="mat-icon notranslate gds-icon-l google-symbols mat-ligature-font mat-icon-no-color gemini-expand-icon" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="expand_more" fonticon="expand_more"></mat-icon>
        `;
        return folderHeader;
    }

    createConversationsWrapper(folderName, conversations, eventHandler, dragAndDropHandler) {
        const conversationsWrapper = document.createElement('div');
        conversationsWrapper.classList.add('conversations-list-wrapper');

        const conversationsUl = document.createElement('ul');
        conversationsUl.classList.add('conversation-items-container', 'side-nav-opened');
        conversationsUl.dataset.folderName = folderName;
        conversationsUl.addEventListener('dragover', dragAndDropHandler.handleConversationListDragOver.bind(dragAndDropHandler));
        conversationsUl.addEventListener('drop', dragAndDropHandler.handleConversationListDrop.bind(dragAndDropHandler));

        conversations.forEach((conv, index) => {
            const convItem = this.createConversationElement(conv, folderName, index, eventHandler, dragAndDropHandler);
            conversationsUl.appendChild(convItem);
        });

        conversationsWrapper.appendChild(conversationsUl);
        return conversationsWrapper;
    }

    createConversationElement(conv, folderName, index, eventHandler, dragAndDropHandler) {
        const convItem = document.createElement('li');
        convItem.classList.add('conversation-item-wrapper');
        convItem.setAttribute('draggable', 'true');
        convItem.dataset.folderName = folderName;
        convItem.dataset.convId = conv.id;
        convItem.dataset.convTitle = conv.title;
        convItem.dataset.convUrl = conv.url;
        convItem.dataset.originalIndex = index;
        convItem.addEventListener('dragstart', dragAndDropHandler.handleDragStart.bind(dragAndDropHandler));
        convItem.addEventListener('dragend', (event) => event.target.classList.remove('is-dragging'));

        convItem.innerHTML = `
            <div class="conversation-item-content">
                <div class="conversation-title gds-body-m" data-folder-name="${folderName}" data-conv-id="${conv.id}" style="flex-grow: 1; cursor: pointer;" title="${conv.title}">${conv.title}</div>
                <button class="delete-conversation-btn" title="Eliminar conversación: &quot;${conv.title}&quot;" data-folder-name="${folderName}" data-conv-id="${conv.id}"><mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="delete" fonticon="delete"></mat-icon></button>
            </div>
        `;

        eventHandler.addConversationListeners(convItem);
        return convItem;
    }

    enableFolderEditMode(folderName, folderTitleElement, deleteBtn, editBtn, expandIcon, eventHandler) {
        const originalFolderName = folderName;
        folderTitleElement.style.display = 'none';
        deleteBtn.style.display = 'none';
        editBtn.style.display = 'none';
        expandIcon.style.display = 'none';

        const inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.value = originalFolderName;
        inputField.classList.add('folder-rename-input');
        inputField.dataset.originalFolderName = originalFolderName;

        folderTitleElement.parentNode.insertBefore(inputField, folderTitleElement);
        inputField.focus();
        inputField.select();

        eventHandler.addFolderRenameListeners(inputField, originalFolderName, folderTitleElement, deleteBtn, editBtn, expandIcon);
    }

    openGeminiChat(event) {
        const conversationId = event.target.dataset.convId;
        if (conversationId) {
            const selector = '.chat-history-list .conversation[jslog*="\\"c_' + conversationId + '\\""]';
            const targetConversationElement = document.querySelector(selector);

            if (targetConversationElement) {
                const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true, buttons: 1 });
                const mouseDownEvent = new MouseEvent('mousedown', { view: window, bubbles: true, cancelable: true, buttons: 1 });
                const mouseUpEvent = new MouseEvent('mouseup', { view: window, bubbles: true, cancelable: true });

                targetConversationElement.dispatchEvent(mouseDownEvent);
                targetConversationElement.dispatchEvent(mouseUpEvent);
                targetConversationElement.dispatchEvent(clickEvent);

                setTimeout(() => {
                    this.sidebar.classList.add('hidden');
                }, 100);

            } else {
                showToast(`No se pudo cargar la conversación rápidamente. Recargando página...`, 'info');
                window.location.href = `https://gemini.google.com/app/${conversationId}`;
                this.sidebar.classList.add('hidden');
            }
        } else {
            showToast("No se pudo encontrar el ID de esta conversación.", 'error');
        }
    }

    filterConversationsAndFolders() {
        const searchTerm = document.getElementById('search-conversations-input').value.toLowerCase().trim();
        const foldersListUl = document.getElementById('folders-list-ul');
        const folderItems = foldersListUl.querySelectorAll('.gemini-folder-item');

        folderItems.forEach(folderItem => {
            const folderTitleElement = folderItem.querySelector('.gemini-folder-title');
            const folderName = folderTitleElement.textContent.toLowerCase();
            const conversationsWrapper = folderItem.querySelector('.conversations-list-wrapper');
            const conversationItems = conversationsWrapper.querySelectorAll('.conversation-item-wrapper');
            const expandIcon = folderItem.querySelector('.gemini-expand-icon');

            let folderMatches = folderName.includes(searchTerm);
            let anyConversationMatches = false;

            conversationItems.forEach(convItem => {
                const convTitle = convItem.querySelector('.conversation-title').textContent.toLowerCase();
                if (convTitle.includes(searchTerm)) {
                    convItem.style.display = '';
                    anyConversationMatches = true;
                } else {
                    convItem.style.display = 'none';
                }
            });

            if (searchTerm === '') {
                folderItem.style.display = '';
                conversationsWrapper.classList.add('hidden');
                expandIcon.setAttribute('fonticon', 'expand_more');
                expandIcon.setAttribute('data-mat-icon-name', 'expand_more');
                conversationItems.forEach(convItem => convItem.style.display = '');
                return;
            }

            if (folderMatches || anyConversationMatches) {
                folderItem.style.display = '';
                conversationsWrapper.classList.remove('hidden');
                expandIcon.setAttribute('fonticon', 'expand_less');
                expandIcon.setAttribute('data-mat-icon-name', 'expand_less');
            } else {
                folderItem.style.display = 'none';
            }
        });
    }
}