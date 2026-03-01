import api from './client';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  User,
  DashboardData,
  Customer,
  Product,
  Category,
  Order,
  Lead,
  PipelineStage,
  Interaction,
  RevenueReport,
  SalesPerformanceReport,
  CustomerAnalyticsReport,
  ProductPerformanceReport,
  SettingsData,
  ActivityLogEntry,
  PaginatedResponse,
  SupportTicket,
  TicketReply,
  TicketStats,
  ReturnRequest,
  ReturnStats,
  Coupon,
  LoyaltyPoint,
  LoyaltyBalance,
  LoyaltyStats,
  Campaign,
  CampaignStats,
  Cart,
  CartStats,
  Automation,
  AutomationLog,
  AutomationStats,
  Segment,
  ChatMessage,
  ChatConversation,
} from '@/types';

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', credentials),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  me: () =>
    api.get<ApiResponse<{ user: User }>>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<{ user: User }>>('/auth/profile', data),

  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    api.put<ApiResponse<null>>('/auth/password', data),
};

// Dashboard API
export const dashboardApi = {
  get: (period = 30) =>
    api.get<ApiResponse<DashboardData>>('/dashboard', { params: { period } }),
};

// Search API
export const searchApi = {
  search: (q: string) =>
    api.get<ApiResponse<{
      customers: Array<{ id: number; name: string; email: string | null; company: string | null }>;
      products: Array<{ id: number; name: string; sku: string; price: number }>;
      orders: Array<{ id: number; order_number: string; status: string; total: number; created_at: string }>;
      leads: Array<{ id: number; title: string; value: number }>;
    }>>('/search', { params: { q } }),
};

// Customer API
export const customerApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Customer>>('/customers', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Customer>>(`/customers/${id}`),

  create: (data: Partial<Customer>) =>
    api.post<ApiResponse<Customer>>('/customers', data),

  update: (id: number, data: Partial<Customer>) =>
    api.put<ApiResponse<Customer>>(`/customers/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/customers/${id}`),

  timeline: (id: number, params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<unknown>>(`/customers/${id}/timeline`, { params }),

  sources: () =>
    api.get<ApiResponse<string[]>>('/customer-sources'),

  tags: () =>
    api.get<ApiResponse<string[]>>('/customer-tags'),
};

// User API
export const userApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  get: (id: number) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/users/${id}`),

  toggleActive: (id: number) =>
    api.patch<ApiResponse<User>>(`/users/${id}/toggle-active`),
};

// Product API
export const productApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Product>>(`/products/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Product>>('/products', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Product>>(`/products/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/products/${id}`),
};

// Category API
export const categoryApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<Category[]>>('/categories', { params }),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Category>>('/categories', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Category>>(`/categories/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/categories/${id}`),
};

// Order API
export const orderApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Order>>('/orders', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Order>>('/orders', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Order>>(`/orders/${id}`, data),

  updateStatus: (id: number, status: string) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/orders/${id}`),

  downloadInvoice: (id: number) =>
    api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),

  statusHistory: (id: number) =>
    api.get<ApiResponse<{ id: number; from_status: string | null; to_status: string; notes: string | null; user: { id: number; name: string } | null; created_at: string }[]>>(`/orders/${id}/status-history`),
};

// Lead API
export const leadApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Lead>>('/leads', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Lead>>(`/leads/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Lead>>('/leads', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Lead>>(`/leads/${id}`, data),

  moveStage: (id: number, data: { pipeline_stage_id: number; position?: number }) =>
    api.patch<ApiResponse<Lead>>(`/leads/${id}/move`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/leads/${id}`),

  board: () =>
    api.get<ApiResponse<PipelineStage[]>>('/pipeline/board'),

  stages: () =>
    api.get<ApiResponse<PipelineStage[]>>('/pipeline/stages'),
};

// Interaction API
export const interactionApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Interaction>>('/interactions', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Interaction>>(`/interactions/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Interaction>>('/interactions', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Interaction>>(`/interactions/${id}`, data),

  complete: (id: number) =>
    api.patch<ApiResponse<Interaction>>(`/interactions/${id}/complete`),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/interactions/${id}`),
};

// Report API
export const reportApi = {
  revenue: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<RevenueReport>>('/reports/revenue', { params }),

  salesPerformance: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<SalesPerformanceReport>>('/reports/sales-performance', { params }),

  customerAnalytics: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<CustomerAnalyticsReport>>('/reports/customers', { params }),

  productPerformance: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<ProductPerformanceReport>>('/reports/products', { params }),
};

// Settings API
export const settingsApi = {
  get: () =>
    api.get<ApiResponse<SettingsData>>('/settings'),

  update: (settings: { key: string; value: unknown; group?: string }[]) =>
    api.put<ApiResponse<SettingsData>>('/settings', { settings }),

  activityLog: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ActivityLogEntry>>('/activity-log', { params }),
};

// Import/Export API
export const importExportApi = {
  exportCustomers: () => api.get('/export/customers', { responseType: 'blob' }),
  exportProducts: () => api.get('/export/products', { responseType: 'blob' }),
  exportOrders: () => api.get('/export/orders', { responseType: 'blob' }),
  importCustomers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ imported: number; errors: string[] }>>('/import/customers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importProducts: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ imported: number; errors: string[] }>>('/import/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Notification API
export const notificationApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<{ id: string; type: string; data: Record<string, unknown>; read_at: string | null; created_at: string }>>('/notifications', { params }),

  unreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.patch<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.post<ApiResponse<null>>('/notifications/mark-all-read'),
};

// Email Template API
export interface EmailTemplateData {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const emailTemplateApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<EmailTemplateData>>('/email-templates', { params }),

  get: (id: number) =>
    api.get<ApiResponse<EmailTemplateData>>(`/email-templates/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<EmailTemplateData>>('/email-templates', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<EmailTemplateData>>(`/email-templates/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/email-templates/${id}`),

  preview: (id: number, data?: Record<string, string>) =>
    api.post<ApiResponse<{ subject: string; body: string }>>(`/email-templates/${id}/preview`, data),

  duplicate: (id: number) =>
    api.post<ApiResponse<EmailTemplateData>>(`/email-templates/${id}/duplicate`),
};

// Support Ticket API
export const supportTicketApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<SupportTicket>>('/support-tickets', { params }),

  get: (id: number) =>
    api.get<ApiResponse<SupportTicket>>(`/support-tickets/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<SupportTicket>>('/support-tickets', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<SupportTicket>>(`/support-tickets/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/support-tickets/${id}`),

  reply: (id: number, data: { body: string; is_internal?: boolean }) =>
    api.post<ApiResponse<TicketReply>>(`/support-tickets/${id}/reply`, data),

  stats: () =>
    api.get<ApiResponse<TicketStats>>('/support-ticket-stats'),
};

// Return API
export const returnApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ReturnRequest>>('/returns', { params }),

  get: (id: number) =>
    api.get<ApiResponse<ReturnRequest>>(`/returns/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<ReturnRequest>>('/returns', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<ReturnRequest>>(`/returns/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/returns/${id}`),

  stats: () =>
    api.get<ApiResponse<ReturnStats>>('/return-stats'),
};

// Coupon API
export const couponApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Coupon>>('/coupons', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Coupon>>(`/coupons/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Coupon>>('/coupons', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Coupon>>(`/coupons/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/coupons/${id}`),
};

// Loyalty API
export const loyaltyApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<LoyaltyPoint>>('/loyalty', { params }),

  addPoints: (data: Record<string, unknown>) =>
    api.post<ApiResponse<null>>('/loyalty', data),

  customerBalance: (customerId: number) =>
    api.get<ApiResponse<LoyaltyBalance>>(`/loyalty/customers/${customerId}`),

  leaderboard: () =>
    api.get<ApiResponse<Customer[]>>('/loyalty/leaderboard'),

  stats: () =>
    api.get<ApiResponse<LoyaltyStats>>('/loyalty/stats'),
};

// Campaign API
export const campaignApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Campaign>>('/campaigns', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Campaign>>(`/campaigns/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Campaign>>('/campaigns', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Campaign>>(`/campaigns/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/campaigns/${id}`),

  send: (id: number) =>
    api.post<ApiResponse<Campaign>>(`/campaigns/${id}/send`),

  stats: () =>
    api.get<ApiResponse<CampaignStats>>('/campaign-stats'),
};

// Cart API
export const cartApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Cart>>('/carts', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Cart>>(`/carts/${id}`),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Cart>>(`/carts/${id}`, data),

  sendReminder: (id: number) =>
    api.post<ApiResponse<Cart>>(`/carts/${id}/remind`),

  stats: () =>
    api.get<ApiResponse<CartStats>>('/cart-stats'),
};

// Automation API
export const automationApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Automation>>('/automations', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Automation>>(`/automations/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Automation>>('/automations', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Automation>>(`/automations/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/automations/${id}`),

  toggle: (id: number) =>
    api.patch<ApiResponse<Automation>>(`/automations/${id}/toggle`),

  logs: (id: number, params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<AutomationLog>>(`/automations/${id}/logs`, { params }),

  stats: () =>
    api.get<ApiResponse<AutomationStats>>('/automation-stats'),
};

// Segment API
export const segmentApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Segment>>('/segments', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Segment>>(`/segments/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Segment>>('/segments', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Segment>>(`/segments/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/segments/${id}`),

  recalculate: (id: number) =>
    api.post<ApiResponse<Segment>>(`/segments/${id}/recalculate`),

  customers: (id: number, params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Customer>>(`/segments/${id}/customers`, { params }),

  preview: (data: { rules: Record<string, unknown>[]; match_type: string }) =>
    api.post<ApiResponse<{ customer_count: number }>>('/segments/preview', data),
};

// Chat API
export const chatApi = {
  conversations: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ChatConversation>>('/chat', { params }),

  messages: (customerId: number, params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ChatMessage>>(`/chat/${customerId}/messages`, { params }),

  send: (customerId: number, data: { message: string; channel: string; ticket_id?: number }) =>
    api.post<ApiResponse<ChatMessage>>(`/chat/${customerId}/send`, data),

  receive: (data: { customer_id: number; message: string; channel: string }) =>
    api.post<ApiResponse<ChatMessage>>('/chat/receive', data),

  unreadCount: () =>
    api.get<ApiResponse<{ unread_count: number }>>('/chat/unread-count'),
};
