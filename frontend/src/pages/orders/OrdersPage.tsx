import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, customerApi, productApi } from '@/api/endpoints';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/utils';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Trash2,
  FileDown,
  Clock,
  ArrowRight,
  ShoppingCart,
} from 'lucide-react';
import type { Order, Customer, Product, OrderStatus } from '@/types';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export function OrdersPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: () =>
      orderApi.list({
        page,
        per_page: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      }).then((res) => res.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Status updated');
      if (viewingOrder) {
        orderApi.get(viewingOrder.id).then((res) => setViewingOrder(res.data.data));
      }
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orderApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Delete failed');
      setDeleteTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Orders"
        subtitle={`${data?.meta?.total ?? 0} total orders`}
        breadcrumbs={[{ label: 'Orders' }]}
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order # or customer..."
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
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Order #</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Total</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.data && data.data.length > 0 ? data.data.map((order: Order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary-600">{order.order_number}</td>
                      <td className="px-6 py-4 text-gray-700">{order.customer?.name ?? '—'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDateTime(order.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            orderApi.get(order.id).then((res) => setViewingOrder(res.data.data));
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            orderApi.downloadInvoice(order.id).then((res) => {
                              const url = URL.createObjectURL(new Blob([res.data]));
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `Invoice-${order.order_number}.pdf`;
                              a.click();
                              URL.revokeObjectURL(url);
                            });
                          }} title="Download Invoice">
                            <FileDown className="h-4 w-4" />
                          </Button>
                          {(order.status === 'pending' || order.status === 'cancelled') && (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(order)} className="text-danger-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4">
                        <EmptyState
                          icon={ShoppingCart}
                          title="No orders found"
                          description={search ? 'Try adjusting your search.' : 'Create your first order to get started.'}
                          action={!search ? { label: 'New Order', onClick: () => setShowForm(true) } : undefined}
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

      {/* Order Detail Modal */}
      {viewingOrder && (
        <OrderDetailModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          onStatusChange={(status) => statusMutation.mutate({ id: viewingOrder.id, status })}
          statusLoading={statusMutation.isPending}
        />
      )}

      {/* New Order Modal */}
      {showForm && (
        <NewOrderModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success('Order created');
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Order"
        message={`Are you sure you want to delete order ${deleteTarget?.order_number}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function OrderDetailModal({ order, onClose, onStatusChange, statusLoading }: {
  order: Order;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  statusLoading: boolean;
}) {
  const transitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
  };

  const nextStatuses = transitions[order.status] ?? [];

  return (
    <Modal open={true} onClose={onClose} title={order.order_number} size="lg">
      <div className="px-6 pb-2 -mt-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer?.name}</p>
      </div>
      <div className="p-6 space-y-6">
          {/* Status + Actions */}
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <div className="flex gap-2">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => onStatusChange(status)}
                  loading={statusLoading}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Order Items */}
          <Card padding={false}>
            <div className="p-4 pb-0">
              <CardHeader title="Items" />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Product</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Qty</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Price</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium">{item.product?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{item.product?.sku}</p>
                    </td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Totals */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-green-600">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{order.notes}</p>
            </div>
          )}

          {/* Status History / Audit Trail */}
          <StatusHistoryTimeline orderId={order.id} />
        </div>
    </Modal>
  );
}

function NewOrderModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<{ product_id: string; quantity: string; unit_price: string }[]>([
    { product_id: '', quantity: '1', unit_price: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => customerApi.list({ per_page: 100 }).then((res) => res.data.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => productApi.list({ per_page: 100, is_active: true }).then((res) => res.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => orderApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const addItem = () => setItems([...items, { product_id: '', quantity: '1', unit_price: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...items];
    const current = updated[i];
    if (!current) return;
    updated[i] = { product_id: current.product_id, quantity: current.quantity, unit_price: current.unit_price, [field]: value };
    if (field === 'product_id' && products) {
      const p = products.find((prod: Product) => prod.id === Number(value));
      if (p && updated[i]) updated[i].unit_price = String(p.price);
    }
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      customer_id: Number(customerId),
      items: items.filter((i) => i.product_id).map((i) => ({
        product_id: Number(i.product_id),
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
      })),
      notes: notes || null,
    });
  };

  return (
    <Modal open={true} onClose={onClose} title="New Order" size="lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">{error}</div>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select customer...</option>
              {customers?.map((c: Customer) => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
              <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <select value={item.product_id} onChange={(e) => updateItem(i, 'product_id', e.target.value)} required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Product...</option>
                    {products?.map((p: Product) => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Qty" />
                </div>
                <div className="w-28">
                  <input type="number" step="0.01" min="0" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Price" />
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="p-2 text-gray-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <div className="text-right text-sm font-medium text-gray-700">
              Subtotal: {formatCurrency(subtotal)}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Create Order</Button>
          </div>
        </form>
    </Modal>
  );
}

function StatusHistoryTimeline({ orderId }: { orderId: number }) {
  const [history, setHistory] = useState<{ id: number; from_status: string | null; to_status: string; notes: string | null; user: { id: number; name: string } | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.statusHistory(orderId).then((res) => {
      setHistory(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orderId]);

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-400',
    confirmed: 'bg-blue-400',
    processing: 'bg-indigo-400',
    shipped: 'bg-purple-400',
    delivered: 'bg-green-400',
    cancelled: 'bg-red-400',
    refunded: 'bg-gray-400',
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-gray-400 text-sm">Loading history...</div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">Status History</h3>
      </div>
      <div className="space-y-0">
        {history.map((entry, i) => (
          <div key={entry.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full ${statusColor[entry.to_status] ?? 'bg-gray-300'} ring-2 ring-white`} />
              {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200" />}
            </div>
            {/* Content */}
            <div className="pb-4 -mt-0.5">
              <div className="flex items-center gap-2 text-sm">
                {entry.from_status && (
                  <>
                    <span className="capitalize font-medium text-gray-600">{entry.from_status}</span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </>
                )}
                <span className="capitalize font-semibold text-gray-900">{entry.to_status}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {entry.user?.name ?? 'System'} &middot; {timeAgo(entry.created_at)}
              </p>
              {entry.notes && (
                <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1">{entry.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
