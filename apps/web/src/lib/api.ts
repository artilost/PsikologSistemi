import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Only add token on client side
    if (typeof window !== 'undefined') {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error?: { message?: string } }>) => {
    const message = 
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      error.message || 
      'Bir hata oluştu';
    
    // Handle 401 - Unauthorized (but not 403 Forbidden)
    // 403 means user is authenticated but doesn't have permission
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Only logout if we're not already on login/register pages
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          // Clear session and redirect to login immediately
          // Don't wait for signOut to complete, just start it
          signOut({ callbackUrl: '/login', redirect: true }).catch(() => {
            // If signOut fails, force redirect
            window.location.href = '/login';
          });
          // Return a rejected promise immediately to stop further processing
          return Promise.reject(new Error('Unauthorized - Session expired'));
        }
      }
    }
    
    return Promise.reject(new Error(message));
  }
);

export default api;

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth API
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>('/auth/login', data),
  
  register: (data: RegisterData) =>
    api.post<ApiResponse<User>>('/auth/register', data),
  
  me: () => api.get<ApiResponse<User>>('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

// Users API
export const usersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; includeDeleted?: boolean }) =>
    api.get<PaginatedResponse<User>>('/users', { params }),
  
  listDeleted: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<User>>('/users/deleted', { params }),
  
  get: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  
  getTherapists: () => api.get<ApiResponse<User[]>>('/users/therapists'),
  
  update: (id: string, data: Partial<User>) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, data),
  
  delete: (id: string) => api.delete(`/users/${id}`),
  
  restore: (id: string) => api.post<ApiResponse<User>>(`/users/${id}/restore`),
};

// Clients API
export interface CreateClientData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  occupation?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  therapistProfileId?: string;
}

export const clientsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; therapistId?: string }) =>
    api.get<PaginatedResponse<Client>>('/clients', { params }),
  
  listDeleted: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Client>>('/clients/deleted', { params }),
  
  get: (id: string) => api.get<ApiResponse<Client>>(`/clients/${id}`),
  
  create: (data: CreateClientData) =>
    api.post<ApiResponse<Client>>('/clients', data),
  
  update: (id: string, data: Partial<Client>) =>
    api.patch<ApiResponse<Client>>(`/clients/${id}`, data),
  
  updateConsent: (id: string, data: ConsentData) =>
    api.patch<ApiResponse<Client>>(`/clients/${id}/consent`, data),
  
  delete: (id: string) => api.delete(`/clients/${id}`),
  
  restore: (id: string) => api.post(`/clients/${id}/restore`),
  
  search: (q: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Client>>('/clients/search', { params: { q, ...params } }),
};

// Appointments API
export const appointmentsApi = {
  list: (params?: { 
    page?: number; 
    limit?: number; 
    therapistId?: string;
    clientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    excludeScheduled?: boolean;
  }) => api.get<PaginatedResponse<Appointment>>('/appointments', { params }),
  
  get: (id: string) => api.get<ApiResponse<Appointment>>(`/appointments/${id}`),
  
  create: (data: CreateAppointmentData) =>
    api.post<ApiResponse<Appointment>>('/appointments', data),
  
  update: (id: string, data: Partial<Appointment>) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}`, data),
  
  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status }),
  
  cancel: (id: string, reason?: string) =>
    api.post<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, { reason }),
  
  reschedule: (id: string, data: { startTime: string; endTime: string }) =>
    api.post<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, data),
  
  getAvailableSlots: (params: { therapistId: string; date: string }) =>
    api.get<ApiResponse<TimeSlot[]>>('/appointments/available-slots', { params }),
};

// Sessions API
export const sessionsApi = {
  list: (params?: { page?: number; limit?: number; therapistId?: string; clientId?: string; noteStatus?: string }) =>
    api.get<ApiResponse<Session[]>>('/sessions', { params }),
  
  get: (id: string) => api.get<ApiResponse<Session>>(`/sessions/${id}`),
  
  getByAppointment: (appointmentId: string) =>
    api.get<ApiResponse<Session>>(`/sessions/by-appointment/${appointmentId}`),
  
  create: (data: CreateSessionData) =>
    api.post<ApiResponse<Session>>('/sessions', data),
  
  updateNotes: (id: string, data: SessionNotesData) =>
    api.patch<ApiResponse<Session>>(`/sessions/${id}/notes`, data),
  
  sign: (id: string) => api.post<ApiResponse<{ message: string }>>(`/sessions/${id}/sign`),
  
  getDrafts: (therapistId?: string) =>
    api.get<ApiResponse<Session[]>>('/sessions/drafts', { params: therapistId ? { therapistId } : undefined }),
  
  getClientHistory: (clientId: string, limit?: number) =>
    api.get<ApiResponse<Session[]>>(`/sessions/client-history/${clientId}`, { params: limit ? { limit } : undefined }),
};

// Payments API
export const paymentsApi = {
  list: (params?: { page?: number; limit?: number; status?: string; userId?: string }) =>
    api.get<PaginatedResponse<Payment>>('/payments', { params }),
  
  get: (id: string) => api.get<ApiResponse<Payment>>(`/payments/${id}`),
  
  create: (data: CreatePaymentData) =>
    api.post<ApiResponse<Payment>>('/payments', data),
  
  process: (id: string, data: { method: string; paidAmount: number }) =>
    api.post<ApiResponse<Payment>>(`/payments/${id}/process`, data),
  
  refund: (id: string, data: { refundAmount: number; refundReason: string }) =>
    api.post<ApiResponse<Payment>>(`/payments/${id}/refund`, data),
  
  getStats: (params?: { startDate?: string; endDate?: string; userId?: string }) =>
    api.get<ApiResponse<PaymentStats>>('/payments/stats', { params }),
  
  getPending: (userId?: string) =>
    api.get<ApiResponse<Payment[]>>('/payments/pending', { params: userId ? { userId } : undefined }),
  
  delete: (id: string) => api.delete<ApiResponse<{ message: string }>>(`/payments/${id}`),
  
  update: (id: string, data: { amount?: number; description?: string }) =>
    api.patch<ApiResponse<Payment>>(`/payments/${id}`, data),
};

// Reports API
export const reportsApi = {
  getDashboard: () => api.get<ApiResponse<DashboardStats>>('/reports/dashboard'),
  
  getAppointmentStats: (params?: { startDate?: string; endDate?: string; therapistId?: string }) =>
    api.get<ApiResponse<AppointmentStats>>('/reports/appointments', { params }),
  
  getRevenue: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<RevenueStats>>('/reports/revenue', { params }),
  
  getTherapistPerformance: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<TherapistPerformance[]>>('/reports/therapist-performance', { params }),
};

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface Client {
  id: string;
  userId: string;
  user: User;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  emergContact?: string;
  emergPhone?: string;
  address?: string;
  consentSigned: boolean;
  consentSignedAt?: string;
  recordingConsent: boolean;
  dataProcessConsent: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ConsentData {
  consentSigned?: boolean;
  recordingConsent?: boolean;
  dataProcessConsent?: boolean;
}

export interface Appointment {
  id: string;
  therapistId: string;
  clientId: string;
  locationId?: string;
  roomId?: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  notes?: string;
  appointmentNotes?: string;
  cancellationReason?: string;
  createdAt: string;
  // Included relations (from backend)
  therapist?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  client?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface CreateAppointmentData {
  therapistId: string;
  clientId: string;
  startTime: string;
  endTime: string;
  duration?: number;
  type?: string;
  appointmentNotes?: string;
  notes?: string; // Alias for appointmentNotes
  locationId?: string;
  roomId?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Session {
  id: string;
  appointmentId: string;
  therapistId: string;
  clientId: string;
  userId: string;
  sessionNumber?: number;
  actualStart?: string;
  actualEnd?: string;
  duration?: number;
  clinicalNotes?: string;
  treatmentPlan?: string;
  progressNotes?: string;
  diagnosis?: string;
  interventions?: string[];
  homework?: string;
  riskAssessment?: string;
  noteStatus: string;
  signedAt?: string;
  signedBy?: string;
  isPrivate: boolean;
  createdAt: string;
  appointment?: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  therapist?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  client?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface CreateSessionData {
  appointmentId: string;
  chiefComplaint?: string;
  clinicalNotes?: string;
}

export interface SessionNotesData {
  chiefComplaint?: string;
  clinicalNotes?: string;
  treatmentPlan?: string;
  homework?: string;
}

export interface Payment {
  id: string;
  sessionId?: string;
  userId: string;
  clientId?: string;
  amount: number;
  currency: string;
  paidAmount?: number;
  remainingAmount?: number;
  status: string;
  method?: string;
  description?: string;
  notes?: string;
  dueDate?: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  session?: {
    id: string;
    appointment?: {
      startTime: string;
    };
    client?: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export interface CreatePaymentData {
  userId: string;
  sessionId?: string;
  amount: number;
  currency?: string;
  method?: string;
  notes?: string;
}

export interface ProcessPaymentData {
  amount: number;
  method: string;
}

export interface PaymentStats {
  totalRevenue: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
}

export interface DashboardStats {
  totalClients: number;
  totalAppointments: number;
  todayAppointments: number;
  totalRevenue: number;
  pendingPayments: number;
}

export interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
}

export interface RevenueStats {
  total: number;
  byMonth: { month: string; amount: number }[];
  byMethod: { method: string; amount: number }[];
}

export interface TherapistPerformance {
  therapistId: string;
  therapistName: string;
  totalSessions: number;
  completedSessions: number;
  totalRevenue: number;
  rating?: number;
}

