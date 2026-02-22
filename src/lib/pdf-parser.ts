// PDF text extraction using pdf2json
// This runs on the server side only

export interface ParsedPDF {
  text: string;
  pages: number;
  metadata?: {
    title?: string;
    author?: string;
  };
}

export async function parsePDFBuffer(buffer: Buffer): Promise<ParsedPDF> {
  // Dynamic import for server-side only
  const PDFParser = (await import('pdf2json')).default;

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataReady', (pdfData: {
      Pages: Array<{
        Texts: Array<{
          R: Array<{ T: string }>;
        }>;
      }>;
      Meta?: {
        Title?: string;
        Author?: string;
      };
    }) => {
      try {
        // Extract text from all pages
        const pages = pdfData.Pages || [];
        let fullText = '';

        pages.forEach((page, pageIndex) => {
          const pageTexts = page.Texts || [];
          const pageText = pageTexts
            .map(text => {
              const textRuns = text.R || [];
              return textRuns
                .map(run => decodeURIComponent(run.T || ''))
                .join('');
            })
            .join(' ');

          if (pageText.trim()) {
            fullText += `${pageText}\n\n`;
          }

          // Add page break indicator for multi-page documents
          if (pageIndex < pages.length - 1) {
            fullText += '---\n\n';
          }
        });

        resolve({
          text: fullText.trim(),
          pages: pages.length,
          metadata: {
            title: pdfData.Meta?.Title,
            author: pdfData.Meta?.Author,
          },
        });
      } catch {
        reject(new Error('Failed to extract text from PDF'));
      }
    });

    pdfParser.on('pdfParser_dataError', (errData: Error | { parserError: Error }) => {
      if (errData instanceof Error) {
        reject(errData);
      } else {
        reject(errData.parserError || new Error('PDF parsing failed'));
      }
    });

    // Parse the buffer
    pdfParser.parseBuffer(buffer);
  });
}

export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE_MB = 20;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'File must be a PDF' };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: `File size must be less than ${MAX_SIZE_MB}MB` };
  }

  return { valid: true };
}
