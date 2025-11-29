import { fetchTemplate } from '../utils/templateUtils.js';

export default class Sidebar {
    constructor() {
        this.element = null;
        this.activeSection = null;
    }

    async initialize() {
        let sidebar = document.getElementById('gemini-organizer-sidebar');
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.id = 'gemini-organizer-sidebar';
            sidebar.classList.add('hidden');
            sidebar.innerHTML = await fetchTemplate('src/templates/sidebar.html');
        }
        this.element = sidebar;
        return sidebar;
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
