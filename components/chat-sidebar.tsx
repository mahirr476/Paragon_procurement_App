"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send, Loader2, Sparkles, MessageSquarePlus, Minimize2 } from "lucide-react"
import type { ChatMessage, ChatSession } from "@/lib/types"
import { getCurrentPOs, getApprovedPOs, saveChatSession } from "@/lib/storage"

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentSession = activeSessions.find((s) => s.id === activeSessionId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setActiveSessions((prev) => [...prev, newSession])
    setActiveSessionId(newSession.id)
    setMessages([])
    setIsOpen(true)
    setIsMinimized(false)
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

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    if (messages.length === 0) {
      currentSession.title = input.slice(0, 40) + (input.length > 40 ? "..." : "")
      setActiveSessions((prev) => prev.map((s) => (s.id === currentSession.id ? currentSession : s)))
    }

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

      if (!response.ok) throw new Error("Analysis failed")

      const data = await response.json()
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
      saveChatSession("user", currentSession)
      setActiveSessions((prev) => prev.map((s) => (s.id === currentSession.id ? currentSession : s)))
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error analyzing your request.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && !isMinimized && (
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
                    <button
                      onClick={(e) => handleCloseSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-orange-400 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
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
