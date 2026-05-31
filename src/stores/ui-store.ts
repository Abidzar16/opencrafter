import { create } from 'zustand'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
export type ActivePanel = 'codex' | 'snippets' | 'prompts' | 'export' | null

interface UIState {
  sidebarCollapsed: boolean
  activePanel: ActivePanel
  focusMode: boolean
  saveStatus: SaveStatus
  // modal visibility flags
  novelSettingsOpen: boolean
  createNovelOpen: boolean

  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setActivePanel: (panel: ActivePanel) => void
  setFocusMode: (v: boolean) => void
  setSaveStatus: (status: SaveStatus) => void
  setNovelSettingsOpen: (v: boolean) => void
  setCreateNovelOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>()(set => ({
  sidebarCollapsed: false,
  activePanel: null,
  focusMode: false,
  saveStatus: 'idle',
  novelSettingsOpen: false,
  createNovelOpen: false,

  setSidebarCollapsed: v => set({ sidebarCollapsed: v }),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActivePanel: panel => set({ activePanel: panel }),
  setFocusMode: v => set({ focusMode: v }),
  setSaveStatus: status => set({ saveStatus: status }),
  setNovelSettingsOpen: v => set({ novelSettingsOpen: v }),
  setCreateNovelOpen: v => set({ createNovelOpen: v }),
}))
