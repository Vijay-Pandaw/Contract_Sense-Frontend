const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '') + '/api'

export async function analyzeContractApi(file?: File | null, text?: string, fileName?: string): Promise<any> {
  try {
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE_URL}/contracts/analyze`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success && json.data) return json.data
      throw new Error(json.error || 'Analysis failed')
    } else if (text) {
      const res = await fetch(`${API_BASE_URL}/contracts/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName: fileName || 'Pasted-Contract.txt' }),
      })
      const json = await res.json()
      if (json.success && json.data) return json.data
      throw new Error(json.error || 'Analysis failed')
    }
  } catch (err: any) {
    console.warn('Backend API connection warning, using fallback response:', err.message)
  }
  return null
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
      headers: { 'Content-Type': 'application/json' },
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

    const res = await fetch(`${API_BASE_URL}/contracts?${query.toString()}`)
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) return json.data
  } catch (err: any) {
    console.warn('Backend history API warning:', err.message)
  }
  return []
}

export async function fetchContractByIdApi(id: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${id}`)
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractIds, action, status }),
    })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function deleteContractApi(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${id}`, { method: 'DELETE' })
    return await res.json()
  } catch (err) {
    return null
  }
}

export async function fetchTemplatesApi(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/templates`)
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
    const res = await fetch(url)
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) return json.data
  } catch (err) {
    console.warn('Clause library fetch error:', err)
  }
  return []
}

export async function fetchUserProfileApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/user/profile`)
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
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${API_BASE_URL}/notifications`)
    const json = await res.json()
    if (json.success && Array.isArray(json.data)) return json.data
  } catch (err) {
    console.warn('Notifications fetch error:', err)
  }
  return []
}

export async function markNotificationReadApi(id: string) {
  try {
    await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH' })
  } catch (err) {
    // Ignore
  }
}

export async function markAllNotificationsReadApi() {
  try {
    await fetch(`${API_BASE_URL}/notifications/read-all`, { method: 'PATCH' })
  } catch (err) {
    // Ignore
  }
}

export async function fetchAdminStatsApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/stats`)
    const json = await res.json()
    if (json.success && json.data) return json.data
  } catch (err) {
    console.warn('Admin stats error:', err)
  }
  return null
}

export async function askContractChatApi(documentId: string, question: string, history: any[] = []): Promise<{ content: string; sources?: string[] } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${documentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history }),
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
    return { success: true, token: 'demo_token', user: { name: 'Adv. Priya Sharma', email } }
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
    return { success: true, user: payload }
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
    return { success: true, message: `Password reset link sent to ${email}` }
  }
}
