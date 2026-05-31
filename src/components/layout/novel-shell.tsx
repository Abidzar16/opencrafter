import type { ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { SaveIndicator } from './save-indicator'
import { CodexSidebar } from '@/components/codex/CodexSidebar'
import { useUIStore } from '@/stores/ui-store'
import { useNovel } from '@/lib/db/hooks/novels'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  BookOpen,
  Scissors,
  Wand2,
  Download,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  PenLine,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react'

interface NovelShellProps {
  novelId: string
  children: ReactNode
}

type NavMode = 'plan' | 'write' | 'chat' | 'review'

type NavModeDef = {
  key: NavMode
  label: string
  icon: ReactNode
  to: '/novel/$novelId/plan' | '/novel/$novelId/write' | '/novel/$novelId/chat' | '/novel/$novelId/review'
}

const modes: NavModeDef[] = [
  { key: 'plan', label: 'Plan', icon: <LayoutGrid className="h-4 w-4" />, to: '/novel/$novelId/plan' },
  { key: 'write', label: 'Write', icon: <PenLine className="h-4 w-4" />, to: '/novel/$novelId/write' },
  { key: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" />, to: '/novel/$novelId/chat' },
  { key: 'review', label: 'Review', icon: <ClipboardCheck className="h-4 w-4" />, to: '/novel/$novelId/review' },
]

const sidebarItems = [
  { key: 'codex', label: 'Codex', icon: <BookOpen className="h-5 w-5" /> },
  { key: 'snippets', label: 'Snippets', icon: <Scissors className="h-5 w-5" /> },
  { key: 'prompts', label: 'Prompts', icon: <Wand2 className="h-5 w-5" /> },
  { key: 'export', label: 'Export', icon: <Download className="h-5 w-5" /> },
] as const

export function NovelShell({ novelId, children }: NovelShellProps) {
  const novel = useNovel(novelId)
  const { sidebarCollapsed, toggleSidebar, activePanel, setActivePanel } = useUIStore()
  const location = useLocation()
  const currentMode = modes.find(m => location.pathname.endsWith(m.key))?.key ?? 'plan'

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top navigation bar */}
      <header className="bg-background border-border flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back to library</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Library</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleSidebar}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</TooltipContent>
          </Tooltip>

          <span className="text-foreground max-w-[200px] truncate text-sm font-medium">
            {novel?.title ?? '…'}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center gap-1">
          {modes.map(mode => (
            <Button
              key={mode.key}
              variant={currentMode === mode.key ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-1.5"
              asChild
            >
              <Link to={mode.to} params={{ novelId }}>
                {mode.icon}
                <span className="hidden sm:inline">{mode.label}</span>
              </Link>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SaveIndicator />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Icon sidebar */}
        <aside
          className={cn(
            'bg-sidebar border-sidebar-border flex shrink-0 flex-col items-center gap-1 border-r py-2',
            sidebarCollapsed ? 'w-0 overflow-hidden p-0' : 'w-12',
          )}
        >
          {sidebarItems.map(item => (
            <Tooltip key={item.key}>
              <TooltipTrigger asChild>
                <Button
                  variant={activePanel === item.key ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() =>
                    setActivePanel(activePanel === item.key ? null : item.key)
                  }
                >
                  {item.icon}
                  <span className="sr-only">{item.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </aside>

        {/* Side panel (Codex, Snippets, etc.) */}
        {activePanel === 'codex' && (
          <div className="border-border bg-background w-72 shrink-0 overflow-hidden border-r">
            <CodexSidebar novelId={novelId} />
          </div>
        )}

        {/* Main panel */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
