import FolderManager from '../src/scripts/folderManager.js';

// Mock dependencies
const mockStorage = {
    getFolders: jest.fn(),
    saveFolders: jest.fn(),
};

const mockUI = {
    renderFolders: jest.fn(),
};

// Mock utils
jest.mock('../src/scripts/utils.js', () => ({
    showToast: jest.fn(),
    extractRealConversationIdFromCurrentUrl: jest.fn(),
    extractConversationTitle: jest.fn(),
}));

import { showToast, extractRealConversationIdFromCurrentUrl, extractConversationTitle } from '../src/scripts/utils.js';

describe('FolderManager', () => {
    let folderManager;

    beforeEach(() => {
        folderManager = new FolderManager(mockStorage, mockUI);
        jest.clearAllMocks();

        // Mock DOM elements needed for createFolder
        document.body.innerHTML = `
      <input id="new-folder-name" value="New Folder" />
      <ul id="folders-list-ul"></ul>
    `;
    });

    test('loadAndDisplayFolders should fetch folders and render them', async () => {
        const mockFolders = { 'Folder 1': [] };
        mockStorage.getFolders.mockResolvedValue(mockFolders);

        await folderManager.loadAndDisplayFolders();

        expect(mockStorage.getFolders).toHaveBeenCalled();
        expect(mockUI.renderFolders).toHaveBeenCalledWith(mockFolders, expect.any(Object), undefined, undefined);
    });

    test('createFolder should create a new folder if it does not exist', async () => {
        mockStorage.getFolders.mockResolvedValue({});

        await folderManager.createFolder();

        expect(mockStorage.saveFolders).toHaveBeenCalledWith({ 'New Folder': [] });
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('creada exitosamente'), 'success');
    });

    test('createFolder should not create folder if name is empty', async () => {
        document.getElementById('new-folder-name').value = '';

        await folderManager.createFolder();

        expect(mockStorage.saveFolders).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('ingresa un nombre'), 'warning');
    });

    test('createFolder should not create folder if it already exists', async () => {
        mockStorage.getFolders.mockResolvedValue({ 'New Folder': [] });

        await folderManager.createFolder();

        expect(mockStorage.saveFolders).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('ya existe'), 'warning');
    });

    test('saveCurrentConversation should save conversation to folder', async () => {
        extractRealConversationIdFromCurrentUrl.mockReturnValue('123');
        extractConversationTitle.mockReturnValue('Test Chat');
        mockStorage.getFolders.mockResolvedValue({ 'Target Folder': [] });

        // Mock window.location.href
        delete window.location;
        window.location = { href: 'https://gemini.google.com/app/123' };

        await folderManager.saveCurrentConversation('Target Folder');

        expect(mockStorage.saveFolders).toHaveBeenCalledWith({
            'Target Folder': [
                expect.objectContaining({ id: '123', title: 'Test Chat' })
            ]
        });
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('guardada en la carpeta'), 'success');
    });
});
