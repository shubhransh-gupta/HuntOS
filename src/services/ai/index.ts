import { z } from 'zod'
import type { AISettings, MasterProfile } from '@/types'
import { createAIProvider, type AIProvider } from './ai-provider'
import { storage } from '@/services/storage'

const profileSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedIn: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
  headline: z.string().optional(),
  totalExperienceYears: z.number(),
  companies: z.array(z.string()),
  roles: z.array(z.string()),
  skills: z.array(z.string()),
  technologies: z.array(z.string()),
  achievements: z.array(z.string()),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  ),
  certifications: z.array(z.string()),
  industries: z.array(z.string()),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      technologies: z.array(z.string()).optional(),
      url: z.string().optional(),
    }),
  ),
  workExperience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      description: z.string().optional(),
      achievements: z.array(z.string()).optional(),
      technologies: z.array(z.string()).optional(),
    }),
  ),
})

export function isRemoteAIConfigured(ai: AISettings): boolean {
  if (ai.provider === 'ollama') return true
  return Boolean(ai.apiKey.trim())
}

export async function getAIProvider(): Promise<AIProvider | null> {
  const settings = await storage.getSettings()
  if (!isRemoteAIConfigured(settings.ai)) return null
  return createAIProvider(settings.ai)
}

async function requireAIProvider(): Promise<AIProvider> {
  const ai = await getAIProvider()
  if (!ai) {
    throw new Error('Configure an AI provider in Settings to use this feature.')
  }
  return ai
}

export async function parseResumeWithAI(text: string): Promise<Omit<MasterProfile, 'id' | 'updatedAt'>> {
  const ai = await requireAIProvider()
  const prompt = `Parse this resume into structured JSON with fields: name, email, phone, location, linkedIn, github, portfolio, headline, totalExperienceYears, companies, roles, skills, technologies, achievements, education, certifications, industries, projects, workExperience.\n\nResume:\n${text.slice(0, 12000)}`
  return ai.completeStructured(prompt, profileSchema)
}

export async function generateFollowUp(company: string, role: string, daysSince: number): Promise<string> {
  const ai = await requireAIProvider()
  return ai.complete(
    `Write a concise, professional follow-up email (${daysSince} days since application) for ${role} at ${company}. Keep it under 120 words.`,
    { temperature: 0.5 },
  )
}

export async function generateTailoredResume(
  masterText: string,
  jobTitle: string,
  company: string,
  requirements: string[],
): Promise<string> {
  const ai = await requireAIProvider()
  return ai.complete(
    `Create a tailored resume for ${jobTitle} at ${company}. ONLY use information from the master resume below. NEVER fabricate companies, projects, metrics, or technologies. You may reorder, rewrite, condense, and emphasize relevant achievements.\n\nRequirements:\n${requirements.join('\n')}\n\nMaster Resume:\n${masterText}`,
    { temperature: 0.3 },
  )
}

export async function generateResumeSuggestions(
  masterText: string,
  jobDescription: string,
): Promise<{ current: string; suggested: string; reason: string }[]> {
  const ai = await requireAIProvider()
  const schema = z.array(
    z.object({ current: z.string(), suggested: z.string(), reason: z.string() }),
  )
  return ai.completeStructured(
    `Suggest 2-3 resume improvements. Only rewrite existing content from the master resume. Never invent experience.\n\nJob:\n${jobDescription.slice(0, 3000)}\n\nResume:\n${masterText.slice(0, 6000)}`,
    schema,
  )
}
