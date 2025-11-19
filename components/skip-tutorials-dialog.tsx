"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, GraduationCap } from 'lucide-react'

interface SkipTutorialsDialogProps {
  onContinue: () => void
  onSkipAll: () => void
}

export function SkipTutorialsDialog({ onContinue, onSkipAll }: SkipTutorialsDialogProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-2 border-orange-500/40 p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
            <GraduationCap className="w-10 h-10 text-orange-500 relative z-10" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Welcome!
          </h2>
          <p className="text-neutral-300 leading-relaxed text-base">
            Would you like an interactive tour of the app? We'll guide you through each feature with highlighted elements and step-by-step instructions.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 text-base shadow-lg"
          >
            Show Me Around
          </Button>
          <Button
            onClick={onSkipAll}
            variant="outline"
            className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white py-6 text-base"
          >
            I'll Explore on My Own
          </Button>
        </div>

        <p className="text-xs text-neutral-500 text-center mt-6">
          You can enable tutorials again anytime from Settings
        </p>
      </Card>
    </div>
  )
}
