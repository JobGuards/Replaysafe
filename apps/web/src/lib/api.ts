import {
  MonitorResponse,
  CreateMonitorInput,
  UpdateMonitorInput,
} from "@replaysafe/shared";

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4040";
if (!API_BASE_URL.endsWith("/api")) {
  API_BASE_URL = `${API_BASE_URL}/api`;
}

class ApiClient {
  private projectId: string | null = null;

  setProjectId(id: string | null) {
    this.projectId = id;
  }

  private buildUrl(endpoint: string): string {
    const base = `${API_BASE_URL}${endpoint}`;
    if (!this.projectId || base.includes("projectId=")) return base;
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}projectId=${this.projectId}`;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = this.buildUrl(endpoint);

    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {}
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Monitor methods
  async getMonitors(): Promise<MonitorResponse[]> {
    return this.fetch<MonitorResponse[]>("/monitors");
  }

  async getMonitor(id: string): Promise<MonitorResponse> {
    return this.fetch<MonitorResponse>(`/monitors/${id}`);
  }

  async createMonitor(data: CreateMonitorInput): Promise<MonitorResponse> {
    return this.fetch<MonitorResponse>("/monitors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMonitor(
    id: string,
    data: UpdateMonitorInput,
  ): Promise<MonitorResponse> {
    return this.fetch<MonitorResponse>(`/monitors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteMonitor(id: string): Promise<void> {
    return this.fetch<void>(`/monitors/${id}`, {
      method: "DELETE",
    });
  }

  // Incident methods
  async getIncidents(): Promise<any[]> {
    return this.fetch<any[]>("/incidents");
  }

  async resolveIncident(
    id: string,
    data: { resolutionNotes: string; resolutionCategory: string },
  ): Promise<any> {
    return this.fetch(`/analytics/incidents/${id}/resolve`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Analytics/Activity methods
  async getActivity(): Promise<any> {
    return this.fetch("/analytics/heartbeats/recent");
  }

  async getMonitorAnalytics(monitorId: string): Promise<any> {
    return this.fetch(`/analytics/${monitorId}`);
  }

  async getMonitorHistory(monitorId: string): Promise<any> {
    return this.fetch(`/analytics/${monitorId}/history`);
  }

  async getProjectOverview(): Promise<any> {
    return this.fetch(`/analytics/project/overview`);
  }

  // ReplayGuard methods
  async getGuardedExecutions(): Promise<any[]> {
    return this.fetch<any[]>("/guards");
  }

  async getGuardedExecution(id: string): Promise<any> {
    return this.fetch<any>(`/guards/${id}`);
  }

  // Project methods
  async createProject(name: string): Promise<any> {
    return this.fetch(`/projects`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async upgradePlan(projectId: string, plan: string): Promise<any> {
    return this.fetch(`/projects/plan`, {
      method: "POST",
      body: JSON.stringify({ projectId, plan }),
    });
  }

  async getProjectSideEffects(params?: { type?: string }): Promise<any[]> {
    let url = "/analytics/project/side-effects";
    if (params?.type) {
      url += `?type=${params.type}`;
    }
    return this.fetch<any[]>(url);
  }

  // API Key methods
  async getApiKeys(): Promise<any[]> {
    return this.fetch<any[]>("/api-keys");
  }

  async createApiKey(name: string): Promise<any> {
    return this.fetch<any>("/api-keys", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async deleteApiKey(id: string): Promise<void> {
    return this.fetch<void>(`/api-keys/${id}`, {
      method: "DELETE",
    });
  }

  // Alert Channel methods
  async getAlertChannels(): Promise<any[]> {
    return this.fetch<any[]>("/alert-channels");
  }

  async createAlertChannel(type: string, config: any): Promise<any> {
    return this.fetch<any>("/alert-channels", {
      method: "POST",
      body: JSON.stringify({ type, config }),
    });
  }

  async deleteAlertChannel(id: string): Promise<void> {
    return this.fetch<void>(`/alert-channels/${id}`, {
      method: "DELETE",
    });
  }

  // Waitlist/Interest methods
  async submitInterest(data: { email: string; source: string }): Promise<any> {
    return this.fetch<any>("/public/interest", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Phase 7: Verification
  async verifyExecution(
    executionId: string,
  ): Promise<{ verified: number; failed: number; unknown: number; total: number }> {
    return this.fetch(`/guards/execution/${executionId}/verify`, {
      method: "POST",
    });
  }

  // Phase 7: Provider configs
  async getProviderConfigs(): Promise<any[]> {
    return this.fetch<any[]>("/provider-configs");
  }

  async upsertProviderConfig(provider: string, config: any): Promise<any> {
    return this.fetch<any>("/provider-configs", {
      method: "POST",
      body: JSON.stringify({ provider, config }),
    });
  }

  async toggleProviderConfig(id: string, enabled: boolean): Promise<any> {
    return this.fetch<any>(`/provider-configs/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
  }

  async deleteProviderConfig(id: string): Promise<void> {
    return this.fetch<void>(`/provider-configs/${id}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();

