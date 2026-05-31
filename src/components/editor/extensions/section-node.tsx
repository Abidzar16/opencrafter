import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'

const SECTION_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#84cc16', // lime
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#f43f5e', // rose
]

function SectionNodeView({
  node,
  updateAttributes,
}: {
  node: { attrs: { color: string; label: string } }
  updateAttributes: (attrs: Record<string, unknown>) => void
}) {
  const { color, label } = node.attrs

  return (
    <NodeViewWrapper>
      <div
        data-type="section"
        className="my-3 rounded-r-md pl-3 pr-2 py-2"
        style={{ borderLeft: `3px solid ${color}`, backgroundColor: `${color}10` }}
      >
        {label && (
          <span
            className="mb-1 block text-[10px] font-semibold uppercase tracking-widest select-none"
            style={{ color }}
          >
            {label}
          </span>
        )}
        <NodeViewContent />
        {/* Color picker (only shown in edit mode) */}
        <div className="mt-2 flex flex-wrap gap-1" contentEditable={false}>
          {SECTION_COLORS.map(c => (
            <button
              key={c}
              className="h-4 w-4 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: c === color ? 'white' : 'transparent',
                outline: c === color ? `2px solid ${c}` : 'none',
              }}
              onClick={() => updateAttributes({ color: c })}
            />
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const SectionNode = Node.create({
  name: 'section',
  group: 'block',
  content: 'block+',
  draggable: true,

  addAttributes() {
    return {
      color: { default: '#6366f1' },
      label: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="section"]',
        getAttrs: el => ({
          color: (el as HTMLElement).getAttribute('data-color') ?? '#6366f1',
          label: (el as HTMLElement).getAttribute('data-label') ?? '',
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'section',
        'data-color': HTMLAttributes.color,
        'data-label': HTMLAttributes.label,
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionNodeView)
  },
})

export { SECTION_COLORS }
