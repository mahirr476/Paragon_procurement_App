"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, MoreHorizontal, MapPin, Clock, Shield, TrendingUp, Calendar } from 'lucide-react'
import { getCurrentPOs, getApprovedPOs } from "@/lib/storage"
import { TrendDashboard } from "@/components/trend-dashboard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export default function AgentNetworkPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [currentPOs] = useState(getCurrentPOs())
  const [approvedPOs] = useState(getApprovedPOs())
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly')

  const agents = [
    {
      id: "G-078W",
      name: "VENGEFUL SPIRIT",
      status: "active",
      location: "Berlin",
      lastSeen: "2 min ago",
      missions: 47,
      risk: "high",
    },
    {
      id: "G-079X",
      name: "OBSIDIAN SENTINEL",
      status: "standby",
      location: "Tokyo",
      lastSeen: "15 min ago",
      missions: 32,
      risk: "medium",
    },
    {
      id: "G-080Y",
      name: "GHOSTLY FURY",
      status: "active",
      location: "Cairo",
      lastSeen: "1 min ago",
      missions: 63,
      risk: "high",
    },
    {
      id: "G-081Z",
      name: "CURSED REVENANT",
      status: "compromised",
      location: "Moscow",
      lastSeen: "3 hours ago",
      missions: 28,
      risk: "critical",
    },
    {
      id: "G-082A",
      name: "VENOMOUS SHADE",
      status: "active",
      location: "London",
      lastSeen: "5 min ago",
      missions: 41,
      risk: "medium",
    },
    {
      id: "G-083B",
      name: "MYSTIC ENIGMA",
      status: "training",
      location: "Base Alpha",
      lastSeen: "1 day ago",
      missions: 12,
      risk: "low",
    },
    {
      id: "G-084C",
      name: "WRAITH AVENGER",
      status: "active",
      location: "Paris",
      lastSeen: "8 min ago",
      missions: 55,
      risk: "high",
    },
    {
      id: "G-085D",
      name: "SPECTRAL FURY",
      status: "standby",
      location: "Sydney",
      lastSeen: "22 min ago",
      missions: 38,
      risk: "medium",
    },
  ]

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (currentPOs.length > 0 || approvedPOs.length > 0) {
    const allPOs = [...approvedPOs, ...currentPOs]
    const now = new Date()
    const filteredByTime = allPOs.filter(po => {
      const poDate = new Date(po.date)
      const diffTime = now.getTime() - poDate.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      
      switch (timePeriod) {
        case 'daily':
          return diffDays <= 1
        case 'weekly':
          return diffDays <= 7
        case 'monthly':
          return diffDays <= 30
        case 'yearly':
          return diffDays <= 365
        default:
          return true
      }
    })

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-wider flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              TREND ANALYSIS
            </h1>
            <p className="text-sm text-muted-foreground">Historical patterns and supplier analysis</p>
          </div>
          <div className="flex items-center gap-3" data-tour="trends-filters">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-32 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-xs">
                {filteredByTime.length} / {allPOs.length}
              </Badge>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Export Report</Button>
          </div>
        </div>

        {/* Trend Dashboard */}
        <TrendDashboard 
          currentPOs={filteredByTime.filter(po => currentPOs.some(c => c.orderNo === po.orderNo))} 
          approvedPOs={filteredByTime.filter(po => approvedPOs.some(a => a.orderNo === po.orderNo))} 
          timePeriod={timePeriod}
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-wider">TREND ANALYSIS</h1>
        <p className="text-sm text-muted-foreground">Historical patterns and supplier analysis</p>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Upload purchase orders to view trends</p>
        </CardContent>
      </Card>
    </div>
  )
}
