/**
 * Converts a fetch Response body (SSE stream) into an AsyncIterable of text deltas.
 * Handles both OpenAI-format (`data: {"choices":[{"delta":{"content":"..."}}]}`)
 * and Anthropic-format (`data: {"type":"content_block_delta","delta":{"text":"..."}}`) streams.
 * Terminates on `data: [DONE]` (OpenAI) or `data: {"type":"message_stop"}` (Anthropic).
 */
export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncIterable<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // Keep the last potentially-incomplete line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') return

        let parsed: unknown
        try {
          parsed = JSON.parse(data)
        } catch {
          continue
        }

        const text = extractTextDelta(parsed)
        if (text) yield text

        if (isStreamDone(parsed)) return
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function extractTextDelta(parsed: unknown): string {
  if (!parsed || typeof parsed !== 'object') return ''
  const obj = parsed as Record<string, unknown>

  // OpenAI format
  const choices = obj['choices']
  if (Array.isArray(choices) && choices.length > 0) {
    const delta = (choices[0] as Record<string, unknown>)['delta']
    if (delta && typeof delta === 'object') {
      const content = (delta as Record<string, unknown>)['content']
      if (typeof content === 'string') return content
    }
  }

  // Anthropic format: content_block_delta
  if (obj['type'] === 'content_block_delta') {
    const delta = obj['delta']
    if (delta && typeof delta === 'object') {
      const deltaObj = delta as Record<string, unknown>
      if (deltaObj['type'] === 'text_delta' && typeof deltaObj['text'] === 'string') {
        return deltaObj['text']
      }
    }
  }

  return ''
}

function isStreamDone(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== 'object') return false
  const obj = parsed as Record<string, unknown>
  return obj['type'] === 'message_stop'
}
