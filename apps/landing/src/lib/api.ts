let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4040'
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = `${API_BASE_URL}/api`
}

class ApiClient {
  private projectId: string | null = null

  setProjectId(id: string | null) {
    this.projectId = id
  }

  private buildUrl(endpoint: string): string {
    const base = `${API_BASE_URL}${endpoint}`
    if (!this.projectId || base.includes('projectId=')) return base
    const separator = base.includes('?') ? '&' : '?'
    return `${base}${separator}projectId=${this.projectId}`
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(endpoint)

    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch {
        try {
          const text = await response.text()
          if (text) errorMessage = text
        } catch {}
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Waitlist/Interest methods
  async submitInterest(data: { email: string; source: string }): Promise<any> {
    return this.fetch<any>('/public/interest', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Project methods
  async upgradePlan(projectId: string, plan: string): Promise<any> {
    return this.fetch(`/projects/plan`, {
      method: 'POST',
      body: JSON.stringify({ projectId, plan }),
    })
  }
}

export const api = new ApiClient()
