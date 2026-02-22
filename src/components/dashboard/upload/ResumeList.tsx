import { FileText, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ResumeItem {
  _id: string
  _creationTime: number
  name: string
  pageCount?: number
}

interface ResumeListProps {
  resumes: ResumeItem[]
  onDelete: (resumeId: string) => void
}

export function ResumeList({ resumes, onDelete }: ResumeListProps) {
  if (resumes.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold text-foreground mb-6">Your Saved Resumes</h2>
      <div className="grid gap-3">
        {resumes.map((resume) => (
          <div
            key={resume._id}
            className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between hover:border-border transition-colors shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground">{resume.name}</p>
                <p className="text-xs text-muted-foreground font-semibold">
                  {new Date(resume._creationTime).toLocaleDateString()}
                  {resume.pageCount && ` • ${resume.pageCount} pages`}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(resume._id)}
              className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
