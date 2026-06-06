import { useState, type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SaveIndicator } from './save-indicator'
import { CodexSidebar } from '@/components/codex/CodexSidebar'
import { SnippetsSidebar } from '@/components/snippets/SnippetsSidebar'
import { ExportPanel } from '@/components/export/ExportPanel'
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
  Menu,
  ChevronDown,
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
  const { sidebarCollapsed, toggleSidebar, activePanel, setActivePanel, codexPinned, snippetsPinned } = useUIStore()
  const location = useLocation()
  const currentMode = modes.find(m => location.pathname.endsWith(m.key))?.key ?? 'plan'
  const currentModeLabel = modes.find(m => m.key === currentMode)?.label ?? 'Plan'

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top navigation bar */}
      <header className="bg-background border-border flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <div className="flex items-center gap-2">
          {/* Hamburger: mobile only (< 640px) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open sidebar menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

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

          {/* Sidebar toggle: hidden at mobile (< 640px) */}
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-8 w-8 sm:flex"
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

          <span className="text-foreground max-w-[140px] truncate text-sm font-medium sm:max-w-[200px]">
            {novel?.title ?? '…'}
          </span>
        </div>

        {/* Mode switcher — full buttons at sm+, dropdown at mobile */}
        <div className="flex flex-1 items-center justify-center gap-1">
          {/* Desktop: icon + label buttons */}
          <div className="hidden gap-1 sm:flex">
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
                  <span className="hidden md:inline">{mode.label}</span>
                </Link>
              </Button>
            ))}
          </div>

          {/* Mobile: dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 sm:hidden">
                {modes.find(m => m.key === currentMode)?.icon}
                <span className="text-xs">{currentModeLabel}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {modes.map(mode => (
                <DropdownMenuItem key={mode.key} asChild>
                  <Link to={mode.to} params={{ novelId }} className="flex items-center gap-2">
                    {mode.icon}
                    {mode.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
        {/* Icon sidebar — hidden at < 640px; hidden when sidebarCollapsed */}
        <aside
          className={cn(
            'bg-sidebar border-sidebar-border hidden shrink-0 flex-col items-center gap-1 border-r py-2 sm:flex',
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
                  aria-label={item.label}
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </aside>

        {/* Side panel (Codex, Snippets) — hidden below 900px */}
        {(activePanel === 'codex' || codexPinned) && (
          <div className="border-border bg-background hidden w-72 shrink-0 overflow-hidden border-r max-[900px]:hidden min-[900px]:block">
            <CodexSidebar novelId={novelId} />
          </div>
        )}

        {(activePanel === 'snippets' || snippetsPinned) && (
          <div className="border-border bg-background hidden w-72 shrink-0 overflow-hidden border-r max-[900px]:hidden min-[900px]:block">
            <SnippetsSidebar novelId={novelId} />
          </div>
        )}

        {/* Main panel */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Export panel (sheet overlay) */}
      <ExportPanel
        open={activePanel === 'export'}
        novelId={novelId}
        onClose={() => setActivePanel(null)}
      />

      {/* Mobile sidebar sheet (< 640px) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-sm">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 p-2">
            {sidebarItems.map(item => (
              <Button
                key={item.key}
                variant={activePanel === item.key ? 'secondary' : 'ghost'}
                className="h-10 justify-start gap-3"
                onClick={() => {
                  setActivePanel(activePanel === item.key ? null : item.key)
                  setMobileMenuOpen(false)
                }}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Button>
            ))}
          </div>
          {/* Mobile: show panel content inline */}
          {(activePanel === 'codex' || codexPinned) && (
            <div className="border-t">
              <CodexSidebar novelId={novelId} />
            </div>
          )}
          {(activePanel === 'snippets' || snippetsPinned) && (
            <div className="border-t">
              <SnippetsSidebar novelId={novelId} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
