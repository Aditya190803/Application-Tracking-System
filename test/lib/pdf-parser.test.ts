import { describe, expect,it } from 'vitest';

import { validatePDFFile } from '@/lib/pdf-parser';

describe('pdf-parser', () => {
    describe('validatePDFFile', () => {
        it('should return valid for a proper PDF file', () => {
            const file = new File([''], 'test.pdf', { type: 'application/pdf' });
            // Mock size
            Object.defineProperty(file, 'size', { value: 1024 * 1024 });

            const result = validatePDFFile(file);
            expect(result.valid).toBe(true);
        });

        it('should return invalid for non-pdf files', () => {
            const file = new File([''], 'test.txt', { type: 'text/plain' });
            const result = validatePDFFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('File must be a PDF');
        });

        it('should return invalid for large files', () => {
            const file = new File([''], 'large.pdf', { type: 'application/pdf' });
            Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 }); // 25MB

            const result = validatePDFFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('File size must be less than 20MB');
        });
    });
});
