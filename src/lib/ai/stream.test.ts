import { describe, it, expect } from 'vitest'
import { parseSSEStream } from './stream'

function makeStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const body = lines.join('\n') + '\n'
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body))
      controller.close()
    },
  })
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<string[]> {
  const chunks: string[] = []
  for await (const chunk of parseSSEStream(stream)) {
    chunks.push(chunk)
  }
  return chunks
}

describe('parseSSEStream — OpenAI format', () => {
  it('parses a single content delta', async () => {
    const stream = makeStream([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}',
      'data: [DONE]',
    ])
    const chunks = await collect(stream)
    expect(chunks).toEqual(['Hello'])
  })

  it('concatenates multiple deltas', async () => {
    const stream = makeStream([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}',
      'data: {"choices":[{"delta":{"content":"lo"}}]}',
      'data: [DONE]',
    ])
    const chunks = await collect(stream)
    expect(chunks).toEqual(['Hel', 'lo'])
  })

  it('stops at [DONE]', async () => {
    const stream = makeStream([
      'data: {"choices":[{"delta":{"content":"Stop here"}}]}',
      'data: [DONE]',
      'data: {"choices":[{"delta":{"content":"Never seen"}}]}',
    ])
    const chunks = await collect(stream)
    expect(chunks).toEqual(['Stop here'])
    expect(chunks).not.toContain('Never seen')
  })

  it('skips non-data lines', async () => {
    const stream = makeStream([
      'event: content_block_delta',
      'data: {"choices":[{"delta":{"content":"Hi"}}]}',
      ': keep-alive comment',
      'data: [DONE]',
    ])
    const chunks = await collect(stream)
    expect(chunks).toEqual(['Hi'])
  })

  it('skips deltas with no content field', async () => {
    const stream = makeStream([
      'data: {"choices":[{"delta":{}}]}',
      'data: {"choices":[{"delta":{"content":"World"}}]}',
      'data: [DONE]',
    ])
    const chunks = await collect(stream)
    expect(chunks).toEqual(['World'])
  })

  it('skips malformed JSON lines', async () => {
    const stream = makeStream([
      'data: {broken json',
      'data: {"choices":[{"delta":{"content":"OK"}}]}',
      'data: [DONE]',
    ])
    const chunks = await collect(stream)
    expect(chunks).toEqual(['OK'])
  })
})

describe('parseSSEStream — Anthropic format', () => {
  it('parses content_block_delta text_delta', async () => {
    const stream = makeStream([
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}',
      'data: {"type":"message_stop"}',
    ])
    const chunks = await collect(stream)
    expect(chunks).toEqual(['Hello'])
  })

  it('stops at message_stop', async () => {
    const stream = makeStream([
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"}}',
      'data: {"type":"message_stop"}',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Never"}}',
    ])
    const chunks = await collect(stream)
    expect(chunks).not.toContain('Never')
  })

  it('ignores non-text_delta event types', async () => {
    const stream = makeStream([
      'data: {"type":"message_start","message":{}}',
      'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Go"}}',
      'data: {"type":"message_stop"}',
    ])
    const chunks = await collect(stream)
    expect(chunks).toEqual(['Go'])
  })
})

describe('parseSSEStream — edge cases', () => {
  it('handles empty stream', async () => {
    const stream = makeStream([])
    const chunks = await collect(stream)
    expect(chunks).toEqual([])
  })

  it('handles stream with only [DONE]', async () => {
    const stream = makeStream(['data: [DONE]'])
    const chunks = await collect(stream)
    expect(chunks).toEqual([])
  })
})
