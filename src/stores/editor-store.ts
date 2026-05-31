import { create } from 'zustand'

interface EditorState {
  activeNovelId: string | null
  activeActId: string | null
  activeChapterId: string | null
  activeSceneId: string | null
  wordCount: number

  setActiveNovel: (id: string | null) => void
  setActiveAct: (id: string | null) => void
  setActiveChapter: (id: string | null) => void
  setActiveScene: (id: string | null) => void
  setWordCount: (count: number) => void
}

export const useEditorStore = create<EditorState>()(set => ({
  activeNovelId: null,
  activeActId: null,
  activeChapterId: null,
  activeSceneId: null,
  wordCount: 0,

  setActiveNovel: id => set({ activeNovelId: id }),
  setActiveAct: id => set({ activeActId: id }),
  setActiveChapter: id => set({ activeChapterId: id }),
  setActiveScene: id => set({ activeSceneId: id }),
  setWordCount: count => set({ wordCount: count }),
}))
