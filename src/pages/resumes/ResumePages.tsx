import { useEffect, useState } from 'react'
import { storage } from '@/services/storage'
import type { MasterResume, ResumeVersion } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { exportResumePdf, exportResumeDocx } from '@/services/export/resume-export'

export function MasterResumePage() {
  const [resume, setResume] = useState<MasterResume | null>(null)

  useEffect(() => {
    storage.getMasterResume().then((r) => setResume(r ?? null))
  }, [])

  async function save() {
    if (!resume) return
    await storage.saveMasterResume({ ...resume, updatedAt: new Date().toISOString() })
  }

  if (!resume) return <div className="p-8">No master resume. Upload during onboarding.</div>

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Master Resume v{resume.version}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Source of truth. Tailored resumes are generated from this.
      </p>
      <Card>
        <CardContent className="pt-4">
          <Textarea
            rows={20}
            value={resume.rawText}
            onChange={(e) => setResume({ ...resume, rawText: e.target.value })}
          />
          <div className="mt-4 flex gap-2">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={() => exportResumePdf(resume.rawText, 'master-resume.pdf')}>Export PDF</Button>
            <Button variant="outline" onClick={() => exportResumeDocx(resume.rawText, 'master-resume.docx')}>Export DOCX</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TailoredResumesPage() {
  const [versions, setVersions] = useState<ResumeVersion[]>([])

  useEffect(() => {
    storage.getResumeVersions().then(setVersions)
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Tailored Resumes</h1>
      <Link to="/resumes/master" className="text-sm underline">View Master Resume</Link>
      <div className="space-y-3">
        {versions.map((v) => (
          <Card key={v.id}>
            <CardHeader>
              <CardTitle className="text-base">{v.name}</CardTitle>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Created {new Date(v.createdAt).toLocaleDateString()} • Based on Master Resume v{v.masterResumeVersion}
              </p>
            </CardHeader>
            <CardContent>
              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm">{v.content.slice(0, 500)}...</pre>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => exportResumePdf(v.content, `${v.name}.pdf`)}>PDF</Button>
                <Button size="sm" variant="outline" onClick={() => exportResumeDocx(v.content, `${v.name}.docx`)}>DOCX</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {versions.length === 0 && <p className="text-sm text-[var(--color-muted-foreground)]">No tailored resumes yet.</p>}
      </div>
    </div>
  )
}
