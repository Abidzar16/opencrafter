import { Mark, mergeAttributes } from '@tiptap/core'

/**
 * Shell for Phase 3. Stores an entryId attribute on the mark so detection
 * results can be replayed after a full implementation. The hover card and
 * auto-detection engine are wired up in Phase 3 (§3.3).
 */
export const CodexHighlight = Mark.create({
  name: 'codexHighlight',
  excludes: '',
  spanning: false,
  inclusive: false,

  addAttributes() {
    return {
      entryId: {
        default: null,
        parseHTML: el => el.getAttribute('data-entry-id'),
        renderHTML: attrs => ({ 'data-entry-id': attrs.entryId }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-entry-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'codex-highlight underline decoration-dotted decoration-primary/60 cursor-pointer',
      }),
      0,
    ]
  },
})
