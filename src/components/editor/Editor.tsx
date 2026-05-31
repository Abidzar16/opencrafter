import { useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import { BeatNode } from './extensions/beat-node'
import { SectionNode } from './extensions/section-node'
import { SlashMenu } from './extensions/slash-menu'
import { CodexHighlight } from './extensions/codex-highlight'
import { useSceneContent, useSaveSceneContent, useUpdateScene } from '@/lib/db/hooks'
import { useDebouncedSave } from '@/lib/hooks/use-debounced-save'
import { useRevision } from '@/lib/hooks/use-revision'
import { RevisionEntityType } from '@/types'
import db from '@/lib/db/db'

interface EditorProps {
  sceneId: string
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void
  onWordCountChange?: (count: number) => void
}

export function Editor({ sceneId, onEditorReady, onWordCountChange }: EditorProps) {
  const sceneContent = useSceneContent(sceneId)
  const saveSceneContent = useSaveSceneContent()
  const updateScene = useUpdateScene()
  const saveRevision = useRevision(RevisionEntityType.SceneContent, sceneId)

  // Track whether content was loaded into the editor for this sceneId
  const loadedSceneIdRef = useRef<string | null>(null)
  const onWordCountChangeRef = useRef(onWordCountChange)
  useEffect(() => { onWordCountChangeRef.current = onWordCountChange }, [onWordCountChange])

  const doSave = useCallback(async () => {
    if (!editor || editor.isDestroyed) return
    const json = editor.getJSON()

    // Snapshot current stored content before overwrite
    const stored = await db.scene_content.get(sceneId)
    if (stored?.content && Object.keys(stored.content).length > 0) {
      await saveRevision(JSON.stringify(stored.content))
    }

    await saveSceneContent(sceneId, json)

    const words = editor.storage.characterCount?.words() ?? 0
    await updateScene(sceneId, { wordCount: words })
    onWordCountChangeRef.current?.(words)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, saveSceneContent, updateScene, saveRevision])

  const triggerSave = useDebouncedSave(doSave, 800)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: { depth: 100 } }),
      CharacterCount,
      Placeholder.configure({ placeholder: 'Start writing…' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
      BeatNode,
      SectionNode,
      SlashMenu,
      CodexHighlight,
    ],
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
      },
    },
    onUpdate: () => {
      triggerSave()
    },
  })

  // Load content whenever sceneId changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (sceneContent === undefined) return // still loading
    if (loadedSceneIdRef.current === sceneId) return // already loaded

    const content =
      sceneContent?.content && Object.keys(sceneContent.content).length > 0
        ? sceneContent.content
        : '<p></p>'

    editor.commands.setContent(content, false)
    loadedSceneIdRef.current = sceneId

    const words = editor.storage.characterCount?.words() ?? 0
    onWordCountChangeRef.current?.(words)
  }, [editor, sceneId, sceneContent])

  // Expose editor to parent
  useEffect(() => {
    if (editor) onEditorReady?.(editor)
  }, [editor, onEditorReady])

  return (
    <div className="editor-wrapper">
      <EditorContent editor={editor} />
    </div>
  )
}
