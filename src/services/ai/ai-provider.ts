import type { AIProviderId, AISettings } from '@/types'

export interface CompletionOptions {
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface AIProvider {
  id: AIProviderId
  name: string
  testConnection(): Promise<boolean>
  complete(prompt: string, options?: CompletionOptions): Promise<string>
  completeStructured<T>(prompt: string, schema: { parse: (data: unknown) => T }, options?: CompletionOptions): Promise<T>
}

export function createAIProvider(settings: AISettings): AIProvider {
  switch (settings.provider) {
    case 'anthropic':
      return createAnthropicProvider(settings)
    case 'ollama':
      return createOllamaProvider(settings)
    case 'openai-compatible':
      return createOpenAICompatibleProvider(settings)
    case 'openai':
    default:
      return createOpenAIProvider(settings)
  }
}

function createOpenAIProvider(settings: AISettings): AIProvider {
  const baseUrl = settings.baseUrl || 'https://api.openai.com/v1'
  return {
    id: 'openai',
    name: 'OpenAI',
    async testConnection() {
      if (!settings.apiKey) return false
      try {
        const res = await fetch(`${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${settings.apiKey}` },
        })
        return res.ok
      } catch {
        return false
      }
    },
    async complete(prompt, options) {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 4096,
        }),
      })
      if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`)
      const data = await res.json()
      return data.choices[0].message.content
    },
    async completeStructured(prompt, schema, options) {
      const text = await this.complete(
        `${prompt}\n\nRespond with valid JSON only. No markdown fences.`,
        options,
      )
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
      return schema.parse(JSON.parse(cleaned))
    },
  }
}

function createOpenAICompatibleProvider(settings: AISettings): AIProvider {
  const provider = createOpenAIProvider({ ...settings, provider: 'openai-compatible' })
  return { ...provider, id: 'openai-compatible', name: 'OpenAI Compatible' }
}

function createAnthropicProvider(settings: AISettings): AIProvider {
  return {
    id: 'anthropic',
    name: 'Anthropic',
    async testConnection() {
      if (!settings.apiKey) return false
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: settings.model || 'claude-3-5-haiku-latest',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        })
        return res.ok || res.status === 400
      } catch {
        return false
      }
    },
    async complete(prompt, options) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.model || 'claude-3-5-haiku-latest',
          max_tokens: options?.maxTokens ?? 4096,
          system: options?.systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) throw new Error(`Anthropic error: ${res.statusText}`)
      const data = await res.json()
      return data.content[0].text
    },
    async completeStructured(prompt, schema, options) {
      const text = await this.complete(
        `${prompt}\n\nRespond with valid JSON only.`,
        options,
      )
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
      return schema.parse(JSON.parse(cleaned))
    },
  }
}

function createOllamaProvider(settings: AISettings): AIProvider {
  const baseUrl = settings.baseUrl || 'http://localhost:11434'
  return {
    id: 'ollama',
    name: 'Ollama',
    async testConnection() {
      try {
        const res = await fetch(`${baseUrl}/api/tags`)
        return res.ok
      } catch {
        return false
      }
    },
    async complete(prompt, options) {
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.model || 'llama3.2',
          prompt: options?.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt,
          stream: false,
        }),
      })
      if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`)
      const data = await res.json()
      return data.response
    },
    async completeStructured(prompt, schema, options) {
      const text = await this.complete(
        `${prompt}\n\nRespond with valid JSON only.`,
        options,
      )
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
      return schema.parse(JSON.parse(cleaned))
    },
  }
}

export class MockAIProvider implements AIProvider {
  id: AIProviderId = 'openai'
  name = 'Mock (Offline)'

  async testConnection() {
    return true
  }

  async complete(prompt: string) {
    if (prompt.includes('resume') || prompt.includes('Resume')) {
      return JSON.stringify({
        name: 'Shubhransh Gupta',
        email: 'shubhransh@example.com',
        phone: '+91 9876543210',
        location: 'Bangalore, India',
        linkedIn: 'linkedin.com/in/shubhransh',
        github: 'github.com/shubhransh',
        headline: 'Senior iOS Engineer',
        totalExperienceYears: 5.2,
        companies: ['Razorpay', 'MakeMyTrip', 'Flipkart'],
        roles: ['Senior iOS Engineer', 'iOS Developer'],
        skills: ['Swift', 'SwiftUI', 'UIKit', 'Combine', 'async/await', 'Objective-C', 'Core Data', 'SPM', 'CI/CD'],
        technologies: ['Swift', 'SwiftUI', 'UIKit', 'Combine', 'Xcode', 'GitHub Actions'],
        achievements: [
          'Built UPI payment flows reducing support tickets by 40%',
          'Led migration to SwiftUI for core booking flow',
          'Reduced app crash rate by 35%',
        ],
        education: [{ institution: 'VTU', degree: 'B.E.', field: 'Computer Science' }],
        certifications: ['Apple Certified Developer'],
        industries: ['Fintech', 'Travel', 'E-commerce', 'Payments'],
        projects: [{ name: 'Payment SDK', description: 'Internal UPI SDK', technologies: ['Swift', 'UIKit'] }],
        workExperience: [
          {
            company: 'Razorpay',
            role: 'Senior iOS Engineer',
            startDate: '2022',
            achievements: ['Built UPI payment flows reducing support tickets by 40%'],
            technologies: ['Swift', 'UIKit', 'Combine'],
          },
        ],
      })
    }
    return '{}'
  }

  async completeStructured<T>(_prompt: string, schema: { parse: (data: unknown) => T }): Promise<T> {
    const raw = await this.complete(_prompt)
    return schema.parse(JSON.parse(raw))
  }
}
