"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send, Loader2, Sparkles, Minimize2 } from "lucide-react"
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

      if (!response.ok) throw new Error("Analysis failed")

      const data = await response.json()
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.analysis,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
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

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-24 right-6 w-80 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl z-50 p-4 cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AI Assistant</p>
              <p className="text-orange-100 text-xs">{messages.length} messages</p>
            </div>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-24 right-6 w-[420px] h-[600px] bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-2xl shadow-2xl border border-orange-500/30 z-50 flex flex-col overflow-hidden backdrop-blur-xl">
      <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b border-orange-500/30 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">AI Assistant</h3>
              <p className="text-orange-200 text-xs">Ask anything about your POs</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setIsMinimized(true)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-6 rounded-2xl border border-orange-500/30">
                <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-1">Ready to help!</p>
                <p className="text-sm text-neutral-400">Ask me about patterns, anomalies, or insights</p>
              </div>
              <div className="grid grid-cols-1 gap-2 text-left">
                <button
                  onClick={() => setInput("Show me top spending branches")}
                  className="text-xs text-neutral-400 hover:text-orange-400 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-orange-500/50 rounded-lg p-3 transition-all text-left"
                >
                  Show me top spending branches
                </button>
                <button
                  onClick={() => setInput("Any price anomalies this month?")}
                  className="text-xs text-neutral-400 hover:text-orange-400 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-orange-500/50 rounded-lg p-3 transition-all text-left"
                >
                  Any price anomalies this month?
                </button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-lg ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                    : "bg-neutral-800 border border-neutral-700 text-neutral-100"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-lg">
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
              <span className="text-sm text-neutral-300">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-neutral-700/50 bg-neutral-900/50 backdrop-blur-sm p-4">
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
            placeholder="Type your question..."
            disabled={isLoading}
            className="bg-neutral-800/80 border-neutral-600 focus:border-orange-500 text-white placeholder-neutral-500 text-sm h-11 rounded-xl transition-all"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-11 w-11 rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
