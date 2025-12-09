import Sidebar from './components/Sidebar.js';
import FolderList from './components/FolderList.js';
import FolderIndicator from './components/FolderIndicator.js';
import ConversationList from './components/ConversationList.js';

export default class UI {
    constructor() {
        this.sidebarComponent = new Sidebar();
        this.folderListComponent = new FolderList();
        this.folderIndicatorComponent = new FolderIndicator();
        this.conversationListComponent = this.folderListComponent.conversationList;

        this.toggleButton = null;
    }

    get sidebar() {
        return this.sidebarComponent.element;
    }

    get activeSection() {
        return this.sidebarComponent.activeSection;
    }

    async initializeSidebar() {
        return this.sidebarComponent.initialize();
    }

    updateSyncStatusIcon(isSyncEnabled) {
        this.sidebarComponent.updateSyncStatusIcon(isSyncEnabled);
    }

    toggleSidebarVisibility() {
        this.sidebarComponent.toggleVisibility();
    }

    toggleSectionVisibility(sectionId) {
        this.sidebarComponent.toggleSectionVisibility(sectionId);
    }

    async renderFolders(folders, openFolderStates, eventHandler, dragAndDropHandler) {
        return this.folderListComponent.render(folders, openFolderStates, eventHandler, dragAndDropHandler);
    }

    enableFolderEditMode(folderName, folderTitleElement, deleteBtn, editBtn, expandIcon, eventHandler) {
        this.folderListComponent.enableEditMode(folderName, folderTitleElement, deleteBtn, editBtn, expandIcon, eventHandler);
    }

    filterConversationsAndFolders() {
        const searchInput = document.getElementById('search-conversations-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        this.folderListComponent.filter(searchTerm);
    }

    async displayFolderIndicator(folderName) {
        return this.folderIndicatorComponent.display(folderName);
    }

    openGeminiChat(event) {
        const conversationId = event.target.dataset.convId;
        this.conversationListComponent.openChat(conversationId, this.sidebarComponent);
    }

    async addToggleButton(eventHandler, folderManager) {
        // Updated anchor selector: prioritized 'My Stuff' button, then 'New Chat', then fallback to list container
        const myStuffButton = document.querySelector('side-nav-entry-button[data-test-id="my-stuff-side-nav-entry-button"]');
        const newChatButton = document.querySelector('side-nav-action-button[data-test-id="new-chat-button"]');
        const chatHistoryList = document.querySelector('.chat-history-list');

        let anchorElement = myStuffButton || newChatButton || chatHistoryList;
        let insertPosition = myStuffButton ? 'before' : (newChatButton ? 'after' : 'before');

        if (anchorElement) {
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
                
                if (insertPosition === 'before') {
                    anchorElement.parentNode.insertBefore(ourButtonWrapper, anchorElement);
                } else {
                    anchorElement.after(ourButtonWrapper);
                }
                
                this.toggleButton = button;
            }

            if (!this.sidebarComponent.element) {
                await this.initializeSidebar();
            }
            if (this.sidebarComponent.element && !ourButtonWrapper.contains(this.sidebarComponent.element)) {
                ourButtonWrapper.appendChild(this.sidebarComponent.element);
            }
            eventHandler.addEventListeners();
        }
    }
}