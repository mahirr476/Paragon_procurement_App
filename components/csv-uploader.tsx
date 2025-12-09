'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, CheckCircle, AlertCircle, Database, Plus } from 'lucide-react'
import { parseCSV } from '@/lib/csv-parser'
import { saveCurrentPOs } from '@/lib/storage'
import type { PoloxyDatabase } from '@/lib/poloxy-types'
import { availableDatabases } from '@/lib/poloxy-mock-data'

interface CSVUploaderProps {
  onUploadSuccess: (count: number, databaseId?: string) => void
  databases?: PoloxyDatabase[]
  onAddDatabase?: (db: PoloxyDatabase) => void
}

export function CSVUploader({ onUploadSuccess, databases = [], onAddDatabase }: CSVUploaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<string>("none")
  const [isAddDbDialogOpen, setIsAddDbDialogOpen] = useState(false)
  const [newDbName, setNewDbName] = useState("")
  const [newDbCode, setNewDbCode] = useState("")
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

      const result = await saveCurrentPOs(pos)
      if (!result.success) {
        throw new Error(result.error || 'Failed to save purchase orders to database')
      }

      setMessage({ type: 'success', text: `Successfully uploaded ${pos.length} purchase orders` })
      onUploadSuccess(pos.length, selectedDatabase !== "none" ? selectedDatabase : undefined)
    } catch (error) {
      console.error('[CSV Uploader] Error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to parse CSV file'
      })
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAddNewDatabase = () => {
    if (!newDbName || !newDbCode || !onAddDatabase) return

    const newDb: PoloxyDatabase = {
      id: `db-csv-${Date.now()}`,
      code: newDbCode,
      name: newDbName,
      apiEndpoint: `https://poloxy.api/${newDbCode}`,
      isConnected: true,
      lastSynced: new Date(),
    }

    onAddDatabase(newDb)
    setSelectedDatabase(newDb.id)
    setIsAddDbDialogOpen(false)
    setNewDbName("")
    setNewDbCode("")
  }

  // Get available databases that aren't already connected
  const unconnectedDatabases = availableDatabases.filter(
    (availDb) => !databases.some((db) => db.code === availDb.code)
  )

  return (
    <>
      <Card className="bg-neutral-900 border-neutral-700" data-tour="upload-csv">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">UPLOAD NEW PO CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Database Selection */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 block">Link to Database (Optional)</label>
              <div className="flex gap-2">
                <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="No database" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="none" className="text-white hover:bg-neutral-700">
                      No database
                    </SelectItem>
                    {databases.map((db) => (
                      <SelectItem key={db.id} value={db.id} className="text-white hover:bg-neutral-700">
                        <div className="flex items-center gap-2">
                          <Database className="w-3 h-3" />
                          {db.code} - {db.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsAddDbDialogOpen(true)}
                  className="border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {selectedDatabase !== "none" && (
                <p className="text-xs text-neutral-500">
                  Orders will be tagged with database: {databases.find((db) => db.id === selectedDatabase)?.name}
                </p>
              )}
            </div>

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

      {/* Add Database Dialog */}
      <Dialog open={isAddDbDialogOpen} onOpenChange={setIsAddDbDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Database</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Create a new database connection for CSV uploads
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="db-code" className="text-neutral-300">Database Code</Label>
              <Input
                id="db-code"
                placeholder="e.g., a900"
                value={newDbCode}
                onChange={(e) => setNewDbCode(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="db-name" className="text-neutral-300">Database Name</Label>
              <Input
                id="db-name"
                placeholder="e.g., Regional Office"
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDbDialogOpen(false)
                  setNewDbName("")
                  setNewDbCode("")
                }}
                className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNewDatabase}
                disabled={!newDbName || !newDbCode}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Database className="w-4 h-4 mr-2" />
                Add Database
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
