import FolderList from '../src/scripts/components/FolderList.js';

describe('FolderList', () => {
    let folderList;

    beforeEach(() => {
        document.body.innerHTML = '';
        folderList = new FolderList();
    });

    test('renderFolders renders empty state when no folders', async () => {
        // Need to create the container first as renderFolders expects it in DOM
        document.body.innerHTML = '<ul id="folders-list-ul"></ul>';
        
        await folderList.renderFolders({}, {}, {}, {});
        
        const container = document.getElementById('folders-list-ul');
        expect(container.querySelector('.empty-state-text')).not.toBeNull();
        expect(container.querySelector('.empty-state-text').textContent).toBe('No tienes carpetas aún.');
    });

    test('renderFolders renders folders list', async () => {
        document.body.innerHTML = '<ul id="folders-list-ul"></ul>';
        const mockFolders = {
            'Work': [],
            'Personal': []
        };
        const mockHandler = {
            addFolderInteractionListeners: jest.fn(),
            addFolderRenameListeners: jest.fn(),
            addConversationListeners: jest.fn()
        };
        const mockDragHandler = {
            handleDragOver: jest.fn(),
            handleDragLeave: jest.fn(),
            handleDrop: jest.fn(),
            handleConversationListDragOver: jest.fn(),
            handleConversationListDrop: jest.fn(),
            handleDragStart: jest.fn()
        };

        await folderList.renderFolders(mockFolders, {}, mockHandler, mockDragHandler);

        const container = document.getElementById('folders-list-ul');
        expect(container.children.length).toBe(2);
        expect(container.textContent).toContain('Work');
        expect(container.textContent).toContain('Personal');
    });

    test('filter hides non-matching items', async () => {
        document.body.innerHTML = '<ul id="folders-list-ul"></ul>';
        const mockFolders = {
            'Alpha': [],
            'Beta': []
        };
        const mockHandler = {
            addFolderInteractionListeners: jest.fn(),
            addFolderRenameListeners: jest.fn(),
            addConversationListeners: jest.fn()
        };
        const mockDragHandler = {
            handleDragOver: jest.fn(),
            handleDragLeave: jest.fn(),
            handleDrop: jest.fn(),
            handleConversationListDragOver: jest.fn(),
            handleConversationListDrop: jest.fn(),
            handleDragStart: jest.fn()
        };

        await folderList.renderFolders(mockFolders, {}, mockHandler, mockDragHandler);
        
        folderList.filter('alpha');
        
        const container = document.getElementById('folders-list-ul');
        const items = container.querySelectorAll('.gemini-folder-item');
        
        // Alpha should be visible
        expect(items[0].style.display).not.toBe('none');
        // Beta should be hidden
        expect(items[1].style.display).toBe('none');
    });
});
