import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyApi, customerApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import {
  Star,
  Trophy,
  Gift,
  TrendingUp,
  Plus,
  Award,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import type { LoyaltyPoint, LoyaltyPointType, LoyaltyStats, Customer } from '@/types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

type TabKey = 'overview' | 'transactions' | 'leaderboard';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'transactions', label: 'Transactions', icon: <Star className="h-4 w-4" /> },
  { key: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="h-4 w-4" /> },
];

const TYPE_OPTIONS: { value: LoyaltyPointType; label: string }[] = [
  { value: 'earned', label: 'Earned' },
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'expired', label: 'Expired' },
  { value: 'adjustment', label: 'Adjustment' },
];

/* ------------------------------------------------------------------ */
/*  Badge helpers                                                      */
/* ------------------------------------------------------------------ */

function tierBadge(tier: Customer['tier']) {
  const map: Record<Customer['tier'], { variant: 'info' | 'warning' | 'default' | 'danger' | 'success'; label: string }> = {
    platinum: { variant: 'info', label: 'Platinum' },
    gold: { variant: 'warning', label: 'Gold' },
    silver: { variant: 'default', label: 'Silver' },
    bronze: { variant: 'danger', label: 'Bronze' },
    regular: { variant: 'info', label: 'Regular' },
  };
  const cfg = map[tier] ?? { variant: 'default' as const, label: tier };

  // Custom colors for tiers
  const colorMap: Record<string, string> = {
    platinum: 'bg-purple-100 text-purple-700',
    gold: 'bg-yellow-100 text-yellow-700',
    silver: 'bg-gray-100 text-gray-700',
    bronze: 'bg-orange-100 text-orange-700',
    regular: 'bg-blue-100 text-blue-700',
  };
  const colorClass = colorMap[tier] ?? '';

  return <Badge variant={cfg.variant} className={colorClass}>{cfg.label}</Badge>;
}

function typeBadge(type: LoyaltyPointType) {
  const map: Record<LoyaltyPointType, { variant: 'success' | 'danger' | 'info' | 'default' | 'warning'; label: string }> = {
    earned: { variant: 'success', label: 'Earned' },
    redeemed: { variant: 'danger', label: 'Redeemed' },
    bonus: { variant: 'info', label: 'Bonus' },
    expired: { variant: 'default', label: 'Expired' },
    adjustment: { variant: 'warning', label: 'Adjustment' },
  };
  const cfg = map[type] ?? { variant: 'default' as const, label: type };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-UG');
}

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Trophy className="h-5 w-5 text-orange-500" />;
  return <span className="text-sm font-medium text-gray-500">{rank}</span>;
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Loyalty & Rewards"
        subtitle="Manage loyalty points and reward programs"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Loyalty & Rewards' }]}
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
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'leaderboard' && <LeaderboardTab />}
    </div>
  );
}

/* ================================================================== */
/*  Overview Tab                                                       */
/* ================================================================== */

function OverviewTab() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['loyalty-stats'],
    queryFn: () => loyaltyApi.stats().then((res) => res.data.data),
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['loyalty-leaderboard'],
    queryFn: () => loyaltyApi.leaderboard().then((res) => res.data.data),
  });

  const stats: LoyaltyStats | null = statsData ?? null;
  const isLoading = statsLoading || leaderboardLoading;

  // Derive tier distribution from leaderboard data
  const tierDistribution = (leaderboard ?? []).reduce<Record<string, number>>(
    (acc, customer) => {
      const tier = customer.tier ?? 'regular';
      acc[tier] = (acc[tier] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const statCards = [
    {
      label: 'Total Points Issued',
      value: stats ? formatNumber(stats.total_points_issued) : '—',
      icon: Star,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: 'Total Points Redeemed',
      value: stats ? formatNumber(stats.total_points_redeemed) : '—',
      icon: Gift,
      color: 'text-red-600 bg-red-100',
    },
    {
      label: 'Active Members',
      value: stats ? formatNumber(stats.active_members) : '—',
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Avg Balance',
      value: stats ? formatNumber(stats.average_balance) : '—',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tier Distribution */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tier Distribution</h3>
        {isLoading ? (
          <TableSkeleton rows={5} cols={3} />
        ) : Object.keys(tierDistribution).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {(['platinum', 'gold', 'silver', 'bronze', 'regular'] as const).map((tier) => {
              const count = tierDistribution[tier] ?? 0;
              const iconColorMap: Record<string, string> = {
                platinum: 'text-purple-600 bg-purple-100',
                gold: 'text-yellow-600 bg-yellow-100',
                silver: 'text-gray-600 bg-gray-100',
                bronze: 'text-orange-600 bg-orange-100',
                regular: 'text-blue-600 bg-blue-100',
              };
              return (
                <div key={tier} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <div className={`rounded-lg p-2 ${iconColorMap[tier]}`}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
                    <p className="text-xs text-gray-500 capitalize">{tier}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Award}
            title="No tier data"
            description="No customers found in the leaderboard."
          />
        )}
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Transactions Tab                                                   */
/* ================================================================== */

function TransactionsTab() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [page, setPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Transactions list
  const { data, isLoading } = useQuery({
    queryKey: ['loyalty-transactions', page, customerFilter, typeFilter],
    queryFn: () =>
      loyaltyApi
        .list({
          page,
          per_page: 15,
          customer_id: customerFilter || undefined,
          type: typeFilter || undefined,
        })
        .then((res) => res.data),
  });

  const transactions: LoyaltyPoint[] = data?.data ?? [];
  const meta = data?.meta;

  // Customers for dropdown
  const { data: customers } = useQuery({
    queryKey: ['customers-list-loyalty'],
    queryFn: () => customerApi.list({ per_page: 100 }).then((res) => res.data.data),
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={customerFilter}
            onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Customers</option>
            {(customers ?? []).map((c: Customer) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="flex-1" />
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Points
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Points</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Description</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Balance After</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => {
                      const isPositive = tx.points > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                            {tx.customer?.name ?? `Customer #${tx.customer_id}`}
                          </td>
                          <td className="px-6 py-4">{typeBadge(tx.type)}</td>
                          <td className={`px-6 py-4 text-right font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            <span className="inline-flex items-center gap-1">
                              {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {isPositive ? '+' : ''}{formatNumber(tx.points)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{tx.description ?? '—'}</td>
                          <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300 font-medium">
                            {formatNumber(tx.balance_after)}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(tx.created_at)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4">
                        <EmptyState
                          icon={Star}
                          title="No transactions found"
                          description="No loyalty point transactions match the current filters."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-3">
                <p className="text-sm text-gray-500">
                  Page {meta.current_page} of {meta.last_page} ({meta.total} results)
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add Points Modal */}
      {showAddModal && (
        <AddPointsModal
          customers={customers ?? []}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['loyalty-stats'] });
            queryClient.invalidateQueries({ queryKey: ['loyalty-leaderboard'] });
            toast.success('Points added successfully');
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Add Points Modal                                                   */
/* ================================================================== */

function AddPointsModal({
  customers,
  onClose,
  onSuccess,
}: {
  customers: Customer[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState<LoyaltyPointType>('bonus');
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('');
  const toast = useToastStore();

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => loyaltyApi.addPoints(data),
    onSuccess: () => onSuccess(),
    onError: () => toast.error('Failed to add points'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !points) {
      toast.error('Please fill in all required fields');
      return;
    }
    mutation.mutate({
      customer_id: Number(customerId),
      type,
      points: Number(points),
      description: description || undefined,
    });
  }

  return (
    <Modal open onClose={onClose} title="Add Loyalty Points" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LoyaltyPointType)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Points <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
            min={1}
            placeholder="e.g. 500"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding...' : 'Add Points'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ================================================================== */
/*  Leaderboard Tab                                                    */
/* ================================================================== */

function LeaderboardTab() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['loyalty-leaderboard'],
    queryFn: () => loyaltyApi.leaderboard().then((res) => res.data.data),
  });

  const customers: Customer[] = leaderboard ?? [];

  return (
    <div className="space-y-4">
      <Card padding={false}>
        {isLoading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-6 py-3 text-center font-medium text-gray-500 w-16">Rank</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-500">Tier</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">Points Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {customers.map((customer, index) => {
                  const rank = index + 1;
                  const rowHighlight =
                    rank === 1
                      ? 'bg-yellow-50 dark:bg-yellow-900/10'
                      : rank === 2
                        ? 'bg-gray-50 dark:bg-gray-800/30'
                        : rank === 3
                          ? 'bg-orange-50 dark:bg-orange-900/10'
                          : '';
                  return (
                    <tr
                      key={customer.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${rowHighlight}`}
                    >
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">{rankIcon(rank)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{customer.email ?? '—'}</td>
                      <td className="px-6 py-4 text-center">{tierBadge(customer.tier)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatNumber(customer.points_balance)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">pts</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Trophy}
              title="No leaderboard data"
              description="No customers with loyalty points yet."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
