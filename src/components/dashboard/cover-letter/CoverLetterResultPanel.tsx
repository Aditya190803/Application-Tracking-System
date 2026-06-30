'use client';

import { ArrowRight, CheckCircle, Copy, Download, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface CoverLetterResultPanelProps {
  coverLetter: string;
  copied: boolean;
  isGenerating: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onCopyMarkdown: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onNewLetter: () => void;
}

export function CoverLetterResultPanel({
  coverLetter,
  copied,
  isGenerating,
  onCopy,
  onDownload,
  onCopyMarkdown,
  onExportPdf,
  onExportDocx,
  onNewLetter,
}: CoverLetterResultPanelProps) {
  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-2xl shadow-border/15 backdrop-blur sm:p-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Your cover letter</h2>
            <p className="text-sm font-medium text-muted-foreground">AI-generated and tailored to your application</p>
            <Link href="/dashboard/history" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-foreground">
              Save and review in history
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={onCopy}
            className="h-11 rounded-xl border-border/70 px-5 font-bold text-foreground/85 hover:bg-background"
          >
            {copied ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 text-foreground" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Text
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onDownload}
            className="h-11 rounded-xl border-border/70 px-5 font-bold text-foreground/85 hover:bg-background"
          >
            <Download className="mr-2 h-4 w-4" />
            Download .txt
          </Button>
          <Button
            variant="outline"
            onClick={onCopyMarkdown}
            className="h-11 rounded-xl border-border/70 px-5 font-bold text-foreground/85 hover:bg-background"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Markdown
          </Button>
          <Button
            variant="outline"
            onClick={onExportPdf}
            className="h-11 rounded-xl border-border/70 px-5 font-bold text-foreground/85 hover:bg-background"
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={onExportDocx}
            className="h-11 rounded-xl border-border/70 px-5 font-bold text-foreground/85 hover:bg-background"
          >
            <Download className="mr-2 h-4 w-4" />
            Export DOCX
          </Button>
          <Button
            variant="outline"
            onClick={onNewLetter}
            disabled={isGenerating}
            className="h-11 rounded-xl border-border/70 px-5 font-bold text-foreground/85 hover:bg-background"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            New Letter
          </Button>
        </div>
      </div>

      <div className="min-h-[400px] rounded-3xl border border-border/60 bg-background/80 p-6 sm:p-8">
        <pre className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-foreground/90 selection:bg-primary selection:text-white">
          {coverLetter}
        </pre>
      </div>
    </section>
  );
}