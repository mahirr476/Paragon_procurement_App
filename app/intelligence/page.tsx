


"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  Trash2,
  Plus,
  Search,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Menu,
  X,
  Settings2,
} from "lucide-react"
import { getChatSessions, saveChatSession, deleteChatSession, generateChatTitle } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"
import type { ChatSession, ChatMessage } from "@/lib/types"

export default function IntelligencePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  // Mobile drawer state (separate from desktop sidebar)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) setUserId(user.id)
    else console.warn("No user logged in - chat features disabled")
  }, [])

  useEffect(() => {
    if (!userId) return
    const loadSessions = async () => {
      const loadedSessions = await getChatSessions(userId)
      setSessions(Array.isArray(loadedSessions) ? loadedSessions : [])
    }
    loadSessions()
  }, [userId])

  const createNewChat = async () => {
    if (!userId) return
    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: "New Chat" }),
      })
      if (!response.ok) throw new Error("Failed to create chat session")
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to create chat session")

      const session = data.session as any
      const normalizedSession: ChatSession = {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: (session.messages ?? []).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
      }
      setActiveSession(normalizedSession)
      setIsMobileDrawerOpen(false)
      const updatedSessions = await getChatSessions(userId)
      setSessions(Array.isArray(updatedSessions) ? updatedSessions : [])
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 100)
    } catch (error) {
      console.error("Failed to create new chat session", error)
    }
  }

  useEffect(() => {
    if (activeSession?.messages) {
      setTimeout(() => {
        if (activeSession.messages.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        else inputRef.current?.focus()
      }, 100)
    }
  }, [activeSession?.messages, isLoading])

  useEffect(() => {
    if (activeSession && activeSession.messages.length === 0) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [activeSession?.id])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !activeSession || !userId) return

    const userInput = input
    setInput("")
    setIsLoading(true)

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    }

    const updatedMessages = [...activeSession.messages, userMessage]
    const updatedSession = {
      ...activeSession,
      messages: updatedMessages,
      title: activeSession.messages.length === 0 ? generateChatTitle(userInput) : activeSession.title,
      updatedAt: new Date(),
    }
    setActiveSession(updatedSession)

    if (activeSession.messages.length === 0 && updatedSession.title !== activeSession.title) {
      try {
        if (userId && activeSession.id) await saveChatSession(userId, updatedSession)
      } catch (error) {
        console.error("Failed to save chat session title", error)
      }
    }

    try {
      try {
        const userMsgResponse = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: activeSession.id, role: "user", content: userInput }),
        })
        if (!userMsgResponse.ok) console.error("Failed to save user message")
      } catch (error) {
        console.error("Failed to save user message", error)
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userInput }),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = data.error || "Analysis failed. Please try again."
        if (response.status === 401 || errorMessage.includes("Invalid API Key")) {
          errorMessage = `🔑 Invalid API Key. Please set ANTHROPIC_API_KEY in your .env.local file.`
        } else if (response.status === 413 || errorMessage.includes("too large")) {
          errorMessage = `📊 Request too large. Try asking a more specific question.`
        } else if (response.status === 429 || errorMessage.includes("Rate limit")) {
          const timeMatch = errorMessage.match(/Please try again in ([^.]+)/)
          errorMessage = timeMatch ? `⚠️ Rate limit reached. Please try again in ${timeMatch[1]}.` : `⚠️ Rate limit reached. ${errorMessage}`
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
      const finalSession = { ...updatedSession, messages: finalMessages, updatedAt: new Date() }
      setActiveSession(finalSession)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)

      try {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: activeSession.id, role: "assistant", content: assistantMessage.content }),
        })
        if (userId && activeSession.id) await saveChatSession(userId, finalSession)
      } catch (error) {
        console.error("Failed to save assistant message", error)
      }

      const updatedSessions = await getChatSessions(userId)
      setSessions(Array.isArray(updatedSessions) ? updatedSessions : [])
    } catch (err) {
      let errorText = err instanceof Error ? err.message : "Sorry, I encountered an error."
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      }
      setActiveSession({ ...updatedSession, messages: [...updatedMessages, errorMessage], updatedAt: new Date() })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSession = (session: ChatSession) => {
    setActiveSession(session)
    setIsMobileDrawerOpen(false)
    setTimeout(() => {
      if (session.messages.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      else inputRef.current?.focus()
    }, 100)
  }

  const handleDeleteChat = async (sessionId: string) => {
    if (!userId) return
    await deleteChatSession(sessionId)
    const updatedSessions = await getChatSessions(userId)
    setSessions(Array.isArray(updatedSessions) ? updatedSessions : [])
    if (activeSession?.id === sessionId) setActiveSession(null)
  }

  const filteredSessions = Array.isArray(sessions)
    ? sessions.filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  // Suggested prompts for empty state (matching cyberpunk demo)
  const suggestedPrompts = [
    { icon: "💰", label: "Analyze last month's spending" },
    { icon: "⚠️", label: "Flag high-risk vendor anomalies" },
    { icon: "📊", label: "Predict inventory bottlenecks" },
  ]

  // Sidebar content (shared between desktop sidebar and mobile drawer)
  const SidebarContent = () => (
    <>
      <div className="border-b border-border p-3 sm:p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Chat History
          </h3>
          <Button onClick={createNewChat} size="sm" className="bg-accent hover:bg-accent/90 h-7 sm:h-8 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chats..."
            className="pl-9 bg-input border-border text-foreground text-xs sm:text-sm h-8 sm:h-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 sm:space-y-2 min-h-0">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-[10px] sm:text-xs text-muted-foreground">No chat history yet</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`group p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                activeSession?.id === session.id
                  ? "bg-accent/20 border-accent/50"
                  : "bg-card-hover border-border hover:border-muted-foreground"
              }`}
              onClick={() => handleSelectSession(session)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-foreground font-medium truncate mb-1">{session.title}</p>
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {session.messages.length}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteChat(session.id)
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )

  return (
    <div className="h-full flex flex-col md:flex-row md:gap-6 relative md:p-6 min-h-0">
      {/* Mobile Top Bar - visible only on mobile */}
      <div className="md:hidden flex items-center bg-card/80 backdrop-blur-md p-3 border-b border-border sticky top-0 z-30">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border hover:border-accent/50 transition-colors"
        >
          <Menu className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1 px-3">
          <h2 className="text-foreground text-sm font-bold tracking-wider uppercase">Intelligence</h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">System: Optimal</p>
          </div>
        </div>
        <button className="flex size-9 items-center justify-center">
          <Settings2 className="w-4 h-4 text-muted-foreground hover:text-accent transition-colors" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-4/5 max-w-sm bg-card border-r border-border flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Session Logs</h3>
              <button onClick={() => setIsMobileDrawerOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar Toggle */}
      <Button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-8 bg-card hover:bg-card/80 border border-border rounded-r-xl shadow-lg hidden md:flex"
        size="icon"
        data-tour="ai-sidebar-toggle"
      >
        {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Desktop Sidebar */}
      <div className={`hidden md:block transition-all duration-300 ease-in-out flex-shrink-0 ${
        isSidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 -ml-6"
      }`}>
        {isSidebarOpen && (
          <Card className="w-80 bg-card border-border flex flex-col h-full">
            <SidebarContent />
          </Card>
        )}
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 bg-card border-0 md:border md:border-border flex flex-col min-w-0 rounded-none md:rounded-xl" data-tour="ai-chat-area">
        {/* Desktop header - hidden on mobile (we have the mobile top bar) */}
        <CardHeader className="border-b border-border flex-shrink-0 hidden md:block">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            {activeSession ? activeSession.title : "AI Procurement Analysis"}
          </CardTitle>
          {activeSession && (
            <p className="text-xs text-muted-foreground mt-1">
              Created {new Date(activeSession.createdAt).toLocaleString()}
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
          {!activeSession ? (
            /* Welcome / Empty State - matching cyberpunk demo */
            <div className="flex-1 flex items-center justify-center px-4" data-tour="ai-suggestions">
              <div className="text-center max-w-sm w-full">
                {/* Glowing icon */}
                <div className="relative mb-6 mx-auto w-fit">
                  <div className="absolute inset-0 blur-2xl bg-accent/20 rounded-full scale-150"></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-accent/30 flex items-center justify-center bg-card">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
                  </div>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight mb-2">Neural Procurement Interface</h1>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-[280px] mx-auto mb-8 leading-relaxed">
                  System ready for multi-vector data analysis. Select a protocol or enter a custom query.
                </p>
                {/* Suggested prompts */}
                <div className="grid grid-cols-1 gap-2.5 sm:gap-3 w-full">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        createNewChat()
                        // Set input after chat creation
                        setTimeout(() => setInput(prompt.label), 300)
                      }}
                      className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-card border border-border hover:border-accent/40 hover:bg-accent/5 transition-all text-left group"
                    >
                      <span className="text-lg">{prompt.icon}</span>
                      <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-accent transition-colors">{prompt.label}</span>
                    </button>
                  ))}
                </div>
                <Button onClick={createNewChat} className="bg-accent hover:bg-accent/90 mt-6 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6 min-h-0">
                {activeSession.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2">
                      <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-accent mx-auto" />
                      <p className="text-xs sm:text-sm text-muted-foreground">Start a conversation</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeSession.messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl ${
                            msg.role === "user"
                              ? "bg-accent text-accent-foreground rounded-br-sm"
                              : "bg-muted/50 text-foreground rounded-bl-sm border border-border"
                          }`}
                        >
                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-accent font-bold uppercase tracking-widest">
                              <Sparkles className="w-3 h-3" />
                              Intelligence Output
                            </div>
                          )}
                          <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className="text-[9px] sm:text-[10px] mt-1.5 opacity-50 uppercase">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted/50 border border-border rounded-2xl rounded-bl-sm px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent animate-spin" />
                          <span className="text-xs sm:text-sm text-foreground">Analyzing...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Bar - sticky bottom with glow effect */}
              <div className="border-t border-border bg-card p-3 sm:p-4 flex-shrink-0 pb-4 sm:pb-4">
                <div className="max-w-3xl mx-auto relative group">
                  {/* Subtle glow behind input on focus */}
                  <div className="absolute -inset-1 bg-accent/10 blur opacity-0 group-focus-within:opacity-100 transition duration-500 rounded-xl"></div>
                  <div className="relative flex gap-2 items-center">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Inquire system..."
                      disabled={isLoading}
                      className="bg-input border-border text-foreground placeholder-muted-foreground rounded-xl h-10 sm:h-11 text-xs sm:text-sm"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !input.trim()}
                      className="bg-accent hover:bg-accent/90 rounded-xl h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                      size="icon"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}