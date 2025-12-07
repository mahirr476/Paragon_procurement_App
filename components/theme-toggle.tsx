"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getTheme, saveTheme } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"

const darkTheme = {
  id: 'cyberpunk',
  colors: {
    background: '240 10% 3.9%',
    foreground: '0 0% 98%',
    card: '240 10% 8%',
    cardForeground: '0 0% 98%',
    primary: '24 100% 50%',
    primaryForeground: '0 0% 98%',
    muted: '240 10% 14%',
    mutedForeground: '240 5% 64%',
    border: '240 10% 18%',
    accent: '24 100% 50%',
    ring: '24 100% 50%',
  }
}

const lightTheme = {
  id: 'light',
  colors: {
    background: '0 0% 100%',
    foreground: '222 47% 11%',
    card: '0 0% 98%',
    cardForeground: '222 47% 11%',
    primary: '222 47% 25%',
    primaryForeground: '210 40% 98%',
    muted: '210 40% 96%',
    mutedForeground: '215 16% 47%',
    border: '214 32% 91%',
    accent: '210 40% 90%',
    ring: '222 47% 25%',
  }
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  const applyTheme = (themeId: string, colors: typeof darkTheme.colors) => {
    const root = document.documentElement
    root.setAttribute('data-theme', themeId)

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
        const isLightMode = theme === 'light'
        setIsDark(!isLightMode)
        applyTheme(
          isLightMode ? lightTheme.id : darkTheme.id,
          isLightMode ? lightTheme.colors : darkTheme.colors
        )
      } else {
        applyTheme(darkTheme.id, darkTheme.colors)
      }
    }
    loadTheme()
  }, [])

  const toggleTheme = async () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)

    const theme = newIsDark ? darkTheme : lightTheme
    const user = getCurrentUser()
    if (user) {
      await saveTheme(user.id, theme.id)
    }
    applyTheme(theme.id, theme.colors)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-muted-foreground hover:!bg-transparent hover:!text-accent"
    >
      {isDark ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </Button>
  )
}
