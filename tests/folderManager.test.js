import FolderManager from '../src/scripts/services/FolderManager.js';

// Mock dependencies
const mockStorage = {
    getFolders: jest.fn(),
    saveFolders: jest.fn(),
};

const mockUI = {
    renderFolders: jest.fn(),
    getOpenFolderStates: jest.fn(),
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
    });

    test('loadAndDisplayFolders should fetch folders and render them', async () => {
        const mockFolders = { 'Folder 1': [] };
        const mockOpenStates = { 'Folder 1': true };
        
        mockStorage.getFolders.mockResolvedValue(mockFolders);
        mockUI.getOpenFolderStates.mockReturnValue(mockOpenStates);

        await folderManager.loadAndDisplayFolders();

        expect(mockStorage.getFolders).toHaveBeenCalled();
        expect(mockUI.getOpenFolderStates).toHaveBeenCalled();
        expect(mockUI.renderFolders).toHaveBeenCalledWith(mockFolders, mockOpenStates, undefined, undefined);
    });

    test('createFolder should create a new folder if it does not exist', async () => {
        mockStorage.getFolders.mockResolvedValue({});

        await folderManager.createFolder('New Folder');

        expect(mockStorage.saveFolders).toHaveBeenCalledWith({ 'New Folder': [] });
    });

    test('createFolder should throw error if name is empty', async () => {
        await expect(folderManager.createFolder('')).rejects.toThrow("El nombre de la carpeta no puede estar vacío.");
        expect(mockStorage.saveFolders).not.toHaveBeenCalled();
    });

    test('createFolder should throw error if folder already exists', async () => {
        mockStorage.getFolders.mockResolvedValue({ 'Existing Folder': [] });

        await expect(folderManager.createFolder('Existing Folder')).rejects.toThrow('La carpeta "Existing Folder" ya existe.');
        expect(mockStorage.saveFolders).not.toHaveBeenCalled();
    });

    test('renameFolder should rename folder correctly', async () => {
        const initialFolders = { 'OldName': [{ id: '1', title: 'Chat' }] };
        mockStorage.getFolders.mockResolvedValue(initialFolders);

        await folderManager.renameFolder('OldName', 'NewName');

        expect(mockStorage.saveFolders).toHaveBeenCalledWith({ 'NewName': [{ id: '1', title: 'Chat' }] });
    });

    test('renameFolder should throw error if new name exists', async () => {
         const initialFolders = { 'OldName': [], 'ExistingName': [] };
         mockStorage.getFolders.mockResolvedValue(initialFolders);

         await expect(folderManager.renameFolder('OldName', 'ExistingName')).rejects.toThrow('Ya existe una carpeta con el nombre "ExistingName".');
    });

    test('deleteFolder should delete valid folder', async () => {
        const initialFolders = { 'FolderToDelete': [] };
        mockStorage.getFolders.mockResolvedValue(initialFolders);

        await folderManager.deleteFolder('FolderToDelete');
        
        expect(mockStorage.saveFolders).toHaveBeenCalledWith({});
    });
    
    test('deleteFolder should throw error if folder does not exist', async () => {
        mockStorage.getFolders.mockResolvedValue({});

        await expect(folderManager.deleteFolder('NonExistent')).rejects.toThrow("La carpeta especificada no existe.");
    });

    test('saveCurrentConversation should save conversation to folder', async () => {
        extractRealConversationIdFromCurrentUrl.mockReturnValue('123');
        extractConversationTitle.mockReturnValue('Test Chat');
        mockStorage.getFolders.mockResolvedValue({ 'Target Folder': [] });

        // Mock window.location.href
        const originalLocation = window.location;
        delete window.location;
        window.location = { href: 'https://gemini.google.com/app/123' };

        await folderManager.saveCurrentConversation('Target Folder');

        expect(mockStorage.saveFolders).toHaveBeenCalledWith({
            'Target Folder': [
                expect.objectContaining({ id: '123', title: 'Test Chat' })
            ]
        });
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('guardada en la carpeta'), 'success');
        
        window.location = originalLocation;
    });
});
