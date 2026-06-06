import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import { detect, countMentions } from '@/lib/codex-detector'
import type { TrackedEntry } from '@/lib/codex-detector'

export const CODEX_DETECTION_META = 'codexDetectionDecorations'
export const codexDetectionKey = new PluginKey<DecorationSet>('codexDetection')

/**
 * Creates a ProseMirror plugin that debounces after doc changes,
 * runs the codex detector over all text nodes, and applies inline
 * decorations. Uses setMeta transactions so the debounce dispatch
 * does not re-trigger autosave (caller must filter on CODEX_DETECTION_META).
 */
export function createCodexDetectionPlugin(
  getEntries: () => TrackedEntry[],
  onMentionCounts: (counts: Record<string, number>) => void,
): Plugin<DecorationSet> {
  let view: EditorView | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  function scheduleDetection() {
    if (timer) clearTimeout(timer)

    const schedule =
      typeof requestIdleCallback !== 'undefined'
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: 1200 })
        : (cb: () => void) => setTimeout(cb, 1000)

    timer = setTimeout(() => {
      schedule(() => {
        if (!view) return
        const entries = getEntries()
        const decorations: Decoration[] = []
        const allMatches: ReturnType<typeof detect> = []

        view.state.doc.descendants((node, pos) => {
          if (!node.isText || !node.text) return
          const matches = detect(node.text, entries)
          for (const m of matches) {
            decorations.push(
              Decoration.inline(pos + m.start, pos + m.end, {
                class:
                  'codex-auto-highlight underline decoration-dotted decoration-primary/60 cursor-pointer',
                'data-entry-id': m.entryId,
              }),
            )
          }
          allMatches.push(...matches)
        })

        const decoSet = DecorationSet.create(view.state.doc, decorations)
        view.dispatch(view.state.tr.setMeta(CODEX_DETECTION_META, decoSet))
        onMentionCounts(countMentions(allMatches))
      })
    }, 50) // tiny delay so we don't block within the same microtask
  }

  return new Plugin<DecorationSet>({
    key: codexDetectionKey,

    view(editorView) {
      view = editorView
      scheduleDetection()
      return {
        destroy() {
          view = null
          if (timer) clearTimeout(timer)
        },
      }
    },

    state: {
      init(): DecorationSet {
        return DecorationSet.empty
      },

      apply(tr, old) {
        const meta = tr.getMeta(CODEX_DETECTION_META) as DecorationSet | undefined
        if (meta !== undefined) return meta
        if (tr.docChanged) {
          // Map existing decorations while waiting for next debounce
          scheduleDetection()
          return old.map(tr.mapping, tr.doc)
        }
        return old
      },
    },

    props: {
      decorations(state) {
        return codexDetectionKey.getState(state) ?? DecorationSet.empty
      },
    },
  })
}
