import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sampleJobs from '../sample-data/jobs.json'
import { normalizeAndDedupe } from '../src/services/matching/deduplication'
import { scoreJob } from '../src/services/matching/matching-engine'
import { createDefaultHuntProfile } from '../src/services/storage/storage-repository'
import { defaultSourceConfig } from '../src/types/source-config'
import type { Application, MasterProfile, MasterResume, RawJob } from '../src/types'

const profile: MasterProfile = {
  id: 'demo-profile',
  name: 'Shubhransh Gupta',
  email: 'shubhransh@example.com',
  headline: 'Senior iOS Engineer',
  location: 'Bangalore, India',
  totalExperienceYears: 5.2,
  companies: ['Razorpay', 'MakeMyTrip'],
  roles: ['Senior iOS Engineer', 'iOS Developer'],
  skills: ['Swift', 'SwiftUI', 'UIKit', 'Combine', 'async/await', 'GraphQL', 'CI/CD'],
  technologies: ['Swift', 'SwiftUI', 'UIKit', 'Combine', 'Xcode'],
  achievements: [
    'Built and shipped UPI payment flows in Swift and SwiftUI, reducing support tickets by 40%',
    'Led the SwiftUI migration of the core booking experience across iPhone and iPad',
    'Designed scalable mobile architecture and reusable components adopted by four product teams',
    'Partnered closely with design, product, and backend engineers to deliver features end to end',
    'Improved application performance, startup latency, and memory footprint through profiling',
    'Established automated testing, code review standards, and continuous integration pipelines',
    'Owned App Store releases, crash monitoring, analytics instrumentation, and rollout strategy',
    'Mentored junior engineers and drove technical design reviews for complex mobile features',
    'Built accessible, responsive interfaces integrating REST and GraphQL backend services',
    'Delivered high-quality, maintainable Swift code for consumer products at scale',
    'Collaborated with cross-functional teams to define, design, and ship new features',
    'Identified and resolved production issues, bottlenecks, and bugs across the mobile stack',
    'Contributed to technical roadmap, engineering standards, and mobile platform strategy',
  ],
  education: [{ institution: 'VTU', degree: 'B.E.', field: 'Computer Science' }],
  certifications: [],
  industries: ['Fintech', 'Payments'],
  projects: [],
  workExperience: [
    {
      company: 'Razorpay',
      role: 'Senior iOS Engineer',
      startDate: '2022',
      description:
        'Develop, maintain, and ship consumer-facing iOS applications using Swift, SwiftUI, UIKit, and Combine. Collaborate with product managers, designers, and backend engineers to build high-quality mobile features and payment experiences. Write clean, testable, maintainable code, participate in code reviews, and contribute to architecture and technical design decisions. Optimize application performance, reliability, and user experience while integrating RESTful and GraphQL APIs. Support continuous integration, automated testing, release management, and production monitoring.',
      achievements: ['Built UPI payment flows reducing support tickets by 40%'],
      technologies: ['Swift', 'UIKit', 'Combine'],
    },
    {
      company: 'MakeMyTrip',
      role: 'iOS Developer',
      startDate: '2019',
      endDate: '2022',
      description:
        'Implemented new features and screens for a large-scale travel booking application serving millions of users. Worked with cross-functional teams to translate designs and requirements into responsive, accessible interfaces. Debugged and resolved complex production issues, improved test coverage, and mentored junior developers on mobile best practices.',
      achievements: ['Led SwiftUI migration for the core booking flow'],
      technologies: ['Swift', 'SwiftUI', 'UIKit'],
    },
  ],
  updatedAt: new Date().toISOString(),
}

const masterResume: MasterResume = {
  id: 'demo-resume',
  version: 1,
  rawText: 'Senior iOS Engineer with 5+ years building fintech apps in Swift, SwiftUI, and UIKit.',
  sections: {
    full: 'Senior iOS Engineer with 5+ years building fintech apps in Swift, SwiftUI, and UIKit.',
    skills: 'Swift, SwiftUI, UIKit, Combine, GraphQL, CI/CD',
  },
  updatedAt: new Date().toISOString(),
}

async function main() {
  const huntProfile = {
    ...(await createDefaultHuntProfile()),
    id: 'demo-hunt-profile',
    name: 'iOS — Bangalore',
    isDefault: true,
  }

  // The "Custom Startup" fixture is a placeholder with a one-line description,
  // which skews the responsibility overlap ratio. Keep the demo to real companies.
  const demoJobs = (sampleJobs as RawJob[]).filter((job) => job.company !== 'Custom Startup')

  const { jobs } = normalizeAndDedupe(demoJobs)
  const scoredJobs = jobs
    .map((job) => {
      const result = scoreJob(profile, job, huntProfile)
      return {
        ...job,
        matchScore: result.matchScore,
        matchBreakdown: result.matchBreakdown,
        skillMatches: result.skillMatches,
        recommendation: result.recommendation.recommendation,
      }
    })
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))

  const topJob = scoredJobs[0]
  const applications: Application[] = [
    {
      id: 'app-1',
      jobId: topJob?.id,
      company: topJob?.company ?? 'Razorpay',
      role: topJob?.title ?? 'Senior iOS Engineer',
      status: 'applied',
      appliedDate: new Date(Date.now() - 8 * 86400000).toISOString(),
      source: topJob?.source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'app-2',
      company: 'PhonePe',
      role: 'Senior iOS Developer',
      status: 'interview',
      appliedDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'app-3',
      company: 'Flipkart',
      role: 'iOS Engineer',
      status: 'to_apply',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'app-4',
      company: 'CRED',
      role: 'Lead iOS Engineer',
      status: 'saved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  const seed = {
    profile,
    masterResume,
    huntProfiles: [huntProfile],
    settings: {
      id: 'app-settings',
      onboardingComplete: true,
      theme: 'dark',
      ai: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: '',
        baseUrl: '',
      },
      notificationsEnabled: false,
      activeHuntProfileId: huntProfile.id,
      sourceConfig: defaultSourceConfig,
    },
    jobs: scoredJobs.slice(0, 15),
    applications,
    huntRuns: [
      {
        id: 'demo-hunt-run',
        huntProfileId: huntProfile.id,
        startedAt: new Date(Date.now() - 5 * 60000).toISOString(),
        completedAt: new Date().toISOString(),
        discovered: 24,
        duplicatesRemoved: 6,
        relevant: 14,
        strongMatches: 8,
        exceptionalMatches: 3,
      },
    ],
    topJobId: topJob?.id,
  }

  writeFileSync(resolve('scripts/screenshot-seed.json'), JSON.stringify(seed, null, 2))
  console.log(`Wrote seed with ${seed.jobs.length} jobs, top job ${topJob?.company} ${topJob?.title}`)
}

main()
