import { useState } from 'react'
import type { Job, MasterResume } from '@/types'
import { generateResumeSuggestions } from '@/services/ai'
import { storage } from '@/services/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  job: Job
  masterResume: MasterResume
  onUpdate: () => void
}

export function ResumeOptimizer({ job, masterResume, onUpdate }: Props) {
  const [suggestions, setSuggestions] = useState<{ current: string; suggested: string; reason: string }[]>([])
  const [loading, setLoading] = useState(false)

  async function loadSuggestions() {
    setLoading(true)
    try {
      const result = await generateResumeSuggestions(masterResume.rawText, job.description)
      setSuggestions(result)
    } finally {
      setLoading(false)
    }
  }

  async function approveSuggestion(index: number) {
    const s = suggestions[index]
    const updatedText = masterResume.rawText.replace(s.current, s.suggested)
    await storage.saveMasterResume({
      ...masterResume,
      version: masterResume.version + 1,
      rawText: updatedText,
      updatedAt: new Date().toISOString(),
    })
    setSuggestions(suggestions.filter((_, i) => i !== index))
    onUpdate()
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={loadSuggestions} disabled={loading}>
        {loading ? 'Analyzing...' : 'Improve My Resume'}
      </Button>
      {suggestions.map((s, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 pt-4 text-sm">
            <div><strong>CURRENT:</strong> {s.current}</div>
            <div><strong>SUGGESTED:</strong> {s.suggested}</div>
            <div><strong>WHY:</strong> {s.reason}</div>
            <Button size="sm" onClick={() => approveSuggestion(i)}>Approve Change</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
