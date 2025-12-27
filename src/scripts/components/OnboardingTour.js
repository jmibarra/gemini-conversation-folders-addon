import Component from '../core/Component.js';

export default class OnboardingTour extends Component {
    constructor(props) {
        super(props);
        this.onClose = props.onClose || (() => {});
        this.handleClose = this.handleClose.bind(this);
    }

    render() {
        return `
            <div id="onboarding-overlay" class="onboarding-overlay">
                <div class="onboarding-modal">
                    <div class="onboarding-header">
                        <h2>¡Bienvenido al Organizador de Gemini! 🚀</h2>
                    </div>
                    <div class="onboarding-content">
                        <p>Gracias por instalar la extensión. Aquí tienes algunos tips para empezar:</p>
                        <ul>
                            <li>
                                <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="create_new_folder" fonticon="create_new_folder"></mat-icon>
                                <div class="text-content">
                                    <strong>Crea carpetas</strong> para organizar tus chats por temas.
                                </div>
                            </li>
                            <li>
                                <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="save" fonticon="save"></mat-icon>
                                <div class="text-content">
                                    <strong>Guarda conversaciones</strong> actuales haciendo clic en "Guardar" o usando el menú contextual.
                                </div>
                            </li>
                            <li>
                                <mat-icon role="img" class="mat-icon notranslate google-symbols mat-ligature-font mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-name="drag_indicator" fonticon="drag_indicator"></mat-icon>
                                <div class="text-content">
                                    <strong>Arrastra y suelta</strong> tus chats de una carpeta a otra fácilmente.
                                </div>
                            </li>
                        </ul>
                        <div class="onboarding-footer">
                            <button id="onboarding-close-btn" class="primary-btn">¡Entendido, vamos!</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    afterRender() {
        const closeBtn = this.element.querySelector('#onboarding-close-btn');
        if (closeBtn) {
            // Using onclick to ensure one listener and simple binding
            closeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Gemini Organizer: Close tour clicked');
                this.close();
            };
        }
    }

    handleClose() {
        this.close();
    }

    close() {
        console.log('Gemini Organizer: Closing tour');
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.onClose();
    }
}
