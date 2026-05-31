import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'

function BeatNodeView() {
  return (
    <NodeViewWrapper>
      <div
        data-type="beat"
        className="my-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-950/30"
      >
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-amber-600 select-none dark:text-amber-400">
          Beat
        </span>
        <NodeViewContent className="text-sm text-amber-900 dark:text-amber-100" />
      </div>
    </NodeViewWrapper>
  )
}

export const BeatNode = Node.create({
  name: 'beat',
  group: 'block',
  content: 'inline*',
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="beat"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'beat' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(BeatNodeView)
  },

  addKeyboardShortcuts() {
    return {
      // Enter inside a beat exits the beat node and inserts a paragraph after
      Enter: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const node = selection.$anchor.node()
        if (node.type.name !== 'beat') return false
        return editor.chain().exitCode().run()
      },
    }
  },
})
