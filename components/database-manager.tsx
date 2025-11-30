"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { PoloxyDatabase } from "@/lib/poloxy-types"
import { availableDatabases } from "@/lib/poloxy-mock-data"
import { Database, Plus, RefreshCw, Unlink, Check } from "lucide-react"

interface DatabaseManagerProps {
  databases: PoloxyDatabase[]
  onAddDatabase: (db: PoloxyDatabase) => void
  onUnlinkDatabase: (dbId: string) => void
  onSyncDatabase: (dbId: string) => void
  onSyncAll: () => void
  isSyncing: boolean
}

export function DatabaseManager({
  databases,
  onAddDatabase,
  onUnlinkDatabase,
  onSyncDatabase,
  onSyncAll,
  isSyncing,
}: DatabaseManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDb, setSelectedDb] = useState<PoloxyDatabase | null>(null)

  const handleAddDatabase = () => {
    if (selectedDb) {
      const newDb: PoloxyDatabase = {
        ...selectedDb,
        id: `db-${Date.now()}`,
        isConnected: true,
        lastSynced: new Date(),
      }
      onAddDatabase(newDb)
      setIsDialogOpen(false)
      setSelectedDb(null)
    }
  }

  // Filter out already connected databases
  const available = availableDatabases.filter(
    (availDb) => !databases.some((db) => db.code === availDb.code)
  )

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider">
            DATABASES
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSyncAll}
            disabled={isSyncing || databases.length === 0}
            className="h-7 text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            Sync All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Connected Databases */}
        {databases.map((db) => (
          <div
            key={db.id}
            className="p-3 rounded-lg bg-background border border-border hover:border-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{db.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{db.code}</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <Check className="w-2.5 h-2.5 mr-1" />
                Connected
              </Badge>
            </div>

            {db.lastSynced && (
              <p className="text-xs text-muted-foreground mb-2">
                Last synced: {new Date(db.lastSynced).toLocaleTimeString()}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSyncDatabase(db.id)}
                disabled={isSyncing}
                className="flex-1 h-7 text-xs"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
                Sync
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUnlinkDatabase(db.id)}
                disabled={isSyncing}
                className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Unlink className="w-3 h-3 mr-1" />
                Unlink
              </Button>
            </div>
          </div>
        ))}

        {databases.length === 0 && (
          <div className="p-6 text-center">
            <Database className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No databases connected</p>
            <p className="text-xs text-muted-foreground mt-1">Add a database to get started</p>
          </div>
        )}

        {/* Add Database Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-dashed border-accent/50 hover:border-accent hover:bg-accent/5"
              disabled={available.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Database
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Poloxy Database</DialogTitle>
              <DialogDescription>
                Select a database to connect and sync approval requests
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Available Databases</Label>
                {available.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    All available databases are already connected
                  </p>
                ) : (
                  <div className="space-y-2">
                    {available.map((db) => (
                      <button
                        key={db.id}
                        onClick={() => setSelectedDb(db)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          selectedDb?.id === db.id
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-cyan-500/20 flex items-center justify-center">
                            <Database className="w-5 h-5 text-cyan-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-foreground">{db.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{db.code}</p>
                          </div>
                          {selectedDb?.id === db.id && (
                            <Check className="w-5 h-5 text-accent" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setSelectedDb(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDatabase}
                  disabled={!selectedDb}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Database
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
