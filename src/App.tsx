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
import {
  ScalesOfJusticeWatermark,
  LegalLedgerIcon,
  StatutoryMSMEDBadge,
  IndianContractActBadge,
  ConstitutionSealStamp,
  IndianLegalEmptyBanner,
} from './LegalMotifs'

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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editorTab, setEditorTab] = useState<'clauses' | 'inspector'>('clauses')
  const [heroPreviewTab, setHeroPreviewTab] = useState<'risks' | 'redlines' | 'msmed'>('risks')

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
    const activeTheme = savedTheme || 'dark'
    setTheme(activeTheme)
    document.documentElement.classList.toggle('dark', activeTheme === 'dark')
    document.documentElement.classList.toggle('light', activeTheme === 'light')

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
    document.documentElement.classList.toggle('light', newTheme === 'light')
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

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: chatInput.trim() }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatTyping(true)

    const contractContext = {
      fileName: documentName,
      healthScore,
      summary,
      clauses: clausesList.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        riskLevel: c.riskLevel,
        riskScore: c.riskScore,
        text: c.text,
        explanation: c.explanation,
        actReference: c.actReference,
        redline: c.redline,
      })),
    }

    const res = await askContractChatApi(documentId, userMsg.content, chatMessages, contractContext)
    setChatTyping(false)

    if (res && res.content) {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: res.content, sources: res.sources },
      ])
    } else {
      const q = userMsg.content.toLowerCase()
      let dynamicFallback = ''
      let sources: string[] = []

      if (/^(hi|hello|hey|ok|okay|thanks|thank you)\b/i.test(q)) {
        dynamicFallback = "Hello! I am your expert AI Legal Assistant. How can I help you analyze, audit, or redline your contract today?"
      } else {
        const matchingClause = clausesList.find((c) =>
          q.split(' ').some((word) => word.length > 3 && (c.title.toLowerCase().includes(word) || c.category.toLowerCase().includes(word) || c.text.toLowerCase().includes(word)))
        )

        if (matchingClause) {
          dynamicFallback = `Regarding "${matchingClause.title}" in ${documentName}: "${matchingClause.text}". ${matchingClause.explanation || ''} ${matchingClause.actReference ? `Statutory reference: ${matchingClause.actReference}.` : ''}`
          sources = [matchingClause.title]
        } else {
          dynamicFallback = `Based on "${documentName}" (Health Score: ${healthScore}/100), ${clausesList.length} clauses were audited. You can ask directly about payment terms, MSMED statutory deadlines, liability caps, or redlines.`
          sources = clausesList.slice(0, 2).map((c) => c.title)
        }
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: dynamicFallback,
          sources,
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
        <button className="brand flex-shrink-0" onClick={() => navigateTo('welcome')} aria-label="ContractSense Home">
          <div className="brand-mark">
            <Scale className="w-5 h-5" />
          </div>
          <span>
            Contract<span>Sense</span>
          </span>
        </button>

        {/* Desktop & Tablet Navigation Links: Horizontal Scroll Container */}
        <div className="nav-scroll-wrapper overflow-x-auto flex-1 scrollbar-thin">
          <nav className="main-nav">
            <button
              className={`px-4 py-2.5 text-base font-medium rounded-lg ${currentView === 'dashboard' ? 'nav-active' : ''}`}
              onClick={() => navigateTo('dashboard')}
            >
              <LayoutDashboard className="w-4 h-4 text-violet-400" /> Dashboard
            </button>
            <button
              className={`px-4 py-2.5 text-base font-medium rounded-lg ${currentView === 'contracts' ? 'nav-active' : ''}`}
              onClick={() => navigateTo('contracts')}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" /> My Contracts
            </button>
            <button
              className={`px-4 py-2.5 text-base font-medium rounded-lg ${currentView === 'editor' ? 'nav-active' : ''}`}
              onClick={() => navigateTo('editor')}
            >
              <FileEdit className="w-4 h-4 text-amber-400" /> Contract Editor
            </button>
            <button
              className={`px-4 py-2.5 text-base font-medium rounded-lg ${currentView === 'generator' ? 'nav-active' : ''}`}
              onClick={() => navigateTo('generator')}
            >
              <Sparkles className="w-4 h-4 text-violet-400" /> AI Generator
            </button>
            <button
              className={`px-4 py-2.5 text-base font-medium rounded-lg ${currentView === 'clause_library' ? 'nav-active' : ''}`}
              onClick={() => navigateTo('clause_library')}
            >
              <Layers className="w-4 h-4 text-blue-400" /> Clause Library
            </button>
            <button
              className={`px-4 py-2.5 text-base font-medium rounded-lg ${currentView === 'compare' ? 'nav-active' : ''}`}
              onClick={() => navigateTo('compare')}
            >
              <History className="w-4 h-4 text-purple-400" /> Compare
            </button>
            <button
              className={`px-4 py-2.5 text-base font-medium rounded-lg ${currentView === 'admin' ? 'nav-active' : ''}`}
              onClick={() => navigateTo('admin')}
            >
              <BarChart3 className="w-4 h-4 text-rose-400" /> Admin Analytics
            </button>
          </nav>
        </div>

        {/* Header Right Actions */}
        <div className="header-actions flex-shrink-0">
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
          <button className="button button-coral button-small hidden sm:inline-flex rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(124,58,237,0.35)]" onClick={() => setUploadModalOpen(true)}>
            <FileUp className="w-4 h-4" /> Upload Contract
          </button>

          {/* User Profile Avatar Dropdown */}
          <div className="profile-nav-container">
            <button
              className="profile-trigger-btn rounded-lg"
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
              <div className="popover-menu rounded-xl" style={{ width: '270px', top: '48px' }}>
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
                    className="popover-item rounded-lg"
                    onClick={() => {
                      setIsEditingProfile(false)
                      navigateTo('profile')
                      setProfileDropdownOpen(false)
                    }}
                  >
                    <User className="w-4 h-4 text-indigo-500" /> View Profile
                  </button>
                  <button
                    className="popover-item rounded-lg"
                    onClick={() => {
                      setIsEditingProfile(true)
                      navigateTo('profile')
                      setProfileDropdownOpen(false)
                    }}
                  >
                    <FileEdit className="w-4 h-4 text-emerald-600" /> Edit Profile
                  </button>
                  <button
                    className="popover-item rounded-lg"
                    onClick={() => {
                      navigateTo('settings')
                      setProfileDropdownOpen(false)
                    }}
                  >
                    <Settings className="w-4 h-4 text-slate-500" /> Settings
                  </button>
                  <button
                    className="popover-item rounded-lg"
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
                    className="popover-item danger-item rounded-lg"
                    onClick={async () => {
                      setProfileDropdownOpen(false)
                      await logoutUser()
                      setIsLoggedIn(false)
                      setCurrentView('welcome')
                      showToast('Signed out of session')
                    }}
                  >
                    <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-menu-btn rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>
      {/* Mobile Slide-over Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-white/10">
              <span className="font-extrabold text-sm text-white tracking-wider uppercase">Menu</span>
              <button className="icon-btn rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <button className={`mobile-nav-item rounded-lg ${currentView === 'welcome' ? 'active' : ''}`} onClick={() => navigateTo('welcome')}>
              <Sparkles className="w-4 h-4 text-violet-400" /> Overview & Hero
            </button>
            <button className={`mobile-nav-item rounded-lg ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>
              <LayoutDashboard className="w-4 h-4 text-indigo-400" /> Risk Dashboard
            </button>
            <button className={`mobile-nav-item rounded-lg ${currentView === 'contracts' ? 'active' : ''}`} onClick={() => navigateTo('contracts')}>
              <BookOpen className="w-4 h-4 text-emerald-400" /> My Contracts
            </button>
            <button className={`mobile-nav-item rounded-lg ${currentView === 'editor' ? 'active' : ''}`} onClick={() => navigateTo('editor')}>
              <FileEdit className="w-4 h-4 text-amber-400" /> Clause Editor
            </button>
            <button className={`mobile-nav-item rounded-lg ${currentView === 'generator' ? 'active' : ''}`} onClick={() => navigateTo('generator')}>
              <Sparkles className="w-4 h-4 text-violet-400" /> Agreement Generator
            </button>
            <button className={`mobile-nav-item rounded-lg ${currentView === 'clause_library' ? 'active' : ''}`} onClick={() => navigateTo('clause_library')}>
              <Layers className="w-4 h-4 text-blue-400" /> Clause Library
            </button>
            <button className={`mobile-nav-item rounded-lg ${currentView === 'compare' ? 'active' : ''}`} onClick={() => navigateTo('compare')}>
              <History className="w-4 h-4 text-purple-400" /> Version Diff
            </button>
            {userProfile.role === 'admin' && (
              <button className={`mobile-nav-item rounded-lg ${currentView === 'admin' ? 'active' : ''}`} onClick={() => navigateTo('admin')}>
                <ShieldCheck className="w-4 h-4 text-rose-400" /> Admin Console
              </button>
            )}
            <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
              <button className="button button-coral w-full py-3 rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2" onClick={() => { setUploadModalOpen(true); setMobileMenuOpen(false) }}>
                <FileUp className="w-4 h-4" /> Upload Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. WELCOME / LANDING VIEW                                                 */}
      {/* ========================================================================= */}
      {currentView === 'welcome' && (
        <main className="w-full">
          <section className="hero relative overflow-hidden">
            {/* Background Watermark: Scales of Justice */}
            <ScalesOfJusticeWatermark className="w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />

            <div className="hero-copy relative z-10">
              {/* Glowing Pill / Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-[0_0_20px_rgba(124,58,237,0.25)] animate-fade-in-up">
                  <span className="text-violet-400">✦</span> AI-POWERED CONTRACT INTELLIGENCE
                </div>
                <ConstitutionSealStamp title="INDIAN LEGAL INTELLIGENCE" subtitle="MSMED ACT 2006 & STATUTORY AUDIT" />
              </div>

              {/* Oversized Heavy Bold Sans-Serif Hero Title with Elegant Italic Highlighting */}
              <h1 className="hero-title text-4xl sm:text-5xl lg:text-[58px] font-extrabold tracking-tight text-white leading-[1.08] mb-6">
                Detect risky clauses in seconds. <br className="hidden sm:inline" />
                <em className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 font-normal drop-shadow-[0_0_35px_rgba(167,139,250,0.5)]">
                  Protect your business.
                </em>
              </h1>

              <p className="hero-description text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mb-6">
                ContractSense automatically audits MSME & vendor agreements against Indian statutory payment laws, caps unlimited liabilities, flags missing safeguards, and suggests 1-click fair redlines.
              </p>

              {/* Statutory Compliance Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mb-8">
                <StatutoryMSMEDBadge variant="compact" />
                <IndianContractActBadge variant="compact" />
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="hero-cta flex items-center gap-4 flex-wrap mb-8">
                <button
                  className="button button-coral hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] text-base font-bold px-6 py-3.5 rounded-lg flex items-center gap-2.5"
                  onClick={() => setUploadModalOpen(true)}
                >
                  <FileUp className="w-5 h-5" /> Analyze a Contract Now
                </button>
                <button
                  className="button button-dark rounded-lg border border-white/20 hover:border-violet-500/50 hover:bg-white/10 hover:-translate-y-0.5 text-white text-base font-bold px-6 py-3.5 transition-all duration-200 flex items-center gap-2.5"
                  onClick={() => navigateTo('generator')}
                >
                  <Sparkles className="w-5 h-5 text-violet-400" /> Generate New Agreement
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="hero-trust flex items-center gap-6 text-xs text-slate-400 font-medium flex-wrap">
                <span className="inline-flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> MSMED Act 2006 Compliant
                </span>
                <span className="inline-flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SOC2 & GDPR Encrypted
                </span>
                <span className="inline-flex items-center gap-2 text-slate-300">
                  <LockKeyhole className="w-4 h-4 text-violet-400" /> 100% Confidential
                </span>
              </div>
            </div>

            {/* Right Side: Interactive Hero Preview Panel */}
            <div className="hero-visual relative z-10">
              <div className="scan-halo" />

              {/* Modern Layered Preview Panel */}
              <div className="hero-interactive-panel relative z-10 w-full max-w-[500px] rounded-2xl bg-[#121215]/90 border border-white/15 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_0_40px_rgba(124,58,237,0.25)]">
                
                {/* Panel Top Window Bar */}
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                      MSA_Vendor_Agreement.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Audit
                    </span>
                  </div>
                </div>

                {/* Interactive Sub-Tabs */}
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-4">
                  <button
                    type="button"
                    onClick={() => setHeroPreviewTab('risks')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      heroPreviewTab === 'risks'
                        ? 'bg-violet-600/30 text-white border border-violet-500/50 shadow-md shadow-violet-950/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> 3 High Risks
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroPreviewTab('redlines')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      heroPreviewTab === 'redlines'
                        ? 'bg-violet-600/30 text-white border border-violet-500/50 shadow-md shadow-violet-950/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Smart Redline
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroPreviewTab('msmed')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      heroPreviewTab === 'msmed'
                        ? 'bg-violet-600/30 text-white border border-violet-500/50 shadow-md shadow-violet-950/50'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-400" /> MSMED Audit
                  </button>
                </div>

                {/* Tab 1: Risks Content */}
                {heroPreviewTab === 'risks' && (
                  <div className="space-y-2.5 animate-fade-in-up">
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300">Clause 8.2 — Net 90-Day Payment Term</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Critical
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          Violates Section 15 of MSMED Act 2006 (Maximum statutory payment term is 45 days).
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300">Clause 14.1 — Unlimited Consequential Liability</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            High
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          Exposes vendor to uncapped damages. Recommended cap: 100% of contract fee.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-medium text-slate-300">Overall Contract Health Score</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-rose-400 text-sm">
                        <span>54 / 100</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Needs Revision)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Redline Content */}
                {heroPreviewTab === 'redlines' && (
                  <div className="space-y-3 animate-fade-in-up">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                        Draft Redline Proposed by ContractSense AI:
                      </span>
                      <div className="space-y-2 text-xs font-mono leading-relaxed">
                        <div className="p-2 rounded bg-rose-500/15 text-rose-300 border-l-2 border-rose-500 line-through">
                          "Buyer shall settle all undisputed invoices within ninety (90) calendar days from receipt..."
                        </div>
                        <div className="p-2 rounded bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-500">
                          "Buyer shall settle all undisputed invoices within forty-five (45) days in strict compliance with MSMED Act 2006 Section 15..."
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" /> Legally enforceable statutory override
                      </span>
                      <span className="text-violet-400 font-semibold cursor-pointer hover:underline" onClick={() => setUploadModalOpen(true)}>
                        Accept redline →
                      </span>
                    </div>
                  </div>
                )}

                {/* Tab 3: MSMED Audit */}
                {heroPreviewTab === 'msmed' && (
                  <div className="space-y-2.5 animate-fade-in-up">
                    <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/25">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-violet-300">Section 16 Statutory Interest Mandate</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-violet-500/20 text-violet-300">
                          Mandatory Law
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Buyer is liable to pay compound interest at 3× the RBI bank rate with monthly rests for delayed payments exceeding 45 days.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Max Term Allowed</span>
                        <b className="text-sm font-bold text-white mt-0.5 block">45 Days</b>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Compound Penalty</span>
                        <b className="text-sm font-bold text-emerald-400 mt-0.5 block">3× RBI Rate</b>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Badge 1 (Top-Right): 96% Audit Confidence */}
                <div className="absolute -top-4 -right-3 sm:-right-6 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#18181b]/95 border border-violet-500/40 shadow-xl shadow-purple-950/60 backdrop-blur-xl animate-float-slow">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <b className="text-[11px] text-white block leading-tight">96% Audit Confidence</b>
                    <small className="text-[9px] text-slate-400 font-mono block">Statutory Legal Engine</small>
                  </div>
                </div>

                {/* Floating Badge 2 (Bottom-Left): MSMED Violation Detected */}
                <div className="absolute -bottom-4 -left-3 sm:-left-6 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#18181b]/95 border border-rose-500/40 shadow-xl shadow-black/80 backdrop-blur-xl animate-float-slow [animation-delay:2s]">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <b className="text-[11px] text-rose-300 block leading-tight">MSMED Violation Detected</b>
                    <small className="text-[9px] text-slate-400 font-mono block">Section 15 — Term exceeds 45 days</small>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Process Section (wearedirect.co Bento Card Layout) */}
          <section className="section bg-transparent py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
            <div className="max-w-6xl mx-auto">
              {/* Center Subtitle Badge */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                  <span className="text-violet-400">✦</span> HOW IT WORKS
                </div>
              </div>

              {/* Oversized Headline with Dynamic Gradient Text */}
              <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                From risky PDF to{' '}
                <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 font-normal drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                  protected agreement
                </span>{' '}
                in three steps.
              </h2>
              <p className="text-center text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-14 leading-relaxed">
                Our OCR, clause chunker, and statutory legal engine streamline the entire contract review and negotiation workflow in seconds.
              </p>

              {/* 3-Column Bento Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Step 1 Bento Card */}
                <div className="bento-step-card group">
                  <div>
                    {/* Top Step Badge & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="step-badge-pill bg-violet-500/15 border border-violet-500/30 text-violet-300">
                        STEP 01
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:bg-violet-600/20 group-hover:border-violet-500/40 transition-all duration-300">
                        <Upload className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-violet-300 transition-colors">
                      Upload Contract
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed mb-6">
                      Upload any PDF, DOCX, scanned agreement, or paste raw covenants. Our OCR extracts every clause with semantic precision.
                    </p>
                  </div>

                  {/* Visual Bento Mini-Panel */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2 group-hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="truncate max-w-[140px] text-white font-semibold">Vendor_Agreement.pdf</span>
                      <span className="text-emerald-400 font-bold">● Parsed</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">PDF</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-300 border border-white/10">DOCX</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">18 Clauses</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 Bento Card */}
                <div className="bento-step-card group">
                  <div>
                    {/* Top Step Badge & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="step-badge-pill bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        STEP 02
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:border-amber-500/40 transition-all duration-300">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-amber-300 transition-colors">
                      Instant Risk Audit
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed mb-6">
                      AI audits covenants against MSMED Act Section 15/16, Arbitration rules, and Commercial benchmarks to flag critical traps.
                    </p>
                  </div>

                  {/* Visual Bento Mini-Panel */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2 group-hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> MSMED 45-Day Violation
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300">High Risk</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Unlimited Consequential Damages</span>
                      <span className="text-amber-400 font-semibold">Flagged</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 Bento Card */}
                <div className="bento-step-card group">
                  <div>
                    {/* Top Step Badge & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="step-badge-pill bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        STEP 03
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-300">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2.5 group-hover:text-emerald-300 transition-colors">
                      Accept Redlines & Sign
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed mb-6">
                      Review side-by-side redlines, accept statutory revisions in the editor, and export an execution-ready protected PDF.
                    </p>
                  </div>

                  {/* Visual Bento Mini-Panel */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2 group-hover:border-white/10 transition-colors">
                    <div className="text-[11px] font-mono leading-tight">
                      <span className="text-rose-400 line-through block">Net 90-Day Payment</span>
                      <span className="text-emerald-400 font-bold block mt-0.5">→ Net 45-Day Statutory Override</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-slate-400">
                      <span className="text-emerald-400 font-semibold">✓ 1-Click Redline Applied</span>
                      <span className="text-violet-400 font-bold">Export PDF</span>
                    </div>
                  </div>
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
          <div className="dashboard-top relative overflow-hidden">
            {/* Background Watermark: Scales of Justice */}
            <ScalesOfJusticeWatermark className="w-[450px] h-[450px] -right-10 -top-14 opacity-20" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <p className="eyebrow m-0">
                  <FileCheck className="w-3.5 h-3.5" /> Active Contract Risk Audit
                </p>
                <ConstitutionSealStamp title="CONSTITUTION OF INDIA" subtitle="STATUTORY MSMED 2006 JURISDICTION" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {documentName} <em className="text-violet-400">Score: {healthScore}/100</em>
              </h1>
              <p className="dashboard-subtitle text-slate-400 mt-1 max-w-2xl text-xs sm:text-sm">
                Comprehensive statutory risk breakdown, Section 15 payment compliance, and renegotiation recommendations.
              </p>
              
              {/* Compliance Engine Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
                <StatutoryMSMEDBadge variant="compact" />
                <IndianContractActBadge variant="compact" />
              </div>
            </div>

            <div className="dashboard-actions relative z-10 flex flex-wrap gap-2.5 items-center">
              <button className="button button-coral px-6 py-3.5 text-base font-bold rounded-lg flex items-center gap-2.5 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all" onClick={() => navigateTo('editor')}>
                <FileEdit className="w-5 h-5" /> Open In Contract Editor
              </button>
              <button className="button button-outline px-6 py-3.5 text-base font-bold rounded-lg flex items-center gap-2.5 border border-white/20 hover:border-violet-500/50 hover:-translate-y-0.5 transition-all" onClick={() => exportReportApi(documentId, 'pdf')}>
                <Download className="w-5 h-5" /> Export Report (PDF)
              </button>
              <button className="button button-light px-6 py-3.5 text-base font-bold rounded-lg flex items-center gap-2.5 border border-white/15 hover:border-white/30 hover:-translate-y-0.5 transition-all" onClick={() => setShareModalOpen(true)}>
                <Share2 className="w-5 h-5" /> Share with Team
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
            <div className="health-card bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="card-heading flex justify-between items-center pb-3 mb-4 border-b border-white/10">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">Contract Health Score</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Statutory Engine Active
                </span>
              </div>
              <div className="health-content flex items-center gap-5">
                {/* Circular Neon Meter */}
                <div className="relative w-28 h-28 min-w-[112px] grid place-items-center">
                  <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="70" className="stroke-white/10 fill-none stroke-[12]" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      className="fill-none stroke-[12] transition-all duration-700"
                      style={{
                        strokeDasharray: 452,
                        strokeDashoffset: 452 - (452 * healthScore) / 100,
                        stroke: healthScore > 75 ? '#34d399' : healthScore > 50 ? '#fbbf24' : '#f87171',
                        filter: healthScore > 75 ? 'drop-shadow(0 0 10px rgba(52,211,153,0.6))' : 'drop-shadow(0 0 10px rgba(248,113,113,0.6))',
                        strokeLinecap: 'round',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <b className="text-3xl font-extrabold text-white leading-none">{healthScore}</b>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">/ 100</span>
                  </div>
                </div>
                <div className="health-text space-y-2">
                  <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                    healthScore < 60 ? 'crimson-glass-badge' : 'emerald-glass-badge'
                  }`}>
                    {summary?.overallRiskLevel
                      ? `${summary.overallRiskLevel.toUpperCase()} RISK PROFILE`
                      : healthScore < 60
                      ? 'HIGH RISK PROFILE'
                      : 'BALANCED PROFILE'}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {summary?.protectionDetail ||
                      (healthScore < 60
                        ? 'Contains critical payment and liability terms under MSMED Act 2006. Prompt renegotiation advised.'
                        : 'Equitable terms with balanced mutual rights.')}
                  </p>
                </div>
              </div>
              <div className="health-footer flex flex-wrap justify-between items-center pt-4 mt-4 border-t border-white/10 text-xs text-slate-400 font-mono gap-2">
                <span>Confidence: <b className="text-white">96% Statutory</b></span>
                <span>Jurisdiction: <b className="text-white">India / MSMED 2006</b></span>
              </div>
            </div>

            <div className="recommend-card bg-[#18181f] border border-violet-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="eyebrow text-violet-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs">
                    <Sparkles className="w-3.5 h-3.5" /> Priority Recommendation
                  </p>
                  <IndianContractActBadge variant="compact" />
                </div>
                <h2 className="text-lg font-bold text-white my-2">{summary?.recommendation || (topConcern ? `Fix: ${topConcern.title}` : 'Review Contract Terms')}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {summary?.recommendationDetail || topConcern?.explanation || 'Inspect flagged clauses and apply suggested statutory redlines before execution.'}
                </p>
              </div>
              {topConcern && (
                <button
                  className="button button-coral button-small mt-4 w-fit hover:scale-105 transition-all shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                  onClick={() => {
                    setSelectedClause(topConcern)
                    navigateTo('editor')
                  }}
                >
                  <Check className="w-3.5 h-3.5" /> Inspect Top Concern & Redline
                </button>
              )}
            </div>

            <div className="protection-card bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <div>
                <p className="eyebrow text-emerald-400 flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs">
                  <ShieldAlert className="w-3.5 h-3.5" /> Missing Protection
                </p>
                <h3 className="text-lg font-bold text-white my-2">{missingProtections[0]?.title || 'Standard Protections Applied'}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {missingProtections[0]?.text || 'No critical statutory safeguards missing from this agreement.'}
                </p>
              </div>
              <button
                className="button button-outline button-small mt-4 w-fit"
                onClick={() => navigateTo('clause_library')}
              >
                <Plus className="w-3.5 h-3.5" /> Browse Approved Clauses
              </button>
            </div>
          </div>

          {/* Top Concerns Cards */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Top Clause Concerns & Risk Audit</h3>
                <p className="text-xs text-slate-400">Click any risk card to inspect statutory explanation & apply side-by-side redlines</p>
              </div>
              <button className="button button-ghost button-small text-violet-400 hover:text-violet-300 font-bold" onClick={() => navigateTo('editor')}>
                Open Split-Pane Editor ({clausesList.length} Clauses) <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {clausesList.map((clause) => {
                const isHigh = clause.riskLevel === 'critical' || clause.riskLevel === 'high'
                return (
                  <div
                    key={clause.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isHigh
                        ? 'bg-[#18181f] border-rose-500/30 hover:border-rose-500/60 shadow-lg shadow-rose-950/20'
                        : 'bg-[#121215] border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => {
                      setSelectedClause(clause)
                      navigateTo('editor')
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                          {clause.category}
                        </span>
                        <span className={`risk-pill risk-${clause.riskLevel}`}>
                          {riskMeta[clause.riskLevel].label}
                        </span>
                      </div>

                      {isHigh && (
                        <div className="crimson-glass-badge p-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 mb-2.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>CRITICAL RISK DETECTED</span>
                        </div>
                      )}

                      <h4 className="text-base font-bold text-white mb-1.5">{clause.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{clause.explanation}</p>
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold text-violet-400 pt-3 border-t border-white/10">
                      <span>Risk Score: <b className={isHigh ? 'text-rose-400' : 'text-emerald-400'}>{clause.riskScore}/100</b></span>
                      <span className="flex items-center gap-0.5 text-xs font-bold hover:underline">
                        Inspect & Redline <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONTRACT EDITOR (INLINE + SIDE PANEL)                                  */}
      {/* ========================================================================= */}
      {currentView === 'editor' && (
        <div className="dashboard">
          {/* Top Header & Actions */}
          <div className="dashboard-top">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-2.5 backdrop-blur-md">
                <span className="text-violet-400">✦</span> CONTRACT INTELLIGENCE WORKBENCH
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {documentName} <em className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 font-normal">(Live Analysis & Redlines)</em>
              </h1>
              <p className="dashboard-subtitle text-slate-400 text-xs sm:text-sm mt-1">
                Inspect AI statutory audits, view high-contrast side-by-side redlines, and execute 1-click statutory protections.
              </p>
            </div>
            <div className="dashboard-actions">
              <button className="button button-outline px-5 py-3 text-sm sm:text-base font-bold rounded-lg flex items-center gap-2 border border-white/20 hover:border-violet-500/50 hover:-translate-y-0.5 transition-all" onClick={() => setVersionSnapshotModalOpen(true)}>
                <History className="w-5 h-5" /> Save Snapshot
              </button>
              <button className="button button-light px-5 py-3 text-sm sm:text-base font-bold rounded-lg flex items-center gap-2 border border-white/15 hover:border-white/30 hover:-translate-y-0.5 transition-all" onClick={() => setShareModalOpen(true)}>
                <Share2 className="w-5 h-5" /> Invite Collaborator
              </button>
              <button className="button button-coral px-5 py-3 text-sm sm:text-base font-bold rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all" onClick={() => exportReportApi(documentId, 'pdf')}>
                <Download className="w-5 h-5" /> Export Final Contract
              </button>
            </div>
          </div>

          {/* Mobile Tab Switcher for Editor */}
          <div className="flex lg:hidden bg-[#121215] p-1 rounded-xl mb-4 border border-white/10">
            <button
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editorTab === 'clauses' ? 'bg-violet-600/30 border border-violet-500/40 text-white shadow-md' : 'text-slate-400'}`}
              onClick={() => setEditorTab('clauses')}
            >
              Document Clauses ({clausesList.length})
            </button>
            <button
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editorTab === 'inspector' ? 'bg-violet-600/30 border border-violet-500/40 text-white shadow-md' : 'text-slate-400'}`}
              onClick={() => setEditorTab('inspector')}
            >
              AI Redline Inspector
            </button>
          </div>

          {/* High-Contrast Split Pane Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Pane: Document Viewer & Clause List (7 Columns) */}
            <div className={`lg:col-span-7 bg-[#121215] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl ${editorTab === 'inspector' ? 'hidden lg:block' : 'block'}`}>
              
              {/* Document Status Banner */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">{documentName}</span>
                  <span className="text-slate-400 text-xs">({clausesList.length} Clauses)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Auto-Saving Active
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                    Health Score: {healthScore}/100
                  </span>
                </div>
              </div>

              {/* Clause Cards List */}
              <div className="space-y-4">
                {clausesList.map((clause) => {
                  const isSelected = selectedClause?.id === clause.id
                  const isHighRisk = clause.riskLevel === 'critical' || clause.riskLevel === 'high'

                  return (
                    <div
                      key={clause.id}
                      className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#18181f] border-violet-500/70 shadow-[0_0_30px_rgba(124,58,237,0.2)] ring-1 ring-violet-500/40'
                          : 'bg-[#16161a] border-white/10 hover:border-white/20 hover:bg-[#1a1a20]'
                      }`}
                      onClick={() => {
                        setSelectedClause(clause)
                        if (window.innerWidth < 1024) setEditorTab('inspector')
                      }}
                    >
                      {/* Clause Top Bar */}
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                            {clause.category}
                          </span>
                          <b className="text-sm font-bold text-white">{clause.title}</b>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`risk-pill risk-${clause.riskLevel}`}>
                            {riskMeta[clause.riskLevel].label}
                          </span>
                        </div>
                      </div>

                      {/* High Risk Callout Badge */}
                      {isHighRisk && !clause.acceptedRedline && (
                        <div className="crimson-glass-badge p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 font-bold text-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>CRITICAL RISK: {clause.title.toUpperCase()} (MSMED VIOLATION)</span>
                          </div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Action Required
                          </span>
                        </div>
                      )}

                      {/* Accepted Redline Badge */}
                      {clause.acceptedRedline && (
                        <div className="emerald-glass-badge p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 font-bold text-emerald-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>STATUTORY REDLINE APPLIED (Net 45-Days Cap Enforced)</span>
                          </div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Enforced
                          </span>
                        </div>
                      )}

                      {/* High-Contrast Clause Textarea */}
                      <textarea
                        className="w-full bg-[#0e0e11] text-white font-mono text-xs leading-relaxed p-3.5 rounded-lg border border-white/10 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/40 outline-none resize-y min-h-[85px] transition-all"
                        value={clause.text}
                        onChange={(e) => handleClauseTextChange(clause.id, e.target.value)}
                        rows={3}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Clause Bottom Footer */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                        <span>Risk Score: <b className={isHighRisk ? 'text-rose-400' : 'text-emerald-400'}>{clause.riskScore}/100</b></span>
                        <div className="flex items-center gap-3">
                          {clause.comments && clause.comments.length > 0 && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <MessageCircle className="w-3 h-3" /> {clause.comments.length}
                            </span>
                          )}
                          <span className="text-violet-400 font-semibold flex items-center gap-0.5 hover:underline">
                            Inspect Analytics <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Pane: Risk & Clause Analytics Modular Stack (5 Columns) */}
            {selectedClause && (
              <div className={`lg:col-span-5 sticky top-20 space-y-4 ${editorTab === 'clauses' ? 'hidden lg:block' : 'block'}`}>
                
                {/* Modular Card 1: Health Score & Real-Time Risk Progress Meter */}
                <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                      CONTRACT HEALTH METER
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Analysis
                    </span>
                  </div>

                  <div className="flex items-center gap-5">
                    {/* Circular Neon Meter */}
                    <div className="relative w-24 h-24 min-w-[96px] grid place-items-center">
                      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                        <circle cx="80" cy="80" r="70" className="stroke-white/10 fill-none stroke-[12]" />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          className="fill-none stroke-[12] transition-all duration-700"
                          style={{
                            strokeDasharray: 452,
                            strokeDashoffset: 452 - (452 * healthScore) / 100,
                            stroke: healthScore > 75 ? '#34d399' : healthScore > 50 ? '#fbbf24' : '#f87171',
                            filter: healthScore > 75 ? 'drop-shadow(0 0 8px rgba(52,211,153,0.5))' : 'drop-shadow(0 0 8px rgba(248,113,113,0.5))',
                            strokeLinecap: 'round',
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <b className="text-2xl font-extrabold text-white leading-none">{healthScore}</b>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">/ 100</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        healthScore < 60 ? 'crimson-glass-badge' : 'emerald-glass-badge'
                      }`}>
                        {healthScore < 60 ? 'HIGH RISK PROFILE' : 'BALANCED PROFILE'}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {healthScore < 60 ? 'Contains critical payment terms violating statutory caps. Accept redlines to normalize.' : 'All clauses compliant with MSMED statutory safeguards.'}
                      </p>
                    </div>
                  </div>

                  {/* Statutory Sub-Progress Bars */}
                  <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2.5">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>MSMED 45-Day Statutory Compliance</span>
                        <span className="text-white font-bold">{selectedClause.acceptedRedline ? '100%' : '35%'}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${selectedClause.acceptedRedline ? 'w-full bg-emerald-500 shadow-[0_0_8px_#34d399]' : 'w-[35%] bg-rose-500 shadow-[0_0_8px_#f87171]'}`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Liability Protection Ratio</span>
                        <span className="text-white font-bold">85%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full w-[85%] bg-amber-500 shadow-[0_0_8px_#fbbf24]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modular Card 2: Selected Clause Statutory Violation Breakdown */}
                <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-violet-400 uppercase tracking-wider block">
                        {selectedClause.category}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">{selectedClause.title}</h3>
                    </div>
                    <span className={`risk-pill risk-${selectedClause.riskLevel}`}>
                      Score: {selectedClause.riskScore}/100
                    </span>
                  </div>

                  {/* High Risk Banner */}
                  {(selectedClause.riskLevel === 'critical' || selectedClause.riskLevel === 'high') && (
                    <div className="crimson-glass-badge p-3 rounded-xl text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <b className="text-rose-200 block text-xs">CRITICAL STATUTORY RISK DETECTED</b>
                        <p className="text-rose-300/90 text-[11px] mt-0.5 leading-relaxed">
                          Violates Section 15 of MSMED Act 2006. Standard business risk requires capping buyer payment to 45 calendar days.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Plain English Explanation */}
                  <div>
                    <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                      Plain English Explanation
                    </span>
                    <div className="p-3 rounded-xl bg-[#0e0e11] border border-white/10 text-xs text-slate-300 leading-relaxed">
                      {selectedClause.explanation}
                    </div>
                  </div>

                  {/* Business Consequences */}
                  <div>
                    <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                      Business Hazard
                    </span>
                    <div className="p-3 rounded-xl bg-[#0e0e11] border border-white/10 text-xs text-slate-300 leading-relaxed">
                      {selectedClause.consequences}
                    </div>
                  </div>

                  {/* Statutory Reference Pill */}
                  {selectedClause.actReference && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <b className="block text-[11px] uppercase font-mono">Statutory Authority</b>
                        <span>{selectedClause.actReference}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modular Card 3: AI Redline Recommendation & 1-Click Execution */}
                <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI STATUTORY REDLINE
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Pre-Approved Redline
                    </span>
                  </div>

                  {/* High-Contrast Diff Box */}
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                      <span className="text-[10px] font-mono font-bold uppercase text-rose-400 block mb-1">
                        Original Covenant (High Risk)
                      </span>
                      <p className="text-xs font-mono text-rose-300/90 line-through leading-relaxed">
                        {selectedClause.redline.original}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-1">
                        Suggested Statutory Redline (Safe)
                      </span>
                      <p className="text-xs font-mono text-emerald-300 font-semibold leading-relaxed">
                        {selectedClause.redline.suggested}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Rationale: {selectedClause.redline.rationale}
                  </p>

                  {/* 1-Click Execution Trigger */}
                  <button
                    className="button button-coral w-full py-3.5 px-6 rounded-lg text-base font-bold flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(124,58,237,0.7)] transition-all cursor-pointer"
                    onClick={() => handleAcceptRedline(selectedClause.id)}
                  >
                    <Check className="w-5 h-5" /> Accept & Apply Redline (1-Click)
                  </button>
                </div>

                {/* Modular Card 4: Clause Comments Thread */}
                <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Collaborative Annotations
                  </span>

                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedClause.comments && selectedClause.comments.length > 0 ? (
                      selectedClause.comments.map((cmt) => (
                        <div key={cmt.id} className="p-2.5 bg-[#0e0e11] rounded-xl border border-white/10">
                          <div className="flex justify-between font-bold text-[11px] text-slate-300">
                            <span>{cmt.authorName}</span>
                            <span className="font-mono text-[9px] text-slate-500">
                              {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{cmt.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-500 italic py-1">No comments on this clause yet.</div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add comment..."
                      className="flex-1 bg-[#0e0e11] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(selectedClause.id)}
                    />
                    <button className="button button-dark px-3.5 py-2 rounded-xl text-xs font-bold" onClick={() => handleAddComment(selectedClause.id)}>
                      <Send className="w-3 h-3" />
                    </button>
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
          <div className="dashboard-top relative overflow-hidden">
            {/* Background Watermark: Scales of Justice */}
            <ScalesOfJusticeWatermark className="w-[450px] h-[450px] -right-10 -top-14 opacity-20" />

            <div className="relative z-10">
              <div className="flex items-center gap-3.5 mb-2">
                <LegalLedgerIcon className="w-12 h-12" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="eyebrow m-0">
                      <BookOpen className="w-3.5 h-3.5" /> Indian Legal Repository & CLM
                    </p>
                    <ConstitutionSealStamp title="LEGAL LEDGER" subtitle="SECTION 15 COMPLIANCE" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                    My Contracts <em>& Audit History</em>
                  </h1>
                </div>
              </div>
              <p className="dashboard-subtitle text-slate-400 max-w-2xl text-xs sm:text-sm">
                Manage, filter, compare, and organize all uploaded and drafted agreements under Indian Commercial & MSMED Law.
              </p>
            </div>

            <div className="dashboard-actions relative z-10 flex flex-wrap gap-2.5 items-center">
              <button className="button button-coral px-6 py-3.5 text-base font-bold rounded-lg flex items-center gap-2.5 shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all" onClick={() => setUploadModalOpen(true)}>
                <FileUp className="w-5 h-5" /> Upload New Contract
              </button>
              <button className="button button-outline px-6 py-3.5 text-base font-bold rounded-lg flex items-center gap-2.5 border border-white/20 hover:border-violet-500/50 hover:-translate-y-0.5 transition-all" onClick={() => navigateTo('generator')}>
                <Sparkles className="w-5 h-5 text-violet-400" /> Generate Agreement
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
                <select className="filter-dropdown rounded-lg" value={tableRiskFilter} onChange={(e) => setTableRiskFilter(e.target.value)}>
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical Risk</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>

                <select className="filter-dropdown rounded-lg" value={tableStatusFilter} onChange={(e) => setTableStatusFilter(e.target.value)}>
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
                  <button className="button button-small button-light rounded-md" onClick={() => handleBulkAction('update_status', 'signed')}>
                    Mark Signed
                  </button>
                  <button className="button button-small button-danger rounded-md" onClick={() => handleBulkAction('delete')}>
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {filteredContracts.length === 0 ? (
              <IndianLegalEmptyBanner
                title="No Agreements in Legal Repository"
                subtitle="Your repository is ready for Indian Contract Act & MSMED compliance auditing. Upload a contract to begin automated clause extraction and risk scoring."
                actionButton={
                  <button
                    className="button button-coral px-6 py-3.5 text-base font-bold rounded-lg flex items-center gap-2.5 shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <FileUp className="w-5 h-5" /> Upload Contract Now
                  </button>
                }
              />
            ) : (
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
                        <div className="flex gap-2 justify-end">
                          <button
                            className="px-4 py-2 text-sm font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-violet-500/50 hover:-translate-y-0.5 transition-all shadow-sm flex items-center gap-1.5"
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
                            <FileText className="w-4 h-4 text-violet-400" /> Editor
                          </button>
                          <button
                            className="px-3 py-2 text-sm font-semibold rounded-md bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 hover:border-rose-500/60 hover:-translate-y-0.5 transition-all shadow-sm flex items-center gap-1.5"
                            onClick={async () => {
                              await deleteContractApi(c.id)
                              showToast('Contract deleted')
                              loadInitialData()
                            }}
                            title="Delete Contract"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
          <div className="modal-panel relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Background Watermark: Scales of Justice */}
            <ScalesOfJusticeWatermark className="w-[360px] h-[360px] -right-16 -top-16 opacity-15" />

            <button className="close-modal relative z-10" onClick={() => setUploadModalOpen(false)}>
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                  <FileUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Upload & Audit Agreement</h2>
                  <p className="text-[11px] text-slate-400">Statutory Indian Contract Act & MSMED 2006 compliance scanner</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <StatutoryMSMEDBadge variant="compact" />
                <IndianContractActBadge variant="compact" />
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  className={`button button-small flex-1 rounded-md ${uploadMode === 'pdf' ? 'button-coral' : 'button-light'}`}
                  onClick={() => setUploadMode('pdf')}
                >
                  Upload PDF / DOCX
                </button>
                <button
                  className={`button button-small flex-1 rounded-md ${uploadMode === 'text' ? 'button-coral' : 'button-light'}`}
                  onClick={() => setUploadMode('text')}
                >
                  Paste Contract Text
                </button>
              </div>

              {uploadMode === 'pdf' ? (
                <label className="border-2 border-dashed border-white/20 bg-black/40 hover:bg-white/5 hover:border-violet-500/60 p-6 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:text-violet-300 transition-all mb-2.5 shadow-[0_0_15px_rgba(124,58,237,0.25)]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <b className="text-sm font-bold text-white">{selectedFile ? selectedFile.name : 'Select or drop contract file'}</b>
                  <span className="text-xs text-slate-400 mt-1">PDF, DOCX, or text file up to 50MB</span>
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
                  placeholder="Paste contract clauses or agreement text here for instant statutory evaluation..."
                  className="w-full bg-black/50 border border-white/15 rounded-lg p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500 transition-colors font-mono leading-relaxed"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
              )}

              <button
                className="button button-coral w-full py-3.5 mt-4 text-base font-bold rounded-lg shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                onClick={handleUploadAndAnalyze}
              >
                <Sparkles className="w-5 h-5 text-white" /> Start AI Statutory Risk Audit
              </button>
            </div>
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

      {/* Floating AI Chat Assistant (wearedirect.co Popover Style) */}
      <div className="chat-widget">
        {chatOpen && (
          <div className="chat-window">
            <header>
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center text-violet-400">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="absolute inset-0 blur-[5px] bg-violet-500/40 rounded-full" />
                </div>
                <div>
                  <b className="text-xs font-bold text-white block leading-tight">Contract AI Intelligence</b>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> MSMED Legal Engine Active
                  </span>
                </div>
              </div>
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setChatOpen(false)}
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* Quick Prompt Suggestions */}
            <div className="px-3.5 py-2 bg-[#18181b]/60 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/5 hover:bg-violet-600/20 text-slate-300 hover:text-white border border-white/10 hover:border-violet-500/40 whitespace-nowrap transition-all"
                onClick={() => setChatInput('Check Clause 8 for MSMED Act Section 15 payment violations')}
              >
                MSMED 45-Day Check
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/5 hover:bg-violet-600/20 text-slate-300 hover:text-white border border-white/10 hover:border-violet-500/40 whitespace-nowrap transition-all"
                onClick={() => setChatInput('Explain uncapped consequential liability risks in plain English')}
              >
                Explain Liabilities
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/5 hover:bg-violet-600/20 text-slate-300 hover:text-white border border-white/10 hover:border-violet-500/40 whitespace-nowrap transition-all"
                onClick={() => setChatInput('Suggest a fair redline for the indemnity clause')}
              >
                Suggest Redline
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="chat-messages">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-msg ${msg.role}`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-violet-300/80 font-mono">
                      Authority: {msg.sources.join(', ')}
                    </div>
                  )}
                </div>
              ))}
              {chatTyping && (
                <div className="chat-msg assistant text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Analyzing contract clauses against statutory rules...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form className="chat-input" onSubmit={handleSendChat}>
              <input
                type="text"
                placeholder="Ask about clauses, statutory risks..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="button button-coral rounded-lg px-4 py-3 hover:-translate-y-0.5 transition-all shadow-[0_0_15px_rgba(124,58,237,0.4)] flex items-center justify-center cursor-pointer">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Trigger Button */}
        <button
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 px-5 py-3 rounded-lg bg-black/85 hover:bg-black backdrop-blur-md border border-white/20 hover:border-violet-500/60 shadow-2xl hover:shadow-[0_0_25px_rgba(124,58,237,0.45)] transition-all duration-300 hover:-translate-y-0.5 text-white cursor-pointer group font-bold text-sm"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <div className="relative flex items-center justify-center text-violet-400">
            <Sparkles className="w-5 h-5 text-violet-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute inset-0 blur-[6px] bg-violet-500/50 rounded-lg animate-pulse" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">Ask Contract AI</span>
        </button>
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
