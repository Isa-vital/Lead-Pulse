import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/api/endpoints';
import { Card, CardHeader } from '@/components/ui/Card';
import { ChartSkeleton, KPICardSkeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
} from 'lucide-react';

type TabKey = 'revenue' | 'sales' | 'customers' | 'products';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'revenue', label: 'Revenue', icon: <DollarSign className="h-4 w-4" /> },
  { key: 'sales', label: 'Sales Performance', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'customers', label: 'Customers', icon: <Users className="h-4 w-4" /> },
  { key: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
];

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#06b6d4', '#f59e0b', '#ef4444'];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('revenue');
  const [period, setPeriod] = useState('30');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Analytics and performance insights"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Reports' }]}
        actions={
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'revenue' && <RevenueReport days={Number(period)} />}
      {activeTab === 'sales' && <SalesPerformanceReport days={Number(period)} />}
      {activeTab === 'customers' && <CustomerReport days={Number(period)} />}
      {activeTab === 'products' && <ProductReport days={Number(period)} />}
    </div>
  );
}

function RevenueReport({ days }: { days: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-revenue', days],
    queryFn: () => reportApi.revenue({ days, group_by: days <= 30 ? 'day' : days <= 90 ? 'week' : 'month' }).then((r) => r.data.data),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
      <ChartSkeleton />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Revenue" value={formatCurrency(data?.summary?.total_revenue ?? 0)} icon={<DollarSign />} />
        <KPICard label="Total Orders" value={String(data?.summary?.total_orders ?? 0)} icon={<Package />} />
        <KPICard label="Avg Order Value" value={formatCurrency(data?.summary?.avg_order_value ?? 0)} icon={<TrendingUp />} />
        <KPICard label="Growth" value={`${(data?.summary?.growth_rate ?? 0).toFixed(1)}%`} icon={<TrendingUp />}
          positive={(data?.summary?.growth_rate ?? 0) >= 0} />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader title="Revenue Over Time" />
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.chart ?? []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function SalesPerformanceReport({ days }: { days: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-sales', days],
    queryFn: () => reportApi.salesPerformance({ days }).then((r) => r.data.data),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Sales Reps */}
      <Card>
        <CardHeader title="Sales Representatives" />
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.sales_reps ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Lead Performance Table */}
      <Card>
        <CardHeader title="Lead Conversion" />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-500">Rep</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Leads</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Won</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Lost</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Conv. Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.lead_performance ?? []).map((rep, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{rep.name}</td>
                  <td className="px-4 py-2 text-right">{rep.total_leads}</td>
                  <td className="px-4 py-2 text-right text-green-600">{rep.won_leads}</td>
                  <td className="px-4 py-2 text-right text-red-600">{rep.lost_leads}</td>
                  <td className="px-4 py-2 text-right font-medium">{rep.conversion_rate?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CustomerReport({ days }: { days: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-customers', days],
    queryFn: () => reportApi.customerAnalytics({ days }).then((r) => r.data.data),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Total Customers" value={String(data?.summary?.total_customers ?? 0)} icon={<Users />} />
        <KPICard label="New Customers" value={String(data?.summary?.new_customers ?? 0)} icon={<Users />} />
        <KPICard label="Avg Lifetime Value" value={formatCurrency(data?.summary?.average_lifetime_value ?? 0)} icon={<DollarSign />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Customers Chart */}
        <Card>
          <CardHeader title="New Customers Over Time" />
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.new_customers_chart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Customer Sources */}
        <Card>
          <CardHeader title="Customer Sources" />
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.sources ?? []}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {(data?.sources ?? []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* LTV Segments */}
      <Card>
        <CardHeader title="Lifetime Value Segments" />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-500">Segment</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Customers</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.ltv_segments ?? []).map((seg, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium capitalize">{seg.segment}</td>
                  <td className="px-4 py-2 text-right">{seg.count}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(Number(seg.total_value))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ProductReport({ days }: { days: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-products', days],
    queryFn: () => reportApi.productPerformance({ days }).then((r) => r.data.data),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <ChartSkeleton />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader title="Top Selling Products" />
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top_selling ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip formatter={(v) => [Number(v ?? 0), 'Qty Sold']} />
                <Bar dataKey="total_sold" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Revenue */}
        <Card>
          <CardHeader title="Revenue by Category" />
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.category_breakdown ?? []}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {(data?.category_breakdown ?? []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader title="Low Stock Alert" />
        {(data?.low_stock ?? []).length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Product</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">SKU</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Stock</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.low_stock ?? []).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-gray-500">{p.sku}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-danger-600 font-medium">{p.stock_quantity}</span>
                    </td>
                    <td className="px-4 py-2 text-right">{p.low_stock_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 mt-4">
            <AlertTriangle className="mx-auto h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400 mt-2">No low stock items</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
  positive,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-primary-50 p-3 text-primary-600">{icon}</div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className={`text-xl font-bold ${positive !== undefined ? (positive ? 'text-green-600' : 'text-red-600') : 'text-gray-900 dark:text-white'}`}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}
