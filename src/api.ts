// Base API URL resolution with robust path normalization
const rawBase = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:5001'
).trim().replace(/\/$/, '')
const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

function buildAuthHeaders(token?: string): Record<string, string> {
  const resolvedToken = token || localStorage.getItem('contractsense_auth_token') || ''
  return resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}
}

export async function checkBackendHealthApi(): Promise<{ online: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { ...buildAuthHeaders() },
    })
    if (res.ok) {
      const data = await res.json()
      return { online: true, message: data.status || 'operational' }
    }
    return { online: false, message: `Status code ${res.status}` }
  } catch (err: any) {
    return { online: false, message: err.message || 'Backend unreachable' }
  }
}

export async function analyzeContractApi(file?: File | null, text?: string, fileName?: string): Promise<any> {
  const apiUrl = `${API_BASE_URL}/contracts/analyze`
  const docName = file ? file.name : (fileName || 'Pasted-Contract.txt')
  const docType = file ? (file.type || 'application/octet-stream') : 'text/plain'
  const docSize = file ? `${file.size} bytes` : `${(text || '').length} characters`

  console.log('[Frontend Upload] Contract Analysis Request:')
  console.log('  1. File Name:', docName)
  console.log('  2. File Type:', docType)
  console.log('  3. File Size:', docSize)
  console.log('  4. API URL:', apiUrl)
  console.log('  5. HTTP Method: POST')

  let res: Response
  if (file) {
    const formData = new FormData()
    formData.append('file', file)
    res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        ...buildAuthHeaders(),
      },
      body: formData,
    })
  } else if (text) {
    res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ text, fileName: fileName || 'Pasted-Contract.txt' }),
    })
  } else {
    throw new Error('No contract file or text provided')
  }

  console.log('  6. HTTP Status:', res.status)
  const json = await res.json()
  console.log('  7. Response Body:', json)

  if (json.success && json.data) {
    const clauses = json.data.clauses || []
    const riskyClauses = clauses.filter((c: any) => c.riskLevel === 'high' || c.riskLevel === 'critical' || (c.riskScore && c.riskScore >= 60))
    console.log('  8. Number of clauses returned:', clauses.length)
    console.log('  9. Number of risks returned:', riskyClauses.length)
    return json.data
  }

  throw new Error(json.error || 'Contract analysis failed. Please try again.')
}

export async function generateContractApi(payload: {
  contractType: string
  partyA: string
  partyB: string
  jurisdiction: string
  termLength: string
  keyTerms: string
  riskTolerance: 'conservative' | 'balanced' | 'aggressive'
}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.success && json.data) return json.data
  } catch (err: any) {
    console.warn('Generate contract API warning:', err.message)
  }
  return null
}

export async function fetchContractHistoryApi(params?: {
  search?: string
  risk?: string
  status?: string
  sort?: string
}): Promise<any[]> {
  try {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.risk && params.risk !== 'all') query.append('risk', params.risk)
    if (params?.status && params.status !== 'all') query.append('status', params.status)
    if (params?.sort) query.append('sort', params.sort)

    const res = await fetch(`${API_BASE_URL}/contracts?${query.toString()}`, {
      headers: {
        ...buildAuthHeaders(),
      },
    })
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) return json.data
  } catch (err: any) {
    console.warn('Backend history API warning:', err.message)
  }
  return []
}

export async function fetchContractByIdApi(id: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${id}`, {
      headers: {
        ...buildAuthHeaders(),
      },
    })
    const json = await res.json()
    if (json.success && json.data) return json.data
  } catch (err: any) {
    console.warn('Get contract API warning:', err.message)
  }
  return null
}

export async function updateClauseApi(documentId: string, clauseId: string, text: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${documentId}/clauses/${clauseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ text }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function acceptRedlineApi(documentId: string, clauseId: string, action = 'accept', customText?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${documentId}/clauses/${clauseId}/redline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ action, customText }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function createVersionApi(documentId: string, summary: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${documentId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ summary }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function shareContractApi(documentId: string, email: string, role = 'view') {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${documentId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ email, role }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function addCommentApi(documentId: string, content: string, clauseId?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${documentId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ content, clauseId }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function resolveCommentApi(documentId: string, commentId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${documentId}/comments/${commentId}/resolve`, {
      method: 'PATCH',
      headers: {
        ...buildAuthHeaders(),
      },
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function compareContractsApi(v1Id?: string, v2Id?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ version1Id: v1Id, version2Id: v2Id }),
    })
    const json = await res.json()
    if (json.success && json.data) return json.data
  } catch (err) {
    return null
  }
  return null
}

export async function exportReportApi(documentId: string, format = 'txt') {
  window.open(`${API_BASE_URL}/contracts/${documentId}/export?format=${format}`, '_blank')
}

export async function bulkContractActionApi(contractIds: string[], action: 'delete' | 'update_status', status?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ contractIds, action, status }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function deleteContractApi(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${id}`, {
      method: 'DELETE',
      headers: {
        ...buildAuthHeaders(),
      },
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function fetchTemplatesApi(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/templates`, {
      headers: {
        ...buildAuthHeaders(),
      },
    })
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) return json.data
  } catch (err) {
    console.warn('Templates fetch error:', err)
  }
  return []
}

export async function fetchClauseLibraryApi(category?: string): Promise<any[]> {
  try {
    const url = category ? `${API_BASE_URL}/contracts/clause-library?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/contracts/clause-library`
    const res = await fetch(url, {
      headers: {
        ...buildAuthHeaders(),
      },
    })
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) return json.data
  } catch (err) {
    console.warn('Clause library fetch error:', err)
  }
  return []
}

export async function fetchUserProfileApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        ...buildAuthHeaders(),
      },
    })
    const json = await res.json()
    if (json.success && json.data) return json.data
  } catch (err) {
    console.warn('User profile error:', err)
  }
  return null
}

export async function updateUserProfileApi(updates: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify(updates),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function exportUserDataApi() {
  window.open(`${API_BASE_URL}/user/export-data`, '_blank')
}

export async function fetchNotificationsApi(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        ...buildAuthHeaders(),
      },
    })
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) return json.data
  } catch (err) {
    console.warn('Notifications fetch error:', err)
  }
  return []
}

export async function markNotificationReadApi(id: string) {
  try {
    await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        ...buildAuthHeaders(),
      },
    })
  } catch (err) {
    // Ignore
  }
}

export async function markAllNotificationsReadApi() {
  try {
    await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        ...buildAuthHeaders(),
      },
    })
  } catch (err) {
    // Ignore
  }
}

export async function fetchAdminStatsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: {
        ...buildAuthHeaders(),
      },
    })
    const json = await res.json()
    if (json.success && json.data) return json.data
  } catch (err) {
    console.warn('Admin stats error:', err)
  }
  return null
}

export async function askContractChatApi(
  documentId: string,
  question: string,
  history: any[] = [],
  context?: any
): Promise<{ content: string; sources?: string[] } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${documentId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ question, history, context }),
    })
    const json = await res.json()
    if (json.success && json.data) {
      return {
        content: json.data.content,
        sources: json.data.sources,
      }
    }
  } catch (err: any) {
    console.warn('Backend chat API warning:', err.message)
  }
  return null
}

export async function loginApi(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return await res.json()
  } catch (err) {
    return { success: false, error: 'Unable to reach auth server' }
  }
}

export async function signupApi(payload: { name: string; email: string; password: string; companyName?: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return await res.json()
  } catch (err) {
    return { success: false, error: 'Unable to reach auth server' }
  }
}

export async function forgotPasswordApi(email: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return await res.json()
  } catch (err) {
    return { success: false, error: 'Unable to reach auth server' }
  }
}

export async function socialLoginApi(provider: 'google' | 'apple', email?: string, name?: string, avatarUrl?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/social-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, email, name, avatarUrl }),
    })
    return await res.json()
  } catch (err) {
    return { success: false, error: 'Unable to reach auth server for social login' }
  }
}

export async function changePasswordApi(currentPassword: string, newPassword: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    return await res.json()
  } catch (err) {
    return { success: false, error: 'Unable to process password change' }
  }
}

export async function fetchCurrentUserApi(token?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        ...buildAuthHeaders(token),
      },
    })
    return await res.json()
  } catch (err) {
    return { success: false, error: 'Unable to reach auth server' }
  }
}

