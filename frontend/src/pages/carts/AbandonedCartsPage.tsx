import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Eye,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  DollarSign,
  Package,
} from 'lucide-react';
import type { Cart, CartStats, CartStatus } from '@/types';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function statusBadge(status: CartStatus) {
  const map: Record<CartStatus, { variant: 'info' | 'danger' | 'success' | 'warning'; label: string }> = {
    active: { variant: 'info', label: 'Active' },
    abandoned: { variant: 'danger', label: 'Abandoned' },
    recovered: { variant: 'success', label: 'Recovered' },
    converted: { variant: 'warning', label: 'Converted' },
  };
  const cfg = map[status] ?? { variant: 'info' as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ─── Component ────────────────────────────────────────────────────────── */

export function AbandonedCartsPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<Cart | null>(null);

  /* ── Queries ────────────────────────────────────────────────────────── */

  const { data, isLoading } = useQuery({
    queryKey: ['carts', page, search, statusFilter],
    queryFn: () =>
      cartApi
        .list({
          page,
          per_page: 15,
          search: search || undefined,
          status: statusFilter || undefined,
        })
        .then((res) => res.data),
  });

  const carts: Cart[] = data?.data ?? [];
  const meta = data?.meta;

  const { data: statsRes } = useQuery({
    queryKey: ['cart-stats'],
    queryFn: () => cartApi.stats().then((res) => res.data),
  });
  const stats: CartStats | null = statsRes?.data ?? null;

  /* ── Mutations ──────────────────────────────────────────────────────── */

  const reminderMutation = useMutation({
    mutationFn: (id: number) => cartApi.sendReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carts'] });
      queryClient.invalidateQueries({ queryKey: ['cart-stats'] });
      toast.success('Reminder sent successfully');
      setReminderTarget(null);
    },
    onError: () => {
      toast.error('Failed to send reminder');
      setReminderTarget(null);
    },
  });

  const recoverMutation = useMutation({
    mutationFn: (id: number) => cartApi.update(id, { status: 'recovered' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carts'] });
      queryClient.invalidateQueries({ queryKey: ['cart-stats'] });
      toast.success('Cart marked as recovered');
    },
    onError: () => {
      toast.error('Failed to update cart');
    },
  });

  /* ── Detail fetch ───────────────────────────────────────────────────── */

  const { data: detailRes, isLoading: detailLoading } = useQuery({
    queryKey: ['cart', selectedCart?.id],
    queryFn: () => cartApi.get(selectedCart!.id).then((res) => res.data),
    enabled: !!selectedCart,
  });
  const cartDetail: Cart | null = detailRes?.data ?? null;

  /* ── KPI cards ──────────────────────────────────────────────────────── */

  const statCards = [
    { label: 'Total Abandoned', value: stats?.total_abandoned ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
    { label: 'Recovered', value: stats?.total_recovered ?? 0, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Recovery Rate', value: `${(stats?.recovery_rate ?? 0).toFixed(1)}%`, icon: TrendingUp, color: 'text-blue-600 bg-blue-100' },
    { label: 'Abandoned Value', value: formatCurrency(stats?.abandoned_value ?? 0), icon: DollarSign, color: 'text-orange-600 bg-orange-100' },
    { label: 'Recovered Value', value: formatCurrency(stats?.recovered_value ?? 0), icon: DollarSign, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Recoverable', value: stats?.recoverable ?? 0, icon: RefreshCw, color: 'text-purple-600 bg-purple-100' },
  ];

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Abandoned Cart Recovery"
        subtitle="Monitor and recover abandoned shopping carts"
        breadcrumbs={[{ label: 'Abandoned Carts' }]}
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="abandoned">Abandoned</option>
            <option value="recovered">Recovered</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {isLoading ? (
          <TableSkeleton rows={6} cols={8} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-center font-medium text-gray-500">Items</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Total (UGX)</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-center font-medium text-gray-500">Reminders</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Last Reminder</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Abandoned Since</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {carts.length > 0 ? carts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{cart.customer?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{cart.customer?.email ?? ''}</p>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">{cart.items?.length ?? 0}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(cart.total)}</td>
                      <td className="px-6 py-4">{statusBadge(cart.status)}</td>
                      <td className="px-6 py-4 text-center text-gray-700">{cart.reminder_count}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(cart.reminder_sent_at)}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{daysAgo(cart.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Details"
                            onClick={() => { setSelectedCart(cart); setShowDetail(true); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {cart.status === 'abandoned' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Send Reminder"
                                onClick={() => setReminderTarget(cart)}
                              >
                                <Bell className="h-4 w-4 text-amber-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Mark as Recovered"
                                onClick={() => recoverMutation.mutate(cart.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4">
                        <EmptyState
                          icon={ShoppingCart}
                          title="No carts found"
                          description={search ? 'Try adjusting your search or filters.' : 'No carts match the current criteria.'}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
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

      {/* ── Detail Modal ───────────────────────────────────────────────── */}
      <Modal
        open={showDetail}
        onClose={() => { setShowDetail(false); setSelectedCart(null); }}
        title="Cart Details"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : cartDetail ? (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900">{cartDetail.customer?.name ?? '—'}</p>
                <p className="text-xs text-gray-500">{cartDetail.customer?.email ?? ''}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Status</p>
                <div className="mt-1">{statusBadge(cartDetail.status)}</div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Created</p>
                <p className="text-sm text-gray-700">{formatDate(cartDetail.created_at)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Last Reminder</p>
                <p className="text-sm text-gray-700">{formatDate(cartDetail.reminder_sent_at)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Reminders Sent</p>
                <p className="text-sm text-gray-700">{cartDetail.reminder_count}</p>
              </div>
              {cartDetail.recovered_at && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Recovered At</p>
                  <p className="text-sm text-gray-700">{formatDate(cartDetail.recovered_at)}</p>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Package className="h-4 w-4" /> Cart Items
              </h4>
              {cartDetail.items && cartDetail.items.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Product</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-500">Qty</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500">Unit Price</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cartDetail.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-gray-900">{item.product?.name ?? `Product #${item.product_id}`}</td>
                          <td className="px-4 py-2 text-center text-gray-700">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900">
                            {formatCurrency(item.subtotal ?? item.unit_price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={3} className="px-4 py-2 text-right font-semibold text-gray-700">Total</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900">{formatCurrency(cartDetail.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No items in this cart.</p>
              )}
            </div>

            {/* Actions */}
            {cartDetail.status === 'abandoned' && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowDetail(false);
                    setReminderTarget(cartDetail);
                  }}
                >
                  <Bell className="h-4 w-4" /> Send Reminder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    recoverMutation.mutate(cartDetail.id);
                    setShowDetail(false);
                    setSelectedCart(null);
                  }}
                >
                  <CheckCircle className="h-4 w-4" /> Mark as Recovered
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">Cart not found.</p>
        )}
      </Modal>

      {/* ── Reminder Confirmation Modal ────────────────────────────────── */}
      <Modal
        open={!!reminderTarget}
        onClose={() => setReminderTarget(null)}
        title="Send Reminder"
        size="sm"
      >
        {reminderTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Send a recovery reminder to{' '}
              <span className="font-semibold text-gray-900">{reminderTarget.customer?.name ?? 'this customer'}</span>{' '}
              for their abandoned cart worth{' '}
              <span className="font-semibold text-gray-900">{formatCurrency(reminderTarget.total)}</span>?
            </p>
            {reminderTarget.reminder_count > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {reminderTarget.reminder_count} reminder(s) already sent.
              </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReminderTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={reminderMutation.isPending}
                onClick={() => reminderMutation.mutate(reminderTarget.id)}
              >
                {reminderMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Send Reminder
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
