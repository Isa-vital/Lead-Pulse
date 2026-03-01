import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { KPICardSkeleton, ChartSkeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Target,
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => dashboardApi.get(period).then((res) => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.name}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { kpis, revenue_chart, pipeline_summary, recent_orders, recent_leads, top_customers, upcoming_tasks } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name}`}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {new Date(Date.now() - period * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' - '}
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenue"
          value={formatCurrency(kpis.revenue.value)}
          change={kpis.revenue.change}
          changeLabel={`vs prev ${period}d`}
          icon={DollarSign}
          iconColor="text-green-600 bg-green-50"
        />
        <KPICard
          title="Orders"
          value={kpis.orders.value}
          change={kpis.orders.change}
          changeLabel={`vs prev ${period}d`}
          icon={ShoppingCart}
          iconColor="text-blue-600 bg-blue-50"
        />
        <KPICard
          title="New Customers"
          value={kpis.new_customers.value}
          change={kpis.new_customers.change}
          changeLabel={`vs prev ${period}d`}
          icon={Users}
          iconColor="text-purple-600 bg-purple-50"
        />
        <KPICard
          title="Active Leads"
          value={kpis.active_leads.value}
          icon={Target}
          iconColor="text-orange-600 bg-orange-50"
          subtitle={`Pipeline: ${formatCurrency(kpis.active_leads.pipeline_value)}`}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Conversion Rate"
          value={`${kpis.conversion_rate.value}%`}
          icon={TrendingUp}
          iconColor="text-emerald-600 bg-emerald-50"
          subtitle={`${kpis.conversion_rate.won} won / ${kpis.conversion_rate.total} total`}
        />
        <KPICard
          title="Total Products"
          value={kpis.total_products}
          icon={Package}
          iconColor="text-cyan-600 bg-cyan-50"
        />
        <KPICard
          title="Low Stock Alerts"
          value={kpis.low_stock_products}
          icon={AlertTriangle}
          iconColor={kpis.low_stock_products > 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue Trend" subtitle={`Last ${period} days`} />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue_chart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} labelFormatter={(l) => formatDate(String(l))} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pipeline Summary */}
        <Card>
          <CardHeader title="Sales Pipeline" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipeline_summary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v) => [Number(v), 'Leads']} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {pipeline_summary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card padding={false}>
          <div className="p-6 pb-0">
            <CardHeader title="Recent Orders" subtitle="Latest 5 orders" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Order</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Total</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent_orders.length > 0 ? recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-primary-600">{order.order_number}</td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{order.customer}</td>
                    <td className="px-6 py-3 font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Customers */}
        <Card padding={false}>
          <div className="p-6 pb-0">
            <CardHeader title="Top Customers" subtitle="By lifetime value" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Orders</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">LTV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {top_customers.length > 0 ? top_customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        {customer.company && <p className="text-xs text-gray-500">{customer.company}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{customer.order_count}</td>
                    <td className="px-6 py-3 font-medium text-green-600">{formatCurrency(customer.lifetime_value)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">No customers yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Recent Leads & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card padding={false}>
          <div className="p-6 pb-0">
            <CardHeader title="Recent Leads" />
          </div>
          <div className="divide-y divide-gray-50">
            {recent_leads.length > 0 ? recent_leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lead.stage_color }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.title}</p>
                    <p className="text-xs text-gray-500">{lead.customer} · {lead.assignee}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(lead.value)}</span>
              </div>
            )) : (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No active leads</p>
            )}
          </div>
        </Card>

        {/* Upcoming Tasks */}
        <Card padding={false}>
          <div className="p-6 pb-0">
            <CardHeader title="Upcoming Tasks" />
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming_tasks.length > 0 ? upcoming_tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{task.subject}</p>
                    <p className="text-xs text-gray-500">{task.customer} · {task.type}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{timeAgo(task.scheduled_at)}</span>
              </div>
            )) : (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No upcoming tasks</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
