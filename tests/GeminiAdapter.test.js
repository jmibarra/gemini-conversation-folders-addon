import GeminiAdapter from '../src/scripts/services/GeminiAdapter.js';

describe('GeminiAdapter', () => {
    let adapter;

    beforeEach(() => {
        // Limpiar el cuerpo del documento antes de cada prueba
        document.body.innerHTML = '';
        adapter = new GeminiAdapter();
    });

    test('getSidebarInsertionPoint priority 1: My Stuff Button', () => {
        const myStuff = document.createElement('side-nav-entry-button');
        myStuff.setAttribute('data-test-id', 'my-stuff-side-nav-entry-button');
        document.body.appendChild(myStuff);

        const point = adapter.getSidebarInsertionPoint();
        expect(point).not.toBeNull();
        expect(point.element).toBe(myStuff);
        expect(point.position).toBe('before');
    });

    test('getSidebarInsertionPoint priority 2: New Chat Button', () => {
        const newChat = document.createElement('side-nav-action-button');
        newChat.setAttribute('data-test-id', 'new-chat-button');
        document.body.appendChild(newChat);

        const point = adapter.getSidebarInsertionPoint();
        expect(point).not.toBeNull();
        expect(point.element).toBe(newChat);
        expect(point.position).toBe('after');
    });

    test('getSidebarInsertionPoint priority 3: Chat History', () => {
        const historyContainer = document.createElement('div');
        historyContainer.className = 'chat-history-container';
        const list = document.createElement('div');
        list.className = 'chat-history-list';
        historyContainer.appendChild(list);
        document.body.appendChild(historyContainer);

        const point = adapter.getSidebarInsertionPoint();
        expect(point).not.toBeNull();
        expect(point.element).toBe(historyContainer); // Debería ser el padre
        expect(point.position).toBe('before');
    });

    test('getSidebarInsertionPoint returns null if nothing found', () => {
        const point = adapter.getSidebarInsertionPoint();
        expect(point).toBeNull();
    });
});
