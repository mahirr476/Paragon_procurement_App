

// "use client"

// import { useState, useEffect } from "react"
// import { ChevronRight, Settings, BarChart3, Zap, Database, Clock, Layers } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { DashboardOverview } from "@/components/dashboard-overview"
// import { ProfileDropdown } from "@/components/profile-dropdown"
// import { NotificationBell } from "@/components/notification-bell"
// import { ThemeToggle } from "@/components/theme-toggle"
// import PendingPOPage from "./pending-po/page"
// import POPage from "./po/page"
// import IntelligencePage from "./intelligence/page"
// import SystemsPage from "./systems/page"
// import ReportsPage from "./reports/page"
// import { getApprovedPOs } from "@/lib/storage"
// import { getCurrentUser } from "@/lib/auth"
// import type { User } from "@/lib/types"
// import { useRouter, useSearchParams } from "next/navigation"
// import { InteractiveTour } from "@/components/interactive-tour"
// import { SkipTutorialsDialog } from "@/components/skip-tutorials-dialog"

// export const dynamic = "force-dynamic"

// const VALID_SECTIONS = ["overview", "pending-po", "po", "reports", "intelligence", "systems"]

// export default function TacticalDashboard() {
//   const router = useRouter()
//   const searchParams = useSearchParams()
  
//   // Initialize activeSection from URL or default to "overview"
//   const getInitialSection = () => {
//     try {
//       const section = searchParams.get("section")
//       return section && VALID_SECTIONS.includes(section) ? section : "overview"
//     } catch {
//       return "overview"
//     }
//   }
  
//   const [activeSection, setActiveSection] = useState(getInitialSection)
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
//   const [approvedPOs, setApprovedPOs] = useState<any[]>([])
//   const [currentUser, setCurrentUser] = useState<User | null>(null)
//   const [showTutorialDialog, setShowTutorialDialog] = useState(false)
//   const [activeTutorial, setActiveTutorial] = useState<string | null>(null)
//   const [tutorialsEnabled, setTutorialsEnabled] = useState(false)
//   const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set())

//   // Sync activeSection with URL on mount (only once)
//   useEffect(() => {
//     const section = searchParams.get("section")
//     const validSection = section && VALID_SECTIONS.includes(section) ? section : "overview"
//     if (validSection !== activeSection) {
//       setActiveSection(validSection)
//     }
//     // Only run on mount
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   // Update URL when activeSection changes (but avoid if URL already matches)
//   useEffect(() => {
//     const currentSection = searchParams.get("section")
//     const expectedSection = activeSection === "overview" ? null : activeSection
    
//     // Only update URL if it doesn't match
//     if (currentSection !== expectedSection) {
//       const newUrl = activeSection === "overview" 
//         ? "/" 
//         : `/?section=${activeSection}`
//       router.replace(newUrl, { scroll: false })
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activeSection])

//   // Check authentication
//   useEffect(() => {
//     const user = getCurrentUser()
//     if (!user) {
//       router.push("/login")
//     } else {
//       setCurrentUser(user)
//     }
//   }, [router])

//   useEffect(() => {
//     async function loadApprovedPOs() {
//       try {
//         const user = getCurrentUser()
//         const pos = await getApprovedPOs(user?.empId)
//         setApprovedPOs(pos)
//       } catch (error) {
//         console.error("[v0] Error loading approved POs:", error)
//         setApprovedPOs([])
//       }
//     }
//     loadApprovedPOs()
//   }, [])

//   // Refresh approved POs when returning to dashboard or when section changes
//   useEffect(() => {
//     async function refreshPOs() {
//       try {
//         const user = getCurrentUser()
//         const pos = await getApprovedPOs(user?.empId)
//         console.log("[Dashboard] Loaded approved POs:", pos.length)
//         setApprovedPOs(pos)
//       } catch (error) {
//         console.error("[v0] Error refreshing POs:", error)
//       }
//     }
    
//     // Refresh immediately and also when switching to overview
//     refreshPOs()
//     if (activeSection === "overview") {
//       refreshPOs()
//     }
    
//     // Also refresh periodically (every 3 seconds) when on overview to catch updates
//     let interval: NodeJS.Timeout | null = null
//     if (activeSection === "overview") {
//       interval = setInterval(refreshPOs, 3000)
//     }
    
//     return () => {
//       if (interval) clearInterval(interval)
//     }
//   }, [activeSection])
  
//   // Also refresh on window focus and when POs are approved
//   useEffect(() => {
//     const handleFocus = () => {
//       if (activeSection === "overview") {
//         const user = getCurrentUser()
//         getApprovedPOs(user?.empId).then(pos => {
//           console.log("[Dashboard] Refreshed on focus:", pos.length)
//           setApprovedPOs(pos)
//         }).catch(console.error)
//       }
//     }
    
//     const handlePOsApproved = () => {
//       if (activeSection === "overview") {
//         const user = getCurrentUser()
//         getApprovedPOs(user?.empId).then(pos => {
//           console.log("[Dashboard] Refreshed after approval:", pos.length)
//           setApprovedPOs(pos)
//         }).catch(console.error)
//       }
//     }
    
//     // Check localStorage for updates
//     const checkForUpdates = () => {
//       const lastApproved = localStorage.getItem('pos-last-approved')
//       if (lastApproved) {
//         const lastTime = parseInt(lastApproved)
//         const now = Date.now()
//         // If approved within last 10 seconds, refresh
//         if (now - lastTime < 10000 && activeSection === "overview") {
//           const user = getCurrentUser()
//           getApprovedPOs(user?.empId).then(setApprovedPOs).catch(console.error)
//         }
//       }
//     }
    
//     window.addEventListener('focus', handleFocus)
//     window.addEventListener('pos-approved', handlePOsApproved)
    
//     // Check for updates every 2 seconds
//     const interval = setInterval(checkForUpdates, 2000)
    
//     return () => {
//       window.removeEventListener('focus', handleFocus)
//       window.removeEventListener('pos-approved', handlePOsApproved)
//       clearInterval(interval)
//     }
//   }, [activeSection])

//   useEffect(() => {
//     if (typeof window === "undefined") return
//     const justLoggedIn = sessionStorage.getItem("show_tutorial_dialog")
//     if (justLoggedIn === "true") {
//       setShowTutorialDialog(true)
//       sessionStorage.removeItem("show_tutorial_dialog")
//     }
//   }, [])

//   useEffect(() => {
//     if (tutorialsEnabled && !completedTutorials.has(activeSection)) {
//       // Small delay to let DOM render
//       const timer = setTimeout(() => {
//         setActiveTutorial(activeSection)
//       }, 300)
//       return () => clearTimeout(timer)
//     }
//   }, [activeSection, tutorialsEnabled, completedTutorials])

//   const handleTutorialComplete = () => {
//     if (activeTutorial) {
//       setCompletedTutorials((prev) => new Set([...prev, activeTutorial]))
//     }
//     setActiveTutorial(null)
//   }

//   const handleSkipTutorial = () => {
//     if (activeTutorial) {
//       setCompletedTutorials((prev) => new Set([...prev, activeTutorial]))
//     }
//     setActiveTutorial(null)
//   }

//   const handleAcceptTutorials = () => {
//     setShowTutorialDialog(false)
//     setTutorialsEnabled(true)
//     // Start dashboard tutorial immediately
//     setTimeout(() => {
//       setActiveTutorial("overview")
//     }, 300)
//   }

//   const handleDeclineTutorials = () => {
//     setShowTutorialDialog(false)
//     setTutorialsEnabled(false)
//   }

//   const tours: Record<string, { target: string; title: string; description: string; position?: "top" | "bottom" | "left" | "right" }[]> = {
//     overview: [
//       {
//         target: '[data-tour="dashboard-filters"]',
//         title: "Smart Filters",
//         description:
//           "Use these filters to narrow down your purchase orders by search term, branch, supplier, or category. The badge shows how many orders match your current filters.",
//         position: "bottom",
//       },
//       {
//         target: '[data-tour="dashboard-metrics"]',
//         title: "Key Metrics",
//         description:
//           "At-a-glance view of your total spending, order count, average order value, and active suppliers across all approved purchase orders.",
//         position: "bottom",
//       },
//       {
//         target: '[data-tour="dashboard-charts"]',
//         title: "Visual Analytics",
//         description:
//           "Interactive charts showing spending by branch, top suppliers, and category distribution. Click on chart elements to explore specific segments.",
//         position: "top",
//       },
//       {
//         target: '[data-tour="dashboard-recent"]',
//         title: "Recent Orders",
//         description:
//           "Quick access to your most recent purchase orders with key details. Click any row to see full order information.",
//         position: "top",
//       },
//     ],
//     "pending-po": [
//       {
//         target: '[data-tour="upload-csv"]',
//         title: "Upload CSV Files",
//         description:
//           "Drop your CSV file here or click to browse. The system automatically parses purchase order data and runs analysis to detect potential issues.",
//         position: "right",
//       },
//       {
//         target: '[data-tour="upload-stats"]',
//         title: "Upload Statistics",
//         description:
//           "See real-time metrics about your uploaded purchase orders including total count, amounts, and detected issues organized by severity level.",
//         position: "right",
//       },
//       {
//         target: '[data-tour="upload-branch-filter"]',
//         title: "Filter by Branch",
//         description:
//           "Select specific branches to focus on particular locations. This helps you review orders for one branch at a time.",
//         position: "bottom",
//       },
//       {
//         target: '[data-tour="upload-po-list"]',
//         title: "Review Purchase Orders",
//         description:
//           "All uploaded POs appear here. Items with flags are highlighted with colored borders. Click any PO to see detailed analysis, price comparisons, and issue explanations.",
//         position: "top",
//       },
//       {
//         target: '[data-tour="upload-actions"]',
//         title: "Bulk Actions",
//         description:
//           "Select multiple POs using checkboxes, then approve or delete them in bulk. Approved orders are added to your database for trend analysis.",
//         position: "bottom",
//       },
//     ],
//     reports: [
//       {
//         target: '[data-tour="reports-metrics"]',
//         title: "Key Performance Indicators",
//         description:
//           "Track essential metrics including total spend, order count, average PO value, and active suppliers at a glance.",
//         position: "bottom",
//       },
//       {
//         target: '[data-tour="reports-spending"]',
//         title: "Spending Analysis",
//         description:
//           "Visualize spending patterns by category, supplier, and over time to identify trends and optimize procurement strategy.",
//         position: "bottom",
//       },
//       {
//         target: '[data-tour="reports-performance"]',
//         title: "Supplier Performance",
//         description:
//           "Evaluate supplier metrics including on-time delivery rates, lead times, and price variance to make informed sourcing decisions.",
//         position: "top",
//       },
//       {
//         target: '[data-tour="reports-risk"]',
//         title: "Risk Management",
//         description:
//           "Identify concentration risks and single-source dependencies to mitigate supply chain vulnerabilities.",
//         position: "top",
//       },
//     ],
//     intelligence: [
//       {
//         target: '[data-tour="ai-sidebar-toggle"]',
//         title: "Chat History",
//         description:
//           "Toggle this sidebar to view all your previous AI conversations, search through them, or start new chats. Each conversation is automatically saved and titled.",
//         position: "right",
//       },
//       {
//         target: '[data-tour="ai-chat-area"]',
//         title: "AI-Powered Analysis",
//         description:
//           "Ask questions about your purchase order data in natural language. The AI has access to all your approved orders and can help identify patterns, compare suppliers, and provide insights.",
//         position: "top",
//       },
//       {
//         target: '[data-tour="ai-suggestions"]',
//         title: "Suggested Questions",
//         description:
//           "Not sure what to ask? Click these suggested questions to get started. They cover common analysis tasks like finding duplicate orders or comparing supplier pricing.",
//         position: "top",
//       },
//     ],
//     systems: [
//       {
//         target: '[data-tour="profile-icon"]',
//         title: "Profile Settings",
//         description:
//           "Click the profile icon in the top-right to manage your account, update personal information, or sign out.",
//         position: "left",
//       },
//       {
//         target: '[data-tour="notification-bell"]',
//         title: "Notifications",
//         description:
//           "Get alerts when new POs are uploaded and need review, or when anomalies are detected in your data.",
//         position: "left",
//       },
//     ],
//   }

//   if (!currentUser) {
//     return null // or loading spinner
//   }

//   return (
//     <div className="flex h-screen bg-background">
//       {/* Sidebar */}
//       <div
//         className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-card border-r border-border transition-all duration-300 ease-in-out fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""} flex flex-col`}
//       >
//         <div className={`${sidebarCollapsed ? "py-2" : "p-4"} flex-1 flex flex-col`}>
//           <div className={`flex items-center ${sidebarCollapsed ? "justify-center px-2" : "justify-between"} mb-8`}>
//             <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
//               <h1 className="text-accent font-bold text-lg tracking-wider">PO SYSTEM</h1>
//               <p className="text-muted-foreground text-xs">v1.0 PROCUREMENT</p>
//             </div>
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
//               className="text-muted-foreground hover:text-accent hover:!bg-transparent hover:!text-accent"
//             >
//               <ChevronRight
//                 className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`}
//               />
//             </Button>
//           </div>

//           <nav className={`space-y-2 ${sidebarCollapsed ? "px-0" : ""}`}>
//             {/* Dashboard */}
//             <button
//               onClick={() => setActiveSection("overview")}
//               className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : ""} ${sidebarCollapsed ? "" : "gap-3"} ${sidebarCollapsed ? "p-2 mx-0 rounded-md" : "p-3 rounded"} transition-colors ${
//                 activeSection === "overview" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
//               }`}
//             >
//               <Database className="w-5 h-5 flex-shrink-0" />
//               {!sidebarCollapsed && <span className="text-sm font-medium">DASHBOARD</span>}
//             </button>

//             {/* Pending PO */}
//             <button
//               onClick={() => setActiveSection("pending-po")}
//               className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : ""} ${sidebarCollapsed ? "" : "gap-3"} ${sidebarCollapsed ? "p-2 mx-0 rounded-md" : "p-3 rounded"} transition-colors ${
//                 activeSection === "pending-po" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
//               }`}
//             >
//               <Clock className="w-5 h-5 flex-shrink-0" />
//               {!sidebarCollapsed && <span className="text-sm font-medium">PENDING PO</span>}
//             </button>

//             {/* PO */}
//             <button
//               onClick={() => setActiveSection("po")}
//               className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : ""} ${sidebarCollapsed ? "" : "gap-3"} ${sidebarCollapsed ? "p-2 mx-0 rounded-md" : "p-3 rounded"} transition-colors ${
//                 activeSection === "po" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
//               }`}
//             >
//               <Layers className="w-5 h-5 flex-shrink-0" />
//               {!sidebarCollapsed && <span className="text-sm font-medium">PO</span>}
//             </button>

//             {/* Reports */}
//             <button
//               onClick={() => setActiveSection("reports")}
//               className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : ""} ${sidebarCollapsed ? "" : "gap-3"} ${sidebarCollapsed ? "p-2 mx-0 rounded-md" : "p-3 rounded"} transition-colors ${
//                 activeSection === "reports" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
//               }`}
//             >
//               <BarChart3 className="w-5 h-5 flex-shrink-0" />
//               {!sidebarCollapsed && <span className="text-sm font-medium">REPORTS</span>}
//             </button>

//             {/* AI */}
//             <button
//               onClick={() => setActiveSection("intelligence")}
//               className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : ""} ${sidebarCollapsed ? "" : "gap-3"} ${sidebarCollapsed ? "p-2 mx-0 rounded-md" : "p-3 rounded"} transition-colors ${
//                 activeSection === "intelligence" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
//               }`}
//             >
//               <Zap className="w-5 h-5 flex-shrink-0" />
//               {!sidebarCollapsed && <span className="text-sm font-medium">AI ANALYSIS</span>}
//             </button>

//             {/* Settings */}
//             <button
//               onClick={() => setActiveSection("systems")}
//               className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : ""} ${sidebarCollapsed ? "" : "gap-3"} ${sidebarCollapsed ? "p-2 mx-0 rounded-md" : "p-3 rounded"} transition-colors ${
//                 activeSection === "systems" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
//               }`}
//             >
//               <Settings className="w-5 h-5 flex-shrink-0" />
//               {!sidebarCollapsed && <span className="text-sm font-medium">SETTINGS</span>}
//             </button>
//           </nav>

//           {!sidebarCollapsed && (
//             <div className="mt-8 p-4 bg-muted border border-border rounded">
//               <div className="flex items-center gap-2 mb-2">
//                 <div className="w-2 h-2 bg-foreground rounded-full animate-pulse"></div>
//                 <span className="text-xs text-foreground">SYSTEM ACTIVE</span>
//               </div>
//               <div className="text-xs text-muted-foreground space-y-1">
//                 <div>{approvedPOs.length} approved orders</div>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>

//       {/* Mobile Overlay */}
//       {!sidebarCollapsed && (
//         <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
//       )}

//       {/* Main Content */}
//       <div className={`flex-1 flex flex-col ${sidebarCollapsed ? "ml-16" : "ml-64"} md:ml-0 transition-all duration-300 ease-in-out`}>
//         {/* Top Toolbar */}
//         <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
//           <div className="flex items-center gap-4">
//             <div className="text-sm text-muted-foreground">
//               PROCUREMENT / <span className="text-accent">{activeSection.toUpperCase()}</span>
//             </div>
//           </div>
//           <div className="flex items-center gap-4">
//             <div className="text-xs text-muted-foreground">
//               {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" })}
//             </div>
//             <div className="flex items-center gap-1">
//               <ThemeToggle />
//               <div data-tour="notification-bell">
//                 <NotificationBell />
//               </div>
//             </div>
//             <div data-tour="profile-icon">
//               <ProfileDropdown user={currentUser} />
//             </div>
//           </div>
//         </div>

//         {/* Dashboard Content */}
//         <div className="flex-1 overflow-auto pl-2 md:pl-0">
//           {activeSection === "overview" && <DashboardOverview approvedPOs={approvedPOs} />}
//           {activeSection === "pending-po" && <PendingPOPage />}
//           {activeSection === "po" && <POPage />}
//           {activeSection === "reports" && <ReportsPage />}
//           {activeSection === "intelligence" && <IntelligencePage />}
//           {activeSection === "systems" && <SystemsPage />}
//         </div>
//       </div>

//       {/* Tutorial Dialogs */}
//       {showTutorialDialog && (
//         <SkipTutorialsDialog onContinue={handleAcceptTutorials} onSkipAll={handleDeclineTutorials} />
//       )}

//       {activeTutorial && tours[activeTutorial] && (
//         <InteractiveTour
//           steps={tours[activeTutorial]}
//           onComplete={handleTutorialComplete}
//           onSkip={handleSkipTutorial}
//         />
//       )}
//     </div>
//   )
// }




"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Settings, BarChart3, Zap, Database, Clock, Layers, Menu, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardOverview } from "@/components/dashboard-overview"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import PendingPOPage from "./pending-po/page"
import POPage from "./po/page"
import IntelligencePage from "./intelligence/page"
import SystemsPage from "./systems/page"
import ReportsPage from "./reports/page"
import { getApprovedPOs } from "@/lib/storage"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"
import { useRouter, useSearchParams } from "next/navigation"
import { InteractiveTour } from "@/components/interactive-tour"
import { SkipTutorialsDialog } from "@/components/skip-tutorials-dialog"

export const dynamic = "force-dynamic"

const VALID_SECTIONS = ["overview", "pending-po", "po", "reports", "intelligence", "systems"]

export default function TacticalDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const getInitialSection = () => {
    try {
      const section = searchParams.get("section")
      return section && VALID_SECTIONS.includes(section) ? section : "overview"
    } catch {
      return "overview"
    }
  }
  
  const [activeSection, setActiveSection] = useState(getInitialSection)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [approvedPOs, setApprovedPOs] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showTutorialDialog, setShowTutorialDialog] = useState(false)
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null)
  const [tutorialsEnabled, setTutorialsEnabled] = useState(false)
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set())

  useEffect(() => {
    const section = searchParams.get("section")
    const validSection = section && VALID_SECTIONS.includes(section) ? section : "overview"
    if (validSection !== activeSection) {
      setActiveSection(validSection)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const currentSection = searchParams.get("section")
    const expectedSection = activeSection === "overview" ? null : activeSection
    if (currentSection !== expectedSection) {
      const newUrl = activeSection === "overview" 
        ? "/" 
        : `/?section=${activeSection}`
      router.replace(newUrl, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

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
        const user = getCurrentUser()
        const pos = await getApprovedPOs(user?.empId)
        setApprovedPOs(pos)
      } catch (error) {
        console.error("[v0] Error loading approved POs:", error)
        setApprovedPOs([])
      }
    }
    loadApprovedPOs()
  }, [])

  useEffect(() => {
    async function refreshPOs() {
      try {
        const user = getCurrentUser()
        const pos = await getApprovedPOs(user?.empId)
        console.log("[Dashboard] Loaded approved POs:", pos.length)
        setApprovedPOs(pos)
      } catch (error) {
        console.error("[v0] Error refreshing POs:", error)
      }
    }
    
    refreshPOs()
    if (activeSection === "overview") {
      refreshPOs()
    }
    
    let interval: NodeJS.Timeout | null = null
    if (activeSection === "overview") {
      interval = setInterval(refreshPOs, 3000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeSection])
  
  useEffect(() => {
    const handleFocus = () => {
      if (activeSection === "overview") {
        const user = getCurrentUser()
        getApprovedPOs(user?.empId).then(pos => {
          console.log("[Dashboard] Refreshed on focus:", pos.length)
          setApprovedPOs(pos)
        }).catch(console.error)
      }
    }
    
    const handlePOsApproved = () => {
      if (activeSection === "overview") {
        const user = getCurrentUser()
        getApprovedPOs(user?.empId).then(pos => {
          console.log("[Dashboard] Refreshed after approval:", pos.length)
          setApprovedPOs(pos)
        }).catch(console.error)
      }
    }
    
    const checkForUpdates = () => {
      const lastApproved = localStorage.getItem('pos-last-approved')
      if (lastApproved) {
        const lastTime = parseInt(lastApproved)
        const now = Date.now()
        if (now - lastTime < 10000 && activeSection === "overview") {
          const user = getCurrentUser()
          getApprovedPOs(user?.empId).then(setApprovedPOs).catch(console.error)
        }
      }
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pos-approved', handlePOsApproved)
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
    setTimeout(() => {
      setActiveTutorial("overview")
    }, 300)
  }

  const handleDeclineTutorials = () => {
    setShowTutorialDialog(false)
    setTutorialsEnabled(false)
  }

  // Handle mobile section change - close menu after selecting
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setMobileMenuOpen(false)
  }

  const tours: Record<string, { target: string; title: string; description: string; position?: "top" | "bottom" | "left" | "right" }[]> = {
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
    "pending-po": [
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
    return null
  }

  // Nav items config for both sidebar and bottom bar
  const navItems = [
    { id: "overview", label: "DASHBOARD", shortLabel: "System", icon: Database },
    { id: "pending-po", label: "PENDING PO", shortLabel: "Pending", icon: Clock },
    { id: "po", label: "PO", shortLabel: "Orders", icon: Layers },
    { id: "reports", label: "REPORTS", shortLabel: "Reports", icon: BarChart3 },
    { id: "intelligence", label: "AI ANALYSIS", shortLabel: "AI", icon: Zap },
    { id: "systems", label: "SETTINGS", shortLabel: "Config", icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* ===== DESKTOP SIDEBAR (hidden on mobile) ===== */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-card border-r border-border transition-all duration-300 ease-in-out hidden md:flex flex-col`}
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

          <nav className={`space-y-2 ${sidebarCollapsed ? "px-0" : ""}`}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : ""} ${sidebarCollapsed ? "" : "gap-3"} ${sidebarCollapsed ? "p-2 mx-0 rounded-md" : "p-3 rounded"} transition-colors ${
                  activeSection === item.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
        </div>
      </div>

      {/* ===== MOBILE SIDEBAR DRAWER (slides in from left) ===== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-accent font-bold text-lg tracking-wider">PO SYSTEM</h1>
                  <p className="text-muted-foreground text-xs">v1.0 PROCUREMENT</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-muted-foreground hover:text-accent"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </Button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                      activeSection === item.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-auto p-4 bg-muted border border-border rounded">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-foreground rounded-full animate-pulse"></div>
                  <span className="text-xs text-foreground">SYSTEM ACTIVE</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {approvedPOs.length} approved orders
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ===== MOBILE TOP HEADER (visible only on mobile) ===== */}
        <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-card/95 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-accent p-1"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <p className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase">System Status: Active</p>
              <h1 className="text-sm font-bold leading-tight tracking-tight text-foreground uppercase">
                PROCUREMENT / {activeSection === "overview" ? "DASHBOARD" : activeSection.toUpperCase()}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div data-tour="notification-bell">
              <NotificationBell />
            </div>
            <div data-tour="profile-icon">
              <ProfileDropdown user={currentUser} />
            </div>
          </div>
        </div>

        {/* ===== DESKTOP TOP TOOLBAR (hidden on mobile) ===== */}
        <div className="hidden md:flex h-16 bg-card border-b border-border items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              PROCUREMENT / <span className="text-accent">{activeSection.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" })}
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <div data-tour="notification-bell">
                <NotificationBell />
              </div>
            </div>
            <div data-tour="profile-icon">
              <ProfileDropdown user={currentUser} />
            </div>
          </div>
        </div>

        {/* ===== PAGE CONTENT ===== */}
        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          {activeSection === "overview" && <DashboardOverview approvedPOs={approvedPOs} />}
          {activeSection === "pending-po" && <PendingPOPage />}
          {activeSection === "po" && <POPage />}
          {activeSection === "reports" && <ReportsPage />}
          {activeSection === "intelligence" && <IntelligencePage />}
          {activeSection === "systems" && <SystemsPage />}
        </div>
      </div>

      {/* ===== MOBILE BOTTOM TAB BAR (visible only on mobile) ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border px-2 py-2 flex justify-around items-end">
        {/* Show first 2 nav items */}
        {navItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            onClick={() => handleSectionChange(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] ${
              activeSection === item.id ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wider uppercase">{item.shortLabel}</span>
          </button>
        ))}

        {/* Center FAB - quick action for pending PO */}
        <div className="relative -top-4">
          <button
            onClick={() => handleSectionChange("pending-po")}
            className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] border-4 border-background"
          >
            <Plus className="w-5 h-5 text-accent-foreground" />
          </button>
        </div>

        {/* Show last 2 nav items (reports + AI) */}
        {navItems.slice(3, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => handleSectionChange(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] ${
              activeSection === item.id ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-wider uppercase">{item.shortLabel}</span>
          </button>
        ))}
      </nav>

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