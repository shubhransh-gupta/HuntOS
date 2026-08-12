import type { MasterProfile } from '@/types'

export function parseProfileLocally(text: string): Omit<MasterProfile, 'id' | 'updatedAt'> {
  const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0]
  const phone = text.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{2,4}\)|\d{2,4})[-.\s]?\d{3,4}[-.\s]?\d{3,4}/)?.[0]
  const linkedIn = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0]
  const github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i)?.[0]
  const portfolio = text.match(/(?:https?:\/\/)[^\s)]+/i)?.[0]

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const nameCandidate = lines.find((line) => line.length <= 60 && !line.includes('@') && !/^https?:\/\//i.test(line))
  const headlineCandidate = lines.find(
    (line, index) =>
      index > 0 &&
      line.length <= 100 &&
      !line.includes('@') &&
      !/^https?:\/\//i.test(line) &&
      line !== nameCandidate,
  )

  const skillsSection = text.match(
    /(?:^|\n)\s*(?:skills|technical skills|core competencies)\s*[:\-]?\s*\n?([\s\S]*?)(?:\n\s*\n|\n[A-Z][A-Za-z ]{2,}:|\n[A-Z ]{4,}\n|$)/i,
  )?.[1]
  const skills = (skillsSection ?? text)
    .split(/[,|•·;\n]/)
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 1 && skill.length < 40 && !/\d{4}/.test(skill))
    .slice(0, 30)

  const experienceMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of\s+experience)?/i)

  return {
    name: nameCandidate ?? 'Your Name',
    email,
    phone,
    location: text.match(/(?:^|\n)\s*(?:location|address)\s*[:\-]?\s*([^\n]+)/i)?.[1]?.trim(),
    linkedIn,
    github,
    portfolio: portfolio && portfolio !== linkedIn && portfolio !== github ? portfolio : undefined,
    headline: headlineCandidate,
    totalExperienceYears: experienceMatch ? parseFloat(experienceMatch[1]) : 0,
    companies: [],
    roles: [],
    skills,
    technologies: skills,
    achievements: [],
    education: [],
    certifications: [],
    industries: [],
    projects: [],
    workExperience: [],
  }
}
