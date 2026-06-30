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

export class PDFNoExtractableTextError extends Error {
  constructor() {
    super('PDF_NO_EXTRACTABLE_TEXT');
    this.name = 'PDFNoExtractableTextError';
  }
}

/** pdf2json URL-encodes text runs; Word Print-to-PDF can produce invalid % sequences. */
export function decodePdfTextRun(token: string): string {
  const raw = token || '';
  if (!raw) return '';
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '));
  } catch {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
}

function extractTextFromPages(pdfData: {
  Pages: Array<{
    Texts: Array<{
      R: Array<{ T: string }>;
    }>;
  }>;
}): string {
  const pages = pdfData.Pages || [];
  const pageTexts = pages.map(page =>
    (page.Texts || [])
      .map(text => {
        const textRuns = text.R || [];
        return textRuns.map(run => decodePdfTextRun(run.T || '')).join('');
      })
      .join(' ')
      .trim(),
  );

  const firstTextIndex = pageTexts.findIndex(Boolean);
  if (firstTextIndex === -1) {
    return '';
  }

  let lastTextIndex = pageTexts.length - 1;
  while (lastTextIndex >= 0 && !pageTexts[lastTextIndex]) {
    lastTextIndex -= 1;
  }

  return pageTexts.slice(firstTextIndex, lastTextIndex + 1).join('\n\n---\n\n');
}

export async function parsePDFBuffer(buffer: Buffer): Promise<ParsedPDF> {
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
        const pages = pdfData.Pages || [];
        let fullText = extractTextFromPages(pdfData);

        const parserWithRaw = pdfParser as { getRawTextContent?: () => string };
        if (!fullText && typeof parserWithRaw.getRawTextContent === 'function') {
          fullText = parserWithRaw.getRawTextContent().trim();
        }

        if (!fullText) {
          reject(new PDFNoExtractableTextError());
          return;
        }

        resolve({
          text: fullText,
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