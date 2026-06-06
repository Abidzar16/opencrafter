// Transparent gzip compression for large Tiptap JSON documents stored in Dexie.
// Only compresses when the serialised JSON exceeds COMPRESS_THRESHOLD bytes.
// Uses the browser's native CompressionStream / DecompressionStream APIs.

const COMPRESS_THRESHOLD = 50_000 // ~50 KB of raw JSON

async function streamToUint8Array(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

/**
 * Serialise and gzip-compress `data` if it exceeds the threshold.
 * Returns `null` for small documents (store as plain object instead).
 */
export async function compressJSON(data: Record<string, unknown>): Promise<Uint8Array | null> {
  const json = JSON.stringify(data)
  if (json.length < COMPRESS_THRESHOLD) return null

  const encoded = new TextEncoder().encode(json)
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  await writer.write(encoded)
  await writer.close()
  return streamToUint8Array(cs.readable)
}

/**
 * Decompress bytes produced by `compressJSON` back to the original object.
 */
export async function decompressJSON(bytes: Uint8Array): Promise<Record<string, unknown>> {
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  await writer.write(bytes)
  await writer.close()
  const decompressed = await streamToUint8Array(ds.readable)
  const json = new TextDecoder().decode(decompressed)
  return JSON.parse(json) as Record<string, unknown>
}
