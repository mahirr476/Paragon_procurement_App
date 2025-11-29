"use client"

import { useState, useEffect } from "react"
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

  // Get current user ID on mount
  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setUserId(user.id)
    } else {
      console.warn("No user logged in - chat features disabled")
    }
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
          title: "New Chat",
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

      setActiveSession(normalizedSession)
      // Reload sessions to include the new one
      const updatedSessions = await getChatSessions(userId)
      setSessions(Array.isArray(updatedSessions) ? updatedSessions : [])
    } catch (error) {
      console.error("Failed to create new chat session", error)
    }
  }

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

    // Update title if this is the first message
    if (activeSession.messages.length === 0 && updatedSession.title !== activeSession.title) {
      try {
        if (userId && activeSession.id) {
          const saveResult = await saveChatSession(userId, updatedSession)
          if (!saveResult.success) {
            console.error("Failed to save chat session title:", saveResult.error)
          }
        }
      } catch (error) {
        console.error("Failed to save chat session title", error)
      }
    }

    try {
      // Persist user message to the database
      try {
        const userMsgResponse = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSession.id,
            role: "user",
            content: userInput,
          }),
        })
        if (!userMsgResponse.ok) {
          const errorData = await userMsgResponse.json()
          console.error("Failed to save user message:", errorData.error || "Unknown error")
        }
      } catch (error) {
        console.error("Failed to save user message", error)
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userInput }),
      })

      if (!response.ok) throw new Error("Analysis failed")

      const data = await response.json()
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.analysis,
        timestamp: new Date(),
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      const finalSession = {
        ...updatedSession,
        messages: finalMessages,
        updatedAt: new Date(),
      }

      setActiveSession(finalSession)

      // Persist assistant message and update session
      try {
        const assistantMsgResponse = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSession.id,
            role: "assistant",
            content: assistantMessage.content,
          }),
        })
        if (!assistantMsgResponse.ok) {
          const errorData = await assistantMsgResponse.json()
          console.error("Failed to save assistant message:", errorData.error || "Unknown error")
        }

        if (userId && activeSession.id) {
          const saveResult = await saveChatSession(userId, finalSession)
          if (!saveResult.success) {
            console.error("Failed to save chat session:", saveResult.error)
          }
        }
      } catch (error) {
        console.error("Failed to save assistant message or session", error)
      }

      // Reload sessions to get latest data
      const updatedSessions = await getChatSessions(userId)
      setSessions(Array.isArray(updatedSessions) ? updatedSessions : [])
    } catch (err) {
      console.error("[v0] AI analysis error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (sessionId: string) => {
    if (!userId) return
    await deleteChatSession(sessionId)
    const updatedSessions = await getChatSessions(userId)
    setSessions(Array.isArray(updatedSessions) ? updatedSessions : [])
    if (activeSession?.id === sessionId) {
      setActiveSession(null)
    }
  }

  const filteredSessions = Array.isArray(sessions)
    ? sessions.filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  return (
    <div className="p-6 h-screen flex gap-6 relative">
      <Button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-8 bg-card hover:bg-card/80 border border-border rounded-r-xl shadow-lg"
        size="icon"
        data-tour="ai-sidebar-toggle"
      >
        {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 -ml-6"
        }`}
      >
        {isSidebarOpen && (
          <Card className="w-80 bg-card border-border flex flex-col h-full">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat History
                </CardTitle>
                <Button onClick={createNewChat} size="sm" className="bg-accent hover:bg-accent/90 h-8">
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search chats..."
                  className="pl-9 bg-input border-border text-foreground text-sm h-9"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No chat history yet</p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                      activeSession?.id === session.id
                        ? "bg-accent/20 border-accent/50"
                        : "bg-card-hover border-border hover:border-muted-foreground"
                    }`}
                    onClick={() => setActiveSession(session)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate mb-1">{session.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
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
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="flex-1 bg-card border-border flex flex-col" data-tour="ai-chat-area">
        <CardHeader className="border-b border-border">
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

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {!activeSession ? (
            <div className="flex-1 flex items-center justify-center" data-tour="ai-suggestions">
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-foreground mb-2">Welcome to AI Analysis</p>
                <p className="text-sm text-muted-foreground mb-4">Start a new chat to analyze your purchase orders</p>
                <Button onClick={createNewChat} className="bg-accent hover:bg-accent/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-2xl px-4 py-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-accent/20 border border-accent/50 text-accent-foreground"
                          : "bg-card-hover border border-border text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-2 ${msg.role === "user" ? "text-accent-foreground/70" : "text-muted-foreground"}`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card-hover border border-border rounded-lg px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-accent animate-spin" />
                      <span className="text-sm text-foreground">Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Ask about your purchase orders..."
                    disabled={isLoading}
                    className="bg-input border-border text-foreground placeholder-muted-foreground"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
