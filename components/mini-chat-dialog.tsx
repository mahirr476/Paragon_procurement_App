


"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send, Loader2, Sparkles, Minimize2, ChevronDown } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { getCurrentPOs, getApprovedPOs } from "@/lib/storage"

interface MiniChatDialogProps {
  onClose: () => void
}

export function MiniChatDialog({ onClose }: MiniChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Prevent body scroll on mobile when chat is open
  useEffect(() => {
    if (!isMinimized) {
      const isMobile = window.innerWidth < 640
      if (isMobile) {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
      }
    }
  }, [isMinimized])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const currentPOs = await getCurrentPOs()
      const approvedPOs = await getApprovedPOs()

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          currentPOs: currentPOs.length,
          approvedPOs: approvedPOs.length,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = data.error || "Analysis failed. Please try again."
        if (response.status === 401 || errorMessage.includes("Invalid API Key")) {
          errorMessage = `🔑 Invalid API Key. Please set ANTHROPIC_API_KEY in your .env.local file.`
        } else if (response.status === 413 || errorMessage.includes("too large")) {
          errorMessage = `📊 Request too large. Try a more specific question.`
        } else if (response.status === 429 || errorMessage.includes("Rate limit")) {
          const timeMatch = errorMessage.match(/Please try again in ([^.]+)/)
          errorMessage = timeMatch
            ? `⚠️ Rate limit. Try again in ${timeMatch[1]}.`
            : `⚠️ Rate limit reached. ${errorMessage}`
        }
        throw new Error(errorMessage)
      }

      if (!data.analysis) throw new Error(data.error || "No response from AI service.")

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.analysis,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      let errorText = err instanceof Error ? err.message : "Sorry, I encountered an error."
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Minimized Pill
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 w-72 sm:w-80 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl z-[60] p-3 sm:p-4 cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-1.5 sm:p-2 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-xs sm:text-sm">AI Assistant</p>
              <p className="text-orange-100 text-[10px] sm:text-xs">{messages.length} messages</p>
            </div>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20 rounded-xl"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Full Chat Dialog
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MOBILE  → full screen from top:0 to bottom:64px (above bottom tab bar)
  // DESKTOP → floating 420×600 card at bottom-right
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[55] sm:hidden"
        onClick={onClose}
      />

      <div
        className={[
          // Base
          "fixed z-[60] flex flex-col overflow-hidden",
          "bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800",
          "backdrop-blur-xl shadow-2xl",

          // ── MOBILE: full-screen overlay above bottom tab bar ──
          "inset-x-0 top-0 bottom-16",         // top-0 → bottom-16 (leaves 64px for tab bar)
          "rounded-none",
          "border-b border-orange-500/20",

          // ── DESKTOP (sm+): floating card ──
          "sm:inset-auto",                       // reset mobile insets
          "sm:bottom-24 sm:right-6",
          "sm:w-[420px] sm:h-[600px]",
          "sm:rounded-2xl sm:border sm:border-orange-500/30",
        ].join(" ")}
      >
        {/* ━━ Header ━━ */}
        <div className="bg-gradient-to-r from-orange-500/15 to-orange-600/15 border-b border-orange-500/20 backdrop-blur-sm p-3 sm:p-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-xl shadow-lg shadow-orange-500/20">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm sm:text-base leading-tight">
                  AI Assistant
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  <p className="text-orange-200/70 text-[9px] sm:text-[10px] font-medium uppercase tracking-widest">
                    System: Online
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Minimize – desktop only */}
              <Button
                onClick={() => setIsMinimized(true)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl hidden sm:flex"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              {/* Close */}
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ━━ Messages Area ━━ */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 min-h-0 overscroll-contain">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center px-2 sm:p-6">
              <div className="space-y-4 w-full max-w-sm">
                {/* Hero / Welcome */}
                <div className="bg-gradient-to-br from-orange-500/15 to-orange-600/15 p-5 sm:p-6 rounded-2xl border border-orange-500/20">
                  <div className="relative mx-auto w-fit mb-3">
                    <div className="absolute inset-0 blur-xl bg-orange-500/30 rounded-full scale-150"></div>
                    <Sparkles className="relative w-10 h-10 sm:w-12 sm:h-12 text-orange-400" />
                  </div>
                  <p className="text-white font-semibold text-sm sm:text-base mb-1">Ready to help!</p>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    Ask about patterns, anomalies, or insights in your procurement data
                  </p>
                </div>

                {/* Suggested prompts */}
                <div className="grid grid-cols-1 gap-2 text-left">
                  {[
                    "Show me top spending branches",
                    "Any price anomalies this month?",
                    "Which suppliers have highest volume?",
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(prompt)
                        setTimeout(() => inputRef.current?.focus(), 50)
                      }}
                      className="text-xs text-neutral-400 hover:text-orange-400 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-orange-500/40 rounded-lg p-3 transition-all text-left group"
                    >
                      <span className="text-orange-500/50 group-hover:text-orange-500 mr-1.5">›</span>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end pl-8" : "justify-start pr-8"}`}
              >
                <div
                  className={[
                    "max-w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm shadow-lg",
                    msg.role === "user"
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm"
                      : "bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-bl-sm",
                  ].join(" ")}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3 h-3 text-orange-500" />
                      <span className="text-[9px] font-bold tracking-widest text-orange-500/70 uppercase">
                        Output
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-[9px] mt-1.5 uppercase ${
                      msg.role === "user" ? "text-white/40" : "text-neutral-500"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start pr-8">
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl rounded-bl-sm px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 shadow-lg">
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 animate-spin" />
                <span className="text-xs sm:text-sm text-neutral-300">Analyzing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ━━ Input Bar with Glow ━━ */}
        <div className="border-t border-neutral-700/50 bg-neutral-900/80 backdrop-blur-sm p-3 sm:p-4 shrink-0">
          <div className="relative group">
            {/* Glow behind input */}
            <div className="absolute -inset-0.5 bg-orange-500/15 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />
            <div className="relative flex gap-2 items-center">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Inquire system..."
                disabled={isLoading}
                className="bg-neutral-800/80 border-neutral-600 focus:border-orange-500 text-white placeholder-neutral-500 text-sm h-11 rounded-xl transition-all flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-11 w-11 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shrink-0"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}