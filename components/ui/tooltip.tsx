import * as React from "react"

interface TooltipProps {
  children: React.ReactElement
  content: string
  show: boolean
}

export function Tooltip({ children, content, show }: TooltipProps) {
  if (!show) return children

  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover"></div>
      </div>
    </div>
  )
}
