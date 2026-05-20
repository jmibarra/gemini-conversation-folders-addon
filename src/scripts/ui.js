import Sidebar from './components/Sidebar.js';
import FolderList from './components/FolderList.js';
import FolderIndicator from './components/FolderIndicator.js';
import GeminiAdapter from './services/GeminiAdapter.js';

export default class UI {
    constructor() {
        this.sidebarComponent = new Sidebar();
        this.folderListComponent = new FolderList();
        this.folderIndicatorComponent = new FolderIndicator();
        this.conversationListComponent = this.folderListComponent.conversationList; // Utility access
        this.geminiAdapter = new GeminiAdapter();

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
        // Use the specific method for updating folders, not the generic Component.render
        return this.folderListComponent.renderFolders(folders, openFolderStates, eventHandler, dragAndDropHandler);
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

    getOpenFolderStates() {
        return this.folderListComponent.getOpenFolderStates();
    }

    openGeminiChat(event) {
        // Use the dataset from the clicked element
        const conversationId = event.target.dataset.convId;
        this.conversationListComponent.openChat(conversationId, this.sidebarComponent);
    }

    async addToggleButton(eventHandler, folderManager) {
        const insertionPoint = this.geminiAdapter.getSidebarInsertionPoint();
        
        if (insertionPoint) {
            const { element: anchorElement, position } = insertionPoint;
            
            let ourButtonWrapper = document.getElementById('gemini-organizer-wrapper');

            if (!ourButtonWrapper) {
                ourButtonWrapper = document.createElement('div');
                ourButtonWrapper.id = 'gemini-organizer-wrapper';
                ourButtonWrapper.setAttribute('data-test-id', 'gemini-organizer-button');

                const button = document.createElement('gem-nav-list-item');
                button.id = 'gemini-organizer-toggle-btn';
                button.classList.add('ng-star-inserted');

                button.innerHTML = `
                    <a mat-list-item="" class="mat-mdc-list-item mdc-list-item gem-nav-list-item gmat-override mat-mdc-list-item-interactive mat-mdc-list-item-single-line mdc-list-item--with-one-line mdc-list-item--with-leading-icon" tabindex="0" role="button" aria-label="Organizador de Conversaciones" style="cursor: pointer;">
                        <div matlistitemicon="" class="mat-mdc-list-item-icon leading-icon-container mdc-list-item__start">
                            <gem-icon class="gem-nav-list-item-icon">
                                <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font">folder_open</mat-icon>
                            </gem-icon>
                        </div>
                        <span class="mdc-list-item__content">
                            <span class="mat-mdc-list-item-unscoped-content mdc-list-item__primary-text">
                                <span class="label-and-badge">
                                    <span class="title-text gds-emphasized-body-s">Mis conversaciones</span>
                                </span>
                            </span>
                        </span>
                        <div class="mat-focus-indicator"></div>
                    </a>
                `;

                ourButtonWrapper.appendChild(button);
                
                if (position === 'before') {
                    anchorElement.parentNode.insertBefore(ourButtonWrapper, anchorElement);
                } else {
                    anchorElement.after(ourButtonWrapper);
                }
                
                this.toggleButton = button;
            }

            if (!this.sidebarComponent.element) {
                await this.initializeSidebar();
            }
            // Ensure sidebar is in the DOM (inside our wrapper for relative positioning if needed, or just somewhere)
            /* 
               Original code:
               if (this.sidebarComponent.element && !ourButtonWrapper.contains(this.sidebarComponent.element)) {
                   ourButtonWrapper.appendChild(this.sidebarComponent.element);
               }
               The Sidebar CSS #gemini-organizer-sidebar is position:static but opacity:0/height:0.
               Appending it to the wrapper makes sense for context.
            */
            if (this.sidebarComponent.element && !ourButtonWrapper.contains(this.sidebarComponent.element)) {
                ourButtonWrapper.appendChild(this.sidebarComponent.element);
            }
            
            eventHandler.addEventListeners();
        }
    }
}