import { create } from 'zustand'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
export type ActivePanel = 'codex' | 'snippets' | 'prompts' | 'export' | null
export type PlanView = 'board' | 'outline' | 'grid'

interface UIState {
  sidebarCollapsed: boolean
  activePanel: ActivePanel
  codexPinned: boolean
  focusMode: boolean
  saveStatus: SaveStatus
  // modal visibility flags
  novelSettingsOpen: boolean
  createNovelOpen: boolean
  // plan module
  planView: PlanView
  planSearch: string

  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setActivePanel: (panel: ActivePanel) => void
  setCodexPinned: (v: boolean) => void
  toggleCodexPinned: () => void
  setFocusMode: (v: boolean) => void
  setSaveStatus: (status: SaveStatus) => void
  setNovelSettingsOpen: (v: boolean) => void
  setCreateNovelOpen: (v: boolean) => void
  setPlanView: (v: PlanView) => void
  setPlanSearch: (v: string) => void
}

export const useUIStore = create<UIState>()(set => ({
  sidebarCollapsed: false,
  activePanel: null,
  codexPinned: false,
  focusMode: false,
  saveStatus: 'idle',
  novelSettingsOpen: false,
  createNovelOpen: false,
  planView: 'board',
  planSearch: '',

  setSidebarCollapsed: v => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActivePanel: panel => set({ activePanel: panel }),
  setCodexPinned: v => set({ codexPinned: v }),
  toggleCodexPinned: () => set(s => ({ codexPinned: !s.codexPinned })),
  setFocusMode: v => set({ focusMode: v }),
  setSaveStatus: status => set({ saveStatus: status }),
  setNovelSettingsOpen: v => set({ novelSettingsOpen: v }),
  setCreateNovelOpen: v => set({ createNovelOpen: v }),
  setPlanView: v => set({ planView: v }),
  setPlanSearch: v => set({ planSearch: v }),
}))
