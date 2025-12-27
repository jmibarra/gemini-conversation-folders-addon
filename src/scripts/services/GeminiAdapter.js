/**
 * Service responsible for all interactions with the underlying Gemini DOM.
 * Centralizes CSS selectors and DOM traversal logic to make the extension
 * more resilient to changes in Google's UI.
 */
export default class GeminiAdapter {
    constructor() {
        this.selectors = {
            myStuffButton: 'side-nav-entry-button[data-test-id="my-stuff-side-nav-entry-button"]',
            newChatButton: 'side-nav-action-button[data-test-id="new-chat-button"]',
            chatHistoryList: '.chat-history-list',
            sidebarContainer: 'mat-sidenav-container', // Broad container, might need refinement
            mainContent: 'main',
        };
    }

    /**
     * Finds the best element to insert the Organizer button relative to.
     * Prioritizes "My Stuff", then "New Chat", then the chat history list.
     * @returns {{ element: HTMLElement, position: 'before' | 'after' } | null}
     */
    getSidebarInsertionPoint() {
        const myStuff = document.querySelector(this.selectors.myStuffButton);
        if (myStuff) return { element: myStuff, position: 'before' };

        const newChat = document.querySelector(this.selectors.newChatButton);
        if (newChat) return { element: newChat, position: 'after' };

        const historyList = document.querySelector(this.selectors.chatHistoryList);
        if (historyList) return { element: historyList.parentNode, position: 'before' }; // Insert before the list container usually

        return null;
    }

    /**
     * Checks if the Gemini UI has fully loaded essential elements.
     * @returns {boolean}
     */
    isReady() {
        return !!(document.querySelector(this.selectors.myStuffButton) || 
                  document.querySelector(this.selectors.newChatButton) || 
                  document.querySelector(this.selectors.chatHistoryList));
    }
}
