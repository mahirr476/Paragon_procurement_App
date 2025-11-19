"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronRight, CheckCircle } from 'lucide-react'

interface TourStep {
  target: string // CSS selector for element to highlight
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface InteractiveTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
}

export function InteractiveTour({ steps, onComplete, onSkip }: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [elementRect, setElementRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log("[v0] Looking for element:", steps[currentStep].target)
    const targetElement = document.querySelector(steps[currentStep].target)
    
    if (targetElement) {
      console.log("[v0] Element found:", targetElement)
      const rect = targetElement.getBoundingClientRect()
      setElementRect(rect)

      // Scroll element into view
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      })

      // Calculate tooltip position
      const position = steps[currentStep].position || 'bottom'
      const tooltipWidth = 400
      const tooltipHeight = 200
      const padding = 20

      let top = 0
      let left = 0

      switch (position) {
        case 'top':
          top = rect.top - tooltipHeight - padding
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2)
          break
        case 'bottom':
          top = rect.bottom + padding
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2)
          break
        case 'left':
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2)
          left = rect.left - tooltipWidth - padding
          break
        case 'right':
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2)
          left = rect.right + padding
          break
      }

      // Keep tooltip within viewport
      top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20))
      left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20))

      setTooltipPosition({ top, left })
    } else {
      console.log("[v0] Element not found, retrying...")
      const retryTimeout = setTimeout(() => {
        const retryElement = document.querySelector(steps[currentStep].target)
        if (retryElement) {
          const rect = retryElement.getBoundingClientRect()
          setElementRect(rect)
          retryElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          })
        }
      }, 100)
      
      return () => clearTimeout(retryTimeout)
    }
  }, [currentStep, steps])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  return (
    <>
      {/* Dark Overlay with Spotlight */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {elementRect && (
                <rect
                  x={elementRect.left - 8}
                  y={elementRect.top - 8}
                  width={elementRect.width + 16}
                  height={elementRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
            className="animate-in fade-in duration-300"
          />
        </svg>

        {/* Animated Border around highlighted element */}
        {elementRect && (
          <div
            className="absolute border-2 border-orange-500 rounded-lg animate-pulse pointer-events-none"
            style={{
              top: elementRect.top - 8,
              left: elementRect.left - 8,
              width: elementRect.width + 16,
              height: elementRect.height + 16,
              boxShadow: '0 0 20px rgba(249, 115, 22, 0.5), inset 0 0 20px rgba(249, 115, 22, 0.2)',
            }}
          />
        )}
      </div>

      {/* Tour Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[101] pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: '400px',
        }}
      >
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-2 border-orange-500/50 rounded-xl p-6 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">{currentStep + 1}</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{steps[currentStep].title}</h3>
                <p className="text-xs text-neutral-400">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <Button
              onClick={onSkip}
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:text-white hover:bg-neutral-700 -mt-2 -mr-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-neutral-700 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Description */}
          <p className="text-neutral-300 leading-relaxed mb-6 text-sm">
            {steps[currentStep].description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={onSkip}
              variant="outline"
              size="sm"
              className="border-neutral-600 text-neutral-400 hover:bg-neutral-700 hover:text-white"
            >
              Skip Tour
            </Button>
            <Button
              onClick={handleNext}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white flex items-center gap-2 shadow-lg"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Finish <CheckCircle className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Step Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
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
        </div>

        {/* Arrow pointer */}
        {elementRect && (
          <div
            className="absolute w-0 h-0"
            style={{
              ...(steps[currentStep].position === 'top' && {
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid rgba(249, 115, 22, 0.5)',
              }),
              ...(steps[currentStep].position === 'bottom' && {
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '10px solid rgba(249, 115, 22, 0.5)',
              }),
              ...(steps[currentStep].position === 'left' && {
                right: '-10px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderLeft: '10px solid rgba(249, 115, 22, 0.5)',
              }),
              ...(steps[currentStep].position === 'right' && {
                left: '-10px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderRight: '10px solid rgba(249, 115, 22, 0.5)',
              }),
            }}
          />
        )}
      </div>
    </>
  )
}
