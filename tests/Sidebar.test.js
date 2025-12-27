import Sidebar from '../src/scripts/components/Sidebar.js';

describe('Sidebar', () => {
    let sidebar;

    beforeEach(() => {
        document.body.innerHTML = '';
        sidebar = new Sidebar();
    });

    test('initial state has no active section', () => {
        expect(sidebar.activeSection).toBeNull();
    });

    test('initialize creates element and returns it', () => {
        const el = sidebar.initialize();
        expect(el).not.toBeNull();
        expect(el.id).toBe('gemini-organizer-sidebar');
        expect(sidebar.element).toBe(el);
    });

    test('toggleSectionVisibility switches sections', () => {
        sidebar.initialize();
        // Mock getElementById behavior for sections within the sidebar if needed, 
        // but since we append to DOM in real app, we might need to append here too.
        // For unit test simple check:
        document.body.appendChild(sidebar.element);

        sidebar.toggleSectionVisibility('create-folder-container');
        expect(sidebar.activeSection).toBe('create-folder-container');
        
        const createContainer = sidebar.element.querySelector('#create-folder-container');
        expect(createContainer.classList.contains('hidden')).toBe(false);

        // Toggle off
        sidebar.toggleSectionVisibility('create-folder-container');
        expect(sidebar.activeSection).toBeNull();
        expect(createContainer.classList.contains('hidden')).toBe(true);
    });

    test('toggleVisibility hides/shows main sidebar', () => {
        sidebar.initialize();
        document.body.appendChild(sidebar.element);
        
        // Initial state is hidden by default in render?
        // Let's check render(): class="hidden"
        expect(sidebar.element.classList.contains('hidden')).toBe(true);

        sidebar.toggleVisibility();
        expect(sidebar.element.classList.contains('hidden')).toBe(false);
        
        sidebar.toggleVisibility();
        expect(sidebar.element.classList.contains('hidden')).toBe(true);
    });
});
