import type { ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActionMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  destructive?: boolean
  separator?: boolean
  disabled?: boolean
}

interface ActionMenuProps {
  actions: ActionMenuItem[]
  trigger?: ReactNode
  align?: 'start' | 'center' | 'end'
}

export function ActionMenu({ actions, trigger, align = 'end' }: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {actions.map((action, i) => (
          <span key={i}>
            {action.separator && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(action.destructive && 'text-destructive focus:text-destructive')}
            >
              {action.icon && <span className="mr-2 h-4 w-4">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          </span>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
