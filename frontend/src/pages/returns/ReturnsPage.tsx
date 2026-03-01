import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnApi, orderApi, customerApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  RotateCcw,
  PackageX,
  Clock,
  CheckCircle,
  XCircle,
  Settings2,
} from 'lucide-react';
import type {
  ReturnRequest,
  ReturnStatus,
  Customer,
  Order,
} from '@/types';

const STATUS_OPTIONS: { value: ReturnStatus; label: string }[] = [
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'received', label: 'Received' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'rejected', label: 'Rejected' },
];

const REASON_OPTIONS = [
  'Defective product',
  'Wrong item received',
  'Item not as described',
  'Changed mind',
  'Damaged in transit',
  'Missing parts',
  'Other',
];

const REFUND_METHOD_OPTIONS = [
  { value: 'original', label: 'Original Payment Method' },
  { value: 'store_credit', label: 'Store Credit' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

function statusBadge(status: ReturnStatus) {
  const map: Record<ReturnStatus, { variant: 'info' | 'warning' | 'default' | 'success' | 'danger'; label: string }> = {
    requested: { variant: 'info', label: 'Requested' },
    approved: { variant: 'warning', label: 'Approved' },
    received: { variant: 'default', label: 'Received' },
    refunded: { variant: 'success', label: 'Refunded' },
    rejected: { variant: 'danger', label: 'Rejected' },
  };
  const cfg = map[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function ReturnsPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processingReturn, setProcessingReturn] = useState<ReturnRequest | null>(null);
  const [viewingReturn, setViewingReturn] = useState<ReturnRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReturnRequest | null>(null);

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['return-stats'],
    queryFn: () => returnApi.stats().then((res) => res.data.data),
  });

  // Returns list
  const { data, isLoading } = useQuery({
    queryKey: ['returns', page, search, statusFilter, dateFrom, dateTo],
    queryFn: () =>
      returnApi.list({
        page,
        per_page: 15,
        search: search || undefined,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => returnApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['return-stats'] });
      toast.success('Return request deleted');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Failed to delete return request');
      setDeleteTarget(null);
    },
  });

  const statCards = [
    { label: 'Total Returns', value: stats?.total ?? 0, icon: RotateCcw, color: 'text-gray-600 bg-gray-100' },
    { label: 'Pending Requests', value: stats?.requested ?? 0, icon: Clock, color: 'text-blue-600 bg-blue-100' },
    { label: 'Total Refunded', value: formatCurrency(stats?.total_refunded ?? 0), icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: XCircle, color: 'text-red-600 bg-red-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Returns & Refunds"
        subtitle={`${data?.meta?.total ?? 0} total return requests`}
        breadcrumbs={[{ label: 'Returns & Refunds' }]}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            New Return
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
              placeholder="Search by return number..."
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
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="To date"
          />
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
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Return #</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Order</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Reason</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Refund Amount</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Created</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.data && data.data.length > 0 ? data.data.map((ret: ReturnRequest) => (
                    <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary-600">{ret.return_number}</td>
                      <td className="px-6 py-4 text-gray-700">{ret.order?.order_number ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-700">{ret.customer?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-700 max-w-[180px] truncate">{ret.reason}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(ret.refund_amount)}</td>
                      <td className="px-6 py-4">{statusBadge(ret.status)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDateTime(ret.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            returnApi.get(ret.id).then((res) => setViewingReturn(res.data.data));
                          }} title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            returnApi.get(ret.id).then((res) => setProcessingReturn(res.data.data));
                          }} title="Process">
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(ret)} className="text-danger-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4">
                        <EmptyState
                          icon={PackageX}
                          title="No return requests found"
                          description={search ? 'Try adjusting your search or filters.' : 'No return requests have been submitted yet.'}
                          action={!search ? { label: 'New Return', onClick: () => setShowCreateModal(true) } : undefined}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data?.meta && data.meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                <p className="text-sm text-gray-500">
                  Page {data.meta.current_page} of {data.meta.last_page} ({data.meta.total} results)
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={data.meta.current_page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={data.meta.current_page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Return Modal */}
      {showCreateModal && (
        <CreateReturnModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['returns'] });
            queryClient.invalidateQueries({ queryKey: ['return-stats'] });
            toast.success('Return request created');
          }}
        />
      )}

      {/* View Detail Modal */}
      {viewingReturn && (
        <ViewReturnModal
          returnRequest={viewingReturn}
          onClose={() => setViewingReturn(null)}
        />
      )}

      {/* Process Return Modal */}
      {processingReturn && (
        <ProcessReturnModal
          returnRequest={processingReturn}
          onClose={() => setProcessingReturn(null)}
          onSuccess={() => {
            setProcessingReturn(null);
            queryClient.invalidateQueries({ queryKey: ['returns'] });
            queryClient.invalidateQueries({ queryKey: ['return-stats'] });
            toast.success('Return request updated');
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Return Request"
        message={`Are you sure you want to delete return ${deleteTarget?.return_number}? This action cannot be undone.`}
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
/*  Create Return Modal                                               */
/* ------------------------------------------------------------------ */
function CreateReturnModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [orderId, setOrderId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<{ product_name: string; quantity: number; amount: number }[]>([
    { product_name: '', quantity: 1, amount: 0 },
  ]);
  const [error, setError] = useState('');

  const { data: ordersData } = useQuery({
    queryKey: ['orders-list'],
    queryFn: () => orderApi.list({ per_page: 100 }).then((res) => res.data),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list({ per_page: 100 }).then((res) => res.data),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => returnApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 1, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((item) => item.product_name.trim() !== '');
    const refundAmount = validItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);
    const payload: Record<string, unknown> = {
      order_id: Number(orderId),
      customer_id: Number(customerId),
      reason,
      description: description || null,
      items: validItems,
      refund_amount: refundAmount,
    };
    mutation.mutate(payload);
  };

  return (
    <Modal open={true} onClose={onClose} title="Create Return Request" size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select order...</option>
              {ordersData?.data?.map((o: Order) => (
                <option key={o.id} value={o.id}>
                  {o.order_number}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select customer...</option>
              {customersData?.data?.map((c: Customer) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select reason...</option>
            {REASON_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Additional details about the return..."
          />
        </div>

        {/* Return Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Return Items</label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3" /> Add Item
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {index === 0 && <label className="block text-xs text-gray-500 mb-1">Product Name</label>}
                  <input
                    type="text"
                    value={item.product_name}
                    onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                    required
                    placeholder="Product name"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && <label className="block text-xs text-gray-500 mb-1">Qty</label>}
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    min={1}
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-4">
                  {index === 0 && <label className="block text-xs text-gray-500 mb-1">Amount (UGX)</label>}
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(index, 'amount', Number(e.target.value))}
                    min={0}
                    required
                    placeholder="0"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-danger-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Total refund: {formatCurrency(items.reduce((sum, item) => sum + item.amount * item.quantity, 0))}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            Create Return
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  View Return Detail Modal                                          */
/* ------------------------------------------------------------------ */
function ViewReturnModal({
  returnRequest,
  onClose,
}: {
  returnRequest: ReturnRequest;
  onClose: () => void;
}) {
  return (
    <Modal open={true} onClose={onClose} title={returnRequest.return_number} size="lg">
      <div className="p-6 space-y-6">
        {/* Status & Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            {statusBadge(returnRequest.status)}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Order</p>
            <p className="text-sm font-medium text-primary-600">{returnRequest.order?.order_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Customer</p>
            <p className="text-sm font-medium">{returnRequest.customer?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Refund Amount</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(returnRequest.refund_amount)}</p>
          </div>
        </div>

        {/* Reason & Description */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Reason</h3>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{returnRequest.reason}</p>
        </div>
        {returnRequest.description && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{returnRequest.description}</p>
          </div>
        )}

        {/* Return Items */}
        {returnRequest.items && returnRequest.items.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Return Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Qty</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {returnRequest.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-gray-700">{item.product_name}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(item.amount * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Refund Details */}
        {returnRequest.refund_method && (
          <div className="text-sm">
            <span className="text-gray-500">Refund Method: </span>
            <span className="font-medium capitalize">{returnRequest.refund_method.replace('_', ' ')}</span>
          </div>
        )}

        {/* Admin Notes */}
        {returnRequest.admin_notes && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Admin Notes</h3>
            <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3 whitespace-pre-wrap">{returnRequest.admin_notes}</p>
          </div>
        )}

        {/* Processed By */}
        {returnRequest.processed_by_user && (
          <div className="text-sm">
            <span className="text-gray-500">Processed By: </span>
            <span className="font-medium">{returnRequest.processed_by_user.name}</span>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-gray-400 flex flex-wrap gap-4">
          <span>Created {formatDateTime(returnRequest.created_at)}</span>
          {returnRequest.approved_at && <span>Approved {formatDateTime(returnRequest.approved_at)}</span>}
          {returnRequest.received_at && <span>Received {formatDateTime(returnRequest.received_at)}</span>}
          {returnRequest.refunded_at && <span>Refunded {formatDateTime(returnRequest.refunded_at)}</span>}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Process Return Modal                                              */
/* ------------------------------------------------------------------ */
function ProcessReturnModal({
  returnRequest,
  onClose,
  onSuccess,
}: {
  returnRequest: ReturnRequest;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState<string>(returnRequest.status);
  const [refundMethod, setRefundMethod] = useState(returnRequest.refund_method ?? '');
  const [refundAmount, setRefundAmount] = useState(returnRequest.refund_amount.toString());
  const [adminNotes, setAdminNotes] = useState(returnRequest.admin_notes ?? '');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => returnApi.update(returnRequest.id, data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      status,
      refund_method: refundMethod || null,
      refund_amount: Number(refundAmount),
      admin_notes: adminNotes || null,
    };
    mutation.mutate(payload);
  };

  const allowedStatuses = (() => {
    switch (returnRequest.status) {
      case 'requested':
        return STATUS_OPTIONS.filter((s) => ['approved', 'rejected'].includes(s.value));
      case 'approved':
        return STATUS_OPTIONS.filter((s) => ['received', 'rejected'].includes(s.value));
      case 'received':
        return STATUS_OPTIONS.filter((s) => ['refunded'].includes(s.value));
      default:
        return [];
    }
  })();

  if (allowedStatuses.length === 0) {
    return (
      <Modal open={true} onClose={onClose} title={`Process ${returnRequest.return_number}`} size="md">
        <div className="p-6">
          <p className="text-sm text-gray-600">
            This return is already <strong>{returnRequest.status}</strong> and cannot be processed further.
          </p>
          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} title={`Process ${returnRequest.return_number}`} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="text-sm text-gray-600">
          Current status: {statusBadge(returnRequest.status as ReturnStatus)}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select status...</option>
            {allowedStatuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Refund Method</label>
          <select
            value={refundMethod}
            onChange={(e) => setRefundMethod(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select refund method...</option>
            {REFUND_METHOD_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Refund Amount (UGX)</label>
          <input
            type="number"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            min={0}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Admin Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Internal notes about this return..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            Update Return
          </Button>
        </div>
      </form>
    </Modal>
  );
}
