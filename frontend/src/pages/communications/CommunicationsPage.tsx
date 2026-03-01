import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interactionApi, customerApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatDateTime } from '@/lib/utils';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
} from 'lucide-react';
import type { Interaction, Customer } from '@/types';

const TYPE_OPTIONS = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'task', label: 'Task', icon: CheckCircle2 },
];

const CHANNEL_OPTIONS = ['phone', 'email', 'in_person', 'video_call', 'chat'];

export function CommunicationsPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Interaction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['interactions', page, search, typeFilter, statusFilter],
    queryFn: () =>
      interactionApi.list({
        page,
        per_page: 20,
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      }).then((res) => res.data),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => interactionApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      toast.success('Interaction marked as complete');
    },
    onError: () => toast.error('Failed to complete interaction'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => interactionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      toast.success('Interaction deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete interaction'),
  });

  const getTypeIcon = (type: string) => {
    const t = TYPE_OPTIONS.find((o) => o.value === type);
    if (!t) return <MessageSquare className="h-4 w-4" />;
    const Icon = t.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communications"
        subtitle="Track calls, emails, meetings, and tasks"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Communications' }]}
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New Interaction
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
              placeholder="Search interactions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : (
        <div className="space-y-3">
          {data?.data && data.data.length > 0 ? (
            data.data.map((interaction: Interaction) => (
              <Card key={interaction.id}>
                <div className="flex items-start gap-4">
                  {/* Type icon */}
                  <div className={`mt-1 flex items-center justify-center rounded-lg p-2 ${
                    interaction.type === 'call' ? 'bg-blue-100 text-blue-600' :
                    interaction.type === 'email' ? 'bg-green-100 text-green-600' :
                    interaction.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                    interaction.type === 'task' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getTypeIcon(interaction.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{interaction.subject}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {interaction.customer?.name ?? 'Unknown Customer'}
                          {interaction.lead && (
                            <span> &middot; Lead: {interaction.lead.title}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={interaction.is_completed ? 'success' : 'warning'}>
                          {interaction.is_completed ? 'Done' : 'Pending'}
                        </Badge>
                        <span className="text-xs text-gray-400">{formatDateTime(interaction.scheduled_at ?? interaction.created_at)}</span>
                      </div>
                    </div>

                    {interaction.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{interaction.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <StatusBadge status={interaction.type} />
                      {interaction.channel && (
                        <Badge variant="default">{interaction.channel.replace('_', ' ')}</Badge>
                      )}
                      {interaction.duration_minutes && (
                        <span className="text-xs text-gray-400">{interaction.duration_minutes} min</span>
                      )}
                      <div className="flex-1" />
                      {!interaction.is_completed && (
                        <Button variant="ghost" size="sm" onClick={() => completeMutation.mutate(interaction.id)}>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Complete</span>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(interaction)} className="text-danger-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No interactions found"
              description="Create your first interaction to start tracking communications."
              action={{ label: 'New Interaction', onClick: () => setShowForm(true) }}
            />
          )}

          {/* Pagination */}
          {data?.meta && data.meta.last_page > 1 && (
            <div className="flex items-center justify-between px-2">
              <p className="text-sm text-gray-500">
                Page {data.meta.current_page} of {data.meta.last_page}
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
        </div>
      )}

      {/* New Interaction Modal */}
      {showForm && (
        <NewInteractionModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['interactions'] });
            toast.success('Interaction created successfully');
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Interaction"
        message={`Are you sure you want to delete "${deleteTarget?.subject}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function NewInteractionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    customer_id: '',
    type: 'call',
    channel: 'phone',
    subject: '',
    description: '',
    scheduled_at: '',
    duration_minutes: '',
  });
  const [error, setError] = useState('');

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => customerApi.list({ per_page: 100 }).then((res) => res.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => interactionApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      customer_id: Number(form.customer_id),
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      scheduled_at: form.scheduled_at || null,
    });
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });
  const inputCls = 'block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100';

  return (
    <Modal open={true} onClose={onClose} title="New Interaction" size="md">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700">{error}</div>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
            <input value={form.subject} onChange={(e) => update('subject', e.target.value)} required className={inputCls} placeholder="e.g. Follow-up call" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
            <select value={form.customer_id} onChange={(e) => update('customer_id', e.target.value)} required className={inputCls}>
              <option value="">Select customer...</option>
              {customers?.map((c: Customer) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select value={form.type} onChange={(e) => update('type', e.target.value)} className={inputCls}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Channel</label>
              <select value={form.channel} onChange={(e) => update('channel', e.target.value)} className={inputCls}>
                {CHANNEL_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled At</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={(e) => update('scheduled_at', e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (min)</label>
              <input type="number" min="0" value={form.duration_minutes} onChange={(e) => update('duration_minutes', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} className={inputCls}
              placeholder="Interaction details..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Create</Button>
          </div>
        </form>
    </Modal>
  );
}
