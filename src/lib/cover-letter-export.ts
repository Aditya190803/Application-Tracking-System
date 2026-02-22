import { sanitizeFileName } from '@/lib/utils'

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function buildCoverLetterMarkdown(coverLetter: string, companyName?: string, jobTitle?: string): string {
  const heading = companyName ? `# Cover Letter - ${companyName}` : '# Cover Letter'
  const subtitle = jobTitle ? `\n_${jobTitle}_\n` : '\n'
  return `${heading}${subtitle}\n${coverLetter}`
}

export function downloadCoverLetterTxt(coverLetter: string, companyName?: string): void {
  const name = sanitizeFileName(`cover-letter-${companyName || 'generated'}`)
  downloadBlob(new Blob([coverLetter], { type: 'text/plain' }), `${name}.txt`)
}

export async function exportCoverLetterPdf(coverLetter: string, companyName?: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const title = companyName ? `Cover Letter - ${companyName}` : 'Cover Letter'
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  doc.setFontSize(16)
  doc.text(title, 40, 50)
  doc.setFontSize(11)
  const lines = doc.splitTextToSize(coverLetter, 515)
  doc.text(lines, 40, 80)
  doc.save(`${sanitizeFileName(title)}.pdf`)
}

export async function exportCoverLetterDocx(coverLetter: string, companyName?: string): Promise<void> {
  const title = companyName ? `Cover Letter - ${companyName}` : 'Cover Letter'
  const response = await fetch('/api/export-cover-letter-docx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coverLetter, companyName }),
  })

  if (!response.ok) {
    throw new Error('Failed to export DOCX')
  }

  const blob = await response.blob()
  downloadBlob(blob, `${sanitizeFileName(title)}.docx`)
}
