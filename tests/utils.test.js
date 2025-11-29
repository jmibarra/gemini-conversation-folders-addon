import { extractRealConversationIdFromCurrentUrl } from '../src/scripts/utils.js';

describe('utils', () => {
    describe('extractRealConversationIdFromCurrentUrl', () => {
        beforeEach(() => {
            delete window.location;
        });

        test('should extract ID from /app/ID format', () => {
            window.location = { href: 'https://gemini.google.com/app/1234567890abcdef' };
            expect(extractRealConversationIdFromCurrentUrl()).toBe('1234567890abcdef');
        });

        test('should extract ID from /gem/GEM_NAME/ID format', () => {
            window.location = { href: 'https://gemini.google.com/gem/coding-partner/1234567890abcdef' };
            expect(extractRealConversationIdFromCurrentUrl()).toBe('1234567890abcdef');
        });

        test('should return null for invalid URL', () => {
            window.location = { href: 'https://gemini.google.com/app/' };
            expect(extractRealConversationIdFromCurrentUrl()).toBeNull();
        });

        test('should return null if ID is too short', () => {
            window.location = { href: 'https://gemini.google.com/app/short' };
            expect(extractRealConversationIdFromCurrentUrl()).toBeNull();
        });
    });
});
