import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'

interface ProseEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function ProseEditor({
  content,
  onChange,
  placeholder = 'Write here…',
  className,
  minHeight = '80px',
}: ProseEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: Object.keys(content).length > 0 ? content : undefined,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>)
    },
    editorProps: {
      attributes: {
        class: 'prose-sm focus:outline-none w-full',
        style: `min-height: ${minHeight}`,
      },
    },
  })

  return (
    <div
      className={cn(
        'rounded-md border bg-background px-3 py-2 text-sm',
        'focus-within:ring-ring focus-within:outline-none focus-within:ring-1',
        className,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
