


"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send, Loader2, Sparkles, MessageSquarePlus, Minimize2 } from "lucide-react"
import type { ChatMessage, ChatSession } from "@/lib/types"
import { getCurrentPOs, getApprovedPOs, getChatSessions, saveChatSession } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"

export function ChatSidebar() {
  const [userId, setUserId] = useState<string | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentSession = activeSessions.find((s) => s.id === activeSessionId)

  // Get current user ID on mount
  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setUserId(user.id)
    } else {
      console.warn("No user logged in - chat features disabled")
    }
  }, [])

  // Load existing chat sessions from the database on mount
  useEffect(() => {
    if (!userId) return

    const loadSessions = async () => {
      try {
        const sessions = await getChatSessions(userId)
        setActiveSessions(sessions)

        // Don't auto-open the chat panel - user must click FAB to open
        // Just pre-select the latest session so it's ready when opened
        if (sessions.length > 0) {
          setActiveSessionId(sessions[0].id)
          setMessages(sessions[0].messages)
          // setIsOpen stays false - panel stays hidden as icon only
        }
      } catch (error) {
        console.error("Failed to load chat sessions", error)
      }
    }

    loadSessions()
  }, [userId])

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [messages, isLoading])

  // Lock body scroll on mobile when chat panel is open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      const isMobile = window.innerWidth < 640
      if (isMobile) {
        document.body.style.overflow = "hidden"
        return () => {
          document.body.style.overflow = ""
        }
      }
    }
  }, [isOpen, isMinimized])

  const handleOpenOrNewChat = async () => {
    // If minimized, just restore the panel
    if (isMinimized) {
      setIsMinimized(false)
      setIsOpen(true)
      return
    }
    // If we already have sessions loaded but panel is closed, just open it
    if (activeSessions.length > 0 && activeSessionId) {
      setIsOpen(true)
      return
    }
    // Otherwise create a new chat
    await handleNewChat()
  }

  const handleNewChat = async () => {
    if (!userId) {
      console.error("Cannot create chat: No user logged in")
      return
    }

    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          title: "New Conversation",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create chat session")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to create chat session")
      }
      const session = data.session as any

      const normalizedSession: ChatSession = {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: (session.messages ?? []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }

      setActiveSessions((prev) => [...prev, normalizedSession])
      setActiveSessionId(normalizedSession.id)
      setMessages(normalizedSession.messages)
      setIsOpen(true)
      setIsMinimized(false)

      setTimeout(() => {
        inputRef.current?.focus()
      }, 150)
    } catch (error) {
      console.error("Failed to start new chat session", error)
    }
  }

  const handleSwitchSession = (sessionId: string) => {
    const session = activeSessions.find((s) => s.id === sessionId)
    if (session) {
      setActiveSessionId(sessionId)
      setMessages(session.messages)
      setIsMinimized(false)

      setTimeout(() => {
        if (session.messages.length > 0) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        } else {
          inputRef.current?.focus()
        }
      }, 100)
    }
  }

  const handleCloseSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      const remaining = activeSessions.filter((s) => s.id !== sessionId)
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id)
        setMessages(remaining[0].messages)
      } else {
        setActiveSessionId(null)
        setMessages([])
      }
    }
  }

  const handleMinimize = () => {
    if (activeSessions.length > 0) {
      setIsMinimized(true)
    } else {
      setIsOpen(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSession) return

    const userInput = input
    setInput("")
    setIsLoading(true)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    if (messages.length === 0) {
      currentSession.title = userInput.slice(0, 40) + (userInput.length > 40 ? "..." : "")
      setActiveSessions((prev) => prev.map((s) => (s.id === currentSession.id ? currentSession : s)))

      try {
        if (userId && currentSession.id) {
          const saveResult = await saveChatSession(userId, currentSession)
          if (!saveResult.success) console.error("Failed to save chat session title:", saveResult.error)
        }
      } catch (error) {
        console.error("Failed to save chat session title", error)
      }
    }

    try {
      try {
        const userMsgResponse = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: currentSession.id, role: "user", content: userInput }),
        })
        if (!userMsgResponse.ok) console.error("Failed to save user message")
      } catch (error) {
        console.error("Failed to save user message", error)
      }

      const currentPOs = await getCurrentPOs()
      const approvedPOs = await getApprovedPOs()

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userInput, currentPOs: currentPOs.length, approvedPOs: approvedPOs.length }),
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
          errorMessage = timeMatch ? `⚠️ Rate limit. Try again in ${timeMatch[1]}.` : `⚠️ Rate limit reached. ${errorMessage}`
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

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)

      currentSession.messages = finalMessages
      currentSession.updatedAt = new Date()

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)

      try {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: currentSession.id, role: "assistant", content: assistantMessage.content }),
        })
        if (userId && currentSession.id) await saveChatSession(userId, currentSession)
      } catch (error) {
        console.error("Failed to save assistant message or session", error)
      }

      setActiveSessions((prev) => prev.map((s) => (s.id === currentSession.id ? currentSession : s)))
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

  return (
    <>
      {/* ━━ Floating Action Button ━━ */}
      {/* Show when: logged in AND panel is not actively open */}
      {userId && (!isOpen || isMinimized) && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
          <Button
            onClick={handleOpenOrNewChat}
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110"
          >
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </Button>
        </div>
      )}

      {/* ━━ Chat Panel ━━ */}
      {/* Mobile: full-screen above bottom tab bar (bottom-16 = 64px) */}
      {/* Desktop: floating 420×600 card at bottom-right */}
      {isOpen && !isMinimized && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[55] sm:hidden"
            onClick={() => handleMinimize()}
          />

          <div
            className={[
              "fixed z-[60] flex flex-col overflow-hidden",
              "bg-card shadow-2xl",
              "animate-in slide-in-from-bottom-4 duration-300",

              // Mobile: full-screen overlay above bottom tab bar
              "inset-x-0 top-0 bottom-16",
              "rounded-none border-b border-border",

              // Desktop: floating card
              "sm:inset-auto",
              "sm:bottom-6 sm:right-6",
              "sm:w-[420px] sm:h-[600px]",
              "sm:rounded-2xl sm:border sm:border-border",
            ].join(" ")}
          >
            {/* ── Header with tabs ── */}
            <div className="bg-primary/10 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary p-1.5 sm:p-2 rounded-lg">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="text-foreground font-semibold text-sm">AI Assistant</span>
                    <div className="flex items-center gap-1.5 sm:hidden">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </span>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">Online</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Minimize – desktop only */}
                  <Button
                    onClick={handleMinimize}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg hidden sm:flex"
                    title="Minimize"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  {/* Close – X icon on all devices, minimizes the panel */}
                  <Button
                    onClick={handleMinimize}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Session tabs - scrollable */}
              {activeSessions.length > 0 && (
                <div className="flex items-center gap-1 px-2 pb-2 overflow-x-auto scrollbar-hide">
                  {activeSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSwitchSession(session.id)}
                      className={`group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs transition-all flex-shrink-0 ${
                        activeSessionId === session.id
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="truncate max-w-[100px] sm:max-w-[120px]">{session.title}</span>
                      <span
                        onClick={(e) => handleCloseSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:text-orange-400 transition-opacity cursor-pointer inline-flex items-center justify-center"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleCloseSession(session.id, e as any)
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                  <Button
                    onClick={handleNewChat}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-primary"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 overscroll-contain">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4 p-3 sm:p-4 w-full max-w-sm">
                    <div className="bg-primary/10 p-5 sm:p-6 rounded-2xl border border-primary/20">
                      <div className="relative mx-auto w-fit mb-2 sm:mb-3">
                        <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full scale-150"></div>
                        <Sparkles className="relative w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </div>
                      <p className="text-foreground font-medium text-sm mb-1">Ask me anything!</p>
                      <p className="text-xs text-muted-foreground">I can help analyze your purchase orders</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        "What are my top spending branches?",
                        "Show me any price anomalies",
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInput(prompt)
                            setTimeout(() => inputRef.current?.focus(), 50)
                          }}
                          className="w-full text-xs text-left text-muted-foreground hover:text-primary bg-card hover:bg-muted border border-border hover:border-primary/30 rounded-lg p-2.5 sm:p-3 transition-all"
                        >
                          <span className="text-primary/50 mr-1">›</span> {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    // Robust role detection: handle 'role', 'type', or any casing
                    const msgRole = (msg.role || (msg as any).type || "assistant").toLowerCase()
                    const isUser = msgRole === "user"

                    return (
                      <div key={msg.id} className={`flex ${isUser ? "justify-end pl-6 sm:pl-8" : "justify-start pr-6 sm:pr-8"}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] px-3 sm:px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm ${
                            isUser
                              ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm"
                              : "bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-bl-sm"
                          }`}
                        >
                          {!isUser && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <Sparkles className="w-3 h-3 text-primary" />
                              <span className="text-[9px] font-bold tracking-widest text-primary/70 uppercase">Output</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className={`text-[9px] mt-1 uppercase ${isUser ? "text-white/40" : "text-neutral-500"}`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {isLoading && (
                    <div className="flex justify-start pr-8">
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 animate-spin" />
                        <span className="text-xs text-neutral-300">Analyzing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* ── Input Bar with Glow ── */}
            <div className="border-t border-border bg-muted/50 backdrop-blur-sm p-3 flex-shrink-0">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-primary/10 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />
                <div className="relative flex gap-2">
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
                    className="bg-neutral-900 border-neutral-700 focus:border-orange-500 text-white placeholder-neutral-500 text-sm h-11 rounded-xl flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-11 w-11 rounded-xl shadow-lg shadow-orange-500/20 flex-shrink-0 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    size="icon"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}