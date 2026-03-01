import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportTicketApi, customerApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatDateTime, timeAgo } from '@/lib/utils';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  LifeBuoy,
  Ticket,
  Clock,
  AlertTriangle,
  CheckCircle,
  Send,
} from 'lucide-react';
import type {
  SupportTicket,
  TicketReply,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  Customer,
} from '@/types';

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'product', label: 'Product' },
];

function priorityBadge(priority: TicketPriority) {
  const map: Record<TicketPriority, { variant: 'danger' | 'warning' | 'default' | 'success'; label: string }> = {
    urgent: { variant: 'danger', label: 'Urgent' },
    high: { variant: 'warning', label: 'High' },
    medium: { variant: 'default', label: 'Medium' },
    low: { variant: 'success', label: 'Low' },
  };
  const cfg = map[priority] ?? { variant: 'default' as const, label: priority };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function statusBadge(status: TicketStatus) {
  const map: Record<TicketStatus, { variant: 'info' | 'warning' | 'default' | 'success' | 'danger'; label: string }> = {
    open: { variant: 'info', label: 'Open' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    waiting: { variant: 'default', label: 'Waiting' },
    resolved: { variant: 'success', label: 'Resolved' },
    closed: { variant: 'default', label: 'Closed' },
  };
  const cfg = map[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function SupportTicketsPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupportTicket | null>(null);

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['support-ticket-stats'],
    queryFn: () => supportTicketApi.stats().then((res) => res.data.data),
  });

  // Tickets list
  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', page, search, statusFilter, priorityFilter, categoryFilter],
    queryFn: () =>
      supportTicketApi.list({
        page,
        per_page: 15,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
      }).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => supportTicketApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-stats'] });
      toast.success('Ticket deleted');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Failed to delete ticket');
      setDeleteTarget(null);
    },
  });

  const statCards = [
    { label: 'Total Tickets', value: stats?.total ?? 0, icon: Ticket, color: 'text-gray-600 bg-gray-100' },
    { label: 'Open', value: stats?.open ?? 0, icon: LifeBuoy, color: 'text-blue-600 bg-blue-100' },
    { label: 'In Progress', value: stats?.in_progress ?? 0, icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
    { label: 'Avg Resolution', value: stats?.avg_resolution_hours != null ? `${stats.avg_resolution_hours}h` : '—', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Support Tickets"
        subtitle={`${data?.meta?.total ?? 0} total tickets`}
        breadcrumbs={[{ label: 'Support Tickets' }]}
        actions={
          <Button onClick={() => { setEditingTicket(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
              placeholder="Search by ticket # or subject..."
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
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
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
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Ticket #</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Subject</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Category</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Priority</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Assigned To</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Created</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.data && data.data.length > 0 ? data.data.map((ticket: SupportTicket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary-600">{ticket.ticket_number}</td>
                      <td className="px-6 py-4 text-gray-700 max-w-[200px] truncate">{ticket.subject}</td>
                      <td className="px-6 py-4 text-gray-700">{ticket.customer?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-700 capitalize">{ticket.category}</td>
                      <td className="px-6 py-4">{priorityBadge(ticket.priority)}</td>
                      <td className="px-6 py-4">{statusBadge(ticket.status)}</td>
                      <td className="px-6 py-4 text-gray-700">{ticket.assignee?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDateTime(ticket.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            supportTicketApi.get(ticket.id).then((res) => setViewingTicket(res.data.data));
                          }} title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            supportTicketApi.get(ticket.id).then((res) => {
                              setEditingTicket(res.data.data);
                              setShowForm(true);
                            });
                          }} title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(ticket)} className="text-danger-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-4">
                        <EmptyState
                          icon={LifeBuoy}
                          title="No tickets found"
                          description={search ? 'Try adjusting your search or filters.' : 'Create your first support ticket to get started.'}
                          action={!search ? { label: 'New Ticket', onClick: () => { setEditingTicket(null); setShowForm(true); } } : undefined}
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

      {/* Create/Edit Modal */}
      {showForm && (
        <TicketFormModal
          ticket={editingTicket}
          onClose={() => { setShowForm(false); setEditingTicket(null); }}
          onSuccess={() => {
            setShowForm(false);
            setEditingTicket(null);
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['support-ticket-stats'] });
            toast.success(editingTicket ? 'Ticket updated' : 'Ticket created');
          }}
        />
      )}

      {/* View Detail Modal */}
      {viewingTicket && (
        <TicketDetailModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
          onReplyAdded={() => {
            supportTicketApi.get(viewingTicket.id).then((res) => setViewingTicket(res.data.data));
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Ticket"
        message={`Are you sure you want to delete ticket ${deleteTarget?.ticket_number}? This action cannot be undone.`}
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
/*  Create / Edit Form Modal                                          */
/* ------------------------------------------------------------------ */
function TicketFormModal({
  ticket,
  onClose,
  onSuccess,
}: {
  ticket: SupportTicket | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!ticket;
  const [customerId, setCustomerId] = useState(ticket?.customer_id?.toString() ?? '');
  const [subject, setSubject] = useState(ticket?.subject ?? '');
  const [description, setDescription] = useState(ticket?.description ?? '');
  const [category, setCategory] = useState<string>(ticket?.category ?? 'general');
  const [priority, setPriority] = useState<string>(ticket?.priority ?? 'medium');
  const [status, setStatus] = useState<string>(ticket?.status ?? 'open');
  const [orderId, setOrderId] = useState(ticket?.order_id?.toString() ?? '');
  const [error, setError] = useState('');

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list({ per_page: 100 }).then(res => res.data),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEditing ? supportTicketApi.update(ticket!.id, data) : supportTicketApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      customer_id: Number(customerId),
      subject,
      description,
      category,
      priority,
      ...(isEditing ? { status } : {}),
      order_id: orderId ? Number(orderId) : null,
    };
    mutation.mutate(payload);
  };

  return (
    <Modal open={true} onClose={onClose} title={isEditing ? 'Edit Ticket' : 'New Support Ticket'} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

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

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Brief summary of the issue..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe the issue in detail..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {isEditing && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Order ID <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="number"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Related order ID..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? 'Update Ticket' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  View Detail Modal (ticket info + replies + reply form)            */
/* ------------------------------------------------------------------ */
function TicketDetailModal({
  ticket,
  onClose,
  onReplyAdded,
}: {
  ticket: SupportTicket;
  onClose: () => void;
  onReplyAdded: () => void;
}) {
  const toast = useToastStore();
  const [replyBody, setReplyBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const replyMutation = useMutation({
    mutationFn: (data: { body: string; is_internal?: boolean }) =>
      supportTicketApi.reply(ticket.id, data),
    onSuccess: () => {
      toast.success('Reply sent');
      setReplyBody('');
      setIsInternal(false);
      onReplyAdded();
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    replyMutation.mutate({ body: replyBody, is_internal: isInternal || undefined });
  };

  return (
    <Modal open={true} onClose={onClose} title={ticket.ticket_number} size="lg">
      <div className="px-6 pb-2 -mt-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.customer?.name}</p>
      </div>
      <div className="p-6 space-y-6">
        {/* Ticket Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            {statusBadge(ticket.status)}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            {priorityBadge(ticket.priority)}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Category</p>
            <p className="text-sm font-medium capitalize">{ticket.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Assigned To</p>
            <p className="text-sm font-medium">{ticket.assignee?.name ?? 'Unassigned'}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">{ticket.subject}</h3>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {ticket.order && (
          <div className="text-sm">
            <span className="text-gray-500">Related Order: </span>
            <span className="font-medium text-primary-600">{ticket.order.order_number}</span>
          </div>
        )}

        <div className="text-xs text-gray-400 flex gap-4">
          <span>Created {formatDateTime(ticket.created_at)}</span>
          {ticket.first_response_at && <span>First response {timeAgo(ticket.first_response_at)}</span>}
          {ticket.resolved_at && <span>Resolved {timeAgo(ticket.resolved_at)}</span>}
          {ticket.is_overdue && <span className="text-red-500 font-medium">Overdue</span>}
        </div>

        {/* Replies */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">
              Replies ({ticket.replies?.length ?? 0})
            </h3>
          </div>
          {ticket.replies && ticket.replies.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {ticket.replies.map((reply: TicketReply) => (
                <div
                  key={reply.id}
                  className={`rounded-lg p-3 text-sm ${
                    reply.is_internal
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">
                      {reply.user?.name ?? 'Unknown'}
                      {reply.is_internal && (
                        <Badge variant="warning" className="ml-2">Internal</Badge>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(reply.created_at)}</span>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{reply.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No replies yet.</p>
          )}
        </div>

        {/* Reply Form */}
        {ticket.status !== 'closed' && (
          <form onSubmit={handleReply} className="space-y-3 border-t border-gray-200 pt-4">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={3}
              required
              placeholder="Write a reply..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Internal note
              </label>
              <Button type="submit" loading={replyMutation.isPending} size="sm">
                <Send className="h-4 w-4" />
                Send Reply
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
