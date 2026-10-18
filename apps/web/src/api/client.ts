const API_URL = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('daedalous_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('daedalous_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('daedalous_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Error de red o servidor' }));
    throw new Error(errorData.error || `Error HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<{ user: any }>('/auth/me'),

  // Proyectos
  getProjects: () => request<{ projects: any[] }>('/projects'),
  getProject: (id: string) => request<{ project: any }>(`/projects/${id}`),
  createProject: (data: any) =>
    request<{ id: string; code: string; versionId: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  copyProject: (id: string) =>
    request<{ id: string; code: string }>(`/projects/${id}/copy`, { method: 'POST' }),
  setProjectStatus: (id: string, status: 'active' | 'disabled') =>
    request<{ message: string }>(`/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteProject: (id: string) =>
    request<{ message: string }>(`/projects/${id}`, { method: 'DELETE' }),

  // Pasos y cálculo en vivo
  evalCalc: (projectData: any) =>
    request<any>('/steps/eval', {
      method: 'POST',
      body: JSON.stringify({ projectData }),
    }),
  saveStep: (versionId: string, stepKey: string, data: any, note?: string) =>
    request<any>(`/steps/${versionId}/${stepKey}`, {
      method: 'PUT',
      body: JSON.stringify({ data, note }),
    }),
  validateStep: (versionId: string, stepKey: string) =>
    request<{ message: string }>(`/steps/${versionId}/${stepKey}/validate`, {
      method: 'POST',
    }),

  // Plantilla Datacenter
  getDatacenterTemplate: () => request<any>('/templates/datacenter'),
  addTemplateItem: (item: any) =>
    request<any>('/templates/datacenter/items', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  deleteTemplateItem: (id: string) =>
    request<any>(`/templates/datacenter/items/${id}`, { method: 'DELETE' }),

  // Usuarios y roles
  getUsers: () => request<any>('/users'),
  createUser: (data: any) =>
    request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Sincronización SQLite -> PostgreSQL
  getSyncStatus: () => request<any>('/sync/status'),
  triggerSync: (targetUrl?: string) =>
    request<any>('/sync/trigger', {
      method: 'POST',
      body: JSON.stringify({ targetUrl }),
    }),
};
