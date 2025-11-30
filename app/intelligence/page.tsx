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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
      
      // Auto-scroll to input and focus it after a short delay
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 100)
    } catch (error) {
      console.error("Failed to create new chat session", error)
    }
  }
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (activeSession?.messages) {
      setTimeout(() => {
        if (activeSession.messages.length > 0) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        } else {
          // If no messages, focus input
          inputRef.current?.focus()
        }
      }, 100)
    }
  }, [activeSession?.messages, isLoading])
  
  // Focus input when session is first loaded
  useEffect(() => {
    if (activeSession && activeSession.messages.length === 0) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 200)
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

      const data = await response.json()

      if (!response.ok) {
        // Extract the full error message, especially for rate limits and API key errors
        let errorMessage = data.error || "Analysis failed. Please try again."
        
        // If it's an API key error, format it nicely
        if (response.status === 401 || errorMessage.includes("Invalid API Key") || errorMessage.includes("invalid api key")) {
          errorMessage = `🔑 Invalid API Key. Please set GROQ_API_KEY in your .env.local file.\n\nGet your API key at: https://console.groq.com/keys\n\nAfter adding the key, restart your development server.`
        }
        // If it's a "request too large" error, format it nicely
        else if (response.status === 413 || errorMessage.includes("too large") || errorMessage.includes("Request too large") || errorMessage.includes("TPM")) {
          errorMessage = `📊 Request too large. The data is too extensive for the current model.\n\nTry asking a more specific question, or upgrade your Groq account at https://console.groq.com/settings/billing`
        }
        // If it's a rate limit error, format it nicely
        else if (response.status === 429 || errorMessage.includes("Rate limit") || errorMessage.includes("rate limit")) {
          // Extract the "Please try again in X" part if it exists
          const timeMatch = errorMessage.match(/Please try again in ([^.]+)/)
          if (timeMatch) {
            errorMessage = `⚠️ Rate limit reached. Please try again in ${timeMatch[1]}. Need more tokens? Upgrade at https://console.groq.com/settings/billing`
          } else {
            errorMessage = `⚠️ Rate limit reached. ${errorMessage}`
          }
        }
        
        throw new Error(errorMessage)
      }

      if (!data.analysis) {
        throw new Error(data.error || "No response from AI service. Please check your API configuration.")
      }

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

      // Auto-scroll to latest message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)

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
      let errorText = err instanceof Error ? err.message : "Sorry, I encountered an error analyzing your request."
      
      // Provide helpful message for API key errors
      if (errorText.includes("Invalid API Key") || errorText.includes("invalid api key") || errorText.includes("API key not configured")) {
        errorText = `🔑 ${errorText}`
      }
      // Provide helpful message for "request too large" errors
      else if (errorText.includes("too large") || errorText.includes("Request too large") || errorText.includes("TPM")) {
        errorText = `📊 ${errorText}`
      }
      // Provide helpful message for rate limits
      else if (errorText.includes("Rate limit") || errorText.includes("rate limit")) {
        errorText = `⚠️ Rate limit reached. ${errorText.includes("Please try again in") ? errorText : "Please try again later or upgrade your Groq account at https://console.groq.com/settings/billing"}`
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      }
      
      const finalMessages = [...updatedMessages, errorMessage]
      const finalSession = {
        ...updatedSession,
        messages: finalMessages,
        updatedAt: new Date(),
      }
      setActiveSession(finalSession)
      
      console.error("[v0] AI analysis error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSession = (session: ChatSession) => {
    setActiveSession(session)
    // Auto-scroll to bottom or focus input when selecting a session
    setTimeout(() => {
      if (session.messages.length > 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      } else {
        inputRef.current?.focus()
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 100)
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
    <div className="h-full flex gap-6 relative p-6 min-h-0">
      <Button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-8 bg-card hover:bg-card/80 border border-border rounded-r-xl shadow-lg"
        size="icon"
        data-tour="ai-sidebar-toggle"
      >
        {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      <div
        className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
          isSidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 -ml-6"
        }`}
      >
        {isSidebarOpen && (
          <Card className="w-80 bg-card border-border flex flex-col h-full">
            <CardHeader className="border-b border-border flex-shrink-0">
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
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
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
                    onClick={() => handleSelectSession(session)}
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

      <Card className="flex-1 bg-card border-border flex flex-col min-w-0" data-tour="ai-chat-area">
        <CardHeader className="border-b border-border flex-shrink-0">
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
              <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
                {activeSession.messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2">
                      <Sparkles className="w-8 h-8 text-accent mx-auto" />
                      <p className="text-sm text-muted-foreground">Start a conversation</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeSession.messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl ${
                            msg.role === "user"
                              ? "bg-accent text-accent-foreground rounded-br-sm"
                              : "bg-muted/50 text-foreground rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-accent animate-spin" />
                          <span className="text-sm text-foreground">Analyzing...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="border-t border-border bg-card p-4 flex-shrink-0">
                <div className="max-w-3xl mx-auto flex gap-2">
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
                    placeholder="Ask about your purchase orders..."
                    disabled={isLoading}
                    className="bg-input border-border text-foreground placeholder-muted-foreground rounded-xl h-11"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    className="bg-accent hover:bg-accent/90 rounded-xl h-11 w-11 flex-shrink-0"
                    size="icon"
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
