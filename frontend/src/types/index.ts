// User & Auth Types
export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: 'admin' | 'manager' | 'sales_rep' | 'support';
  roles?: Role[];
  permissions: string[];
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Customer Types
export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: Address;
  tags: string[];
  source: string | null;
  lifetime_value: number;
  custom_fields: Record<string, unknown>;
  notes: string | null;
  is_active: boolean;
  tier: 'regular' | 'bronze' | 'silver' | 'gold' | 'platinum';
  points_balance: number;
  last_activity_at: string | null;
  order_count?: number;
  orders?: Order[];
  leads?: Lead[];
  interactions?: Interaction[];
  created_at: string;
  updated_at: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// Product Types
export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  low_stock_threshold: number;
  images: string[];
  attributes: Record<string, unknown>;
  tags: string[];
  is_active: boolean;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  children?: Category[];
  products_count?: number;
}

// Order Types
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: number;
  customer_id: number;
  user_id: number | null;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  shipping_address: Address | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  customer?: Customer;
  user?: User;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
  metadata: Record<string, unknown>;
  product?: Product;
}

// Lead & Pipeline Types
export interface PipelineStage {
  id: number;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  is_won: boolean;
  is_lost: boolean;
  leads_count?: number;
  total_value?: number;
  leads?: PipelineLead[];
}

export interface PipelineLead {
  id: number;
  title: string;
  value: number;
  probability: number;
  weighted_value: number;
  expected_close: string | null;
  source: string | null;
  customer: { id: number; name: string; company: string | null } | null;
  assignee: { id: number; name: string } | null;
  created_at: string;
}

export interface Lead {
  id: number;
  customer_id: number | null;
  pipeline_stage_id: number;
  stage_id: number;
  assigned_to: number | null;
  title: string;
  value: number;
  probability: number;
  expected_close: string | null;
  expected_close_date?: string | null;
  source: string | null;
  status: string;
  tags: string[];
  notes: string | null;
  custom_fields: Record<string, unknown>;
  lost_reason: string | null;
  won_at: string | null;
  lost_at: string | null;
  customer?: Customer;
  stage?: PipelineStage;
  assignee?: User;
  interactions?: Interaction[];
  created_at: string;
  updated_at: string;
}

// Interaction Types
export type InteractionType = 'email' | 'call' | 'meeting' | 'note' | 'task';
export type InteractionChannel = 'phone' | 'email' | 'in-person' | 'chat' | 'video';

export interface Interaction {
  id: number;
  customer_id: number;
  user_id: number;
  lead_id: number | null;
  type: InteractionType;
  channel: InteractionChannel | null;
  subject: string | null;
  body: string | null;
  description: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  is_completed: boolean;
  duration_minutes: number | null;
  metadata: Record<string, unknown>;
  customer?: Customer;
  user?: User;
  lead?: Lead;
  created_at: string;
  updated_at: string;
}

// Dashboard Types
export interface DashboardKPIs {
  revenue: { value: number; change: number; period: number };
  orders: { value: number; change: number };
  new_customers: { value: number; change: number };
  active_leads: { value: number; pipeline_value: number };
  conversion_rate: { value: number; won: number; total: number };
  total_customers: number;
  total_products: number;
  low_stock_products: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  revenue_chart: RevenueChartData[];
  order_status: { status: string; count: number; total: number }[];
  pipeline_summary: { stage: string; color: string; count: number; total_value: number }[];
  recent_orders: { id: number; order_number: string; customer: string; total: number; status: string; created_at: string }[];
  recent_leads: { id: number; title: string; customer: string; stage: string; stage_color: string; value: number; assignee: string; expected_close: string }[];
  top_customers: { id: number; name: string; company: string; lifetime_value: number; order_count: number }[];
  upcoming_tasks: { id: number; type: string; subject: string; customer: string; assignee: string; scheduled_at: string }[];
}

// Report Types
export interface RevenueReport {
  chart: { period: string; revenue: number; orders: number; avg_order_value: number }[];
  summary: { total_revenue: number; total_orders: number; avg_order_value: number; growth_rate: number };
}

export interface SalesPerformanceReport {
  sales_reps: { id: number; name: string; orders_count: number; revenue: number }[];
  lead_performance: { id: number; name: string; total_leads: number; won_leads: number; lost_leads: number; conversion_rate: number; pipeline_value: number }[];
}

export interface CustomerAnalyticsReport {
  summary: { total_customers: number; new_customers: number; average_lifetime_value: number };
  new_customers_chart: { period: string; count: number }[];
  sources: { source: string; count: number }[];
  ltv_segments: { segment: string; count: number; total_value: number }[];
}

export interface ProductPerformanceReport {
  top_selling: { id: number; name: string; sku: string; total_sold: number; revenue: number }[];
  low_stock: { id: number; name: string; sku: string; stock_quantity: number; low_stock_threshold: number }[];
  category_breakdown: { category: string; revenue: number; count: number }[];
}

// Settings Types
export type SettingsData = Record<string, Array<{ key: string; value: string }>>;

export interface ActivityLogEntry {
  id: number;
  user_id: number | null;
  action: string;
  description: string | null;
  model_type: string;
  model_id: number | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user?: User;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Support Ticket Types
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'general' | 'billing' | 'technical' | 'shipping' | 'product';

export interface SupportTicket {
  id: number;
  customer_id: number;
  assigned_to: number | null;
  order_id: number | null;
  ticket_number: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  channel: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  sla_hours: number;
  metadata: Record<string, unknown> | null;
  is_overdue?: boolean;
  customer?: { id: number; name: string; email: string | null };
  assignee?: { id: number; name: string };
  order?: Order;
  replies?: TicketReply[];
  created_at: string;
  updated_at: string;
}

export interface TicketReply {
  id: number;
  ticket_id: number;
  user_id: number;
  body: string;
  is_internal: boolean;
  attachments: string[] | null;
  user?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  waiting: number;
  resolved: number;
  overdue: number;
  avg_resolution_hours: number;
}

// Return Types
export type ReturnStatus = 'requested' | 'approved' | 'received' | 'refunded' | 'rejected';

export interface ReturnRequest {
  id: number;
  order_id: number;
  customer_id: number;
  processed_by: number | null;
  return_number: string;
  status: ReturnStatus;
  reason: string;
  description: string | null;
  refund_amount: number;
  refund_method: string | null;
  approved_at: string | null;
  received_at: string | null;
  refunded_at: string | null;
  items: ReturnItem[];
  admin_notes: string | null;
  customer?: { id: number; name: string; email: string | null };
  order?: { id: number; order_number: string };
  processed_by_user?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export interface ReturnItem {
  product_id: number;
  product_name: string;
  quantity: number;
  amount: number;
}

export interface ReturnStats {
  total: number;
  requested: number;
  approved: number;
  refunded: number;
  rejected: number;
  total_refunded: number;
}

// Coupon Types
export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: CouponType;
  value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_per_customer: number | null;
  times_used: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  conditions: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Loyalty Types
export type LoyaltyPointType = 'earned' | 'redeemed' | 'bonus' | 'expired' | 'adjustment';

export interface LoyaltyPoint {
  id: number;
  customer_id: number;
  order_id: number | null;
  points: number;
  type: LoyaltyPointType;
  description: string | null;
  balance_after: number;
  expires_at: string | null;
  customer?: { id: number; name: string; email: string | null };
  order?: { id: number; order_number: string };
  created_at: string;
  updated_at: string;
}

export interface LoyaltyBalance {
  customer_id: number;
  customer_name: string;
  points_balance: number;
  total_earned: number;
  total_redeemed: number;
  recent_transactions: LoyaltyPoint[];
}

export interface LoyaltyStats {
  total_points_issued: number;
  total_points_redeemed: number;
  active_members: number;
  average_balance: number;
}

// Campaign Types
export type CampaignType = 'email' | 'sms';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

export interface Campaign {
  id: number;
  created_by: number;
  email_template_id: number | null;
  name: string;
  type: CampaignType;
  subject: string | null;
  content: string | null;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  unsubscribe_count: number;
  segment_filters: Record<string, unknown>[] | null;
  open_rate?: number;
  click_rate?: number;
  created_by_user?: { id: number; name: string };
  email_template?: { id: number; name: string; subject: string };
  recipients?: CampaignRecipient[];
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  id: number;
  campaign_id: number;
  customer_id: number;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  customer?: { id: number; name: string; email: string | null };
}

export interface CampaignStats {
  total: number;
  draft: number;
  sent: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  avg_open_rate: number;
  avg_click_rate: number;
}

// Cart Types
export type CartStatus = 'active' | 'abandoned' | 'recovered' | 'converted';

export interface Cart {
  id: number;
  customer_id: number;
  status: CartStatus;
  total: number;
  reminder_sent_at: string | null;
  reminder_count: number;
  recovered_at: string | null;
  customer?: { id: number; name: string; email: string | null };
  items?: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal?: number;
  product?: { id: number; name: string; price: number };
}

export interface CartStats {
  total_abandoned: number;
  total_recovered: number;
  total_converted: number;
  abandoned_value: number;
  recovered_value: number;
  recovery_rate: number;
  recoverable: number;
}

// Automation Types
export type AutomationTrigger = 'cart_abandoned' | 'order_placed' | 'customer_created' | 'customer_inactive' | 'lead_stage_changed' | 'ticket_created';
export type AutomationAction = 'send_email' | 'send_sms' | 'assign_tag' | 'update_tier' | 'create_task' | 'send_notification';

export interface Automation {
  id: number;
  name: string;
  description: string | null;
  trigger_type: AutomationTrigger;
  action_type: AutomationAction;
  conditions: Record<string, unknown> | null;
  action_config: Record<string, unknown> | null;
  delay_minutes: number;
  is_active: boolean;
  last_triggered_at: string | null;
  execution_count: number;
  logs_count?: number;
  logs?: AutomationLog[];
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: number;
  automation_id: number;
  customer_id: number;
  status: 'success' | 'failed' | 'skipped';
  result: string | null;
  context: Record<string, unknown> | null;
  customer?: { id: number; name: string };
  created_at: string;
}

export interface AutomationStats {
  total: number;
  active: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
}

// Segment Types
export interface SegmentRule {
  field: string;
  operator: string;
  value: string | number | boolean;
}

export interface Segment {
  id: number;
  name: string;
  description: string | null;
  rules: SegmentRule[];
  match_type: 'all' | 'any';
  customer_count: number;
  is_active: boolean;
  last_calculated_at: string | null;
  created_at: string;
  updated_at: string;
}

// Chat Types
export type ChatChannel = 'web' | 'whatsapp' | 'messenger';
export type ChatDirection = 'inbound' | 'outbound';

export interface ChatMessage {
  id: number;
  customer_id: number;
  user_id: number | null;
  ticket_id: number | null;
  channel: ChatChannel;
  direction: ChatDirection;
  message: string;
  attachments: string[] | null;
  is_read: boolean;
  customer?: Customer;
  user?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export interface ChatConversation {
  id: number;
  name: string;
  email: string | null;
  unread_count: number;
  chat_messages_max_created_at: string | null;
  chat_messages: ChatMessage[];
}
