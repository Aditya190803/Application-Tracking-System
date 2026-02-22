import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api-response';

const MAX_COVER_LETTER_LENGTH = 25_000;
const MAX_COMPANY_NAME_LENGTH = 200;
const require = createRequire(import.meta.url);

interface ExportDocxBody {
  coverLetter?: string;
  companyName?: string;
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? randomUUID();

  try {
    const body = (await request.json()) as ExportDocxBody;
    const coverLetter = typeof body.coverLetter === 'string' ? body.coverLetter.trim() : '';
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';

    if (!coverLetter) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Cover letter is required');
    }

    if (coverLetter.length > MAX_COVER_LETTER_LENGTH) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Cover letter is too long');
    }

    if (companyName.length > MAX_COMPANY_NAME_LENGTH) {
      return apiError(requestId, 400, 'VALIDATION_ERROR', 'Company name is too long');
    }

    const { Document, Packer, Paragraph, TextRun } = require('docx') as typeof import('docx');
    const title = companyName ? `Cover Letter - ${companyName}` : 'Cover Letter';
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: title, bold: true, size: 32 })],
            }),
            ...coverLetter.split('\n').map((line) => new Paragraph(line || '')),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const bytes = await blob.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="cover-letter.docx"',
      },
    });
  } catch (error) {
    console.error('DOCX export error', { requestId, error });
    return apiError(requestId, 500, 'DOCX_EXPORT_FAILED', 'Failed to export DOCX');
  }
}
