export interface ParsedScene {
  title: string
  summary: string
}

export interface ParsedChapter {
  title: string
  scenes: ParsedScene[]
}

export interface ParsedAct {
  title: string
  chapters: ParsedChapter[]
}

export interface ParsedStructure {
  acts: ParsedAct[]
}

// --- Markdown parser ---

export function parseMarkdown(text: string): ParsedStructure {
  const lines = text.split('\n')
  const acts: ParsedAct[] = []
  let currentAct: ParsedAct | null = null
  let currentChapter: ParsedChapter | null = null
  let currentSceneLines: string[] = []

  function flushScene() {
    if (!currentChapter) return
    const summary = currentSceneLines.join('\n').trim()
    if (summary) {
      const lastScene = currentChapter.scenes[currentChapter.scenes.length - 1]
      if (lastScene) lastScene.summary = summary
    }
    currentSceneLines = []
  }

  function ensureAct() {
    if (!currentAct) {
      currentAct = { title: 'Act 1', chapters: [] }
      acts.push(currentAct)
    }
  }

  function ensureChapter() {
    ensureAct()
    if (!currentChapter) {
      currentChapter = { title: 'Chapter 1', scenes: [] }
      currentAct!.chapters.push(currentChapter)
    }
  }

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flushScene()
      ensureChapter()
      currentChapter!.scenes.push({ title: line.slice(4).trim(), summary: '' })
    } else if (line.startsWith('## ')) {
      flushScene()
      ensureAct()
      currentChapter = { title: line.slice(3).trim(), scenes: [] }
      currentAct!.chapters.push(currentChapter)
    } else if (line.startsWith('# ')) {
      flushScene()
      currentAct = { title: line.slice(2).trim(), chapters: [] }
      acts.push(currentAct)
      currentChapter = null
    } else if (line.trim() && currentChapter) {
      if (currentChapter.scenes.length === 0) {
        currentChapter.scenes.push({ title: line.trim().slice(0, 60), summary: '' })
      }
      currentSceneLines.push(line)
    }
  }
  flushScene()

  if (acts.length === 0) {
    return { acts: [{ title: 'Act 1', chapters: [{ title: 'Chapter 1', scenes: [] }] }] }
  }

  return { acts }
}

// --- DOCX parser (uses mammoth) ---

export async function parseDocx(file: File): Promise<ParsedStructure> {
  // Dynamic import to keep mammoth out of the main bundle
  const mammoth = await import('mammoth') as unknown as {
    convertToHtml: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>
  }
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  return parseHtml(result.value)
}

function parseHtml(html: string): ParsedStructure {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const acts: ParsedAct[] = []
  let currentAct: ParsedAct | null = null
  let currentChapter: ParsedChapter | null = null
  let currentSceneLines: string[] = []

  function flushScene() {
    if (!currentChapter) return
    const summary = currentSceneLines.join(' ').trim()
    if (summary) {
      const lastScene = currentChapter.scenes[currentChapter.scenes.length - 1]
      if (lastScene) lastScene.summary = summary
    }
    currentSceneLines = []
  }

  function ensureAct() {
    if (!currentAct) {
      currentAct = { title: 'Act 1', chapters: [] }
      acts.push(currentAct)
    }
  }

  function ensureChapter() {
    ensureAct()
    if (!currentChapter) {
      currentChapter = { title: 'Chapter 1', scenes: [] }
      currentAct!.chapters.push(currentChapter)
    }
  }

  for (const node of Array.from(doc.body.children)) {
    const tag = node.tagName.toLowerCase()
    const text = node.textContent?.trim() ?? ''
    if (!text) continue

    if (tag === 'h1') {
      flushScene()
      currentAct = { title: text, chapters: [] }
      acts.push(currentAct)
      currentChapter = null
    } else if (tag === 'h2') {
      flushScene()
      ensureAct()
      currentChapter = { title: text, scenes: [] }
      currentAct!.chapters.push(currentChapter)
    } else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      flushScene()
      ensureChapter()
      currentChapter!.scenes.push({ title: text, summary: '' })
    } else if (tag === 'p') {
      ensureChapter()
      if (currentChapter!.scenes.length === 0) {
        currentChapter!.scenes.push({ title: text.slice(0, 60), summary: '' })
      }
      currentSceneLines.push(text)
    }
  }
  flushScene()

  if (acts.length === 0) {
    return { acts: [{ title: 'Act 1', chapters: [{ title: 'Chapter 1', scenes: [] }] }] }
  }

  return { acts }
}
