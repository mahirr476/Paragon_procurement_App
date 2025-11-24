"use client"

import { useState, useEffect } from "react"
import { Palette, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getTheme, saveTheme } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"

const themes = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    type: 'dark',
    description: 'Dark with orange accents',
    colors: {
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      card: '240 10% 8%',
      cardForeground: '0 0% 98%',
      primary: '24 100% 50%',    // Orange
      primaryForeground: '0 0% 98%',
      muted: '240 10% 14%',
      mutedForeground: '240 5% 64%',
      border: '240 10% 18%',
      accent: '24 100% 50%',
      ring: '24 100% 50%',
      preview: 'from-orange-500 to-red-500'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    type: 'dark',
    description: 'Deep blue with cyan accents',
    colors: {
      background: '220 26% 14%',
      foreground: '210 40% 98%',
      card: '220 26% 18%',
      cardForeground: '210 40% 98%',
      primary: '199 89% 48%',    // Cyan
      primaryForeground: '220 26% 14%',
      muted: '220 20% 25%',
      mutedForeground: '215 20% 65%',
      border: '220 20% 28%',
      accent: '199 89% 48%',
      ring: '199 89% 48%',
      preview: 'from-cyan-500 to-blue-600'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'dark',
    description: 'Deep green nature theme',
    colors: {
      background: '160 30% 12%',
      foreground: '142 76% 90%',
      card: '160 30% 16%',
      cardForeground: '142 76% 90%',
      primary: '142 76% 45%',    // Emerald
      primaryForeground: '160 30% 12%',
      muted: '160 20% 24%',
      mutedForeground: '150 15% 65%',
      border: '160 20% 28%',
      accent: '142 76% 45%',
      ring: '142 76% 45%',
      preview: 'from-emerald-500 to-teal-600'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    type: 'dark',
    description: 'Warm pink and purple',
    colors: {
      background: '340 35% 12%',
      foreground: '340 90% 95%',
      card: '340 35% 16%',
      cardForeground: '340 90% 95%',
      primary: '330 81% 60%',    // Pink
      primaryForeground: '340 35% 12%',
      muted: '340 25% 24%',
      mutedForeground: '335 20% 65%',
      border: '340 25% 28%',
      accent: '330 81% 60%',
      ring: '330 81% 60%',
      preview: 'from-pink-500 to-rose-500'
    }
  },
  {
    id: 'arctic',
    name: 'Arctic',
    type: 'dark',
    description: 'Cool blue-gray tones',
    colors: {
      background: '210 20% 15%',
      foreground: '210 40% 98%',
      card: '210 20% 20%',
      cardForeground: '210 40% 98%',
      primary: '208 100% 60%',    // Light blue
      primaryForeground: '210 20% 15%',
      muted: '210 15% 28%',
      mutedForeground: '210 15% 68%',
      border: '210 15% 32%',
      accent: '208 100% 60%',
      ring: '208 100% 60%',
      preview: 'from-sky-400 to-blue-500'
    }
  },
  {
    id: 'light',
    name: 'Light',
    type: 'light',
    description: 'Clean white with gray',
    colors: {
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      card: '0 0% 98%',
      cardForeground: '222 47% 11%',
      primary: '222 47% 25%',    // Dark gray
      primaryForeground: '210 40% 98%',
      muted: '210 40% 96%',
      mutedForeground: '215 16% 47%',
      border: '214 32% 91%',
      accent: '210 40% 90%',
      ring: '222 47% 25%',
      preview: 'from-slate-300 to-gray-400'
    }
  },
  {
    id: 'warm',
    name: 'Warm Light',
    type: 'light',
    description: 'Soft beige and amber',
    colors: {
      background: '48 52% 97%',
      foreground: '25 45% 20%',
      card: '48 52% 95%',
      cardForeground: '25 45% 20%',
      primary: '38 92% 50%',     // Amber
      primaryForeground: '48 52% 97%',
      muted: '43 52% 92%',
      mutedForeground: '25 25% 45%',
      border: '43 52% 88%',
      accent: '43 96% 85%',
      ring: '38 92% 50%',
      preview: 'from-amber-400 to-orange-400'
    }
  },
  {
    id: 'cool',
    name: 'Cool Light',
    type: 'light',
    description: 'Fresh blue and white',
    colors: {
      background: '204 45% 98%',
      foreground: '222 47% 20%',
      card: '204 45% 96%',
      cardForeground: '222 47% 20%',
      primary: '211 100% 50%',   // Blue
      primaryForeground: '204 45% 98%',
      muted: '210 40% 94%',
      mutedForeground: '215 25% 45%',
      border: '214 40% 88%',
      accent: '204 94% 85%',
      ring: '211 100% 50%',
      preview: 'from-blue-400 to-sky-500'
    }
  },
  {
    id: 'monochrome-dark',
    name: 'Monochrome Dark',
    type: 'dark',
    description: 'Pure black and white',
    colors: {
      background: '0 0% 8%',
      foreground: '0 0% 95%',
      card: '0 0% 12%',
      cardForeground: '0 0% 95%',
      primary: '0 0% 80%',
      primaryForeground: '0 0% 10%',
      muted: '0 0% 16%',
      mutedForeground: '0 0% 60%',
      border: '0 0% 22%',
      accent: '0 0% 80%',
      ring: '0 0% 80%',
      preview: 'from-gray-700 to-gray-900'
    }
  },
  {
    id: 'monochrome-light',
    name: 'Monochrome Light',
    type: 'light',
    description: 'Pure white and gray',
    colors: {
      background: '0 0% 98%',
      foreground: '0 0% 10%',
      card: '0 0% 100%',
      cardForeground: '0 0% 10%',
      primary: '0 0% 25%',
      primaryForeground: '0 0% 98%',
      muted: '0 0% 92%',
      mutedForeground: '0 0% 45%',
      border: '0 0% 85%',
      accent: '0 0% 25%',
      ring: '0 0% 25%',
      preview: 'from-gray-300 to-gray-500'
    }
  }
]

export function ThemeSelector({ collapsed }: { collapsed: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('cyberpunk')

  const applyTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId)
    if (!theme) return

    const root = document.documentElement
    root.setAttribute('data-theme', themeId)

    const colors = theme.colors

    root.style.setProperty('--background', colors.background)
    root.style.setProperty('--foreground', colors.foreground)
    root.style.setProperty('--card', colors.card)
    root.style.setProperty('--card-foreground', colors.cardForeground)
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--primary-foreground', colors.primaryForeground)
    root.style.setProperty('--muted', colors.muted)
    root.style.setProperty('--muted-foreground', colors.mutedForeground)
    root.style.setProperty('--border', colors.border)
    root.style.setProperty('--accent', colors.accent)
    root.style.setProperty('--ring', colors.ring)
    root.style.setProperty('--popover', colors.card)
    root.style.setProperty('--popover-foreground', colors.cardForeground)
    root.style.setProperty('--input', colors.border)
  }

  useEffect(() => {
    const loadTheme = async () => {
      const user = getCurrentUser()
      if (user) {
        const theme = await getTheme(user.id)
        setCurrentTheme(theme)
        applyTheme(theme)
      } else {
        applyTheme('cyberpunk')
      }
    }
    loadTheme()
  }, [])

  const handleThemeChange = async (themeId: string) => {
    setCurrentTheme(themeId)
    const user = getCurrentUser()
    if (user) {
      await saveTheme(user.id, themeId)
    }
    applyTheme(themeId)
    setIsOpen(false)
  }

  const currentThemeData = themes.find(t => t.id === currentTheme)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size={collapsed ? "icon" : "default"}
        onClick={() => setIsOpen(!isOpen)}
        className={collapsed
          ? "text-muted-foreground hover:text-foreground w-full justify-center px-0"
          : "w-full flex items-center gap-2 text-muted-foreground hover:text-foreground justify-start"
        }
      >
        <Palette className="w-5 h-5" />
        {!collapsed && (
          <div className="flex flex-col items-start">
            <span className="text-sm">Theme</span>
            <span className="text-xs text-muted-foreground">{currentThemeData?.name}</span>
          </div>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute bottom-full mb-2 w-72 max-h-[70vh] bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden flex flex-col ${
            collapsed ? "left-full ml-2" : "left-0"
          }`}>
            <div className="text-xs text-muted-foreground font-medium p-4 pb-2">SELECT THEME</div>

            <div className="overflow-y-auto px-4 pb-4">
              {/* Dark Themes */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-foreground mb-2">Dark Themes</div>
                <div className="space-y-2">
                  {themes.filter(t => t.type === 'dark').map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-all ${
                        currentTheme === theme.id ? 'bg-muted ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.colors.preview} border-2 border-border shadow-sm flex-shrink-0`} />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-foreground">{theme.name}</div>
                        <div className="text-xs text-muted-foreground">{theme.description}</div>
                      </div>
                      {currentTheme === theme.id && (
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Light Themes */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2">Light Themes</div>
                <div className="space-y-2">
                  {themes.filter(t => t.type === 'light').map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-all ${
                        currentTheme === theme.id ? 'bg-muted ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.colors.preview} border-2 border-border shadow-sm flex-shrink-0`} />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-foreground">{theme.name}</div>
                        <div className="text-xs text-muted-foreground">{theme.description}</div>
                      </div>
                      {currentTheme === theme.id && (
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
