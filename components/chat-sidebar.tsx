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

        if (sessions.length > 0) {
          setActiveSessionId(sessions[0].id)
          setMessages(sessions[0].messages)
          setIsOpen(true)
        }
      } catch (error) {
        console.error("Failed to load chat sessions", error)
      }
    }

    loadSessions()
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
        // User can manually minimize or close
      }
    }
  }

  const handleMinimize = () => {
    if (activeSessions.length > 0) {
      setIsMinimized(true)
    } else {
      // If no sessions, just close the window
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

      // Persist title update
      try {
        if (userId && currentSession.id) {
          const saveResult = await saveChatSession(userId, currentSession)
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
            sessionId: currentSession.id,
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

      const currentPOs = await getCurrentPOs()
      const approvedPOs = await getApprovedPOs()

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userInput,
          currentPOs: currentPOs.length,
          approvedPOs: approvedPOs.length,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Extract the full error message, especially for rate limits
        let errorMessage = data.error || "Analysis failed. Please try again."
        
        // If it's a rate limit error, format it nicely
        if (response.status === 429 || errorMessage.includes("Rate limit") || errorMessage.includes("rate limit")) {
          // Extract the "Please try again in X" part if it exists
          const timeMatch = errorMessage.match(/Please try again in ([^.]+)/);
          if (timeMatch) {
            errorMessage = `⚠️ Rate limit reached. Please try again in ${timeMatch[1]}. Need more tokens? Upgrade at https://console.groq.com/settings/billing`;
          } else {
            errorMessage = `⚠️ Rate limit reached. ${errorMessage}`;
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
      setMessages(finalMessages)

      currentSession.messages = finalMessages
      currentSession.updatedAt = new Date()
      // Persist assistant message and updated session metadata
      try {
        const assistantMsgResponse = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSession.id,
            role: "assistant",
            content: assistantMessage.content,
          }),
        })
        if (!assistantMsgResponse.ok) {
          const errorData = await assistantMsgResponse.json()
          console.error("Failed to save assistant message:", errorData.error || "Unknown error")
        }

        if (userId && currentSession.id) {
          const saveResult = await saveChatSession(userId, currentSession)
          if (!saveResult.success) {
            console.error("Failed to save chat session:", saveResult.error)
          }
        }
      } catch (error) {
        console.error("Failed to save assistant message or session", error)
      }

      setActiveSessions((prev) => prev.map((s) => (s.id === currentSession.id ? currentSession : s)))
    } catch (err) {
      let errorText = err instanceof Error ? err.message : "Sorry, I encountered an error analyzing your request."
      
      // Provide helpful message for rate limits
      if (errorText.includes("Rate limit") || errorText.includes("rate limit")) {
        errorText = `⚠️ Rate limit reached. ${errorText.includes("Please try again in") ? errorText : "Please try again later or upgrade your Groq account at https://console.groq.com/settings/billing"}`
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      console.error("Chat analysis error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      {userId && !isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleNewChat}
            className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-110"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}

      {/* Minimized Tabs Bar */}
      {isMinimized && activeSessions.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
          {activeSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSwitchSession(session.id)}
              className="group flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border-l-4 border-orange-500 rounded-l-xl shadow-lg cursor-pointer transition-all duration-300 hover:translate-x-[-4px]"
            >
              <div className="px-4 py-3 flex items-center gap-3 min-w-0">
                <Sparkles className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <div className="min-w-0 max-w-[200px]">
                  <p className="text-sm font-medium text-white truncate">{session.title}</p>
                  <p className="text-xs text-neutral-400">{session.messages.length} messages</p>
                </div>
                <Button
                  onClick={(e) => handleCloseSession(session.id, e)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <X className="h-3 w-3 text-neutral-400" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            onClick={handleNewChat}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
          >
            <MessageSquarePlus className="h-5 w-5 text-white" />
          </Button>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header with tabs */}
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border-b border-neutral-800 flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold text-sm">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={handleMinimize}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-400 hover:text-white rounded-lg"
                  title="Minimize"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-400 hover:text-white rounded-lg"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Session tabs */}
            {activeSessions.length > 0 && (
              <div className="flex items-center gap-1 px-2 pb-2 overflow-x-auto">
                {activeSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSwitchSession(session.id)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all flex-shrink-0 ${
                      activeSessionId === session.id
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <span className="truncate max-w-[120px]">{session.title}</span>
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
                  className="h-7 w-7 flex-shrink-0 text-neutral-400 hover:text-orange-400"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 p-4">
                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-6 rounded-2xl border border-orange-500/20">
                    <Sparkles className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                    <p className="text-white font-medium text-sm mb-1">Ask me anything!</p>
                    <p className="text-xs text-neutral-400">I can help analyze your purchase orders</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setInput("What are my top spending branches?")}
                      className="w-full text-xs text-left text-neutral-400 hover:text-orange-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-orange-500/30 rounded-lg p-2.5 transition-all"
                    >
                      What are my top spending branches?
                    </button>
                    <button
                      onClick={() => setInput("Show me any price anomalies")}
                      className="w-full text-xs text-left text-neutral-400 hover:text-orange-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-orange-500/30 rounded-lg p-2.5 transition-all"
                    >
                      Show me any price anomalies
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : "bg-neutral-900 border border-neutral-800 text-neutral-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                  <span className="text-xs text-neutral-300">Analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neutral-800 bg-neutral-900/50 p-3 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask about your POs..."
                disabled={isLoading}
                className="bg-neutral-900 border-neutral-700 focus:border-orange-500 text-white placeholder-neutral-500 text-sm h-10 rounded-xl"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-10 w-10 rounded-xl flex-shrink-0"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
