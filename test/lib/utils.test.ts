import { describe, expect,it } from 'vitest';

import { cn, createHash, formatFileSize, LRUCache, sanitizeFileName, truncateText } from '@/lib/utils';

describe('utils', () => {
    describe('cn', () => {
        it('should merge class names', () => {
            expect(cn('a', 'b')).toBe('a b');
            expect(cn('a', { b: true, c: false })).toBe('a b');
        });

        it('should handle tailwind merges', () => {
            expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
        });
    });

    describe('LRUCache', () => {
        it('should store and retrieve values', () => {
            const cache = new LRUCache<string>(2, 100);
            cache.set('a', '1');
            expect(cache.get('a')).toBe('1');
        });

        it('should evict least recently used items', () => {
            const cache = new LRUCache<string>(2, 100);
            cache.set('a', '1');
            cache.set('b', '2');
            cache.get('a'); // Mark 'a' as recently used
            cache.set('c', '3'); // Should evict 'b'

            expect(cache.get('a')).toBe('1');
            expect(cache.get('c')).toBe('3');
            expect(cache.get('b')).toBeNull();
        });

        it('should expire items after TTL', async () => {
            const cache = new LRUCache<string>(2, 0.1); // 100ms
            cache.set('a', '1');

            await new Promise(resolve => setTimeout(resolve, 150));

            expect(cache.get('a')).toBeNull();
        });
    });

    describe('createHash', () => {
        it('should create a consistent hash', () => {
            const input = 'test string';
            const hash1 = createHash(input);
            const hash2 = createHash(input);
            expect(hash1).toBe(hash2);
            expect(typeof hash1).toBe('string');
        });

        it('should create different hashes for different strings', () => {
            expect(createHash('a')).not.toBe(createHash('b'));
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0 Bytes');
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1024 * 1024)).toBe('1 MB');
            expect(formatFileSize(1234567)).toBe('1.18 MB');
        });
    });

    describe('truncateText', () => {
        it('should truncate text correctly', () => {
            expect(truncateText('hello world', 5)).toBe('hello...');
            expect(truncateText('hi', 5)).toBe('hi');
        });
    });

    describe('sanitizeFileName', () => {
        it('should normalize and sanitize names', () => {
            expect(sanitizeFileName('Cover Letter - ACME Inc.')).toBe('cover-letter-acme-inc');
            expect(sanitizeFileName('   Weird / Name <> "x"   ')).toBe('weird-name-x');
        });

        it('should use fallback for invalid names', () => {
            expect(sanitizeFileName('....', 'file')).toBe('file');
            expect(sanitizeFileName('***', 'file')).toBe('file');
        });
    });
});
