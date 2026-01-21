"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getTheme, saveTheme } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"

const darkTheme = {
  id: 'dark-blue-amber',
  colors: {
    background: '220 40% 8%',        // Dark blue background
    foreground: '0 0% 98%',          // White text
    card: '220 35% 12%',             // Slightly lighter dark blue for cards
    cardForeground: '0 0% 98%',      // White text on cards
    primary: '45 93% 58%',           // Amber yellow
    primaryForeground: '220 40% 8%', // Dark blue text on amber
    muted: '220 30% 16%',            // Muted dark blue
    mutedForeground: '218 15% 65%',  // Muted white/gray
    border: '220 25% 20%',           // Dark blue border
    accent: '45 93% 58%',            // Amber yellow accent
    ring: '45 93% 58%',              // Amber yellow ring
  }
}

const lightTheme = {
  id: 'light-blue',
  colors: {
    background: '0 0% 100%',         // Pure white background
    foreground: '0 0% 0%',           // Black text
    card: '0 0% 98%',                // Off-white cards
    cardForeground: '0 0% 0%',       // Black text on cards
    primary: '220 40% 8%',           // Dark blue (same as dark mode background)
    primaryForeground: '0 0% 100%',  // White text on blue
    muted: '210 40% 96%',            // Very light blue muted
    mutedForeground: '215 25% 27%',  // Dark blue/black muted text
    border: '214 32% 91%',           // Light blue border
    accent: '220 40% 8%',            // Dark blue accent
    ring: '220 40% 8%',              // Dark blue ring
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
        // Handle legacy theme IDs and new ones
        const isLightMode = theme === 'light' || theme === 'light-amber' || theme === 'light-blue-amber' || theme === 'light-blue' ||
                           theme === 'warm' || theme === 'cool' || theme === 'monochrome-light'
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
