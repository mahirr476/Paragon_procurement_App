'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { parseCSV } from '@/lib/csv-parser'
import { saveCurrentPOs } from '@/lib/storage'

interface CSVUploaderProps {
  onUploadSuccess: (count: number) => void
}

export function CSVUploader({ onUploadSuccess }: CSVUploaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setMessage(null)

    try {
      const text = await file.text()
      const pos = parseCSV(text)

      if (pos.length === 0) {
        throw new Error('No valid purchase orders found in CSV')
      }

      saveCurrentPOs(pos)
      setMessage({ type: 'success', text: `Successfully uploaded ${pos.length} purchase orders` })
      onUploadSuccess(pos.length)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to parse CSV file'
      })
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-700" data-tour="upload-csv">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">UPLOAD NEW PO CSV</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-300">Click to upload CSV or drag and drop</p>
            <p className="text-xs text-neutral-500">Supported format: CSV from your company software</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </div>

          {message && (
            <div className={`flex items-start gap-3 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <p className={message.type === 'success' ? 'text-green-300 text-sm' : 'text-red-300 text-sm'}>
                {message.text}
              </p>
            </div>
          )}

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isLoading ? 'Processing...' : 'Select CSV File'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
