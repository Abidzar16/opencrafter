// Extract plain text from Tiptap/ProseMirror JSON

interface TiptapNode {
  type: string
  text?: string
  content?: TiptapNode[]
  attrs?: Record<string, unknown>
}

export function tiptapToText(json: Record<string, unknown>): string {
  if (!json || !json.content) return ''
  return nodeToText(json as unknown as TiptapNode)
}

function nodeToText(node: TiptapNode): string {
  if (node.text) return node.text
  if (!node.content) return ''

  const parts = node.content.map(child => nodeToText(child))

  switch (node.type) {
    case 'paragraph':
      return parts.join('') + '\n\n'
    case 'heading':
      return parts.join('') + '\n\n'
    case 'hardBreak':
      return '\n'
    case 'bulletList':
    case 'orderedList':
      return parts.join('') + '\n'
    case 'listItem':
      return '• ' + parts.join('').trim() + '\n'
    case 'blockquote':
      return parts.join('').split('\n').map(l => '> ' + l).join('\n') + '\n'
    case 'codeBlock':
      return '```\n' + parts.join('') + '\n```\n\n'
    default:
      return parts.join('')
  }
}
