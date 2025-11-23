"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Settings, BarChart3, Zap, Database, FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardOverview } from "@/components/dashboard-overview"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeSelector } from "@/components/theme-selector"
import UploadPage from "./upload/page"
import AgentNetworkPage from "./agent-network/page"
import IntelligencePage from "./intelligence/page"
import SystemsPage from "./systems/page"
import ReportsPage from "./reports/page"
import { getApprovedPOs } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"
import { useRouter } from "next/navigation"
import { InteractiveTour } from "@/components/interactive-tour"
import { SkipTutorialsDialog } from "@/components/skip-tutorials-dialog"

export const dynamic = "force-dynamic"

export default function TacticalDashboard() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [approvedPOs, setApprovedPOs] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showTutorialDialog, setShowTutorialDialog] = useState(false)
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null)
  const [tutorialsEnabled, setTutorialsEnabled] = useState(false)
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set())

  // Check authentication
  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/login")
    } else {
      setCurrentUser(user)
    }
  }, [router])

  useEffect(() => {
    async function loadApprovedPOs() {
      try {
        const pos = await getApprovedPOs()
        setApprovedPOs(pos)
      } catch (error) {
        console.error("[v0] Error loading approved POs:", error)
        setApprovedPOs([])
      }
    }
    loadApprovedPOs()
  }, [])

  // Refresh approved POs when returning to dashboard or when section changes
  useEffect(() => {
    async function refreshPOs() {
      try {
        const pos = await getApprovedPOs()
        console.log("[Dashboard] Loaded approved POs:", pos.length)
        setApprovedPOs(pos)
      } catch (error) {
        console.error("[v0] Error refreshing POs:", error)
      }
    }
    
    // Refresh immediately and also when switching to overview
    refreshPOs()
    if (activeSection === "overview") {
      refreshPOs()
    }
    
    // Also refresh periodically (every 3 seconds) when on overview to catch updates
    let interval: NodeJS.Timeout | null = null
    if (activeSection === "overview") {
      interval = setInterval(refreshPOs, 3000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeSection])
  
  // Also refresh on window focus and when POs are approved
  useEffect(() => {
    const handleFocus = () => {
      if (activeSection === "overview") {
        getApprovedPOs().then(pos => {
          console.log("[Dashboard] Refreshed on focus:", pos.length)
          setApprovedPOs(pos)
        }).catch(console.error)
      }
    }
    
    const handlePOsApproved = () => {
      if (activeSection === "overview") {
        getApprovedPOs().then(pos => {
          console.log("[Dashboard] Refreshed after approval:", pos.length)
          setApprovedPOs(pos)
        }).catch(console.error)
      }
    }
    
    // Check localStorage for updates
    const checkForUpdates = () => {
      const lastApproved = localStorage.getItem('pos-last-approved')
      if (lastApproved) {
        const lastTime = parseInt(lastApproved)
        const now = Date.now()
        // If approved within last 10 seconds, refresh
        if (now - lastTime < 10000 && activeSection === "overview") {
          getApprovedPOs().then(setApprovedPOs).catch(console.error)
        }
      }
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pos-approved', handlePOsApproved)
    
    // Check for updates every 2 seconds
    const interval = setInterval(checkForUpdates, 2000)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pos-approved', handlePOsApproved)
      clearInterval(interval)
    }
  }, [activeSection])

  useEffect(() => {
    if (typeof window === "undefined") return
    const justLoggedIn = sessionStorage.getItem("show_tutorial_dialog")
    if (justLoggedIn === "true") {
      setShowTutorialDialog(true)
      sessionStorage.removeItem("show_tutorial_dialog")
    }
  }, [])

  useEffect(() => {
    if (tutorialsEnabled && !completedTutorials.has(activeSection)) {
      // Small delay to let DOM render
      const timer = setTimeout(() => {
        setActiveTutorial(activeSection)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [activeSection, tutorialsEnabled, completedTutorials])

  const handleTutorialComplete = () => {
    if (activeTutorial) {
      setCompletedTutorials((prev) => new Set([...prev, activeTutorial]))
    }
    setActiveTutorial(null)
  }

  const handleSkipTutorial = () => {
    if (activeTutorial) {
      setCompletedTutorials((prev) => new Set([...prev, activeTutorial]))
    }
    setActiveTutorial(null)
  }

  const handleAcceptTutorials = () => {
    setShowTutorialDialog(false)
    setTutorialsEnabled(true)
    // Start dashboard tutorial immediately
    setTimeout(() => {
      setActiveTutorial("overview")
    }, 300)
  }

  const handleDeclineTutorials = () => {
    setShowTutorialDialog(false)
    setTutorialsEnabled(false)
  }

  const tours: Record<
    string,
    { target: string; title: string; description: string; position?: "top" | "bottom" | "left" | "right" }[]
  > = {
    overview: [
      {
        target: '[data-tour="dashboard-filters"]',
        title: "Smart Filters",
        description:
          "Use these filters to narrow down your purchase orders by search term, branch, supplier, or category. The badge shows how many orders match your current filters.",
        position: "bottom",
      },
      {
        target: '[data-tour="dashboard-metrics"]',
        title: "Key Metrics",
        description:
          "At-a-glance view of your total spending, order count, average order value, and active suppliers across all approved purchase orders.",
        position: "bottom",
      },
      {
        target: '[data-tour="dashboard-charts"]',
        title: "Visual Analytics",
        description:
          "Interactive charts showing spending by branch, top suppliers, and category distribution. Click on chart elements to explore specific segments.",
        position: "top",
      },
      {
        target: '[data-tour="dashboard-recent"]',
        title: "Recent Orders",
        description:
          "Quick access to your most recent purchase orders with key details. Click any row to see full order information.",
        position: "top",
      },
    ],
    upload: [
      {
        target: '[data-tour="upload-csv"]',
        title: "Upload CSV Files",
        description:
          "Drop your CSV file here or click to browse. The system automatically parses purchase order data and runs analysis to detect potential issues.",
        position: "right",
      },
      {
        target: '[data-tour="upload-stats"]',
        title: "Upload Statistics",
        description:
          "See real-time metrics about your uploaded purchase orders including total count, amounts, and detected issues organized by severity level.",
        position: "right",
      },
      {
        target: '[data-tour="upload-branch-filter"]',
        title: "Filter by Branch",
        description:
          "Select specific branches to focus on particular locations. This helps you review orders for one branch at a time.",
        position: "bottom",
      },
      {
        target: '[data-tour="upload-po-list"]',
        title: "Review Purchase Orders",
        description:
          "All uploaded POs appear here. Items with flags are highlighted with colored borders. Click any PO to see detailed analysis, price comparisons, and issue explanations.",
        position: "top",
      },
      {
        target: '[data-tour="upload-actions"]',
        title: "Bulk Actions",
        description:
          "Select multiple POs using checkboxes, then approve or delete them in bulk. Approved orders are added to your database for trend analysis.",
        position: "bottom",
      },
    ],
    reports: [
      {
        target: '[data-tour="reports-metrics"]',
        title: "Key Performance Indicators",
        description:
          "Track essential metrics including total spend, order count, average PO value, and active suppliers at a glance.",
        position: "bottom",
      },
      {
        target: '[data-tour="reports-spending"]',
        title: "Spending Analysis",
        description:
          "Visualize spending patterns by category, supplier, and over time to identify trends and optimize procurement strategy.",
        position: "bottom",
      },
      {
        target: '[data-tour="reports-performance"]',
        title: "Supplier Performance",
        description:
          "Evaluate supplier metrics including on-time delivery rates, lead times, and price variance to make informed sourcing decisions.",
        position: "top",
      },
      {
        target: '[data-tour="reports-risk"]',
        title: "Risk Management",
        description:
          "Identify concentration risks and single-source dependencies to mitigate supply chain vulnerabilities.",
        position: "top",
      },
    ],
    agents: [
      {
        target: '[data-tour="trends-filters"]',
        title: "Analysis Controls",
        description:
          "Filter your trend analysis by time period (daily, weekly, monthly, yearly), branch, and item category to focus on specific segments.",
        position: "bottom",
      },
      {
        target: '[data-tour="trends-summary"]',
        title: "Trend Summary Cards",
        description:
          "Key trend indicators showing total orders, spending trends, and detected anomalies. The percentages show changes over your selected time period.",
        position: "bottom",
      },
      {
        target: '[data-tour="trends-charts"]',
        title: "Spending Analysis",
        description:
          "Visual breakdown of spending by branch and category. These charts help identify where resources are being allocated.",
        position: "top",
      },
      {
        target: '[data-tour="trends-anomalies"]',
        title: "Anomaly Detection",
        description:
          "Automatically detected unusual patterns in your purchase orders. Click any anomaly card to see detailed analysis, related orders, and suggested actions.",
        position: "top",
      },
    ],
    intelligence: [
      {
        target: '[data-tour="ai-sidebar-toggle"]',
        title: "Chat History",
        description:
          "Toggle this sidebar to view all your previous AI conversations, search through them, or start new chats. Each conversation is automatically saved and titled.",
        position: "right",
      },
      {
        target: '[data-tour="ai-chat-area"]',
        title: "AI-Powered Analysis",
        description:
          "Ask questions about your purchase order data in natural language. The AI has access to all your approved orders and can help identify patterns, compare suppliers, and provide insights.",
        position: "top",
      },
      {
        target: '[data-tour="ai-suggestions"]',
        title: "Suggested Questions",
        description:
          "Not sure what to ask? Click these suggested questions to get started. They cover common analysis tasks like finding duplicate orders or comparing supplier pricing.",
        position: "top",
      },
    ],
    systems: [
      {
        target: '[data-tour="profile-icon"]',
        title: "Profile Settings",
        description:
          "Click the profile icon in the top-right to manage your account, update personal information, or sign out.",
        position: "left",
      },
      {
        target: '[data-tour="notification-bell"]',
        title: "Notifications",
        description:
          "Get alerts when new POs are uploaded and need review, or when anomalies are detected in your data.",
        position: "left",
      },
    ],
  }

  if (!currentUser) {
    return null // or loading spinner
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-card border-r border-border transition-all duration-300 ease-in-out fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""} flex flex-col`}
      >
        <div className={`${sidebarCollapsed ? "py-2" : "p-4"} flex-1 flex flex-col`}>
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center px-2" : "justify-between"} mb-8`}>
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-accent font-bold text-lg tracking-wider">PO SYSTEM</h1>
              <p className="text-muted-foreground text-xs">v1.0 PROCUREMENT</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-muted-foreground hover:text-accent hover:!bg-transparent hover:!text-accent"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className={`space-y-2 flex-1 ${sidebarCollapsed ? "px-0" : ""}`}>
            {[
              { id: "overview", icon: Database, label: "DASHBOARD" },
              { id: "upload", icon: Upload, label: "UPLOAD" },
              { id: "reports", icon: BarChart3, label: "REPORTS" },
              { id: "agents", icon: FileText, label: "TRENDS" },
              { id: "intelligence", icon: Zap, label: "AI ANALYSIS" },
              { id: "systems", icon: Settings, label: "SETTINGS" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : ""} ${sidebarCollapsed ? "" : "gap-3"} ${sidebarCollapsed ? "p-2 mx-0 rounded-md" : "p-3 rounded"} transition-colors ${
                  activeSection === item.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-muted border border-border rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-foreground rounded-full animate-pulse"></div>
                <span className="text-xs text-foreground">SYSTEM ACTIVE</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>{approvedPOs.length} approved orders</div>
              </div>
            </div>
          )}

          {/* Moved theme selector to bottom with border above */}
          <div className={`mt-4 pt-4 border-t border-border ${sidebarCollapsed ? "px-2" : ""}`}>
            <ThemeSelector collapsed={sidebarCollapsed} />
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? "ml-16" : "ml-64"} md:ml-0 transition-all duration-300 ease-in-out`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              PROCUREMENT / <span className="text-accent">{activeSection.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" })}
            </div>
            <div data-tour="notification-bell">
              <NotificationBell />
            </div>
            <div data-tour="profile-icon">
              <ProfileDropdown user={currentUser} />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto pl-2 md:pl-0">
          {activeSection === "overview" && <DashboardOverview approvedPOs={approvedPOs} />}
          {activeSection === "upload" && <UploadPage />}
          {activeSection === "reports" && <ReportsPage />}
          {activeSection === "agents" && <AgentNetworkPage />}
          {activeSection === "intelligence" && <IntelligencePage />}
          {activeSection === "systems" && <SystemsPage />}
        </div>
      </div>

      {/* Tutorial Dialogs */}
      {showTutorialDialog && (
        <SkipTutorialsDialog onContinue={handleAcceptTutorials} onSkipAll={handleDeclineTutorials} />
      )}

      {activeTutorial && tours[activeTutorial] && (
        <InteractiveTour
          steps={tours[activeTutorial]}
          onComplete={handleTutorialComplete}
          onSkip={handleSkipTutorial}
        />
      )}
    </div>
  )
}
