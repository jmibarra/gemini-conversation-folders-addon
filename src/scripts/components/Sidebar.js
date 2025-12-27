import Component from '../core/Component.js';

export default class Sidebar extends Component {
    constructor() {
        super();
        this.activeSection = null;
    }

    render() {
        return `
            <div id="gemini-organizer-sidebar" class="hidden">
                <div class="sidebar-actions">
                    <div class="action-buttons-group">
                        <button id="create-folder-section-btn" class="sidebar-action-btn">
                            <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="create_new_folder" fonticon="add"></mat-icon>
                            <span>Carpeta</span>
                        </button>
                        <button id="search-section-btn" class="sidebar-action-btn">
                            <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="search" fonticon="search"></mat-icon>
                            <span>Buscar</span>
                        </button>
                    </div>
                    <button id="open-options-btn" class="settings-btn" title="Abrir configuración">
                        <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="settings" fonticon="settings"></mat-icon>
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
                    <div class="folders-list-header">
                        <h4 class="title gds-label-l">Tus Carpetas Guardadas</h4>
                        <span id="sync-status-icon" class="sync-status-indicator"></span>
                    </div>
                    <ul id="folders-list-ul"></ul>
                </div>
            </div>
        `;
    }

    /**
     * Initializes the component.
     * Replaces previous async initialize with synchronous creation via Component.create().
     */
    initialize() {
        if (!this.element) {
            this.create();
        }
        return this.element;
    }

    toggleVisibility() {
        if (this.element) {
            this.element.classList.toggle('hidden');
            if (this.element.classList.contains('hidden')) {
                this.toggleSectionVisibility(null);
            }
        }
    }

    toggleSectionVisibility(sectionId) {
        const createContainer = document.getElementById('create-folder-container');
        const searchContainer = document.getElementById('search-conversations-container');
        const createBtn = document.getElementById('create-folder-section-btn');
        const searchBtn = document.getElementById('search-section-btn');

        if (this.activeSection === sectionId) {
            sectionId = null;
        }

        this.activeSection = sectionId;

        if (createContainer && searchContainer) {
            createContainer.classList.toggle('hidden', sectionId !== 'create-folder-container');
            searchContainer.classList.toggle('hidden', sectionId !== 'search-conversations-container');
        }

        if (createBtn && searchBtn) {
            createBtn.classList.toggle('active', sectionId === 'create-folder-container');
            searchBtn.classList.toggle('active', sectionId === 'search-conversations-container');
        }
    }

    updateSyncStatusIcon(isSyncEnabled) {
        const iconElement = document.getElementById('sync-status-icon');
        if (iconElement) {
            if (isSyncEnabled) {
                iconElement.innerHTML = `<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="cloud" fonticon="cloud"></mat-icon>`;
                iconElement.title = 'Carpetas sincronizadas con tu cuenta de Google.';
            } else {
                iconElement.innerHTML = `<mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="cloud_off" fonticon="cloud_off"></mat-icon>`;
                iconElement.title = 'Carpetas guardadas localmente en este dispositivo.';
            }
        }
    }

    hide() {
        if (this.element) {
            this.element.classList.add('hidden');
        }
    }
}
