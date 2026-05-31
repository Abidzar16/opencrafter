import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Prompt, PromptComponent, PromptPersona, PromptPreset, ModelConfig, ApiKey, PromptType } from '@/types'

// Prompts

export function usePrompts() {
  return useLiveQuery(() => db.prompts.toArray(), [])
}

export function usePromptsByType(type: PromptType | undefined) {
  return useLiveQuery(
    () => (type ? db.prompts.where('type').equals(type).toArray() : []),
    [type],
  )
}

export function usePrompt(id: string | undefined) {
  return useLiveQuery(() => (id ? db.prompts.get(id) : undefined), [id])
}

export function useCreatePrompt() {
  return async (data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID()
    const now = Date.now()
    await db.prompts.add({ id, ...data, createdAt: now, updatedAt: now })
    return id
  }
}

export function useUpdatePrompt() {
  return async (id: string, data: Partial<Prompt>): Promise<void> => {
    await db.prompts.update(id, { ...data, updatedAt: Date.now() })
  }
}

export function useDeletePrompt() {
  return async (id: string): Promise<void> => {
    await db.prompts.delete(id)
  }
}

// Prompt Components

export function usePromptComponents() {
  return useLiveQuery(() => db.prompt_components.toArray(), [])
}

export function useCreatePromptComponent() {
  return async (data: Omit<PromptComponent, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.prompt_components.add({ id, ...data })
    return id
  }
}

export function useUpdatePromptComponent() {
  return async (id: string, data: Partial<PromptComponent>): Promise<void> => {
    await db.prompt_components.update(id, data)
  }
}

export function useDeletePromptComponent() {
  return async (id: string): Promise<void> => {
    await db.prompt_components.delete(id)
  }
}

// Prompt Personas

export function usePromptPersonas() {
  return useLiveQuery(() => db.prompt_personas.toArray(), [])
}

export function useCreatePromptPersona() {
  return async (data: Omit<PromptPersona, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.prompt_personas.add({ id, ...data })
    return id
  }
}

export function useUpdatePromptPersona() {
  return async (id: string, data: Partial<PromptPersona>): Promise<void> => {
    await db.prompt_personas.update(id, data)
  }
}

export function useDeletePromptPersona() {
  return async (id: string): Promise<void> => {
    await db.prompt_personas.delete(id)
  }
}

// Prompt Presets

export function usePromptPresets(promptId: string | undefined) {
  return useLiveQuery(
    () => (promptId ? db.prompt_presets.where('promptId').equals(promptId).toArray() : []),
    [promptId],
  )
}

export function useCreatePromptPreset() {
  return async (data: Omit<PromptPreset, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.prompt_presets.add({ id, ...data })
    return id
  }
}

export function useDeletePromptPreset() {
  return async (id: string): Promise<void> => {
    await db.prompt_presets.delete(id)
  }
}

// Model Configs

export function useModelConfigs() {
  return useLiveQuery(() => db.model_configs.toArray(), [])
}

export function useModelConfig(id: string | undefined) {
  return useLiveQuery(() => (id ? db.model_configs.get(id) : undefined), [id])
}

export function useCreateModelConfig() {
  return async (data: Omit<ModelConfig, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.model_configs.add({ id, ...data })
    return id
  }
}

export function useUpdateModelConfig() {
  return async (id: string, data: Partial<ModelConfig>): Promise<void> => {
    await db.model_configs.update(id, data)
  }
}

export function useDeleteModelConfig() {
  return async (id: string): Promise<void> => {
    await db.model_configs.delete(id)
  }
}

// API Keys

export function useApiKeys() {
  return useLiveQuery(() => db.api_keys.toArray(), [])
}

export function useApiKeysByProvider(provider: string | undefined) {
  return useLiveQuery(
    () => (provider ? db.api_keys.where('provider').equals(provider).toArray() : []),
    [provider],
  )
}

export function useCreateApiKey() {
  return async (data: Omit<ApiKey, 'id' | 'createdAt'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.api_keys.add({ id, ...data, createdAt: Date.now() })
    return id
  }
}

export function useUpdateApiKey() {
  return async (id: string, data: Partial<ApiKey>): Promise<void> => {
    await db.api_keys.update(id, data)
  }
}

export function useDeleteApiKey() {
  return async (id: string): Promise<void> => {
    await db.api_keys.delete(id)
  }
}
