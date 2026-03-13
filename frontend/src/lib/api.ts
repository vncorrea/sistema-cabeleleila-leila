import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

const TOKEN_KEY = 'cabeleleila_token'
const USER_KEY = 'cabeleleila_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) clearToken()
    const message = err.response?.data?.message ?? err.message
    return Promise.reject(new Error(message))
  }
)

export type Client = { id: number; name: string; email: string; phone: string | null }
export type SalonService = {
  id: number
  name: string
  duration_minutes: number
  price: string
  description: string | null
}
export type AppointmentItem = {
  id: number
  salon_service_id: number
  status: string
  salon_service: SalonService
}
export type User = { id: number; name: string; email: string; role: string }
export type Appointment = {
  id: number
  client_id: number
  starts_at: string
  status: string
  notes: string | null
  assigned_user_id?: number | null
  client?: Client
  assigned_to?: User | null
  items?: AppointmentItem[]
}

export const clientsApi = {
  list: () => api.get<{ data: Client[] }>('/clients'),
  create: (data: { name: string; email: string; phone?: string }) =>
    api.post<{ data: Client }>('/clients', data),
  get: (id: number) => api.get<{ data: Client }>(`/clients/${id}`),
}

export const salonServicesApi = {
  list: () => api.get<{ data: SalonService[] }>('/salon-services'),
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ data: { user: User; token: string; token_type: string } }>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ data: User }>('/auth/me'),
}

export const appointmentsApi = {
  list: (params?: { start_date?: string; end_date?: string; client_id?: number; status?: string }) =>
    api.get<{ data: Appointment[]; current_page: number; total: number; last_page: number }>('/appointments', { params }),
  create: (data: {
    client_id?: number
    client_name?: string
    client_email?: string
    client_phone?: string
    starts_at: string
    salon_service_ids: number[]
    notes?: string
  }) => api.post<{ data: Appointment }>('/appointments', data),
  get: (id: number) => api.get<{ data: Appointment }>(`/appointments/${id}`),
  update: (
    id: number,
    data: { starts_at?: string; salon_service_ids?: number[]; notes?: string; by_staff?: boolean }
  ) => api.put<{ data: Appointment }>(`/appointments/${id}`, data),
  cancel: (id: number, byStaff = false) =>
    api.delete<{ data: Appointment }>(`/appointments/${id}`, { params: { by_staff: byStaff } }),
  confirm: (id: number) => api.post<{ data: Appointment }>(`/appointments/${id}/confirm`),
  historyWithSuggestion: (clientId: number, startDate: string, endDate: string) =>
    api.get<{ data: { appointments: Appointment[]; suggested_date: string | null } }>(
      '/appointments/history-with-suggestion',
      { params: { client_id: clientId, start_date: startDate, end_date: endDate } }
    ),
  updateItemStatus: (itemId: number, status: string) =>
    api.put<{ data: Appointment }>(`/appointment-items/${itemId}/status`, { status }),
}
