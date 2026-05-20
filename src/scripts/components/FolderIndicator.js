import { waitForElement } from '../utils.js';

export default class FolderIndicator {
    async display(folderName) {
        const existingIndicator = document.getElementById('gemini-organizer-folder-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (!folderName) {
            return;
        }

        // 1. Esperamos a que aparezca un elemento estable y único: el botón "PRO".
        let targetContainer = null;
        const proButtonPillbox = await waitForElement('div[data-test-id="pillbox"]', 1500);

        if (proButtonPillbox) {
            // 2. A partir de ahí, encontramos el contenedor padre que agrupa todos los botones.
            targetContainer = proButtonPillbox.closest('.buttons-container');
        }

        if (!targetContainer) {
            // Fallbacks for the new UI
            targetContainer = document.querySelector('header') || document.querySelector('top-bar') || document.querySelector('main');
        }

        if (!targetContainer) {
            console.error('No se pudo encontrar un contenedor válido (header, main o .buttons-container) para el indicador.');
            return;
        }

        const indicator = document.createElement('div');
        indicator.id = 'gemini-organizer-folder-indicator';
        indicator.title = `Guardado en la carpeta: ${folderName}`;
        indicator.innerHTML = `
            <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="folder" fonticon="folder"></mat-icon>
            <span>${folderName}</span>
        `;

        // 3. Insertamos nuestro indicador al principio de ese contenedor.
        targetContainer.prepend(indicator);
    }
}
