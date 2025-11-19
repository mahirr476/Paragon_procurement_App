"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, ChevronRight, CheckCircle } from 'lucide-react'

interface TutorialStep {
  title: string
  description: string
  highlight?: string
}

interface TutorialOverlayProps {
  steps: TutorialStep[]
  onComplete: () => void
  onSkip: () => void
}

export function TutorialOverlay({ steps, onComplete, onSkip }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-orange-500/30 p-6 max-w-lg w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-500 font-bold">{currentStep + 1}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{steps[currentStep].title}</h3>
              <p className="text-xs text-neutral-400">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSkip}
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-neutral-700 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-neutral-300 leading-relaxed">{steps[currentStep].description}</p>
          {steps[currentStep].highlight && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-orange-200">{steps[currentStep].highlight}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="border-neutral-600 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            Skip Tutorial
          </Button>
          <Button
            onClick={handleNext}
            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Got it! <CheckCircle className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-8 bg-orange-500"
                  : index < currentStep
                  ? "w-1.5 bg-orange-500/50"
                  : "w-1.5 bg-neutral-600"
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
