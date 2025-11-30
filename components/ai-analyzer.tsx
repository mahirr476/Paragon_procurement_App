'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PurchaseOrder } from '@/lib/types'
import { Loader2, Send, Zap, AlertCircle } from 'lucide-react'

interface AIAnalyzerProps {
  currentPOs: PurchaseOrder[]
  approvedPOs: PurchaseOrder[]
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIAnalyzer({ currentPOs, approvedPOs }: AIAnalyzerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const suggestedQuestions = [
    'Which suppliers have the most price variations?',
    'Are there any duplicate orders I should review?',
    'What are the highest value orders that need approval?',
    'Show me suppliers with unusual order patterns',
    'Which items have prices above historical averages?',
  ]

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
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

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.analysis,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      let errorMsg = err instanceof Error ? err.message : 'Failed to analyze'
      
      // Provide helpful message for API key errors
      if (errorMsg.includes("Invalid API Key") || errorMsg.includes("invalid api key") || errorMsg.includes("API key not configured")) {
        errorMsg = `🔑 ${errorMsg}`
      }
      // Provide helpful message for "request too large" errors
      else if (errorMsg.includes("too large") || errorMsg.includes("Request too large") || errorMsg.includes("TPM")) {
        errorMsg = `📊 ${errorMsg}`
      }
      // Provide helpful message for rate limits
      else if (errorMsg.includes("Rate limit") || errorMsg.includes("rate limit")) {
        errorMsg = `⚠️ Rate limit reached. ${errorMsg.includes("Please try again in") ? errorMsg : "Please try again later or upgrade your Groq account at https://console.groq.com/settings/billing"}`
      }
      
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (currentPOs.length === 0 && approvedPOs.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-8 text-center">
          <Zap className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Upload PO data to enable AI analysis</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700 flex flex-col h-[600px]">
      <CardHeader className="border-b border-neutral-700">
        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4" />
          AI PROCUREMENT ANALYST
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Zap className="w-8 h-8 text-orange-500 mb-3" />
              <p className="text-sm text-neutral-300 mb-6">Ask questions about your purchase orders</p>
              <div className="space-y-2 w-full">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left p-3 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors border border-neutral-700 hover:border-orange-500/50"
                  >
                    <p className="text-xs text-neutral-400 mb-1">Suggested:</p>
                    <p className="text-sm text-white">{q}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-orange-500/20 border border-orange-500/50 text-orange-100'
                      : 'bg-neutral-800 border border-neutral-700 text-neutral-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-orange-300/70' : 'text-neutral-500'}`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                <span className="text-sm text-neutral-300">Analyzing...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-neutral-700 p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(input)
                }
              }}
              placeholder="Ask about your PO data..."
              disabled={isLoading}
              className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500"
            />
            <Button
              onClick={() => handleSendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-neutral-500">
            Press Enter to send or click suggested questions above
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
