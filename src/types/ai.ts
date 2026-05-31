export enum Provider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Groq = 'groq',
  Ollama = 'ollama',
  LmStudio = 'lmstudio',
  OpenRouter = 'openrouter',
  Generic = 'generic',
}

export interface ApiKey {
  id: string
  provider: Provider
  key: string
  baseUrl?: string
  createdAt: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerationRequest {
  messages: ChatMessage[]
  provider: Provider
  modelId: string
  apiKeyRef?: string
  temperature?: number
  topP?: number
  maxTokens?: number
  stopSequences?: string[]
  thinking?: boolean
  thinkingBudgetTokens?: number
  stream: boolean
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface GenerationResult {
  text: string
  finishReason?: string
  usage?: TokenUsage
}

export interface StreamChunk {
  text: string
  done: boolean
}
