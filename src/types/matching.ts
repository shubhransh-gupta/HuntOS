import type { Recommendation } from './job'

export interface MatchFactor {
  name: string
  score: number
  maxScore: number
  percentage: number
}

export interface MatchBreakdown {
  factors: MatchFactor[]
  totalScore: number
  maxScore: number
  percentage: number
  strongMatches: string[]
  gaps: string[]
  concerns: string[]
}

export interface SkillMatch {
  skill: string
  status: 'strong' | 'partial' | 'missing'
  importance: 'required' | 'preferred' | 'nice-to-have'
}

export interface GapItem {
  skill: string
  classification: 'critical' | 'learnable' | 'low_importance'
}

export interface GapAnalysis {
  matchedCount: number
  totalImportant: number
  gaps: GapItem[]
}

export interface RecommendationResult {
  recommendation: Recommendation
  label: string
  emoji: string
}

export const RECOMMENDATION_THRESHOLDS = {
  apply: 90,
  strong: 80,
  maybe: 65,
} as const

export function getRecommendation(score: number): RecommendationResult {
  if (score >= RECOMMENDATION_THRESHOLDS.apply) {
    return { recommendation: 'apply', label: 'APPLY', emoji: '🔥' }
  }
  if (score >= RECOMMENDATION_THRESHOLDS.strong) {
    return { recommendation: 'strong', label: 'STRONG MATCH', emoji: '🟢' }
  }
  if (score >= RECOMMENDATION_THRESHOLDS.maybe) {
    return { recommendation: 'maybe', label: 'MAYBE', emoji: '🟡' }
  }
  return { recommendation: 'low', label: 'LOW MATCH', emoji: '🔴' }
}
