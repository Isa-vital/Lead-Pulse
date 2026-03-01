import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Ticket,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import type { Coupon, CouponType } from '@/types';

const TYPE_OPTIONS: { value: CouponType; label: string }[] = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
  { value: 'free_shipping', label: 'Free Shipping' },
];

function typeBadge(type: CouponType) {
  const map: Record<CouponType, { variant: 'info' | 'success' | 'default'; label: string }> = {
    percentage: { variant: 'info', label: 'Percentage' },
    fixed_amount: { variant: 'success', label: 'Fixed Amount' },
    free_shipping: { variant: 'default', label: 'Free Shipping' },
  };
  const cfg = map[type] ?? { variant: 'default' as const, label: type };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function couponStatus(coupon: Coupon): 'active' | 'expired' | 'inactive' {
  if (!coupon.is_active) return 'inactive';
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return 'expired';
  return 'active';
}

function statusBadge(coupon: Coupon) {
  const status = couponStatus(coupon);
  const map: Record<string, { variant: 'success' | 'danger' | 'default'; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    expired: { variant: 'danger', label: 'Expired' },
    inactive: { variant: 'default', label: 'Inactive' },
  };
  const cfg = map[status]!;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function displayValue(coupon: Coupon): string {
  switch (coupon.type) {
    case 'percentage':
      return `${coupon.value}%`;
    case 'fixed_amount':
      return formatCurrency(coupon.value);
    case 'free_shipping':
      return 'Free Shipping';
    default:
      return String(coupon.value);
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function CouponsPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  // Coupons list
  const { data, isLoading } = useQuery({
    queryKey: ['coupons', page, search, typeFilter, activeFilter],
    queryFn: () =>
      couponApi
        .list({
          page,
          per_page: 15,
          search: search || undefined,
          type: typeFilter || undefined,
          is_active: activeFilter !== '' ? activeFilter : undefined,
        })
        .then((res) => res.data),
  });

  const coupons: Coupon[] = data?.data ?? [];
  const meta = data?.meta;

  // Derive stats from current dataset
  const totalCoupons = meta?.total ?? 0;
  const activeCoupons = coupons.filter((c) => couponStatus(c) === 'active').length;
  const expiredCoupons = coupons.filter((c) => couponStatus(c) === 'expired').length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.times_used, 0);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Failed to delete coupon');
      setDeleteTarget(null);
    },
  });

  const statCards = [
    { label: 'Total Coupons', value: totalCoupons, icon: Ticket, color: 'text-gray-600 bg-gray-100' },
    { label: 'Active', value: activeCoupons, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Expired', value: expiredCoupons, icon: Clock, color: 'text-red-600 bg-red-100' },
    { label: 'Total Usage', value: totalUsage, icon: BarChart3, color: 'text-blue-600 bg-blue-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Coupons & Discounts"
        subtitle={`${totalCoupons} total coupons`}
        breadcrumbs={[{ label: 'Coupons & Discounts' }]}
        actions={
          <Button onClick={() => { setEditingCoupon(null); setShowModal(true); }}>
            <Plus className="h-4 w-4" />
            New Coupon
          </Button>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
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
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Code</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Value</th>
                    <th className="px-6 py-3 text-center font-medium text-gray-500">Usage</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Valid Period</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.length > 0 ? coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-primary-600">{coupon.code}</td>
                      <td className="px-6 py-4 text-gray-700">{coupon.name}</td>
                      <td className="px-6 py-4">{typeBadge(coupon.type)}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">{displayValue(coupon)}</td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {coupon.times_used}{coupon.usage_limit !== null ? `/${coupon.usage_limit}` : ''}
                      </td>
                      <td className="px-6 py-4">{statusBadge(coupon)}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        <span>{formatDate(coupon.starts_at)}</span>
                        <span className="mx-1">→</span>
                        <span>{formatDate(coupon.expires_at)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit"
                            onClick={() => { setEditingCoupon(coupon); setShowModal(true); }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-600"
                            title="Delete"
                            onClick={() => setDeleteTarget(coupon)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4">
                        <EmptyState
                          icon={Ticket}
                          title="No coupons found"
                          description={search ? 'Try adjusting your search or filters.' : 'No coupons have been created yet.'}
                          action={!search ? { label: 'New Coupon', onClick: () => { setEditingCoupon(null); setShowModal(true); } } : undefined}
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

      {/* Create / Edit Modal */}
      {showModal && (
        <CouponFormModal
          coupon={editingCoupon}
          onClose={() => { setShowModal(false); setEditingCoupon(null); }}
          onSuccess={() => {
            setShowModal(false);
            setEditingCoupon(null);
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon "${deleteTarget?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Coupon Form Modal (Create / Edit)                                 */
/* ------------------------------------------------------------------ */
function CouponFormModal({
  coupon,
  onClose,
  onSuccess,
}: {
  coupon: Coupon | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!coupon;

  const [code, setCode] = useState(coupon?.code ?? '');
  const [name, setName] = useState(coupon?.name ?? '');
  const [description, setDescription] = useState(coupon?.description ?? '');
  const [type, setType] = useState<CouponType>(coupon?.type ?? 'percentage');
  const [value, setValue] = useState(coupon?.value?.toString() ?? '');
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.min_order_amount?.toString() ?? '');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(coupon?.max_discount_amount?.toString() ?? '');
  const [usageLimit, setUsageLimit] = useState(coupon?.usage_limit?.toString() ?? '');
  const [usagePerCustomer, setUsagePerCustomer] = useState(coupon?.usage_per_customer?.toString() ?? '');
  const [startsAt, setStartsAt] = useState(coupon?.starts_at?.slice(0, 16) ?? '');
  const [expiresAt, setExpiresAt] = useState(coupon?.expires_at?.slice(0, 16) ?? '');
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? couponApi.update(coupon!.id, data) : couponApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || null,
      type,
      value: Number(value),
      min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
      max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      usage_per_customer: usagePerCustomer ? Number(usagePerCustomer) : null,
      starts_at: startsAt || null,
      expires_at: expiresAt || null,
      is_active: isActive,
    };
    mutation.mutate(payload);
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <Modal open={true} onClose={onClose} title={isEdit ? 'Edit Coupon' : 'Create Coupon'} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20"
              className={inputClass}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Coupon name"
              className={inputClass}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional description"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value as CouponType)}
              className={inputClass}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value {type === 'percentage' ? '(%)' : type === 'fixed_amount' ? '(UGX)' : ''} *
            </label>
            <input
              type="number"
              required={type !== 'free_shipping'}
              disabled={type === 'free_shipping'}
              min="0"
              step={type === 'percentage' ? '0.01' : '1'}
              value={type === 'free_shipping' ? '0' : value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>

          {/* Min Order Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (UGX)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="No minimum"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Max Discount Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (UGX)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={maxDiscountAmount}
              onChange={(e) => setMaxDiscountAmount(e.target.value)}
              placeholder="No limit"
              className={inputClass}
            />
          </div>

          {/* Usage Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
            <input
              type="number"
              min="0"
              step="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Unlimited"
              className={inputClass}
            />
          </div>

          {/* Usage Per Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Per Customer Limit</label>
            <input
              type="number"
              min="0"
              step="1"
              value={usagePerCustomer}
              onChange={(e) => setUsagePerCustomer(e.target.value)}
              placeholder="Unlimited"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Starts At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Expires At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
          </label>
          <span className="text-sm text-gray-700">Active</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
