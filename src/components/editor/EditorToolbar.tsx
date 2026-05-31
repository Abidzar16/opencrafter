import type { Editor } from '@tiptap/core'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Maximize2,
  Minimize2,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
  focusMode: boolean
  onToggleFocusMode: () => void
}

function ToolBtn({
  tooltip,
  active,
  disabled,
  onClick,
  children,
}: {
  tooltip: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          disabled={disabled}
          onClick={onClick}
          type="button"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

const HEADING_OPTIONS = [
  { value: '0', label: 'Paragraph' },
  { value: '1', label: 'Heading 1' },
  { value: '2', label: 'Heading 2' },
  { value: '3', label: 'Heading 3' },
]

export function EditorToolbar({ editor, focusMode, onToggleFocusMode }: EditorToolbarProps) {
  if (!editor) return null

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? '1'
    : editor.isActive('heading', { level: 2 })
      ? '2'
      : editor.isActive('heading', { level: 3 })
        ? '3'
        : '0'

  return (
    <div
      className={cn(
        'bg-background/95 border-border flex h-10 shrink-0 items-center gap-1 border-b px-3 backdrop-blur',
        focusMode && 'opacity-0 transition-opacity hover:opacity-100',
      )}
    >
      {/* Paragraph style */}
      <Select
        value={currentHeading}
        onValueChange={val => {
          if (val === '0') {
            editor.chain().focus().setParagraph().run()
          } else {
            editor
              .chain()
              .focus()
              .setHeading({ level: parseInt(val) as 1 | 2 | 3 })
              .run()
          }
        }}
      >
        <SelectTrigger className="h-7 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HEADING_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Text formatting */}
      <ToolBtn tooltip="Bold (⌘B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn tooltip="Italic (⌘I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn tooltip="Underline (⌘U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn tooltip="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn tooltip="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-3.5 w-3.5" />
      </ToolBtn>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Text alignment */}
      <ToolBtn tooltip="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn tooltip="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn tooltip="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn tooltip="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolBtn>

      <div className="flex-1" />

      {/* Focus mode */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleFocusMode}
          >
            {focusMode ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{focusMode ? 'Exit focus mode (Esc)' : 'Focus mode'}</TooltipContent>
      </Tooltip>
    </div>
  )
}

// Re-export heading icons in case used elsewhere
export { Heading1, Heading2, Heading3 }
