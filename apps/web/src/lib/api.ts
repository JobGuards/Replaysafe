import { MonitorResponse, CreateMonitorInput, UpdateMonitorInput } from '@stillup/shared'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

class ApiClient {
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }))
      throw new Error(error.message || `API error: ${response.status}`)
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
}

export const api = new ApiClient()
