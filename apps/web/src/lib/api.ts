import { MonitorResponse, CreateMonitorInput, UpdateMonitorInput } from '@stillup/shared'

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
    if (!this.projectId) return base
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

  // Monitor methods
  async getMonitors(): Promise<MonitorResponse[]> {
    return this.fetch<MonitorResponse[]>('/monitors')
  }

  async getMonitor(id: string): Promise<MonitorResponse> {
    return this.fetch<MonitorResponse>(`/monitors/${id}`)
  }

  async createMonitor(data: CreateMonitorInput): Promise<MonitorResponse> {
    return this.fetch<MonitorResponse>('/monitors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMonitor(id: string, data: UpdateMonitorInput): Promise<MonitorResponse> {
    return this.fetch<MonitorResponse>(`/monitors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteMonitor(id: string): Promise<void> {
    return this.fetch<void>(`/monitors/${id}`, {
      method: 'DELETE',
    })
  }

  // Incident methods
  async getIncidents(): Promise<any[]> {
    return this.fetch<any[]>('/incidents')
  }

  // Analytics/Activity methods
  async getActivity(projectId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/analytics/heartbeats/recent?projectId=${projectId}`, {
      credentials: 'include',
    })
    return response.json()
  }

  // ReplayGuard methods
  async getGuardedExecutions(): Promise<any[]> {
    return this.fetch<any[]>('/guards')
  }

  async getGuardedExecution(id: string): Promise<any> {
    return this.fetch<any>(`/guards/${id}`)
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
