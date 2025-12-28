import Storage from '../src/scripts/services/Storage.js';

// Mock chrome.storage
global.chrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
        },
        sync: {
            get: jest.fn(),
            set: jest.fn(),
        },
    },
};

describe('Storage', () => {
    let storage;

    beforeEach(() => {
        storage = new Storage('testKey');
        jest.clearAllMocks();
    });

    test('should set storage area to local', async () => {
        await storage.setStorageArea('local');
        expect(storage.storageArea).toBe(chrome.storage.local);
    });

    test('should set storage area to sync', async () => {
        await storage.setStorageArea('sync');
        expect(storage.storageArea).toBe(chrome.storage.sync);
    });

    test('should get folders from storage', async () => {
        await storage.setStorageArea('local');
        const mockData = { testKey: { folder1: [] } };
        chrome.storage.local.get.mockResolvedValue(mockData);

        const folders = await storage.getFolders();
        expect(chrome.storage.local.get).toHaveBeenCalledWith('testKey');
        expect(folders).toEqual(mockData.testKey);
    });

    test('should return empty object if no folders found', async () => {
        await storage.setStorageArea('local');
        chrome.storage.local.get.mockResolvedValue({});

        const folders = await storage.getFolders();
        expect(folders).toEqual({});
    });

    test('should save folders to storage', async () => {
        await storage.setStorageArea('local');
        const folders = { folder1: [] };

        await storage.saveFolders(folders);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ testKey: folders });
    });
});
