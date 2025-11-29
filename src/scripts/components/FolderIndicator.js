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
        const proButtonPillbox = await waitForElement('div[data-test-id="pillbox"]');

        // 2. A partir de ahí, encontramos el contenedor padre que agrupa todos los botones.
        const targetContainer = proButtonPillbox ? proButtonPillbox.closest('.buttons-container') : null;

        if (!targetContainer) {
            // Si después de esperar sigue sin encontrarlo, el error nos dará una pista.
            console.error('No se pudo encontrar el contenedor de botones (`.buttons-container`) para el indicador.');
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
