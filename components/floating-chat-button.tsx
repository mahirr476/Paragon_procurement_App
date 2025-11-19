'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X } from 'lucide-react'
import { MiniChatDialog } from './mini-chat-dialog'

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg z-50 transition-transform hover:scale-110"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Mini Chat Dialog */}
      {isOpen && (
        <MiniChatDialog onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}
