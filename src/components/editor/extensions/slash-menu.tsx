import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Swords, Layers, BookMarked, BookPlus, ChevronRight } from 'lucide-react'
import type { Editor } from '@tiptap/core'

export const OPEN_PROGRESSION_PICKER_EVENT = 'openCodexProgressionPicker'
export const OPEN_QUICK_CREATE_CODEX_EVENT = 'openQuickCreateCodex'

export interface SlashMenuItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (editor: Editor) => void
}

export const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    title: 'Beat',
    description: 'Insert a beat instruction block',
    icon: <Swords className="h-4 w-4" />,
    command: editor => {
      editor.chain().focus().deleteRange(editor.state.selection).insertContent({ type: 'beat', content: [{ type: 'text', text: '' }] }).run()
    },
  },
  {
    title: 'Section',
    description: 'Wrap content in a colored section',
    icon: <Layers className="h-4 w-4" />,
    command: editor => {
      editor
        .chain()
        .focus()
        .deleteRange(editor.state.selection)
        .insertContent({
          type: 'section',
          attrs: { color: '#6366f1', label: 'Section' },
          content: [{ type: 'paragraph' }],
        })
        .run()
    },
  },
  {
    title: 'Codex Progression',
    description: 'Anchor a character/world change at this scene',
    icon: <BookMarked className="h-4 w-4" />,
    command: (_e) => {
      void _e
      document.dispatchEvent(new CustomEvent(OPEN_PROGRESSION_PICKER_EVENT))
    },
  },
  {
    title: 'New Codex Entry',
    description: 'Quickly create a codex entry and link to this scene',
    icon: <BookPlus className="h-4 w-4" />,
    command: (_e) => {
      void _e
      document.dispatchEvent(new CustomEvent(OPEN_QUICK_CREATE_CODEX_EVENT))
    },
  },
]

interface SlashMenuListProps {
  items: SlashMenuItem[]
  command: (item: SlashMenuItem) => void
}

interface SlashMenuListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const SlashMenuList = forwardRef<SlashMenuListHandle, SlashMenuListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }) {
        if (event.key === 'ArrowUp') {
          setSelectedIndex(i => (i + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex(i => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) command(item)
          return true
        }
        return false
      },
    }))

    if (!items.length) {
      return (
        <div className="bg-popover border-border w-64 rounded-lg border p-2 shadow-lg">
          <p className="text-muted-foreground px-2 py-1 text-sm">No results</p>
        </div>
      )
    }

    return (
      <div className="bg-popover border-border w-64 rounded-lg border p-1 shadow-lg">
        {items.map((item, i) => (
          <button
            key={item.title}
            className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
              i === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
            }`}
            onClick={() => command(item)}
          >
            <span className="text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md border">
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                {item.title}
                <ChevronRight className="text-muted-foreground h-3 w-3" />
              </div>
              <p className="text-muted-foreground truncate text-xs">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    )
  },
)
SlashMenuList.displayName = 'SlashMenuList'

const suggestion: Partial<SuggestionOptions> = {
  char: '/',
  startOfLine: false,
  allowSpaces: false,

  items({ query }: { query: string }) {
    return SLASH_MENU_ITEMS.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()),
    )
  },

  render() {
    let renderer: ReactRenderer<SlashMenuListHandle, SlashMenuListProps>
    let popup: TippyInstance[]

    return {
      onStart(props) {
        renderer = new ReactRenderer(SlashMenuList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) return

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: renderer.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },

      onUpdate(props) {
        renderer.updateProps(props)
        if (!props.clientRect) return
        popup[0]?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect })
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup[0]?.hide()
          return true
        }
        return renderer.ref?.onKeyDown(props) ?? false
      },

      onExit() {
        popup[0]?.destroy()
        renderer.destroy()
      },
    }
  },

  command({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: SlashMenuItem }) {
    editor.chain().focus().deleteRange(range).run()
    props.command(editor)
  },
}

export const SlashMenu = Extension.create({
  name: 'slashMenu',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...suggestion,
      }),
    ]
  },
})
