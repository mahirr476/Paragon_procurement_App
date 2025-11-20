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
import type { ChatSession, ChatMessage } from "@/lib/types"

export default function IntelligencePage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const loadSessions = async () => {
      const loadedSessions = await getChatSessions("default-user")
      setSessions(Array.isArray(loadedSessions) ? loadedSessions : [])
    }
    loadSessions()
  }, [])

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setActiveSession(newSession)
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !activeSession) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const updatedSession = {
      ...activeSession,
      messages: [...activeSession.messages, userMessage],
      title: activeSession.messages.length === 0 ? generateChatTitle(input) : activeSession.title,
      updatedAt: new Date(),
    }

    setActiveSession(updatedSession)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      })

      if (!response.ok) throw new Error("Analysis failed")

      const data = await response.json()
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.analysis,
        timestamp: new Date(),
      }

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        updatedAt: new Date(),
      }

      setActiveSession(finalSession)
      await saveChatSession("default-user", finalSession)
      const updatedSessions = await getChatSessions("default-user")
      setSessions(Array.isArray(updatedSessions) ? updatedSessions : [])
    } catch (err) {
      console.error("[v0] AI analysis error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (sessionId: string) => {
    await deleteChatSession(sessionId)
    const updatedSessions = await getChatSessions("default-user")
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
