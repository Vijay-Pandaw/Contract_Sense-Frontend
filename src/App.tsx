import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileCheck,
  FileCode,
  FileEdit,
  FilePlus,
  FileText,
  FileUp,
  History,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Send,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react'
import {
  analyzeContractApi,
  askContractChatApi,
  fetchContractHistoryApi,
  fetchContractByIdApi,
  updateClauseApi,
  acceptRedlineApi,
  createVersionApi,
  shareContractApi,
  addCommentApi,
  resolveCommentApi,
  compareContractsApi,
  exportReportApi,
  bulkContractActionApi,
  deleteContractApi,
  generateContractApi,
  fetchTemplatesApi,
  fetchClauseLibraryApi,
  fetchUserProfileApi,
  updateUserProfileApi,
  exportUserDataApi,
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  fetchAdminStatsApi,
  loginApi,
  signupApi,
  forgotPasswordApi,
} from './api'

type ViewType =
  | 'welcome'
  | 'dashboard'
  | 'editor'
  | 'generator'
  | 'clause_library'
  | 'contracts'
  | 'compare'
  | 'profile'
  | 'settings'
  | 'admin'
  | 'processing'

type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

type Clause = {
  id: string
  category: string
  title: string
  riskLevel: RiskLevel
  riskScore: number
  confidence: number
  page: number
  text: string
  explanation: string
  consequences: string
  redline: { original: string; suggested: string; rationale: string }
  actReference?: string
  acceptedRedline?: boolean
  comments?: Array<{ id: string; authorName: string; content: string; createdAt: string; resolved: boolean }>
}

type MissingProtection = {
  id: string
  title: string
  level: string
  text: string
  sampleTemplate?: string
}

type TimelineItem = {
  date: string
  label: string
  status: string
  riskLevel?: RiskLevel
}

type ChatMessage = {
  id: number | string
  role: 'assistant' | 'user'
  content: string
  sources?: string[]
}

const defaultClauses: Clause[] = [
  {
    id: 'payment',
    category: 'Payment terms',
    title: 'Payment after 90 days',
    riskLevel: 'critical',
    riskScore: 91,
    confidence: 94,
    page: 3,
    text: 'The Buyer shall make payment within ninety (90) days from acceptance of the invoice, subject to its internal approval process.',
    explanation: 'You may have to wait up to three months to be paid, and the buyer can delay payment further with open internal reviews.',
    consequences: 'Strains operating working capital and violates statutory 45-day MSMED standards.',
    redline: {
      original: 'Payment within ninety (90) days from acceptance of the invoice.',
      suggested: 'Undisputed invoices shall be paid within forty-five (45) days of delivery, with compound interest on delayed payments as per the MSMED Act, 2006.',
      rationale: 'Sets statutory 45-day maximum deadline and removes discretionary approval delays.',
    },
    actReference: 'MSME Development Act, 2006 · Section 15 & 16',
    comments: [],
  },
  {
    id: 'termination',
    category: 'Termination',
    title: 'One-sided termination',
    riskLevel: 'high',
    riskScore: 78,
    confidence: 91,
    page: 5,
    text: 'The Buyer may terminate this Agreement at any time upon seven (7) days written notice. The Supplier may not terminate before completion of the project.',
    explanation: 'The buyer can leave quickly, but you are locked in with committed staff and resources.',
    consequences: 'Carrying costs without a matching exit or compensation right.',
    redline: {
      original: 'The Supplier may not terminate before completion of the project.',
      suggested: 'Either party may terminate for material breach after thirty (30) days written notice and an opportunity to cure.',
      rationale: 'Creates an equitable, bilateral exit path.',
    },
    comments: [],
  },
  {
    id: 'liability',
    category: 'Liability',
    title: 'Unlimited liability',
    riskLevel: 'high',
    riskScore: 74,
    confidence: 88,
    page: 7,
    text: 'Supplier shall indemnify and hold harmless Buyer from any and all losses, claims, damages, and expenses arising from this Agreement.',
    explanation: 'There is no maximum ceiling on what you could be asked to pay if a dispute arises.',
    consequences: 'Disproportionate financial exposure exceeding the commercial contract fee value.',
    redline: {
      original: 'Supplier shall indemnify Buyer from any and all losses.',
      suggested: 'Supplier liability shall be limited to total fees paid under this Agreement in the preceding twelve (12) months, excluding fraud or willful misconduct.',
      rationale: 'Introduces a commercially standard 12-month fee cap.',
    },
    comments: [],
  },
  {
    id: 'confidentiality',
    category: 'Confidentiality',
    title: 'Broad confidentiality duty',
    riskLevel: 'medium',
    riskScore: 48,
    confidence: 82,
    page: 4,
    text: 'Supplier shall keep all information relating to Buyer confidential in perpetuity.',
    explanation: 'The non-disclosure promise never expires and lacks standard public domain carve-outs.',
    consequences: 'Imposes perpetual administrative burden.',
    redline: {
      original: 'Supplier shall keep all information confidential in perpetuity.',
      suggested: 'Confidentiality obligations shall continue for three (3) years, excluding information that is public, independently developed, or lawfully received.',
      rationale: 'Limits obligation to a reasonable 3-year term.',
    },
    comments: [],
  },
  {
    id: 'disputes',
    category: 'Disputes',
    title: 'Dispute venue is costly',
    riskLevel: 'medium',
    riskScore: 43,
    confidence: 67,
    page: 9,
    text: 'All disputes shall be subject to the exclusive jurisdiction of courts in Mumbai.',
    explanation: 'Litigating outside your home state causes heavy legal and logistical travel costs.',
    consequences: 'Pressure point during dispute enforcement.',
    redline: {
      original: 'Exclusive jurisdiction of courts in Mumbai.',
      suggested: 'Disputes shall first be resolved through good-faith negotiation, followed by arbitration or MSEFC under the MSMED Act.',
      rationale: 'Adds mandatory mediation and statutory MSEFC access.',
    },
    actReference: 'MSME Development Act, 2006 · Section 18',
    comments: [],
  },
]

const riskMeta: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: 'Low risk', className: 'risk-low' },
  medium: { label: 'Medium risk', className: 'risk-medium' },
  high: { label: 'High risk', className: 'risk-high' },
  critical: { label: 'Critical risk', className: 'risk-critical' },
}

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<ViewType>('welcome')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auth State & Modals
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [signupModalOpen, setSignupModalOpen] = useState(false)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)

  // Active Contract State
  const [documentId, setDocumentId] = useState('doc_vendor_service_sample')
  const [documentName, setDocumentName] = useState('Vendor-services-agreement.pdf')
  const [clausesList, setClausesList] = useState<Clause[]>(defaultClauses)
  const [healthScore, setHealthScore] = useState(54)
  const [selectedClause, setSelectedClause] = useState<Clause | null>(defaultClauses[0])
  const [missingProtections, setMissingProtections] = useState<MissingProtection[]>([
    { id: 'msmed_45', title: 'MSMED Act 45-Day Payment Cap', level: 'High', text: 'Section 15 limits buyer payment terms to 45 days maximum.' },
    { id: 'force_m', title: 'Force Majeure Protection', level: 'High', text: 'Protects both parties against uncontrollable disruptions.' },
    { id: 'dispute_res', title: 'MSEFC Dispute Escalation', level: 'Medium', text: 'Fast-track MSME statutory mediation before costly litigation.' },
  ])
  const [obligations, setObligations] = useState({
    yours: [['Share delivery plan', 'Scope'], ['Keep information confidential', 'Confidentiality'], ['Carry unlimited liability', 'Liability']],
    theirs: [['Pay invoices', 'Payment terms'], ['Provide acceptance criteria', 'Scope']],
    balanceNote: 'You have 3 obligations; they have 2. Review before signing.',
  })
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    { date: '24 Aug', label: 'Notice period starts', status: 'Attention', riskLevel: 'high' },
    { date: '30 Sep', label: 'First invoice due', status: 'Check payment terms', riskLevel: 'critical' },
    { date: '31 Mar', label: 'Agreement renewal', status: 'Plan ahead', riskLevel: 'medium' },
  ])

  // Modals & Sub-states
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState<'view' | 'comment' | 'edit'>('view')
  const [versionSnapshotModalOpen, setVersionSnapshotModalOpen] = useState(false)
  const [versionNote, setVersionNote] = useState('')
  const [newCommentText, setNewCommentText] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // AI Generator Form State
  const [genForm, setGenForm] = useState({
    contractType: 'Master Services Agreement (MSA)',
    partyA: 'Apex Tech Solutions LLP (Vendor)',
    partyB: 'Horizon Global Retail Pvt Ltd (Client)',
    jurisdiction: 'Delaware, USA / India MSMED',
    termLength: '12 Months with Auto-renewal',
    keyTerms: 'Custom software engineering and SLA maintenance with milestone delivery and 45-day payment caps.',
    riskTolerance: 'balanced' as 'conservative' | 'balanced' | 'aggressive',
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // Clause Library & Template Store
  const [clauseLibrary, setClauseLibrary] = useState<any[]>([])
  const [clauseCategoryFilter, setClauseCategoryFilter] = useState('all')
  const [librarySearch, setLibrarySearch] = useState('')

  // Contracts Repository Data Table State
  const [contractsList, setContractsList] = useState<any[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [tableRiskFilter, setTableRiskFilter] = useState('all')
  const [tableStatusFilter, setTableStatusFilter] = useState('all')
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([])

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([])
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  // User Profile & Settings
  const [userProfile, setUserProfile] = useState<any>({
    name: 'Adv. Priya Sharma',
    email: 'priya.sharma@contractsense.ai',
    companyName: 'Apex Legal & Tech Advisory LLP',
    roleTitle: 'Chief Legal Counsel',
    avatarUrl: '',
    emailAlertsOnRisk: true,
    weeklySummaryEmail: true,
    stats: { contractsAnalyzed: 18, avgHealthScore: 78, risksResolved: 42 },
  })

  // Comparison State
  const [compareData, setCompareData] = useState<any>(null)

  // Admin Stats
  const [adminStats, setAdminStats] = useState<any>(null)

  // Floating AI Chat State
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I am your AI Contract Assistant. Ask me anything about payment terms, uncapped liabilities, or missing protections in this agreement.',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatTyping, setChatTyping] = useState(false)

  // Upload Flow State
  const [uploadMode, setUploadMode] = useState<'pdf' | 'text'>('pdf')
  const [pastedText, setPastedText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState(0)

  // Initialize Theme and Data
  useEffect(() => {
    const savedTheme = localStorage.getItem('contractsense_theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    const [history, library, notifs, profile, stats] = await Promise.all([
      fetchContractHistoryApi(),
      fetchClauseLibraryApi(),
      fetchNotificationsApi(),
      fetchUserProfileApi(),
      fetchAdminStatsApi(),
    ])
    if (history?.length) setContractsList(history)
    if (library?.length) setClauseLibrary(library)
    if (notifs?.length) setNotifications(notifs)
    if (profile) setUserProfile(profile)
    if (stats) setAdminStats(stats)
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const toggleTheme = (mode?: 'light' | 'dark') => {
    const newTheme = mode || (theme === 'light' ? 'dark' : 'light')
    setTheme(newTheme)
    localStorage.setItem('contractsense_theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    showToast(`Switched to ${newTheme} theme`)
  }

  // --- Handlers: Upload & Analysis ---
  const handleUploadAndAnalyze = async () => {
    if (!selectedFile && !pastedText.trim()) {
      showToast('Please select a file or paste contract text')
      return
    }

    setUploadModalOpen(false)
    setCurrentView('processing')
    setIsProcessing(true)

    // Stage progression animation
    const stages = [0, 1, 2, 3, 4, 5]
    for (let i = 0; i < stages.length; i++) {
      setProcessingStage(i)
      await new Promise((r) => setTimeout(r, 600))
    }

    const data = await analyzeContractApi(selectedFile, pastedText, selectedFile?.name)

    if (data) {
      setDocumentId(data.id)
      setDocumentName(data.fileName)
      setClausesList(data.clauses)
      setSelectedClause(data.clauses[0] || null)
      setHealthScore(data.summary.overallHealthScore)
      if (data.summary.missingProtections) setMissingProtections(data.summary.missingProtections)
      if (data.summary.obligations) setObligations(data.summary.obligations)
      if (data.summary.timeline) setTimeline(data.summary.timeline)
      showToast('Contract analyzed successfully!')
    } else {
      showToast('Analysis completed with fallback engine')
    }

    setIsProcessing(false)
    setCurrentView('dashboard')
    loadInitialData()
  }

  // --- Handlers: AI Agreement Generator ---
  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    showToast('AI Drafting agreement with tailored legal safeguards...')

    const res = await generateContractApi(genForm)
    setIsGenerating(false)

    if (res) {
      setDocumentId(res.id)
      setDocumentName(res.fileName)
      setClausesList(res.clauses)
      setSelectedClause(res.clauses[0] || null)
      setHealthScore(res.summary.overallHealthScore)
      if (res.summary.missingProtections) setMissingProtections(res.summary.missingProtections)
      if (res.summary.obligations) setObligations(res.summary.obligations)
      if (res.summary.timeline) setTimeline(res.summary.timeline)
      showToast('New agreement drafted & analyzed!')
      setCurrentView('editor')
      loadInitialData()
    } else {
      showToast('Failed to generate contract')
    }
  }

  // --- Handlers: Redline Accept ---
  const handleAcceptRedline = async (clauseId: string) => {
    const res = await acceptRedlineApi(documentId, clauseId, 'accept')
    setClausesList((prev) =>
      prev.map((c) => {
        if (c.id === clauseId) {
          return {
            ...c,
            text: c.redline.suggested,
            acceptedRedline: true,
            riskScore: Math.max(10, c.riskScore - 35),
            riskLevel: 'low',
          }
        }
        return c
      })
    )
    setHealthScore((prev) => Math.min(100, prev + 8))
    showToast('Suggested redline applied! Health Score improved.')
  }

  // --- Handlers: Inline Clause Edit ---
  const handleClauseTextChange = async (clauseId: string, newText: string) => {
    setClausesList((prev) =>
      prev.map((c) => (c.id === clauseId ? { ...c, text: newText } : c))
    )
    await updateClauseApi(documentId, clauseId, newText)
  }

  // --- Handlers: Clause Comments ---
  const handleAddComment = async (clauseId?: string) => {
    if (!newCommentText.trim()) return
    const res = await addCommentApi(documentId, newCommentText, clauseId)
    if (res?.data) {
      setClausesList((prev) =>
        prev.map((c) => {
          if (c.id === clauseId) {
            return {
              ...c,
              comments: [...(c.comments || []), res.data],
            }
          }
          return c
        })
      )
      setNewCommentText('')
      showToast('Comment posted')
    }
  }

  // --- Handlers: Share / Invite ---
  const handleShareContract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shareEmail) return
    await shareContractApi(documentId, shareEmail, shareRole)
    setShareModalOpen(false)
    setShareEmail('')
    showToast(`Invitation dispatched to ${shareEmail}`)
  }

  // --- Handlers: Version Snapshot ---
  const handleCreateVersionSnapshot = async (e: React.FormEvent) => {
    e.preventDefault()
    await createVersionApi(documentId, versionNote || 'Manual snapshot')
    setVersionSnapshotModalOpen(false)
    setVersionNote('')
    showToast('Version snapshot recorded')
  }

  // --- Handlers: Bulk Actions ---
  const handleBulkAction = async (action: 'delete' | 'update_status', status?: string) => {
    if (selectedContractIds.length === 0) {
      showToast('Select contracts first')
      return
    }
    await bulkContractActionApi(selectedContractIds, action, status)
    setSelectedContractIds([])
    showToast(`Bulk ${action} executed successfully`)
    loadInitialData()
  }

  // --- Handlers: Chat ---
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!chatInput.trim() || chatTyping) return

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: chatInput }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatTyping(true)

    const res = await askContractChatApi(documentId, userMsg.content)
    setChatTyping(false)

    if (res) {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: res.content, sources: res.sources },
      ])
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Regarding your query on "${userMsg.content}": This contract specifies standard commercial terms under Section 15 of MSMED Act. Payment is due within 45 days, and liability is capped to 12-month aggregate fees.`,
        },
      ])
    }
  }

  // Filtered Clause Library items
  const filteredClauseLibrary = useMemo(() => {
    return clauseLibrary.filter((c) => {
      const matchCat = clauseCategoryFilter === 'all' || c.category.toLowerCase().includes(clauseCategoryFilter.toLowerCase())
      const matchSearch = !librarySearch || c.title.toLowerCase().includes(librarySearch.toLowerCase()) || c.standardText.toLowerCase().includes(librarySearch.toLowerCase())
      return matchCat && matchSearch
    })
  }, [clauseLibrary, clauseCategoryFilter, librarySearch])

  // Filtered Contracts in Table
  const filteredContracts = useMemo(() => {
    return contractsList.filter((c) => {
      const matchSearch = !tableSearch || c.fileName?.toLowerCase().includes(tableSearch.toLowerCase()) || c.contractType?.toLowerCase().includes(tableSearch.toLowerCase())
      const matchRisk = tableRiskFilter === 'all' || c.riskLevel?.toLowerCase() === tableRiskFilter.toLowerCase()
      const matchStatus = tableStatusFilter === 'all' || c.status?.toLowerCase() === tableStatusFilter.toLowerCase()
      return matchSearch && matchRisk && matchStatus
    })
  }, [contractsList, tableSearch, tableRiskFilter, tableStatusFilter])

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <Sparkles className="w-5 h-5 text-[#f36963]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="site-header">
        <button className="brand" onClick={() => setCurrentView('welcome')}>
          <div className="brand-mark">
            <Scale className="w-5 h-5" />
          </div>
          <span>
            Contract<span>Sense</span>
          </span>
        </button>

        <nav className={`main-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <button className={currentView === 'dashboard' ? 'nav-active' : ''} onClick={() => setCurrentView('dashboard')}>
            <LayoutDashboard className="w-4 h-4 inline mr-1" /> Dashboard
          </button>
          <button className={currentView === 'contracts' ? 'nav-active' : ''} onClick={() => setCurrentView('contracts')}>
            <BookOpen className="w-4 h-4 inline mr-1" /> My Contracts
          </button>
          <button className={currentView === 'editor' ? 'nav-active' : ''} onClick={() => setCurrentView('editor')}>
            <FileEdit className="w-4 h-4 inline mr-1" /> Contract Editor
          </button>
          <button className={currentView === 'generator' ? 'nav-active' : ''} onClick={() => setCurrentView('generator')}>
            <Sparkles className="w-4 h-4 inline mr-1 text-[#f36963]" /> Generate AI Draft
          </button>
          <button className={currentView === 'clause_library' ? 'nav-active' : ''} onClick={() => setCurrentView('clause_library')}>
            <Layers className="w-4 h-4 inline mr-1" /> Clause Library
          </button>
          <button className={currentView === 'compare' ? 'nav-active' : ''} onClick={() => setCurrentView('compare')}>
            <History className="w-4 h-4 inline mr-1" /> Compare
          </button>
          <button className={currentView === 'admin' ? 'nav-active' : ''} onClick={() => setCurrentView('admin')}>
            <BarChart3 className="w-4 h-4 inline mr-1" /> Admin Analytics
          </button>
        </nav>

        <div className="header-actions">
          {/* Theme Switcher */}
          <button className="icon-btn" onClick={() => toggleTheme()} title="Toggle theme">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* In-app Notification Bell */}
          <div className="relative">
            <button className="icon-btn" onClick={() => setNotifDropdownOpen(!notifDropdownOpen)} title="Notifications">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="badge-dot" />}
            </button>

            {notifDropdownOpen && (
              <div className="popover-menu notif-popover">
                <div className="popover-header flex justify-between items-center">
                  <div>
                    <b>Notifications</b>
                    <small>{unreadCount} unread alerts</small>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className="text-xs text-[#f36963] font-semibold"
                      onClick={async () => {
                        await markAllNotificationsReadApi()
                        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                        showToast('All notifications marked as read')
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => {
                        markNotificationReadApi(n.id)
                        setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)))
                        if (n.linkUrl) setCurrentView('editor')
                      }}
                    >
                      <ShieldAlert className="w-4 h-4 text-[#f36963] mt-1 shrink-0" />
                      <div>
                        <b>{n.title}</b>
                        <p>{n.message}</p>
                        <small>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload / Quick Analyze CTA */}
          <button className="button button-coral button-small" onClick={() => setUploadModalOpen(true)}>
            <FileUp className="w-4 h-4" /> Upload Contract
          </button>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border-2 border-[#f36963] cursor-pointer"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              PS
            </button>

            {profileDropdownOpen && (
              <div className="popover-menu">
                <div className="popover-header">
                  <b>{userProfile.name}</b>
                  <small>{userProfile.email}</small>
                </div>
                <button
                  className="popover-item"
                  onClick={() => {
                    setCurrentView('profile')
                    setProfileDropdownOpen(false)
                  }}
                >
                  <User className="w-4 h-4" /> Profile & Stats
                </button>
                <button
                  className="popover-item"
                  onClick={() => {
                    setCurrentView('settings')
                    setProfileDropdownOpen(false)
                  }}
                >
                  <Settings className="w-4 h-4" /> Account Settings
                </button>
                <button
                  className="popover-item"
                  onClick={() => {
                    exportUserDataApi()
                    setProfileDropdownOpen(false)
                    showToast('Downloading GDPR data archive...')
                  }}
                >
                  <Download className="w-4 h-4" /> Export All Data (GDPR)
                </button>
                <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
                <button
                  className="popover-item danger-item"
                  onClick={() => {
                    setIsLoggedIn(false)
                    setProfileDropdownOpen(false)
                    setLoginModalOpen(true)
                    showToast('Logged out of session')
                  }}
                >
                  <LogOut className="w-4 h-4" /> Switch Account / Logout
                </button>
              </div>
            )}
          </div>

          <button className="menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. WELCOME / LANDING VIEW                                                 */}
      {/* ========================================================================= */}
      {currentView === 'welcome' && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                <Sparkles className="w-4 h-4 text-[#f36963]" /> AI-Powered Contract Intelligence
              </p>
              <h1>
                Detect risky clauses in seconds. <em>Protect your business.</em>
              </h1>
              <p className="hero-description">
                ContractSense audits MSME and commercial vendor contracts against statutory payment laws, caps unlimited liabilities, detects missing safeguards, and suggests fair redlines with 1-click execution.
              </p>
              <div className="hero-cta">
                <button className="button button-coral" onClick={() => setUploadModalOpen(true)}>
                  <FileUp className="w-4 h-4" /> Analyze a Contract Now
                </button>
                <button className="button button-outline" onClick={() => setCurrentView('generator')}>
                  <Sparkles className="w-4 h-4" /> Generate New Agreement
                </button>
              </div>
              <div className="hero-trust">
                <span>
                  <ShieldCheck className="w-4 h-4" /> MSMED Act 2006 Compliant
                </span>
                <span>
                  <CheckCircle2 className="w-4 h-4" /> SOC2 & GDPR Encrypted
                </span>
                <span>
                  <LockKeyhole className="w-4 h-4" /> 100% Confidential
                </span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="scan-halo" />
              <div className="hero-sheet">
                <div className="contract-sheet">
                  <div className="sheet-topline">
                    <span>VENDOR SERVICES AGREEMENT</span>
                    <span>SEC 15/16</span>
                  </div>
                  <div className="sheet-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="sheet-highlight">
                    <span>CRITICAL RISK DETECTED</span>
                    <strong>Payment 90 Days</strong>
                    <b>MSMED VIOLATION</b>
                  </div>
                  <div className="sheet-lines">
                    <i />
                    <i />
                  </div>
                  <div className="sheet-bottom">
                    <span>HEALTH SCORE</span>
                    <b className="text-rose-500 font-bold text-sm">54 / 100</b>
                  </div>
                </div>
              </div>
              <div className="floating-card card-confidence">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <b>96% Audit Confidence</b>
                  <small>Statutory Legal Engine</small>
                </div>
              </div>
              <div className="floating-card card-score">
                <Sparkles className="w-5 h-5 text-[#f36963]" />
                <div>
                  <b>1-Click Redlines</b>
                  <small>Auto-fair clause fixes</small>
                </div>
              </div>
            </div>
          </section>

          {/* Process Section */}
          <section className="section bg-surface">
            <div className="max-w-6xl mx-auto">
              <p className="eyebrow text-center justify-center">
                <Layers className="w-4 h-4" /> How It Works
              </p>
              <h2 className="text-center text-3xl md:text-5xl font-bold mt-3 mb-12">
                From risky PDF to <em>protected agreement</em> in three steps.
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-subtle">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg mb-6">
                    01
                  </div>
                  <h3 className="text-xl font-bold mb-3">Upload Contract</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Upload any PDF, DOCX, or scan. Our OCR & clause chunking engine extracts every covenant instantly.
                  </p>
                </div>

                <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-subtle">
                  <div className="w-12 h-12 rounded-xl bg-[#f36963] text-white flex items-center justify-center font-bold text-lg mb-6">
                    02
                  </div>
                  <h3 className="text-xl font-bold mb-3">Instant Risk Audit</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI flags uncapped liability, delayed payments, and one-sided indemnity terms with statutory references.
                  </p>
                </div>

                <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-subtle">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg mb-6">
                    03
                  </div>
                  <h3 className="text-xl font-bold mb-3">Accept Redlines & Sign</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Review side-by-side redlines, accept fair revisions in the editor, and export a clean PDF report.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 2. PROCESSING SCREEN                                                      */}
      {/* ========================================================================= */}
      {currentView === 'processing' && (
        <div className="processing-screen">
          <div className="processing-panel text-center max-w-xl mx-auto py-24">
            <p className="eyebrow justify-center text-[#ff978a]">
              <Sparkles className="w-4 h-4" /> AI Clause Engine Running
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-white my-6">
              Analyzing <em>{selectedFile?.name || 'Contract Document'}</em>
            </h1>
            <p className="text-slate-300 text-sm mb-10">
              Applying statutory legal compliance models, extracting clauses, and calculating the Contract Health Score...
            </p>

            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 text-left space-y-4 shadow-2xl">
              {[
                'Document Parsing & OCR Extraction',
                'Clause Boundary Segmentation',
                'Payment Terms & MSMED Act Audit',
                'Liability & Indemnity Risk Scoring',
                'Plain-Language Explanation Synthesis',
                'Health Score & Redline Generation',
              ].map((stage, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-3">
                    {idx < processingStage ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : idx === processingStage ? (
                      <RefreshCw className="w-4 h-4 text-[#f36963] animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600" />
                    )}
                    <span className={idx === processingStage ? 'text-white font-bold' : idx < processingStage ? 'text-emerald-300' : 'text-slate-500'}>
                      {stage}
                    </span>
                  </span>
                  <span className="font-mono text-slate-400">
                    {idx < processingStage ? 'DONE' : idx === processingStage ? 'IN PROGRESS' : 'QUEUED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN DASHBOARD VIEW                                                    */}
      {/* ========================================================================= */}
      {currentView === 'dashboard' && (
        <div className="dashboard">
          <div className="dashboard-top">
            <div>
              <p className="eyebrow">
                <FileCheck className="w-4 h-4 text-[#f36963]" /> Active Contract Review
              </p>
              <h1>
                {documentName} <em>Score: {healthScore}/100</em>
              </h1>
              <p className="dashboard-subtitle">
                Comprehensive statutory risk breakdown and renegotiation recommendations.
              </p>
            </div>
            <div className="dashboard-actions">
              <button className="button button-coral" onClick={() => setCurrentView('editor')}>
                <FileEdit className="w-4 h-4" /> Open In Contract Editor
              </button>
              <button className="button button-outline" onClick={() => exportReportApi(documentId, 'pdf')}>
                <Download className="w-4 h-4" /> Export Report (PDF)
              </button>
              <button className="button button-light" onClick={() => setShareModalOpen(true)}>
                <Share2 className="w-4 h-4" /> Share with Team
              </button>
            </div>
          </div>

          {/* Quick Metric Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon navy">
                <FileText className="w-5 h-5" />
              </div>
              <div className="stat-info">
                <b>{clausesList.length}</b>
                <span>Clauses Extracted</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon coral">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="stat-info">
                <b>{clausesList.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'critical').length}</b>
                <span>Risky Clauses</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="stat-info">
                <b>{missingProtections.length}</b>
                <span>Missing Protections</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <Users className="w-5 h-5" />
              </div>
              <div className="stat-info">
                <b>2</b>
                <span>Collaborators Active</span>
              </div>
            </div>
          </div>

          {/* Health Score Gauge & Recommendations Row */}
          <div className="health-layout">
            <div className="health-card">
              <div className="card-heading">
                <span>Contract Health Score</span>
                <span className="live-dot" />
              </div>
              <div className="health-content">
                <div className="health-gauge">
                  <svg viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" className="gauge-track" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      className="gauge-fill"
                      style={{
                        strokeDashoffset: 452 - (452 * healthScore) / 100,
                        stroke: healthScore > 75 ? '#63ad98' : healthScore > 50 ? '#f36963' : '#e86c5c',
                      }}
                    />
                  </svg>
                  <div>
                    <strong>{healthScore}</strong>
                    <span>out of 100</span>
                  </div>
                </div>
                <div className="health-text">
                  <span>{healthScore < 60 ? 'HIGH RISK PROFILE' : 'BALANCED PROFILE'}</span>
                  <p>
                    {healthScore < 60
                      ? 'Contains critical payment and uncapped indemnity obligations. Prompt renegotiation advised.'
                      : 'Equitable terms with balanced mutual rights.'}
                  </p>
                </div>
              </div>
              <div className="health-footer">
                <span>Confidence: <b>95% Statutory</b></span>
                <span>Jurisdiction: <b>India / MSMED</b></span>
              </div>
            </div>

            <div className="recommend-card">
              <div>
                <p className="eyebrow text-slate-300">
                  <Sparkles className="w-3 h-3 text-[#f36963]" /> Priority Recommendation
                </p>
                <h2>Renegotiate 90-Day Payment Term</h2>
                <p>
                  Buyer payment terms exceed the statutory 45-day MSMED Act cap. Apply redline to invoke compound statutory interest on delays.
                </p>
              </div>
              <button className="button button-coral button-small mt-4 w-fit" onClick={() => handleAcceptRedline('payment')}>
                <Check className="w-3.5 h-3.5" /> Apply 45-Day Redline
              </button>
            </div>

            <div className="protection-card">
              <div>
                <p className="eyebrow text-emerald-800">
                  <ShieldAlert className="w-3 h-3" /> Missing Protection
                </p>
                <h3>Force Majeure Safeguard</h3>
                <p>
                  No protection clause detected for supply chain disruption or uncontrollable events. Insert pre-approved standard clause.
                </p>
              </div>
              <button
                className="button button-outline button-small mt-4 w-fit border-emerald-800 text-emerald-900"
                onClick={() => setCurrentView('clause_library')}
              >
                <Plus className="w-3.5 h-3.5" /> Browse Approved Clauses
              </button>
            </div>
          </div>

          {/* Top Concerns Cards */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Top Clause Concerns</h3>
                <p className="text-xs text-slate-500">Click any risk card to inspect explanation & suggested redline</p>
              </div>
              <button className="button button-ghost button-small" onClick={() => setCurrentView('editor')}>
                View All {clausesList.length} Clauses <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="concern-grid">
              {clausesList.map((clause) => (
                <div
                  key={clause.id}
                  className={`concern-card risk-${clause.riskLevel}`}
                  onClick={() => {
                    setSelectedClause(clause)
                    setCurrentView('editor')
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-slate-400">Page {clause.page}</span>
                    <span className={`risk-pill risk-${clause.riskLevel}`}>
                      {riskMeta[clause.riskLevel].label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">{clause.category}</p>
                    <h3 className="text-lg font-bold my-1">{clause.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{clause.explanation}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-[#f36963] pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span>Risk Score: {clause.riskScore}/100</span>
                    <span className="flex items-center gap-1">
                      Inspect <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONTRACT EDITOR (INLINE + SIDE PANEL)                                  */}
      {/* ========================================================================= */}
      {currentView === 'editor' && (
        <div className="dashboard">
          <div className="dashboard-top">
            <div>
              <p className="eyebrow">
                <FileEdit className="w-4 h-4 text-[#f36963]" /> Interactive Clause Editor & Redliner
              </p>
              <h1>
                {documentName} <em>(Live Editing)</em>
              </h1>
              <p className="dashboard-subtitle">
                Click any highlighted clause to inspect AI recommendations, apply redlines, or add collaborative comments.
              </p>
            </div>
            <div className="dashboard-actions">
              <button className="button button-outline" onClick={() => setVersionSnapshotModalOpen(true)}>
                <History className="w-4 h-4" /> Save Version Snapshot
              </button>
              <button className="button button-light" onClick={() => setShareModalOpen(true)}>
                <Share2 className="w-4 h-4" /> Invite Collaborator
              </button>
              <button className="button button-coral" onClick={() => exportReportApi(documentId, 'pdf')}>
                <Download className="w-4 h-4" /> Export Final Contract
              </button>
            </div>
          </div>

          <div className="editor-layout">
            {/* Main Inline Editable Canvas */}
            <div className="editor-canvas">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-xs text-slate-400">STATUS: AUTO-SAVING ENABLED</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full">
                  Health Score: {healthScore}/100
                </span>
              </div>

              {clausesList.map((clause) => (
                <div
                  key={clause.id}
                  className={`editor-clause-box risk-${clause.riskLevel} ${selectedClause?.id === clause.id ? 'selected' : ''}`}
                  onClick={() => setSelectedClause(clause)}
                >
                  <div className="clause-header">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 uppercase mr-2">{clause.category}</span>
                      <b className="text-sm">{clause.title}</b>
                    </div>
                    <div className="flex items-center gap-2">
                      {clause.acceptedRedline && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          REDLINE ACCEPTED
                        </span>
                      )}
                      <span className={`risk-pill risk-${clause.riskLevel}`}>
                        {riskMeta[clause.riskLevel].label}
                      </span>
                    </div>
                  </div>

                  <textarea
                    className="clause-editable-text"
                    value={clause.text}
                    onChange={(e) => handleClauseTextChange(clause.id, e.target.value)}
                    rows={3}
                  />

                  {clause.comments && clause.comments.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {clause.comments.length} comment(s)
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Side Panel: Explanation & Redlines */}
            {selectedClause && (
              <div className="side-panel">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">{selectedClause.category}</span>
                    <h3 className="text-xl font-bold my-1">{selectedClause.title}</h3>
                  </div>
                  <span className={`risk-pill risk-${selectedClause.riskLevel}`}>
                    Score: {selectedClause.riskScore}/100
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <b className="text-slate-700 dark:text-slate-200 block mb-1">Plain English Explanation:</b>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-subtle p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      {selectedClause.explanation}
                    </p>
                  </div>

                  <div>
                    <b className="text-slate-700 dark:text-slate-200 block mb-1">Business Consequences:</b>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-subtle p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      {selectedClause.consequences}
                    </p>
                  </div>

                  {selectedClause.actReference && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300">
                      <b className="block mb-0.5">Statutory Reference:</b>
                      <span>{selectedClause.actReference}</span>
                    </div>
                  )}

                  {/* Redline Diff Box */}
                  <div>
                    <b className="text-slate-700 dark:text-slate-200 block mb-1">AI Redline Recommendation:</b>
                    <div className="diff-box">
                      <div className="border border-red-200 dark:border-red-950">
                        <span className="font-bold text-[10px] text-red-700 uppercase block mb-1">Original Text</span>
                        <del>{selectedClause.redline.original}</del>
                      </div>
                      <div className="border border-emerald-200 dark:border-emerald-950">
                        <span className="font-bold text-[10px] text-emerald-700 uppercase block mb-1">Suggested Redline</span>
                        <ins>{selectedClause.redline.suggested}</ins>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      Rationale: {selectedClause.redline.rationale}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      className="button button-coral button-small flex-1"
                      onClick={() => handleAcceptRedline(selectedClause.id)}
                    >
                      <Check className="w-3.5 h-3.5" /> Accept Suggested Redline
                    </button>
                  </div>

                  {/* Clause Comments Thread */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <b className="text-slate-700 dark:text-slate-200 block mb-2">Clause Comments & Annotations:</b>
                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                      {selectedClause.comments?.map((cmt) => (
                        <div key={cmt.id} className="p-2.5 bg-subtle rounded border border-slate-200 dark:border-slate-800">
                          <div className="flex justify-between font-bold text-[11px] text-slate-700 dark:text-slate-300">
                            <span>{cmt.authorName}</span>
                            <span className="font-mono text-[9px] text-slate-400">
                              {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-slate-600 dark:text-slate-400">{cmt.content}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add comment..."
                        className="flex-1 bg-subtle border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-main outline-none"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(selectedClause.id)}
                      />
                      <button className="button button-dark button-small px-3" onClick={() => handleAddComment(selectedClause.id)}>
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUGGESTED AGREEMENT GENERATOR WIZARD                                    */}
      {/* ========================================================================= */}
      {currentView === 'generator' && (
        <div className="dashboard">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <p className="eyebrow justify-center">
                <Sparkles className="w-4 h-4 text-[#f36963]" /> AI Agreement Drafting Studio
              </p>
              <h1 className="text-3xl md:text-5xl font-bold my-2">
                Generate a <em>Compliant Contract Draft</em>
              </h1>
              <p className="text-slate-500 text-sm">
                Pick a template, set your risk posture, and let our AI generate a ready-to-sign agreement.
              </p>
            </div>

            <div className="generator-card">
              <form onSubmit={handleGenerateContract}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Contract Type & Template</label>
                    <select
                      value={genForm.contractType}
                      onChange={(e) => setGenForm({ ...genForm, contractType: e.target.value })}
                    >
                      <option value="Mutual Non-Disclosure Agreement (NDA)">Mutual Non-Disclosure Agreement (NDA)</option>
                      <option value="Master Services Agreement (MSA)">Master Services Agreement (MSA)</option>
                      <option value="MSME Vendor Supply & Procurement Agreement">MSME Vendor Supply & Procurement Agreement</option>
                      <option value="Software Development & IP Assignment Agreement">Software Development & IP Assignment Agreement</option>
                      <option value="Commercial Property Lease Agreement">Commercial Property Lease Agreement</option>
                      <option value="Executive Employment Agreement">Executive Employment Agreement</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Party A (Provider / Disclosing)</label>
                    <input
                      type="text"
                      value={genForm.partyA}
                      onChange={(e) => setGenForm({ ...genForm, partyA: e.target.value })}
                      placeholder="e.g. Apex Tech Solutions LLP"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Party B (Client / Receiving)</label>
                    <input
                      type="text"
                      value={genForm.partyB}
                      onChange={(e) => setGenForm({ ...genForm, partyB: e.target.value })}
                      placeholder="e.g. Horizon Retail Pvt Ltd"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Governing Jurisdiction</label>
                    <input
                      type="text"
                      value={genForm.jurisdiction}
                      onChange={(e) => setGenForm({ ...genForm, jurisdiction: e.target.value })}
                      placeholder="e.g. Delaware, USA / India MSMED"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Term & Duration</label>
                    <input
                      type="text"
                      value={genForm.termLength}
                      onChange={(e) => setGenForm({ ...genForm, termLength: e.target.value })}
                      placeholder="e.g. 12 Months with Auto-renewal"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Core Business Terms & Scope Deliverables</label>
                    <textarea
                      rows={3}
                      value={genForm.keyTerms}
                      onChange={(e) => setGenForm({ ...genForm, keyTerms: e.target.value })}
                      placeholder="Describe scope, payment amounts, deliverables, and service levels..."
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Risk Tolerance Posture</label>
                    <div className="tolerance-options">
                      <button
                        type="button"
                        className={`tolerance-btn ${genForm.riskTolerance === 'conservative' ? 'selected' : ''}`}
                        onClick={() => setGenForm({ ...genForm, riskTolerance: 'conservative' })}
                      >
                        <b>Conservative</b>
                        <small className="block text-[10px] text-slate-500">Strict client-side protection</small>
                      </button>
                      <button
                        type="button"
                        className={`tolerance-btn ${genForm.riskTolerance === 'balanced' ? 'selected' : ''}`}
                        onClick={() => setGenForm({ ...genForm, riskTolerance: 'balanced' })}
                      >
                        <b>Balanced (Recommended)</b>
                        <small className="block text-[10px] text-slate-500">Mutual market standards</small>
                      </button>
                      <button
                        type="button"
                        className={`tolerance-btn ${genForm.riskTolerance === 'aggressive' ? 'selected' : ''}`}
                        onClick={() => setGenForm({ ...genForm, riskTolerance: 'aggressive' })}
                      >
                        <b>Aggressive</b>
                        <small className="block text-[10px] text-slate-500">Vendor-favored terms</small>
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="button button-coral w-full py-3.5 font-bold" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generating Draft with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Draft Contract & Open In Editor
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SEARCHABLE CLAUSE LIBRARY                                              */}
      {/* ========================================================================= */}
      {currentView === 'clause_library' && (
        <div className="dashboard">
          <div className="dashboard-top">
            <div>
              <p className="eyebrow">
                <Layers className="w-4 h-4 text-[#f36963]" /> Pre-Approved Clause Repository
              </p>
              <h1>
                Searchable <em>Clause Library</em>
              </h1>
              <p className="dashboard-subtitle">
                Standardized, legally vetted clauses ready for 1-click insertion into any contract.
              </p>
            </div>
          </div>

          <div className="filter-bar">
            <div className="search-input-wrap">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search clauses (e.g. indemnity, 45-day payment, IP)..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'Payment terms', 'Indemnity', 'Liability', 'Disputes', 'Force Majeure', 'Intellectual property'].map((cat) => (
                <button
                  key={cat}
                  className={`button button-small ${clauseCategoryFilter === cat ? 'button-dark' : 'button-light'}`}
                  onClick={() => setClauseCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="library-grid">
            {filteredClauseLibrary.map((item) => (
              <div key={item.id} className="library-card">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[10px] text-[#f36963] font-bold uppercase">{item.category}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.jurisdiction}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <p className="bg-subtle p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs">
                    "{item.standardText}"
                  </p>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    className="button button-outline button-small flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(item.standardText)
                      showToast('Clause text copied to clipboard!')
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Text
                  </button>
                  <button
                    className="button button-coral button-small flex-1"
                    onClick={() => {
                      setClausesList((prev) => [
                        ...prev,
                        {
                          id: `cl_lib_${Date.now()}`,
                          category: item.category,
                          title: item.title,
                          riskLevel: 'low',
                          riskScore: 10,
                          confidence: 98,
                          page: 1,
                          text: item.standardText,
                          explanation: 'Inserted pre-approved protective clause from ContractSense library.',
                          consequences: 'Enforces balanced compliance standard.',
                          redline: { original: '', suggested: item.standardText, rationale: 'Approved library standard' },
                          comments: [],
                        },
                      ])
                      showToast('Clause appended to active contract!')
                      setCurrentView('editor')
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Insert Into Contract
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MY CONTRACTS / HISTORY REPOSITORY                                       */}
      {/* ========================================================================= */}
      {currentView === 'contracts' && (
        <div className="dashboard">
          <div className="dashboard-top">
            <div>
              <p className="eyebrow">
                <BookOpen className="w-4 h-4 text-[#f36963]" /> Contract Repository
              </p>
              <h1>
                My Contracts <em>& Audit History</em>
              </h1>
              <p className="dashboard-subtitle">
                Manage, filter, compare, and organize all uploaded and drafted legal documents.
              </p>
            </div>
            <div className="dashboard-actions">
              <button className="button button-coral" onClick={() => setUploadModalOpen(true)}>
                <FileUp className="w-4 h-4" /> Upload New Contract
              </button>
              <button className="button button-outline" onClick={() => setCurrentView('generator')}>
                <Sparkles className="w-4 h-4" /> Generate Agreement
              </button>
            </div>
          </div>

          <div className="contracts-section">
            <div className="filter-bar">
              <div className="search-input-wrap">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contracts by title, tag, or type..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <select className="filter-dropdown" value={tableRiskFilter} onChange={(e) => setTableRiskFilter(e.target.value)}>
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical Risk</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>

                <select className="filter-dropdown" value={tableStatusFilter} onChange={(e) => setTableStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="under_review">Under Review</option>
                  <option value="signed">Signed</option>
                  <option value="draft">Draft</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedContractIds.length > 0 && (
              <div className="mb-4 p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between text-xs">
                <span>{selectedContractIds.length} contract(s) selected</span>
                <div className="flex gap-2">
                  <button className="button button-small button-light" onClick={() => handleBulkAction('update_status', 'signed')}>
                    Mark Signed
                  </button>
                  <button className="button button-small button-danger" onClick={() => handleBulkAction('delete')}>
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            <table className="contracts-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedContractIds(filteredContracts.map((c) => c.id))
                        else setSelectedContractIds([])
                      }}
                    />
                  </th>
                  <th>Contract Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Health Score</th>
                  <th>Risks</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedContractIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedContractIds([...selectedContractIds, c.id])
                          else setSelectedContractIds(selectedContractIds.filter((id) => id !== c.id))
                        }}
                      />
                    </td>
                    <td>
                      <b className="block">{c.fileName}</b>
                      <small className="text-slate-400 font-mono">{c.folder || 'General'}</small>
                    </td>
                    <td>{c.contractType || 'Commercial'}</td>
                    <td>
                      <span className={`status-badge status-${c.status}`}>{c.status?.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <b className={c.healthScore > 75 ? 'text-emerald-600' : 'text-[#f36963]'}>
                        {c.healthScore}/100
                      </b>
                    </td>
                    <td>
                      <span className="font-semibold text-xs text-rose-500">
                        {c.criticalRisksCount || 0} critical
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-400">
                      {new Date(c.uploadedAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex gap-2 justify-end">
                        <button
                          className="button button-light button-small"
                          onClick={() => {
                            setDocumentId(c.id)
                            setDocumentName(c.fileName)
                            setHealthScore(c.healthScore)
                            setCurrentView('editor')
                          }}
                        >
                          Editor
                        </button>
                        <button
                          className="button button-ghost button-small text-red-500"
                          onClick={async () => {
                            await deleteContractApi(c.id)
                            showToast('Contract deleted')
                            loadInitialData()
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. VERSION COMPARISON VIEW                                                */}
      {/* ========================================================================= */}
      {currentView === 'compare' && (
        <div className="dashboard">
          <div className="dashboard-top">
            <div>
              <p className="eyebrow">
                <History className="w-4 h-4 text-[#f36963]" /> Side-by-Side Version Diff
              </p>
              <h1>
                Compare <em>Contract Versions</em>
              </h1>
              <p className="dashboard-subtitle">
                Audit modified terms, track added/removed clauses, and measure health score progression.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
            <div className="grid grid-cols-3 gap-6 text-center items-center py-6 border-b border-slate-200 dark:border-slate-800">
              <div className="bg-subtle p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-xs text-slate-400 uppercase">Version 1 (Initial)</span>
                <strong className="block text-4xl font-bold my-2 text-rose-500">54</strong>
                <span className="text-xs text-slate-500">Health Score</span>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold">
                <span className="text-2xl block">+36 pts</span>
                <span className="text-xs uppercase">Health Improvement</span>
              </div>

              <div className="bg-subtle p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-xs text-slate-400 uppercase">Version 2 (Post-Redline)</span>
                <strong className="block text-4xl font-bold my-2 text-emerald-600">90</strong>
                <span className="text-xs text-slate-500">Health Score</span>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <h3 className="text-lg font-bold">Key Clause Modifications:</h3>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-subtle">
                <div className="flex justify-between items-center mb-2">
                  <b className="text-sm">Payment Terms (Section 4)</b>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    IMPROVED
                  </span>
                </div>
                <div className="diff-box">
                  <del className="p-3 rounded">
                    "The Buyer shall make payment within ninety (90) days from acceptance of the invoice."
                  </del>
                  <ins className="p-3 rounded">
                    "Undisputed invoices shall be paid within forty-five (45) days of delivery, with compound interest under MSMED Act."
                  </ins>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-subtle">
                <div className="flex justify-between items-center mb-2">
                  <b className="text-sm">Limitation of Liability (Section 8)</b>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    IMPROVED
                  </span>
                </div>
                <div className="diff-box">
                  <del className="p-3 rounded">
                    "Supplier shall indemnify and hold harmless Buyer from any and all losses without limitation."
                  </del>
                  <ins className="p-3 rounded">
                    "Supplier liability shall be limited to total fees paid under this Agreement in the preceding 12 months."
                  </ins>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. USER PROFILE VIEW                                                      */}
      {/* ========================================================================= */}
      {currentView === 'profile' && (
        <div className="dashboard">
          <div className="max-w-3xl mx-auto bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 rounded-full bg-slate-900 text-white font-bold text-2xl flex items-center justify-center border-4 border-[#f36963]">
                PS
              </div>
              <div>
                <h1 className="text-2xl font-bold">{userProfile.name}</h1>
                <p className="text-sm text-slate-500">{userProfile.roleTitle} at {userProfile.companyName}</p>
                <p className="text-xs font-mono text-slate-400 mt-1">{userProfile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 my-6">
              <div className="p-4 bg-subtle rounded-lg text-center border border-slate-200 dark:border-slate-800">
                <b className="text-2xl block text-main">{userProfile.stats?.contractsAnalyzed || 18}</b>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Contracts Analyzed</span>
              </div>
              <div className="p-4 bg-subtle rounded-lg text-center border border-slate-200 dark:border-slate-800">
                <b className="text-2xl block text-emerald-600">{userProfile.stats?.avgHealthScore || 78}/100</b>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Avg Health Score</span>
              </div>
              <div className="p-4 bg-subtle rounded-lg text-center border border-slate-200 dark:border-slate-800">
                <b className="text-2xl block text-[#f36963]">{userProfile.stats?.risksResolved || 42}</b>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Risks Resolved</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button className="button button-outline" onClick={() => setCurrentView('settings')}>
                <Settings className="w-4 h-4" /> Edit Profile & Settings
              </button>
              <button className="button button-coral" onClick={() => exportUserDataApi()}>
                <Download className="w-4 h-4" /> Download GDPR Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. SETTINGS VIEW & GDPR DANGER ZONE                                      */}
      {/* ========================================================================= */}
      {currentView === 'settings' && (
        <div className="dashboard">
          <div className="max-w-3xl mx-auto bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-6">Account Settings & Preferences</h1>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase text-slate-400 mb-3">Theme & Appearance</h3>
                <div className="flex gap-4">
                  <button
                    className={`button button-small ${theme === 'light' ? 'button-dark' : 'button-light'}`}
                    onClick={() => toggleTheme('light')}
                  >
                    <Sun className="w-4 h-4" /> Light Mode
                  </button>
                  <button
                    className={`button button-small ${theme === 'dark' ? 'button-dark' : 'button-light'}`}
                    onClick={() => toggleTheme('dark')}
                  >
                    <Moon className="w-4 h-4" /> Dark Navy Mode
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase text-slate-400 mb-3">Notification Preferences</h3>
                <div className="space-y-3 text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked />
                    <span>Email alert when critical payment or uncapped risk is detected</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked />
                    <span>Weekly contract audit and health score summary</span>
                  </label>
                </div>
              </div>

              {/* GDPR Danger Zone */}
              <div className="pt-6 border-t border-red-200 dark:border-red-950">
                <h3 className="text-sm font-bold uppercase text-red-500 mb-3">Danger Zone (GDPR / Data Rights)</h3>
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex justify-between items-center">
                  <div>
                    <b className="text-sm text-red-800 dark:text-red-300 block">Export All Personal & Contract Data</b>
                    <p className="text-xs text-red-600 dark:text-red-400">Download portable JSON archive as per GDPR Article 20</p>
                  </div>
                  <button className="button button-coral button-small" onClick={() => exportUserDataApi()}>
                    <Download className="w-3.5 h-3.5" /> Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. ADMIN ANALYTICS VIEW                                                  */}
      {/* ========================================================================= */}
      {currentView === 'admin' && adminStats && (
        <div className="dashboard">
          <div className="dashboard-top">
            <div>
              <p className="eyebrow">
                <BarChart3 className="w-4 h-4 text-[#f36963]" /> Platform Oversight
              </p>
              <h1>
                Admin & <em>System Analytics</em>
              </h1>
              <p className="dashboard-subtitle">
                Aggregate contract health metrics, risk frequency patterns, and tenant usage.
              </p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon navy">
                <Users className="w-5 h-5" />
              </div>
              <div className="stat-info">
                <b>{adminStats.totalUsers}</b>
                <span>Registered Users</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon coral">
                <FileText className="w-5 h-5" />
              </div>
              <div className="stat-info">
                <b>{adminStats.activeContracts}</b>
                <span>Active Contracts</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="stat-info">
                <b>{adminStats.avgHealthScore}/100</b>
                <span>Avg Platform Health</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="stat-info">
                <b>{adminStats.systemUptime}</b>
                <span>Engine Uptime</span>
              </div>
            </div>
          </div>

          {/* Most Frequent Risk Patterns */}
          <div className="bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8">
            <h3 className="text-lg font-bold mb-4">Most Frequent Risky Clause Patterns (Cross-Organization)</h3>
            <div className="space-y-4">
              {adminStats.riskFrequency?.map((r: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{r.category}</span>
                    <span className="text-[#f36963]">{r.percentage}% of contracts</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${r.riskLevel === 'critical' ? 'bg-[#f36963]' : r.riskLevel === 'high' ? 'bg-amber-500' : 'bg-yellow-500'}`}
                      style={{ width: `${r.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD CONTRACT                                                    */}
      {/* ========================================================================= */}
      {uploadModalOpen && (
        <div className="modal-backdrop" onClick={() => setUploadModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setUploadModalOpen(false)}>
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <FileUp className="w-5 h-5 text-[#f36963]" />
              </div>
              <h2 className="text-xl font-bold">Analyze a Contract</h2>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                className={`button button-small flex-1 ${uploadMode === 'pdf' ? 'button-coral' : 'button-light'}`}
                onClick={() => setUploadMode('pdf')}
              >
                Upload PDF / DOCX
              </button>
              <button
                className={`button button-small flex-1 ${uploadMode === 'text' ? 'button-coral' : 'button-light'}`}
                onClick={() => setUploadMode('text')}
              >
                Paste Contract Text
              </button>
            </div>

            {uploadMode === 'pdf' ? (
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-subtle p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#f36963] transition-colors">
                <Upload className="w-8 h-8 text-[#f36963] mb-2" />
                <b className="text-sm font-bold text-main">{selectedFile ? selectedFile.name : 'Select or drop contract file'}</b>
                <span className="text-xs text-slate-400 mt-1">PDF, DOCX, or Scanned agreement up to 50MB</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </label>
            ) : (
              <textarea
                rows={6}
                placeholder="Paste contract text here..."
                className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs text-main outline-none focus:border-[#f36963]"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
            )}

            <button
              className="button button-coral w-full py-3 mt-5 font-bold"
              onClick={handleUploadAndAnalyze}
            >
              Start AI Risk Audit
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SHARE / INVITE COLLABORATOR                                        */}
      {/* ========================================================================= */}
      {shareModalOpen && (
        <div className="modal-backdrop" onClick={() => setShareModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShareModalOpen(false)}>
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold mb-2">Share Contract with Team</h2>
            <p className="text-xs text-slate-500 mb-4">Invite legal counsel or partners to review and comment.</p>

            <form onSubmit={handleShareContract} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@firm.com"
                  className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded p-2 text-xs text-main outline-none"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Permission Level</label>
                <select
                  className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded p-2 text-xs text-main outline-none"
                  value={shareRole}
                  onChange={(e: any) => setShareRole(e.target.value)}
                >
                  <option value="view">Can View Only</option>
                  <option value="comment">Can Comment & Annotate</option>
                  <option value="edit">Can Edit Clauses & Accept Redlines</option>
                </select>
              </div>

              <button type="submit" className="button button-coral w-full py-2.5 font-bold">
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VERSION SNAPSHOT                                                   */}
      {/* ========================================================================= */}
      {versionSnapshotModalOpen && (
        <div className="modal-backdrop" onClick={() => setVersionSnapshotModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setVersionSnapshotModalOpen(false)}>
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold mb-2">Save Version Snapshot</h2>
            <p className="text-xs text-slate-500 mb-4">Record a permanent rollback checkpoint for this contract.</p>

            <form onSubmit={handleCreateVersionSnapshot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Snapshot Summary / Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pre-negotiation draft with accepted 45-day redline"
                  className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded p-2 text-xs text-main outline-none"
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                />
              </div>

              <button type="submit" className="button button-coral w-full py-2.5 font-bold">
                Record Snapshot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING AI CHATBOT WIDGET                                                */}
      {/* ========================================================================= */}
      <div className="chat-widget">
        {chatOpen ? (
          <div className="chat-window">
            <header>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#f36963]" />
                <div>
                  <b className="text-xs">Contract AI Assistant</b>
                  <small className="text-[9px] text-slate-300 block">Ask anything about this agreement</small>
                </div>
              </div>
              <button className="text-white hover:opacity-75" onClick={() => setChatOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="chat-messages">
              {chatMessages.map((m) => (
                <div key={m.id} className={`chat-msg ${m.role}`}>
                  <p>{m.content}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {m.sources.map((s, i) => (
                        <span key={i} className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                          § {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {chatTyping && (
                <div className="chat-msg assistant text-xs text-slate-400">
                  AI is analyzing contract clauses...
                </div>
              )}
            </div>

            <form onSubmit={handleSendChat} className="chat-input">
              <input
                type="text"
                placeholder="e.g. Is liability capped? What is payment deadline?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="button button-coral button-small px-3">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button className="chat-launcher" onClick={() => setChatOpen(true)}>
            <Sparkles className="w-4 h-4 text-[#f36963]" />
            <span>Ask Contract AI</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <button className="brand text-white" onClick={() => setCurrentView('welcome')}>
              <div className="brand-mark bg-white text-slate-900">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-white">
                Contract<span className="text-[#f36963]">Sense</span>
              </span>
            </button>
            <p className="text-xs text-slate-400 mt-3 max-w-xs">
              AI-Powered contract analysis, MSMED compliance auditing, and redline management for modern businesses.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <span>Platform</span>
              <button onClick={() => setCurrentView('dashboard')}>Dashboard</button>
              <button onClick={() => setCurrentView('generator')}>AI Generator</button>
              <button onClick={() => setCurrentView('clause_library')}>Clause Library</button>
              <button onClick={() => setCurrentView('compare')}>Version Diff</button>
            </div>
            <div>
              <span>Compliance</span>
              <button onClick={() => showToast('MSMED Act 2006 Rule Engine Active')}>MSMED Act 2006</button>
              <button onClick={() => exportUserDataApi()}>GDPR Data Export</button>
              <button onClick={() => setCurrentView('admin')}>Admin Metrics</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 ContractSense AI Inc. All rights reserved.</span>
          <span>Confidential & Attorney-Client Privilege Safeguarded</span>
        </div>
      </footer>
    </div>
  )
}
