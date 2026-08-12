import type { MatchBreakdown } from '@/types/matching'
import { Card, CardHeader, CardTitle, CardContent, Progress } from '@/components/ui/card'

export function MatchAnalysisPanel({ breakdown }: { breakdown: MatchBreakdown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>MATCH ANALYSIS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown.factors.map((f) => (
          <div key={f.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{f.name}</span>
              <span>{f.percentage}%</span>
            </div>
            <Progress value={f.percentage} />
          </div>
        ))}

        {breakdown.strongMatches.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium">STRONG MATCHES</p>
            {breakdown.strongMatches.map((s) => (
              <span key={s} className="mr-2 text-sm">✓ {s}</span>
            ))}
          </div>
        )}

        {breakdown.gaps.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium">GAPS</p>
            {breakdown.gaps.map((g) => (
              <span key={g} className="mr-2 text-sm">⚠ {g}</span>
            ))}
          </div>
        )}

        {breakdown.concerns.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium">CONCERNS</p>
            {breakdown.concerns.map((c) => (
              <p key={c} className="text-sm text-[var(--color-muted-foreground)]">{c}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
