import type { MasterProfile, MasterResume, Job } from '@/types'

export function analyzeATSCompatibility(
  profile: MasterProfile,
  masterResume: MasterResume,
  job: Job,
): { score: number; checks: { name: string; passed: boolean; note?: string }[] } {
  const checks = [
    {
      name: 'Role keywords present',
      passed: job.skills.some((s) => masterResume.rawText.toLowerCase().includes(s.toLowerCase())),
      note: 'Resume mentions key job skills',
    },
    {
      name: 'Technologies aligned',
      passed: job.technologies.filter((t) =>
        profile.technologies.some((pt) => pt.toLowerCase().includes(t.toLowerCase())),
      ).length >= job.technologies.length * 0.5,
    },
    {
      name: 'Job title alignment',
      passed: profile.roles.some((r) =>
        job.title.toLowerCase().includes(r.toLowerCase().split(' ').pop() ?? ''),
      ),
    },
    {
      name: 'Experience mentioned',
      passed: masterResume.rawText.includes(String(Math.floor(profile.totalExperienceYears))),
    },
    {
      name: 'Section structure',
      passed: Object.keys(masterResume.sections).length >= 3,
      note: 'Has multiple resume sections',
    },
    {
      name: 'No excessive irrelevant content',
      passed: masterResume.rawText.length < 8000,
    },
    {
      name: 'Missing terminology flagged',
      passed: job.requirements.required.filter((r) =>
        !masterResume.rawText.toLowerCase().includes(r.toLowerCase().slice(0, 8)),
      ).length <= 2,
    },
  ]

  const passed = checks.filter((c) => c.passed).length
  const score = Math.round((passed / checks.length) * 100)

  return { score, checks }
}

export function validateResumeClaims(masterText: string, tailoredText: string): string[] {
  const violations: string[] = []
  const masterLower = masterText.toLowerCase()

  const companyPattern = /\bat\s+([A-Z][A-Za-z0-9\s&]+?)(?:,|\.|\s+where|\s+as)/g
  let match
  while ((match = companyPattern.exec(tailoredText)) !== null) {
    const company = match[1].trim()
    if (company.length > 3 && !masterLower.includes(company.toLowerCase())) {
      violations.push(`Possible fabricated company: ${company}`)
    }
  }

  return violations
}
