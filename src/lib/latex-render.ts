const DEFAULT_RENDER_API_BASE = 'https://latexonline.cc';
const URL_MODE_MAX_SOURCE_LENGTH = 6000;

export function getLatexRenderApiBase(): string {
  return (process.env.LATEX_RENDER_API_BASE || DEFAULT_RENDER_API_BASE).replace(/\/+$/, '');
}

export function buildLatexCompileUrl(latexSource: string): string {
  const base = getLatexRenderApiBase();
  return `${base}/compile?text=${encodeURIComponent(latexSource)}`;
}

function octalField(value: number, width: number): string {
  const octal = value.toString(8);
  return octal.padStart(width - 1, '0') + '\0';
}

// Build a minimal POSIX tar archive with a single file.
function createSingleFileTar(filename: string, content: Buffer): Buffer {
  const header = Buffer.alloc(512, 0);
  header.write(filename.slice(0, 100), 0, 'utf8');
  header.write(octalField(0o644, 8), 100, 'ascii');
  header.write(octalField(0, 8), 108, 'ascii');
  header.write(octalField(0, 8), 116, 'ascii');
  header.write(octalField(content.length, 12), 124, 'ascii');
  header.write(octalField(Math.floor(Date.now() / 1000), 12), 136, 'ascii');
  header.fill(0x20, 148, 156);
  header.write('0', 156, 'ascii');
  header.write('ustar\0', 257, 'ascii');
  header.write('00', 263, 'ascii');

  let checksum = 0;
  for (let i = 0; i < 512; i += 1) {
    checksum += header[i];
  }
  const checksumText = checksum.toString(8).padStart(6, '0');
  header.write(checksumText, 148, 'ascii');
  header[154] = 0;
  header[155] = 0x20;

  const paddedContentLength = Math.ceil(content.length / 512) * 512;
  const paddedContent = Buffer.alloc(paddedContentLength, 0);
  content.copy(paddedContent, 0);

  return Buffer.concat([header, paddedContent, Buffer.alloc(1024, 0)]);
}

export function shouldUseLatexUploadMode(latexSource: string): boolean {
  return latexSource.length > URL_MODE_MAX_SOURCE_LENGTH;
}

export async function compileLatexViaUpload(latexSource: string): Promise<Response> {
  const base = getLatexRenderApiBase();
  const tarBuffer = createSingleFileTar('main.tex', Buffer.from(latexSource, 'utf8'));
  const tarArrayBuffer = tarBuffer.buffer.slice(
    tarBuffer.byteOffset,
    tarBuffer.byteOffset + tarBuffer.byteLength,
  ) as ArrayBuffer;
  const formData = new FormData();
  formData.append('file', new Blob([tarArrayBuffer], { type: 'application/x-tar' }), 'main.tar');

  return fetch(`${base}/data?target=main.tex`, {
    method: 'POST',
    body: formData,
    cache: 'no-store',
  });
}
