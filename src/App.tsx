import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCheck,
  FileCode,
  FileEdit,
  FilePlus,
  FileText,
  FileUp,
  Globe,
  HelpCircle,
  History,
  Info,
  KeyRound,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Phone,
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
  UserCheck,
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
  fetchCurrentUserApi,
  changePasswordApi,
  forgotPasswordApi,
} from './api'
import AuthPage from './AuthPage'
import { auth, onAuthStateChanged, logoutUser } from './firebase'

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
    id: 'ip',
    category: 'Intellectual Property',
    title: 'Broad pre-existing IP assignment',
    riskLevel: 'medium',
    riskScore: 58,
    confidence: 85,
    page: 10,
    text: 'All inventions, tools, and materials used in providing the services shall immediately become the exclusive property of the Buyer upon creation.',
    explanation: 'You could inadvertently transfer your proprietary tools, background software libraries, or reusable assets.',
    consequences: 'Loss of foundational business IP and restriction from using your own tools for future clients.',
    redline: {
      original: 'All tools and materials used shall become exclusive property of Buyer.',
      suggested: 'Supplier retains all rights in Background IP and grants Buyer a non-exclusive, perpetual license to use the custom deliverables created under this Scope of Work.',
      rationale: 'Protects pre-existing developer IP while granting client full usage rights.',
    },
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
  const [editorTab, setEditorTab] = useState<'clauses' | 'inspector'>('clauses')

  // Auth State & Modals
  const [isLoggedIn, setIsLoggedIn] = useState(false)
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
  const [summary, setSummary] = useState<any>(null)
  const [collaboratorsCount, setCollaboratorsCount] = useState(1)

  const topConcern = useMemo(() => {
    if (!clausesList || clausesList.length === 0) return null
    return [...clausesList].sort((a, b) => b.riskScore - a.riskScore)[0]
  }, [clausesList])

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
    id: '',
    name: '',
    email: '',
    companyName: 'My Enterprise',
    roleTitle: 'Legal & Commercial Reviewer',
    profession: 'Commercial Reviewer',
    role: 'Reviewer',
    phone: '',
    mobileNumber: '',
    bio: 'Commercial contract attorney specializing in MSME compliance, contract risk governance, and vendor negotiations.',
    companyType: 'MSME',
    industry: 'Technology & Legal',
    companyWebsite: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400001',
    connectedProviders: ['Email & Password'],
    avatarUrl: '',
    themePreference: 'system',
    emailAlertsOnRisk: true,
    weeklySummaryEmail: true,
    stats: { contractsAnalyzed: 18, avgHealthScore: 78, risksResolved: 42 },
  })

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<any>({ ...userProfile })
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Sync profile form with userProfile
  useEffect(() => {
    setProfileForm({ ...userProfile })
  }, [userProfile])

  // Change Password Modal State
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<{ error?: string; success?: string }>({})
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  // Change Email Modal State
  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' })
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState<{ error?: string; success?: string }>({})

  // Helper: Initials calculation
  const getInitials = (name?: string) => {
    if (!name) return 'CS'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Profile Handlers
  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const res = await updateUserProfileApi(profileForm)
      setIsSavingProfile(false)
      if (res?.success && res?.data) {
        setUserProfile(res.data)
      } else {
        setUserProfile((prev: any) => ({ ...prev, ...profileForm }))
      }
      setIsEditingProfile(false)
      showToast('Profile updated successfully!')
    } catch {
      setIsSavingProfile(false)
      setUserProfile((prev: any) => ({ ...prev, ...profileForm }))
      setIsEditingProfile(false)
      showToast('Profile updated successfully!')
    }
  }

  const handleCancelProfileEdit = () => {
    setProfileForm({ ...userProfile })
    setIsEditingProfile(false)
    showToast('Reverted profile changes')
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size exceeds 2MB limit')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setProfileForm((prev: any) => ({ ...prev, avatarUrl: base64 }))
      setUserProfile((prev: any) => ({ ...prev, avatarUrl: base64 }))
      updateUserProfileApi({ avatarUrl: base64 })
      showToast('Profile picture updated')
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setProfileForm((prev: any) => ({ ...prev, avatarUrl: '' }))
    setUserProfile((prev: any) => ({ ...prev, avatarUrl: '' }))
    updateUserProfileApi({ avatarUrl: '' })
    showToast('Profile picture removed')
  }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordFeedback({})
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordFeedback({ error: 'Please enter both current and new password.' })
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordFeedback({ error: 'New password must be at least 8 characters long.' })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ error: 'New password and confirmation do not match.' })
      return
    }

    setPasswordSaving(true)
    const res = await changePasswordApi(passwordForm.currentPassword, passwordForm.newPassword)
    setPasswordSaving(false)

    if (res?.success) {
      setPasswordFeedback({ success: res.message || 'Password changed successfully!' })
      setTimeout(() => {
        setChangePasswordModalOpen(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setPasswordFeedback({})
        showToast('Password updated successfully')
      }, 1200)
    } else {
      setPasswordFeedback({ error: res?.error || 'Unable to update password.' })
    }
  }

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailFeedback({})
    if (!emailForm.newEmail.trim() || !emailForm.currentPassword) {
      setEmailFeedback({ error: 'Please enter your new email and current password for verification.' })
      return
    }

    setEmailSaving(true)
    const res = await updateUserProfileApi({ email: emailForm.newEmail.trim() })
    setEmailSaving(false)

    if (res?.success) {
      setEmailFeedback({ success: 'Email address updated successfully!' })
      setUserProfile((prev: any) => ({ ...prev, email: emailForm.newEmail.trim() }))
      setTimeout(() => {
        setChangeEmailModalOpen(false)
        setEmailForm({ newEmail: '', currentPassword: '' })
        setEmailFeedback({})
        showToast('Account email updated')
      }, 1200)
    } else {
      setEmailFeedback({ error: res?.error || 'Unable to update email address.' })
    }
  }

  // Admin Stats
  const [adminStats, setAdminStats] = useState<any>({
    totalUsers: 148,
    activeContracts: 420,
    avgHealthScore: 78,
    systemUptime: '99.98%',
    riskFrequency: [
      { category: 'Payment Terms (>45 days)', percentage: 76, riskLevel: 'critical' },
      { category: 'Uncapped Indemnity & Liability', percentage: 64, riskLevel: 'high' },
      { category: 'Unilateral Termination Rights', percentage: 52, riskLevel: 'high' },
      { category: 'Overbroad IP Assignment', percentage: 41, riskLevel: 'medium' },
      { category: 'Absence of Force Majeure', percentage: 33, riskLevel: 'medium' },
    ],
  })

  // Floating AI Chat State
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I am your AI Contract Assistant. Ask me anything about payment terms, uncapped liabilities, or missing statutory protections in this agreement.',
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

  // Initialize Theme and Listen for Firebase Auth State Changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('contractsense_theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }

    console.log('[Auth] Initializing Firebase Auth observer...')
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[Auth] onAuthStateChanged: Authenticated user detected:', firebaseUser.email, 'UID:', firebaseUser.uid)
        try {
          const token = await firebaseUser.getIdToken()
          localStorage.setItem('contractsense_auth_token', token)

          const displayName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User')
          const providers = firebaseUser.providerData.map((p) =>
            p.providerId === 'google.com' ? 'Google' : p.providerId === 'apple.com' ? 'Apple' : 'Email & Password'
          )

          setUserProfile((prev: any) => ({
            ...prev,
            id: firebaseUser.uid,
            name: displayName,
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || prev.avatarUrl || '',
            connectedProviders: providers.length > 0 ? Array.from(new Set(providers)) : ['Email & Password'],
          }))

          setIsLoggedIn(true)
          loadInitialData()
        } catch (err: any) {
          console.error('[Auth] Error getting user token:', err)
        }
      } else {
        console.log('[Auth] onAuthStateChanged: No authenticated user session found')
        setIsLoggedIn(false)
        localStorage.removeItem('contractsense_auth_token')
      }
    })

    return () => unsubscribe()
  }, [])

  const handleAuthenticated = (user: any, token: string) => {
    localStorage.setItem('contractsense_auth_token', token)
    const displayName = user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'User')
    setUserProfile((prev: any) => ({
      ...prev,
      id: user.uid || user.id || prev.id,
      name: displayName,
      email: user.email || prev.email,
      avatarUrl: user.photoURL || user.avatarUrl || prev.avatarUrl,
    }))
    setIsLoggedIn(true)
    setCurrentView('dashboard')
    showToast(`Welcome, ${displayName}!`)
    loadInitialData()
  }

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

    const currentFile = selectedFile
    const currentText = pastedText
    const currentName = selectedFile ? selectedFile.name : 'Pasted-Contract.txt'

    // Reset previous contract state to guarantee fresh analysis
    setClausesList([])
    setSelectedClause(null)
    setHealthScore(0)
    setSummary(null)
    setMissingProtections([])
    setObligations({ yours: [], theirs: [], balanceNote: '' })
    setTimeline([])
    setUploadModalOpen(false)
    setCurrentView('processing')
    setIsProcessing(true)

    try {
      const stages = [0, 1, 2, 3, 4, 5]
      for (let i = 0; i < stages.length; i++) {
        setProcessingStage(i)
        await new Promise((r) => setTimeout(r, 400))
      }

      const data = await analyzeContractApi(currentFile, currentText, currentName)

      if (data && data.clauses && data.clauses.length > 0) {
        setDocumentId(data.id)
        setDocumentName(data.fileName || currentName)
        setClausesList(data.clauses || [])
        setSelectedClause(data.clauses?.[0] || null)
        setHealthScore(data.summary?.overallHealthScore ?? 50)
        setSummary(data.summary)
        if (data.collaborators?.length) setCollaboratorsCount(data.collaborators.length)
        if (data.summary?.missingProtections) setMissingProtections(data.summary.missingProtections)
        if (data.summary?.obligations) setObligations(data.summary.obligations)
        if (data.summary?.timeline) setTimeline(data.summary.timeline)
        setSelectedFile(null)
        setPastedText('')
        showToast('Contract analyzed successfully!')
        setCurrentView('dashboard')
        loadInitialData()
      } else {
        throw new Error('Contract analysis failed. Please try again.')
      }
    } catch (err: any) {
      console.error('[Upload & Analyze Error]:', err)
      showToast(err.message || 'Contract analysis failed. Please try again.')
      setCurrentView('dashboard')
    } finally {
      setIsProcessing(false)
    }
  }

  // --- Handlers: AI Agreement Generator ---
  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    showToast('AI drafting agreement with statutory MSMED safeguards...')

    const res = await generateContractApi(genForm)
    setIsGenerating(false)

    if (res) {
      setDocumentId(res.id)
      setDocumentName(res.fileName)
      setClausesList(res.clauses || [])
      setSelectedClause(res.clauses?.[0] || null)
      setHealthScore(res.summary?.overallHealthScore ?? 50)
      setSummary(res.summary)
      if (res.collaborators?.length) setCollaboratorsCount(res.collaborators.length)
      if (res.summary?.missingProtections) setMissingProtections(res.summary.missingProtections)
      if (res.summary?.obligations) setObligations(res.summary.obligations)
      if (res.summary?.timeline) setTimeline(res.summary.timeline)
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

  const navigateTo = (view: ViewType) => {
    setCurrentView(view)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isLoggedIn) {
    return <AuthPage onAuthenticated={handleAuthenticated} />
  }

  return (
    <div className="app-shell legal-ambient-mesh">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-fade-in-up">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="site-header">
        <button className="brand" onClick={() => navigateTo('welcome')} aria-label="ContractSense Home">
          <div className="brand-mark">
            <Scale className="w-4 h-4" />
          </div>
          <span>
            Contract<span>Sense</span>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="main-nav hidden md:flex">
          <button className={currentView === 'dashboard' ? 'nav-active' : ''} onClick={() => navigateTo('dashboard')}>
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </button>
          <button className={currentView === 'contracts' ? 'nav-active' : ''} onClick={() => navigateTo('contracts')}>
            <BookOpen className="w-3.5 h-3.5" /> My Contracts
          </button>
          <button className={currentView === 'editor' ? 'nav-active' : ''} onClick={() => navigateTo('editor')}>
            <FileEdit className="w-3.5 h-3.5" /> Contract Editor
          </button>
          <button className={currentView === 'generator' ? 'nav-active' : ''} onClick={() => navigateTo('generator')}>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> AI Generator
          </button>
          <button className={currentView === 'clause_library' ? 'nav-active' : ''} onClick={() => navigateTo('clause_library')}>
            <Layers className="w-3.5 h-3.5" /> Clause Library
          </button>
          <button className={currentView === 'compare' ? 'nav-active' : ''} onClick={() => navigateTo('compare')}>
            <History className="w-3.5 h-3.5" /> Compare
          </button>
          <button className={currentView === 'admin' ? 'nav-active' : ''} onClick={() => navigateTo('admin')}>
            <BarChart3 className="w-3.5 h-3.5" /> Admin Analytics
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Theme Switcher */}
          <button className="icon-btn" onClick={() => toggleTheme()} title="Toggle theme">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
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
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
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
                <div className="py-1">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => {
                          markNotificationReadApi(n.id)
                          setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)))
                          if (n.linkUrl) navigateTo('editor')
                          setNotifDropdownOpen(false)
                        }}
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <b>{n.title}</b>
                          <p>{n.message}</p>
                          <small>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Upload CTA (Hidden on smallest screens to preserve padding) */}
          <button className="button button-coral button-small hidden sm:inline-flex" onClick={() => setUploadModalOpen(true)}>
            <FileUp className="w-3.5 h-3.5" /> Upload Contract
          </button>

          {/* User Profile Avatar Dropdown */}
          <div className="profile-nav-container">
            <button
              className="profile-trigger-btn"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title="User Account & Profile"
            >
              <div className="relative">
                <div className="profile-avatar-circle">
                  {userProfile.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt={userProfile.name} />
                  ) : (
                    <span>{getInitials(userProfile.name)}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />
              </div>
              <div className="profile-name-role hidden lg:flex">
                <b className="truncate max-w-[90px]">{userProfile.name || 'User'}</b>
                <span className="truncate max-w-[90px]">{userProfile.roleTitle || userProfile.profession || 'Legal Account'}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="popover-menu" style={{ width: '270px', top: '48px' }}>
                <div className="popover-header flex items-center gap-2.5">
                  <div className="profile-avatar-circle w-9 h-9 text-xs">
                    {userProfile.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt={userProfile.name} />
                    ) : (
                      <span>{getInitials(userProfile.name)}</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <b className="truncate">{userProfile.name}</b>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {userProfile.roleTitle || userProfile.profession || 'Legal Account'}
                    </span>
                    <small className="text-slate-400 font-mono text-[10px] block truncate">{userProfile.email}</small>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    className="popover-item"
                    onClick={() => {
                      setIsEditingProfile(false)
                      navigateTo('profile')
                      setProfileDropdownOpen(false)
                    }}
                  >
                    <User className="w-4 h-4 text-indigo-500" /> View Profile
                  </button>
                  <button
                    className="popover-item"
                    onClick={() => {
                      setIsEditingProfile(true)
                      navigateTo('profile')
                      setProfileDropdownOpen(false)
                    }}
                  >
                    <FileEdit className="w-4 h-4 text-emerald-600" /> Edit Profile
                  </button>
                  <button
                    className="popover-item"
                    onClick={() => {
                      navigateTo('settings')
                      setProfileDropdownOpen(false)
                    }}
                  >
                    <Settings className="w-4 h-4 text-slate-500" /> Settings
                  </button>
                  <button
                    className="popover-item"
                    onClick={() => {
                      exportUserDataApi()
                      setProfileDropdownOpen(false)
                      showToast('Downloading GDPR data archive...')
                    }}
                  >
                    <Download className="w-4 h-4 text-blue-500" /> Export All Data (GDPR)
                  </button>
                  <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
                  <button
                    className="popover-item danger-item"
                    onClick={async () => {
                      setProfileDropdownOpen(false)
                      await logoutUser()
                      setIsLoggedIn(false)
                      setCurrentView('welcome')
                      showToast('Signed out of session')
                    }}
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Trigger */}
          <button
            className="menu-button md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-full bg-surface border-b border-slate-200 dark:border-slate-800 p-5 shadow-2xl flex flex-col gap-2.5 z-10 animate-fade-in-up mt-[62px]">
            <div className="flex items-center justify-between pb-3 mb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Navigation Menu</span>
              <button
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setUploadModalOpen(true)
                }}
              >
                <FileUp className="w-3.5 h-3.5" /> Upload Contract
              </button>
            </div>
            <button
              className={`p-3 rounded-lg text-left text-sm font-medium flex items-center gap-3 ${currentView === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold' : 'bg-slate-50 dark:bg-slate-800/60'}`}
              onClick={() => navigateTo('dashboard')}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              className={`p-3 rounded-lg text-left text-sm font-medium flex items-center gap-3 ${currentView === 'contracts' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold' : 'bg-slate-50 dark:bg-slate-800/60'}`}
              onClick={() => navigateTo('contracts')}
            >
              <BookOpen className="w-4 h-4" /> My Contracts & Repository
            </button>
            <button
              className={`p-3 rounded-lg text-left text-sm font-medium flex items-center gap-3 ${currentView === 'editor' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold' : 'bg-slate-50 dark:bg-slate-800/60'}`}
              onClick={() => navigateTo('editor')}
            >
              <FileEdit className="w-4 h-4" /> Interactive Contract Editor
            </button>
            <button
              className={`p-3 rounded-lg text-left text-sm font-medium flex items-center gap-3 ${currentView === 'generator' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold' : 'bg-slate-50 dark:bg-slate-800/60'}`}
              onClick={() => navigateTo('generator')}
            >
              <Sparkles className="w-4 h-4 text-indigo-500" /> AI Agreement Drafting Studio
            </button>
            <button
              className={`p-3 rounded-lg text-left text-sm font-medium flex items-center gap-3 ${currentView === 'clause_library' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold' : 'bg-slate-50 dark:bg-slate-800/60'}`}
              onClick={() => navigateTo('clause_library')}
            >
              <Layers className="w-4 h-4" /> Pre-Approved Clause Library
            </button>
            <button
              className={`p-3 rounded-lg text-left text-sm font-medium flex items-center gap-3 ${currentView === 'compare' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold' : 'bg-slate-50 dark:bg-slate-800/60'}`}
              onClick={() => navigateTo('compare')}
            >
              <History className="w-4 h-4" /> Version Diff & Comparison
            </button>
            <button
              className={`p-3 rounded-lg text-left text-sm font-medium flex items-center gap-3 ${currentView === 'admin' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold' : 'bg-slate-50 dark:bg-slate-800/60'}`}
              onClick={() => navigateTo('admin')}
            >
              <BarChart3 className="w-4 h-4" /> Admin Analytics & Oversight
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. WELCOME / LANDING VIEW                                                 */}
      {/* ========================================================================= */}
      {currentView === 'welcome' && (
        <main className="w-full">
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                <Sparkles className="w-3.5 h-3.5" /> AI-Powered Contract Intelligence
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
                <button className="button button-outline" onClick={() => navigateTo('generator')}>
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
                    <b className="text-rose-600 font-bold text-sm">54 / 100</b>
                  </div>
                </div>
              </div>
              <div className="floating-card card-confidence">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <b>96% Audit Confidence</b>
                  <small>Statutory Legal Engine</small>
                </div>
              </div>
              <div className="floating-card card-score">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <div>
                  <b>1-Click Redlines</b>
                  <small>Auto-fair clause fixes</small>
                </div>
              </div>
            </div>
          </section>

          {/* Process Section */}
          <section className="section bg-surface">
            <div className="max-w-5xl mx-auto">
              <p className="eyebrow text-center justify-center">
                <Layers className="w-3.5 h-3.5" /> How It Works
              </p>
              <h2 className="text-center text-2xl md:text-4xl font-bold mt-2 mb-10">
                From risky PDF to <em>protected agreement</em> in three steps.
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-subtle">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-4">
                    01
                  </div>
                  <h3 className="text-lg font-bold mb-2">Upload Contract</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Upload any PDF, DOCX, or scan. Our OCR & clause chunking engine extracts every covenant instantly.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-subtle">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                    02
                  </div>
                  <h3 className="text-lg font-bold mb-2">Instant Risk Audit</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    AI flags uncapped liability, delayed payments, and one-sided indemnity terms with statutory references.
                  </p>
                </div>

                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-subtle">
                  <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm mb-4">
                    03
                  </div>
                  <h3 className="text-lg font-bold mb-2">Accept Redlines & Sign</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
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
          <div className="processing-panel text-center max-w-md mx-auto py-16 px-4">
            <p className="eyebrow justify-center text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" /> AI Statutory Engine Running
            </p>
            <h1 className="text-2xl md:text-3xl font-bold my-4 text-white">
              Auditing <em>Contract Terms</em>
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-8">
              Cross-referencing liability clauses, payment schedules, and indemnity provisions against statutory MSMED guidelines.
            </p>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, (processingStage + 1) * 20)}%` }}
              />
            </div>

            <div className="flex justify-center items-center gap-2 text-xs font-mono text-indigo-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>
                {processingStage === 0 && 'Extracting text & clause boundaries...'}
                {processingStage === 1 && 'Scanning for Section 15/16 payment caps...'}
                {processingStage === 2 && 'Evaluating uncapped indemnity & liabilities...'}
                {processingStage === 3 && 'Generating plain-English business risk breakdown...'}
                {processingStage === 4 && 'Synthesizing legally balanced redlines...'}
                {processingStage >= 5 && 'Finalizing audit scorecard...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN DASHBOARD VIEW                                                    */}
      {/* ========================================================================= */}
      {currentView === 'dashboard' && (
        <div className="dashboard">
          {/* Top Active Contract Banner */}
          <div className="dashboard-top">
            <div>
              <p className="eyebrow">
                <FileCheck className="w-3.5 h-3.5" /> Active Contract Risk Audit
              </p>
              <h1>
                {documentName} <em>Score: {healthScore}/100</em>
              </h1>
              <p className="dashboard-subtitle">
                Comprehensive statutory risk breakdown and renegotiation recommendations.
              </p>
            </div>
            <div className="dashboard-actions">
              <button className="button button-coral" onClick={() => navigateTo('editor')}>
                <FileEdit className="w-3.5 h-3.5" /> Open In Contract Editor
              </button>
              <button className="button button-outline" onClick={() => exportReportApi(documentId, 'pdf')}>
                <Download className="w-3.5 h-3.5" /> Export Report (PDF)
              </button>
              <button className="button button-light" onClick={() => setShareModalOpen(true)}>
                <Share2 className="w-3.5 h-3.5" /> Share with Team
              </button>
            </div>
          </div>

          {/* Quick Metric Cards (Stacked mobile-first, 4 cols desktop) */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon navy">
                <FileText className="w-4 h-4" />
              </div>
              <div className="stat-info">
                <b>{clausesList.length}</b>
                <span>Clauses Extracted</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon coral">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="stat-info">
                <b className="text-rose-600 dark:text-rose-400">
                  {clausesList.filter((c) => c.riskLevel === 'high' || c.riskLevel === 'critical').length}
                </b>
                <span>Risky Clauses</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="stat-info">
                <b>{missingProtections.length}</b>
                <span>Missing Protections</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <Users className="w-4 h-4" />
              </div>
              <div className="stat-info">
                <b>{collaboratorsCount}</b>
                <span>Collaborator{collaboratorsCount > 1 ? 's' : ''} Active</span>
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
                        stroke: healthScore > 75 ? '#059669' : healthScore > 50 ? '#d97706' : '#b94a48',
                      }}
                    />
                  </svg>
                  <div>
                    <strong>{healthScore}</strong>
                    <span>out of 100</span>
                  </div>
                </div>
                <div className="health-text">
                  <span className={healthScore < 60 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}>
                    {summary?.overallRiskLevel
                      ? `${summary.overallRiskLevel.toUpperCase()} RISK PROFILE`
                      : healthScore < 60
                      ? 'HIGH RISK PROFILE'
                      : 'BALANCED PROFILE'}
                  </span>
                  <p>
                    {summary?.protectionDetail ||
                      (healthScore < 60
                        ? 'Contains critical payment and liability terms. Prompt renegotiation advised.'
                        : 'Equitable terms with balanced mutual rights.')}
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
                <p className="eyebrow text-indigo-400">
                  <Sparkles className="w-3 h-3" /> Priority Recommendation
                </p>
                <h2>{summary?.recommendation || (topConcern ? `Review: ${topConcern.title}` : 'Review Contract Terms')}</h2>
                <p>
                  {summary?.recommendationDetail || topConcern?.explanation || 'Inspect flagged clauses and apply suggested statutory redlines before execution.'}
                </p>
              </div>
              {topConcern && (
                <button
                  className="button button-coral button-small mt-3 w-fit"
                  onClick={() => {
                    setSelectedClause(topConcern)
                    navigateTo('editor')
                  }}
                >
                  <Check className="w-3 h-3" /> Inspect Top Concern
                </button>
              )}
            </div>

            <div className="protection-card">
              <div>
                <p className="eyebrow text-emerald-700 dark:text-emerald-400">
                  <ShieldAlert className="w-3 h-3" /> Missing Protection
                </p>
                <h3>{missingProtections[0]?.title || 'Standard Protections Applied'}</h3>
                <p>
                  {missingProtections[0]?.text || 'No critical statutory safeguards missing from this agreement.'}
                </p>
              </div>
              <button
                className="button button-outline button-small mt-3 w-fit"
                onClick={() => navigateTo('clause_library')}
              >
                <Plus className="w-3 h-3" /> Browse Approved Clauses
              </button>
            </div>
          </div>

          {/* Top Concerns Cards */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-bold">Top Clause Concerns</h3>
                <p className="text-xs text-slate-500">Click any risk card to inspect explanation & suggested redline</p>
              </div>
              <button className="button button-ghost button-small" onClick={() => navigateTo('editor')}>
                View All {clausesList.length} Clauses <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>

            <div className="concern-grid">
              {clausesList.map((clause) => (
                <div
                  key={clause.id}
                  className={`concern-card risk-${clause.riskLevel}`}
                  onClick={() => {
                    setSelectedClause(clause)
                    navigateTo('editor')
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[11px] text-slate-400">
                      {clause.page && clause.page > 0 ? `Page ${clause.page}` : 'Clause'}
                    </span>
                    <span className={`risk-pill risk-${clause.riskLevel}`}>
                      {riskMeta[clause.riskLevel].label}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{clause.category}</p>
                    <h3 className="text-base font-bold my-1">{clause.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{clause.explanation}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                    <span>Risk Score: {clause.riskScore}/100</span>
                    <span className="flex items-center gap-0.5 text-[11px]">
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
                <FileEdit className="w-3.5 h-3.5" /> Interactive Clause Editor & Redliner
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
                <History className="w-3.5 h-3.5" /> Save Snapshot
              </button>
              <button className="button button-light" onClick={() => setShareModalOpen(true)}>
                <Share2 className="w-3.5 h-3.5" /> Invite Collaborator
              </button>
              <button className="button button-coral" onClick={() => exportReportApi(documentId, 'pdf')}>
                <Download className="w-3.5 h-3.5" /> Export Final Contract
              </button>
            </div>
          </div>

          {/* Mobile Tab Switcher for Editor */}
          <div className="flex lg:hidden bg-subtle p-1 rounded-lg mb-4 border border-slate-200 dark:border-slate-800">
            <button
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${editorTab === 'clauses' ? 'bg-surface shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
              onClick={() => setEditorTab('clauses')}
            >
              Clause List ({clausesList.length})
            </button>
            <button
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${editorTab === 'inspector' ? 'bg-surface shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
              onClick={() => setEditorTab('inspector')}
            >
              AI Redline Inspector
            </button>
          </div>

          <div className="editor-layout">
            {/* Main Inline Editable Canvas */}
            <div className={`editor-canvas ${editorTab === 'inspector' ? 'hidden lg:block' : 'block'}`}>
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-mono text-xs text-slate-400">STATUS: AUTO-SAVING ENABLED</span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Health Score: {healthScore}/100
                </span>
              </div>

              {clausesList.map((clause) => (
                <div
                  key={clause.id}
                  className={`editor-clause-box risk-${clause.riskLevel} ${selectedClause?.id === clause.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedClause(clause)
                    if (window.innerWidth < 1024) setEditorTab('inspector')
                  }}
                >
                  <div className="clause-header">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 uppercase mr-2">{clause.category}</span>
                      <b className="text-sm">{clause.title}</b>
                    </div>
                    <div className="flex items-center gap-2">
                      {clause.acceptedRedline && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
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
              <div className={`side-panel ${editorTab === 'clauses' ? 'hidden lg:block' : 'block'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">{selectedClause.category}</span>
                    <h3 className="text-lg font-bold my-1">{selectedClause.title}</h3>
                  </div>
                  <span className={`risk-pill risk-${selectedClause.riskLevel}`}>
                    Score: {selectedClause.riskScore}/100
                  </span>
                </div>

                <div className="space-y-3.5 text-xs">
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
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300">
                      <b className="block mb-0.5">Statutory Reference:</b>
                      <span>{selectedClause.actReference}</span>
                    </div>
                  )}

                  {/* Redline Diff Box */}
                  <div>
                    <b className="text-slate-700 dark:text-slate-200 block mb-1">AI Redline Recommendation:</b>
                    <div className="diff-box">
                      <div className="border border-red-200 dark:border-red-950/60">
                        <span className="font-bold text-[10px] text-red-700 dark:text-red-400 uppercase block mb-1">Original Text</span>
                        <del>{selectedClause.redline.original}</del>
                      </div>
                      <div className="border border-emerald-200 dark:border-emerald-950/60">
                        <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-400 uppercase block mb-1">Suggested Redline</span>
                        <ins>{selectedClause.redline.suggested}</ins>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      Rationale: {selectedClause.redline.rationale}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      className="button button-coral button-small w-full"
                      onClick={() => handleAcceptRedline(selectedClause.id)}
                    >
                      <Check className="w-3.5 h-3.5" /> Accept Suggested Redline
                    </button>
                  </div>

                  {/* Clause Comments Thread */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <b className="text-slate-700 dark:text-slate-200 block mb-2">Clause Comments & Annotations:</b>
                    <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                      {selectedClause.comments && selectedClause.comments.length > 0 ? (
                        selectedClause.comments.map((cmt) => (
                          <div key={cmt.id} className="p-2.5 bg-subtle rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              <span>{cmt.authorName}</span>
                              <span className="font-mono text-[9px] text-slate-400">
                                {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="mt-1 text-slate-600 dark:text-slate-400">{cmt.content}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 italic py-1">No comments on this clause yet.</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add comment..."
                        className="flex-1 bg-subtle border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-main outline-none focus:border-indigo-500"
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
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-7">
              <p className="eyebrow justify-center">
                <Sparkles className="w-3.5 h-3.5" /> AI Agreement Drafting Studio
              </p>
              <h1 className="text-2xl md:text-4xl font-bold my-2">
                Generate a <em>Compliant Contract Draft</em>
              </h1>
              <p className="text-slate-500 text-xs md:text-sm">
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
                        <small className="block text-[10px] text-slate-500 mt-0.5">Strict client-side protection</small>
                      </button>
                      <button
                        type="button"
                        className={`tolerance-btn ${genForm.riskTolerance === 'balanced' ? 'selected' : ''}`}
                        onClick={() => setGenForm({ ...genForm, riskTolerance: 'balanced' })}
                      >
                        <b>Balanced (Recommended)</b>
                        <small className="block text-[10px] text-slate-500 mt-0.5">Mutual market standards</small>
                      </button>
                      <button
                        type="button"
                        className={`tolerance-btn ${genForm.riskTolerance === 'aggressive' ? 'selected' : ''}`}
                        onClick={() => setGenForm({ ...genForm, riskTolerance: 'aggressive' })}
                      >
                        <b>Aggressive</b>
                        <small className="block text-[10px] text-slate-500 mt-0.5">Vendor-favored terms</small>
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="button button-coral w-full py-3 font-bold mt-2" disabled={isGenerating}>
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
                <Layers className="w-3.5 h-3.5" /> Pre-Approved Clause Repository
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
            <div className="flex gap-1.5 flex-wrap overflow-x-auto pb-1">
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
            {filteredClauseLibrary.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-surface border border-slate-200 dark:border-slate-800 rounded-xl">
                <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-main">No clauses found matching your search.</p>
                <button className="button button-outline button-small mt-3" onClick={() => { setLibrarySearch(''); setClauseCategoryFilter('all') }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredClauseLibrary.map((item) => (
                <div key={item.id} className="library-card">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">{item.category}</span>
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
                        navigateTo('editor')
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Insert Into Contract
                    </button>
                  </div>
                </div>
              ))
            )}
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
                <BookOpen className="w-3.5 h-3.5" /> Contract Repository
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
                <FileUp className="w-3.5 h-3.5" /> Upload New Contract
              </button>
              <button className="button button-outline" onClick={() => navigateTo('generator')}>
                <Sparkles className="w-3.5 h-3.5" /> Generate Agreement
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

              <div className="flex gap-2 flex-wrap">
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
              <div className="mb-3 p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between text-xs">
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
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-xs text-slate-500">
                      No contracts matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c) => (
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
                        <b className="block font-bold">{c.fileName}</b>
                        <small className="text-slate-400 font-mono">{c.folder || 'General'}</small>
                      </td>
                      <td>{c.contractType || 'Commercial'}</td>
                      <td>
                        <span className={`status-badge status-${c.status}`}>{c.status?.replace('_', ' ')}</span>
                      </td>
                      <td>
                        <b className={c.healthScore > 75 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                          {c.healthScore}/100
                        </b>
                      </td>
                      <td>
                        <span className="font-semibold text-xs text-rose-600 dark:text-rose-400">
                          {c.criticalRisksCount || 0} critical
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-400">
                        {new Date(c.uploadedAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-1.5 justify-end">
                          <button
                            className="button button-light button-small"
                            onClick={async () => {
                              setDocumentId(c.id)
                              setDocumentName(c.fileName)
                              setHealthScore(c.healthScore)
                              const fullDoc = await fetchContractByIdApi(c.id)
                              if (fullDoc && fullDoc.clauses) {
                                setClausesList(fullDoc.clauses)
                                setSelectedClause(fullDoc.clauses[0] || null)
                                setSummary(fullDoc.summary)
                                if (fullDoc.collaborators?.length) setCollaboratorsCount(fullDoc.collaborators.length)
                                if (fullDoc.summary?.missingProtections) setMissingProtections(fullDoc.summary.missingProtections)
                                if (fullDoc.summary?.obligations) setObligations(fullDoc.summary.obligations)
                                if (fullDoc.summary?.timeline) setTimeline(fullDoc.summary.timeline)
                              }
                              navigateTo('editor')
                            }}
                          >
                            Editor
                          </button>
                          <button
                            className="button button-ghost button-small text-rose-600"
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
                  ))
                )}
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
                <History className="w-3.5 h-3.5" /> Side-by-Side Version Diff
              </p>
              <h1>
                Compare <em>Contract Versions</em>
              </h1>
              <p className="dashboard-subtitle">
                Audit modified terms, track added/removed clauses, and measure health score progression.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center items-center py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="bg-subtle p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-xs text-slate-400 uppercase">Version 1 (Initial)</span>
                <strong className="block text-3xl font-bold my-1.5 text-rose-600">54</strong>
                <span className="text-xs text-slate-500">Health Score</span>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                <span className="text-xl md:text-2xl block">+36 pts</span>
                <span className="text-[10px] uppercase tracking-wider">Health Improvement</span>
              </div>

              <div className="bg-subtle p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-xs text-slate-400 uppercase">Version 2 (Post-Redline)</span>
                <strong className="block text-3xl font-bold my-1.5 text-emerald-600">90</strong>
                <span className="text-xs text-slate-500">Health Score</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-base font-bold">Key Clause Modifications:</h3>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-subtle">
                <div className="flex justify-between items-center mb-2">
                  <b className="text-sm">Payment Terms (Section 4)</b>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                    IMPROVED (MSMED 45-DAY)
                  </span>
                </div>
                <div className="diff-box">
                  <del className="p-2.5 rounded">
                    "The Buyer shall make payment within ninety (90) days from acceptance of the invoice."
                  </del>
                  <ins className="p-2.5 rounded">
                    "Undisputed invoices shall be paid within forty-five (45) days of delivery, with compound interest under MSMED Act."
                  </ins>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-subtle">
                <div className="flex justify-between items-center mb-2">
                  <b className="text-sm">Limitation of Liability (Section 8)</b>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                    IMPROVED (CAPPED)
                  </span>
                </div>
                <div className="diff-box">
                  <del className="p-2.5 rounded">
                    "Supplier shall indemnify and hold harmless Buyer from any and all losses without limitation."
                  </del>
                  <ins className="p-2.5 rounded">
                    "Supplier liability shall be limited to total fees paid under this Agreement in the preceding 12 months."
                  </ins>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. COMPLETE USER PROFILE & ACCOUNT MANAGEMENT VIEW                         */}
      {/* ========================================================================= */}
      {currentView === 'profile' && (
        <div className="dashboard profile-page-wrapper">
          {/* Top Profile Hero Header */}
          <div className="profile-hero-banner">
            <div className="profile-hero-flex">
              <div className="profile-hero-left">
                <div className="profile-photo-wrapper">
                  <div className="profile-avatar-circle profile-avatar-lg">
                    {profileForm.avatarUrl ? (
                      <img src={profileForm.avatarUrl} alt={profileForm.name} />
                    ) : (
                      <span>{getInitials(profileForm.name)}</span>
                    )}
                  </div>
                  <label
                    htmlFor="hero-profile-photo-input"
                    className="photo-edit-overlay-btn"
                    title="Change Profile Picture"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      id="hero-profile-photo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>

                <div className="profile-hero-details">
                  <h1>
                    {profileForm.name || 'User Profile'}
                    <span className="verified-tag">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified Account
                    </span>
                  </h1>
                  <p>
                    {profileForm.roleTitle || profileForm.profession || 'Legal Representative'} · {profileForm.companyName || 'Apex Legal Advisory'}
                  </p>
                  <p className="font-mono text-xs text-slate-400">{userProfile.email}</p>
                  <p className="profile-bio-text">{profileForm.bio || 'Commercial contract attorney specializing in MSME compliance, contract risk governance, and vendor negotiations.'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  className={`button button-small ${isEditingProfile ? 'button-dark' : 'button-coral'}`}
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  <FileEdit className="w-3.5 h-3.5" /> {isEditingProfile ? 'Done Editing' : 'Edit Profile'}
                </button>
                <button className="button button-light button-small" onClick={() => exportUserDataApi()}>
                  <Download className="w-3.5 h-3.5" /> GDPR Archive
                </button>
              </div>
            </div>

            {/* Audit & Health Stats Strip */}
            <div className="profile-stat-strip">
              <div className="stat-strip-box">
                <b>{userProfile.stats?.contractsAnalyzed || 18}</b>
                <span>Contracts Analyzed</span>
              </div>
              <div className="stat-strip-box">
                <b className="text-emerald-600">{userProfile.stats?.avgHealthScore || 78}/100</b>
                <span>Avg Health Score</span>
              </div>
              <div className="stat-strip-box">
                <b className="text-indigo-600">{userProfile.stats?.risksResolved || 42}</b>
                <span>Risks Resolved</span>
              </div>
            </div>
          </div>

          {/* Form Content Cards */}
          <div className="space-y-4">
            <div className="profile-card-section">
              <div className="section-title-bar">
                <h3>
                  <User className="w-4 h-4 text-indigo-500" /> Personal & Account Information
                </h3>
              </div>
              <div className="profile-field-grid-2">
                <div className="form-group-item">
                  <label>Full Name</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label>Email Address</label>
                  <input type="email" disabled value={userProfile.email || ''} />
                </div>
                <div className="form-group-item">
                  <label>Job Title / Role</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.roleTitle || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, roleTitle: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    disabled={!isEditingProfile}
                    value={profileForm.phone || profileForm.mobileNumber || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group-item col-span-1 md:col-span-2">
                  <label>Professional Bio</label>
                  <textarea
                    rows={2}
                    disabled={!isEditingProfile}
                    value={profileForm.bio || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="profile-card-section">
              <div className="section-title-bar">
                <h3>
                  <Building className="w-4 h-4 text-indigo-500" /> Organization & Enterprise Profile
                </h3>
              </div>
              <div className="profile-field-grid-2">
                <div className="form-group-item">
                  <label>Company Name</label>
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={profileForm.companyName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label>Enterprise Type</label>
                  <select
                    disabled={!isEditingProfile}
                    value={profileForm.companyType || 'MSME'}
                    onChange={(e) => setProfileForm({ ...profileForm, companyType: e.target.value })}
                  >
                    <option value="MSME">Micro, Small & Medium Enterprise (MSME)</option>
                    <option value="Startup">Early-stage Startup</option>
                    <option value="Corporate">Mid-market / Corporate</option>
                    <option value="LawFirm">Legal Practice / Law Firm</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="profile-card-section">
              <div className="section-title-bar">
                <h3>
                  <LockKeyhole className="w-4 h-4 text-indigo-500" /> Security & Authentication
                </h3>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button className="button button-outline button-small" onClick={() => setChangePasswordModalOpen(true)}>
                  <KeyRound className="w-3.5 h-3.5" /> Change Password
                </button>
                <button className="button button-outline button-small" onClick={() => setChangeEmailModalOpen(true)}>
                  <Mail className="w-3.5 h-3.5" /> Update Email
                </button>
              </div>
            </div>

            {/* Sticky Actions Bar if editing */}
            {isEditingProfile && (
              <div className="profile-actions-bar">
                <span className="text-xs text-slate-500">Unsaved changes in profile</span>
                <div className="flex gap-2">
                  <button className="button button-light button-small" onClick={handleCancelProfileEdit}>
                    Cancel
                  </button>
                  <button className="button button-coral button-small" onClick={handleSaveProfile} disabled={isSavingProfile}>
                    {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. SETTINGS VIEW                                                         */}
      {/* ========================================================================= */}
      {currentView === 'settings' && (
        <div className="dashboard max-w-3xl mx-auto">
          <div className="dashboard-top">
            <div>
              <p className="eyebrow">
                <Settings className="w-3.5 h-3.5" /> System Preferences
              </p>
              <h1>
                Application <em>Settings</em>
              </h1>
              <p className="dashboard-subtitle">Configure theme appearance, notification thresholds, and data privacy.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold mb-3">Theme & Display</h3>
              <div className="flex gap-2">
                <button
                  className={`button button-small ${theme === 'light' ? 'button-dark' : 'button-light'}`}
                  onClick={() => toggleTheme('light')}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
                </button>
                <button
                  className={`button button-small ${theme === 'dark' ? 'button-dark' : 'button-light'}`}
                  onClick={() => toggleTheme('dark')}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark Mode
                </button>
              </div>
            </div>

            <div className="bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold mb-3">Compliance & Statutory Safeguards</h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span>Enforce Section 15 MSMED Act 2006 statutory 45-day payment cap alerts</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span>Highlight uncapped indemnities exceeding contract value</span>
                </label>
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
                <BarChart3 className="w-3.5 h-3.5" /> Platform Oversight
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
                <Users className="w-4 h-4" />
              </div>
              <div className="stat-info">
                <b>{adminStats.totalUsers}</b>
                <span>Registered Users</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon coral">
                <FileText className="w-4 h-4" />
              </div>
              <div className="stat-info">
                <b>{adminStats.activeContracts}</b>
                <span>Active Contracts</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="stat-info">
                <b>{adminStats.avgHealthScore}/100</b>
                <span>Avg Platform Health</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="stat-info">
                <b>{adminStats.systemUptime}</b>
                <span>Engine Uptime</span>
              </div>
            </div>
          </div>

          {/* Most Frequent Risk Patterns */}
          <div className="bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 shadow-sm mb-6">
            <h3 className="text-base font-bold mb-4">Most Frequent Risky Clause Patterns (Cross-Organization)</h3>
            <div className="space-y-4">
              {adminStats.riskFrequency?.map((r: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{r.category}</span>
                    <span className={r.riskLevel === 'critical' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                      {r.percentage}% of contracts
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${r.riskLevel === 'critical' ? 'bg-rose-600' : r.riskLevel === 'high' ? 'bg-amber-500' : 'bg-yellow-500'}`}
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
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <FileUp className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold">Analyze a Contract</h2>
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
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-subtle p-6 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
                <Upload className="w-7 h-7 text-indigo-500 mb-2" />
                <b className="text-xs font-bold text-main">{selectedFile ? selectedFile.name : 'Select or drop contract file'}</b>
                <span className="text-[11px] text-slate-400 mt-1">PDF, DOCX, or text file up to 50MB</span>
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
                className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs text-main outline-none focus:border-indigo-500"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
            )}

            <button
              className="button button-coral w-full py-2.5 mt-4 font-bold"
              onClick={handleUploadAndAnalyze}
            >
              Start AI Risk Audit
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SHARE CONTRACT                                                     */}
      {/* ========================================================================= */}
      {shareModalOpen && (
        <div className="modal-backdrop" onClick={() => setShareModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShareModalOpen(false)}>
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Share2 className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold">Invite Collaborator</h2>
            </div>

            <form onSubmit={handleShareContract} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Collaborator Email</label>
                <input
                  type="email"
                  required
                  placeholder="lawyer@counterparty.com"
                  className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-main outline-none focus:border-indigo-500"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Permission Role</label>
                <select
                  className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-main outline-none"
                  value={shareRole}
                  onChange={(e: any) => setShareRole(e.target.value)}
                >
                  <option value="view">Can View & Read Analysis</option>
                  <option value="comment">Can Review & Comment</option>
                  <option value="edit">Can Edit Clauses & Accept Redlines</option>
                </select>
              </div>

              <button type="submit" className="button button-coral w-full py-2.5 mt-2 font-bold">
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

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <History className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold">Record Version Snapshot</h2>
            </div>

            <form onSubmit={handleCreateVersionSnapshot} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Version Note / Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Post-renegotiation payment terms accepted"
                  className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-main outline-none focus:border-indigo-500"
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="button button-coral w-full py-2.5 mt-2 font-bold">
                Save Snapshot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE PASSWORD                                                    */}
      {/* ========================================================================= */}
      {changePasswordModalOpen && (
        <div className="modal-backdrop" onClick={() => setChangePasswordModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setChangePasswordModalOpen(false)}>
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold">Change Account Password</h2>
            </div>

            {passwordFeedback.error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordFeedback.error}</span>
              </div>
            )}
            {passwordFeedback.success && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{passwordFeedback.success}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-9 text-xs text-main outline-none focus:border-indigo-500"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-slate-400"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-9 text-xs text-main outline-none focus:border-indigo-500"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-slate-400"
                    onClick={() => setShowNewPass(!showNewPass)}
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-9 text-xs text-main outline-none focus:border-indigo-500"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-slate-400"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="button button-coral w-full py-2.5 mt-2 font-bold" disabled={passwordSaving}>
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE EMAIL                                                       */}
      {/* ========================================================================= */}
      {changeEmailModalOpen && (
        <div className="modal-backdrop" onClick={() => setChangeEmailModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setChangeEmailModalOpen(false)}>
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Mail className="w-4 h-4 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold">Update Account Email</h2>
            </div>

            {emailFeedback.error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{emailFeedback.error}</span>
              </div>
            )}
            {emailFeedback.success && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{emailFeedback.success}</span>
              </div>
            )}

            <form onSubmit={handleChangeEmailSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">New Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="newemail@company.com"
                  className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-main outline-none focus:border-indigo-500"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Current Password for Verification</label>
                <input
                  type="password"
                  required
                  className="w-full bg-subtle border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-main outline-none focus:border-indigo-500"
                  value={emailForm.currentPassword}
                  onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                />
              </div>

              <button type="submit" className="button button-coral w-full py-2.5 mt-2 font-bold" disabled={emailSaving}>
                {emailSaving ? 'Updating...' : 'Save New Email'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating AI Chat Assistant */}
      <div className="chat-widget">
        {chatOpen ? (
          <div className="chat-window">
            <header>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <b className="text-xs">Contract AI Assistant</b>
              </div>
              <button className="text-slate-400 hover:text-white" onClick={() => setChatOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="chat-messages">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-msg ${msg.role}`}>
                  <p>{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] opacity-75 font-mono">
                      Sources: {msg.sources.join(', ')}
                    </div>
                  )}
                </div>
              ))}
              {chatTyping && (
                <div className="chat-msg assistant text-xs italic text-slate-500">
                  AI Assistant is analyzing contract clauses...
                </div>
              )}
            </div>

            <form className="chat-input" onSubmit={handleSendChat}>
              <input
                type="text"
                placeholder="Ask about payment or liabilities..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="button button-coral button-small px-3">
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        ) : (
          <button className="chat-launcher" onClick={() => setChatOpen(true)}>
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Ask Contract AI</span>
          </button>
        )}
      </div>

      {/* Site Footer */}
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <button className="brand text-white" onClick={() => navigateTo('welcome')}>
              <div className="brand-mark bg-white text-slate-900">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-white">
                Contract<span className="text-indigo-400">Sense</span>
              </span>
            </button>
            <p className="text-xs text-slate-400 mt-2.5 max-w-xs">
              AI-Powered contract analysis, MSMED compliance auditing, and redline management for modern businesses.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <span>Platform</span>
              <button onClick={() => navigateTo('dashboard')}>Dashboard</button>
              <button onClick={() => navigateTo('generator')}>AI Generator</button>
              <button onClick={() => navigateTo('clause_library')}>Clause Library</button>
              <button onClick={() => navigateTo('compare')}>Version Diff</button>
            </div>
            <div>
              <span>Compliance</span>
              <button onClick={() => showToast('MSMED Act 2006 Rule Engine Active')}>MSMED Act 2006</button>
              <button onClick={() => exportUserDataApi()}>GDPR Data Export</button>
              <button onClick={() => navigateTo('admin')}>Admin Metrics</button>
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
