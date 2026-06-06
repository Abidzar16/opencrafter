import { useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import { Extension } from '@tiptap/core'
import { BeatNode } from './extensions/beat-node'
import { SectionNode } from './extensions/section-node'
import { SlashMenu } from './extensions/slash-menu'
import { CodexHighlight } from './extensions/codex-highlight'
import { createCodexDetectionPlugin, CODEX_DETECTION_META } from './extensions/codex-detection-plugin'
import { useSceneContentDecoded, useSaveSceneContent, useUpdateScene, useUpdateCodexEntry } from '@/lib/db/hooks'
import { decompressJSON } from '@/lib/db/compression'
import { useDebouncedSave } from '@/lib/hooks/use-debounced-save'
import { useRevision } from '@/lib/hooks/use-revision'
import { RevisionEntityType } from '@/types'
import type { TrackedEntry } from '@/lib/codex-detector'
import db from '@/lib/db/db'

interface EditorProps {
  sceneId: string
  novelId: string
  trackedEntries: TrackedEntry[]
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void
  onWordCountChange?: (count: number) => void
}

export function Editor({
  sceneId,
  novelId,
  trackedEntries,
  onEditorReady,
  onWordCountChange,
}: EditorProps) {
  const sceneContent = useSceneContentDecoded(sceneId)
  const saveSceneContent = useSaveSceneContent()
  const updateScene = useUpdateScene()
  const updateCodexEntry = useUpdateCodexEntry()
  const saveRevision = useRevision(RevisionEntityType.SceneContent, sceneId)

  // Track whether content was loaded into the editor for this sceneId
  const loadedSceneIdRef = useRef<string | null>(null)
  const onWordCountChangeRef = useRef(onWordCountChange)
  useEffect(() => { onWordCountChangeRef.current = onWordCountChange }, [onWordCountChange])

  // Keep trackedEntries fresh for the detection plugin via ref
  const trackedEntriesRef = useRef(trackedEntries)
  useEffect(() => { trackedEntriesRef.current = trackedEntries }, [trackedEntries])

  // Update mention counts in DB (debounced via the plugin callback)
  const novelIdRef = useRef(novelId)
  useEffect(() => { novelIdRef.current = novelId }, [novelId])

  const handleMentionCounts = useCallback(
    (counts: Record<string, number>) => {
      // Fire-and-forget batch update
      Object.entries(counts).forEach(([entryId, mentionCount]) => {
        updateCodexEntry(entryId, { mentionCount }).catch(() => {})
      })
    },
    [updateCodexEntry],
  )

  const doSave = useCallback(async () => {
    if (!editor || editor.isDestroyed) return
    const json = editor.getJSON()

    const stored = await db.scene_content.get(sceneId)
    if (stored) {
      const storedContent = stored._compressed
        ? await decompressJSON(stored._compressed)
        : stored.content
      if (Object.keys(storedContent).length > 0) {
        await saveRevision(JSON.stringify(storedContent))
      }
    }

    await saveSceneContent(sceneId, json)

    const words = editor.storage.characterCount?.words() ?? 0
    await updateScene(sceneId, { wordCount: words })
    onWordCountChangeRef.current?.(words)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, saveSceneContent, updateScene, saveRevision])

  const triggerSave = useDebouncedSave(doSave, 800)

  // Build a stable Extension that holds the PM plugin
  const codexDetectionExtension = useRef(
    Extension.create({
      name: 'codexDetectionPlugin',
      addProseMirrorPlugins() {
        return [
          createCodexDetectionPlugin(
            () => trackedEntriesRef.current,
            handleMentionCounts,
          ),
        ]
      },
    }),
  ).current

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
      codexDetectionExtension,
    ],
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
      },
    },
    // Use onTransaction to filter out detection-only dispatches from save
    onTransaction: ({ transaction }) => {
      if (transaction.getMeta(CODEX_DETECTION_META)) return
      triggerSave()
    },
  })

  // Load content whenever sceneId changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (sceneContent === undefined) return
    if (loadedSceneIdRef.current === sceneId) return

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
