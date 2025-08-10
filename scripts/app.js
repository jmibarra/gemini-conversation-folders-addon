class App {
    constructor() {
        this.ui = new UI();
        this.storage = new Storage('geminiConversations');
        this.folderManager = new FolderManager(this.storage, this.ui);
        this.dragAndDropHandler = new DragAndDrop(this.storage, this.folderManager);
        this.eventHandler = new EventHandler(this.ui, this.folderManager, this.dragAndDropHandler);

        this.folderManager.setEventHandler(this.eventHandler);
        this.folderManager.setDragAndDropHandler(this.dragAndDropHandler);

        this.observer = new MutationObserver(this.handleMutations.bind(this));
    }

    init() {
        window.requestIdleCallback(() => {
            this.ui.addToggleButton(this.eventHandler);
            this.folderManager.loadAndDisplayFolders();
            this.dragAndDropHandler.setupDraggableConversations();
            this.observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    handleMutations() {
        const toggleButtonWrapper = document.getElementById('gemini-organizer-wrapper');
        if (!toggleButtonWrapper || !document.body.contains(toggleButtonWrapper)) {
            this.ui.addToggleButton(this.eventHandler);
        }
        this.dragAndDropHandler.setupDraggableConversations();
    }
}
