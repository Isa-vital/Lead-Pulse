import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import {
  Zap,
  Play,
  Plus,
  Activity,
  Clock,
  ArrowRight,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import type {
  Automation,
  AutomationLog,
  AutomationTrigger,
  AutomationAction,
  AutomationStats,
} from '@/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Convert snake_case to Title Case */
function humanize(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function logStatusBadge(status: AutomationLog['status']) {
  const map: Record<AutomationLog['status'], { variant: 'success' | 'danger' | 'default'; label: string }> = {
    success: { variant: 'success', label: 'Success' },
    failed: { variant: 'danger', label: 'Failed' },
    skipped: { variant: 'default', label: 'Skipped' },
  };
  const cfg = map[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

const TRIGGER_OPTIONS: { value: AutomationTrigger; label: string }[] = [
  { value: 'cart_abandoned', label: 'Cart Abandoned' },
  { value: 'order_placed', label: 'Order Placed' },
  { value: 'customer_created', label: 'Customer Created' },
  { value: 'customer_inactive', label: 'Customer Inactive' },
  { value: 'lead_stage_changed', label: 'Lead Stage Changed' },
  { value: 'ticket_created', label: 'Ticket Created' },
];

const ACTION_OPTIONS: { value: AutomationAction; label: string }[] = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'assign_tag', label: 'Assign Tag' },
  { value: 'update_tier', label: 'Update Tier' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'send_notification', label: 'Send Notification' },
];

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export function AutomationsPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [triggerFilter, setTriggerFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);
  const [logsTarget, setLogsTarget] = useState<Automation | null>(null);

  /* ---- Queries ---- */

  const { data, isLoading } = useQuery({
    queryKey: ['automations', page, search, triggerFilter, activeFilter],
    queryFn: () =>
      automationApi
        .list({
          page,
          per_page: 15,
          search: search || undefined,
          trigger_type: triggerFilter || undefined,
          is_active: activeFilter !== '' ? activeFilter : undefined,
        })
        .then((res) => res.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['automation-stats'],
    queryFn: () => automationApi.stats().then((res) => res.data.data),
  });

  const automations: Automation[] = data?.data ?? [];
  const meta = data?.meta;
  const stats: AutomationStats | undefined = statsData;

  /* ---- Mutations ---- */

  const deleteMutation = useMutation({
    mutationFn: (id: number) => automationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast.success('Automation deleted');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Failed to delete automation');
      setDeleteTarget(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => automationApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast.success('Automation status updated');
    },
    onError: () => {
      toast.error('Failed to toggle automation');
    },
  });

  /* ---- KPI cards ---- */

  const statCards = [
    { label: 'Total Automations', value: stats?.total ?? 0, icon: Zap, color: 'text-gray-600 bg-gray-100' },
    { label: 'Active', value: stats?.active ?? 0, icon: Play, color: 'text-green-600 bg-green-100' },
    { label: 'Total Executions', value: stats?.total_executions ?? 0, icon: Activity, color: 'text-blue-600 bg-blue-100' },
    { label: 'Successful', value: stats?.successful_executions ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Failed', value: stats?.failed_executions ?? 0, icon: XCircle, color: 'text-red-600 bg-red-100' },
  ];

  /* ---- Render ---- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Automations"
        subtitle={`${stats?.total ?? 0} workflow automations`}
        breadcrumbs={[{ label: 'Automations' }]}
        actions={
          <Button onClick={() => { setEditingAutomation(null); setShowFormModal(true); }}>
            <Plus className="h-4 w-4" />
            New Automation
          </Button>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
              placeholder="Search automations..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={triggerFilter}
            onChange={(e) => { setTriggerFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Triggers</option>
            {TRIGGER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Workflow</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Delay</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Executions</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Last Triggered</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {automations.length > 0 ? automations.map((automation) => (
                    <tr key={automation.id} className="hover:bg-gray-50 transition-colors">
                      {/* Name & description */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{automation.name}</p>
                        {automation.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{automation.description}</p>
                        )}
                      </td>

                      {/* Trigger → Action */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Badge variant="info">{humanize(automation.trigger_type)}</Badge>
                          <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <Badge variant="success">{humanize(automation.action_type)}</Badge>
                        </div>
                      </td>

                      {/* Delay */}
                      <td className="px-6 py-4 text-gray-700">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {automation.delay_minutes > 0 ? `${automation.delay_minutes} min` : 'Instant'}
                        </div>
                      </td>

                      {/* Active toggle */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(automation.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                            automation.is_active ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          aria-label="Toggle active"
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                              automation.is_active ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Executions */}
                      <td className="px-6 py-4 text-right text-gray-700">{automation.execution_count}</td>

                      {/* Last triggered */}
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(automation.last_triggered_at)}</td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Logs"
                            onClick={() => setLogsTarget(automation)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit"
                            onClick={() => { setEditingAutomation(automation); setShowFormModal(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-600"
                            title="Delete"
                            onClick={() => setDeleteTarget(automation)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4">
                        <EmptyState
                          icon={Zap}
                          title="No automations found"
                          description={search ? 'Try adjusting your search or filters.' : 'No automations have been created yet.'}
                          action={!search ? { label: 'New Automation', onClick: () => { setEditingAutomation(null); setShowFormModal(true); } } : undefined}
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
      {showFormModal && (
        <AutomationFormModal
          automation={editingAutomation}
          onClose={() => { setShowFormModal(false); setEditingAutomation(null); }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingAutomation(null);
            queryClient.invalidateQueries({ queryKey: ['automations'] });
            queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
            toast.success(editingAutomation ? 'Automation updated' : 'Automation created');
          }}
        />
      )}

      {/* View Logs Modal */}
      {logsTarget && (
        <AutomationLogsModal
          automation={logsTarget}
          onClose={() => setLogsTarget(null)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Automation"
        message={`Are you sure you want to delete automation "${deleteTarget?.name}"? This action cannot be undone.`}
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
/*  Automation Form Modal (Create / Edit)                              */
/* ------------------------------------------------------------------ */

function AutomationFormModal({
  automation,
  onClose,
  onSuccess,
}: {
  automation: Automation | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!automation;

  const [name, setName] = useState(automation?.name ?? '');
  const [description, setDescription] = useState(automation?.description ?? '');
  const [triggerType, setTriggerType] = useState<AutomationTrigger>(automation?.trigger_type ?? 'cart_abandoned');
  const [actionType, setActionType] = useState<AutomationAction>(automation?.action_type ?? 'send_email');
  const [delayMinutes, setDelayMinutes] = useState<number>(automation?.delay_minutes ?? 0);
  const [isActive, setIsActive] = useState(automation?.is_active ?? true);
  const [conditions, setConditions] = useState(
    automation?.conditions ? JSON.stringify(automation.conditions, null, 2) : ''
  );
  const [actionConfig, setActionConfig] = useState(
    automation?.action_config ? JSON.stringify(automation.action_config, null, 2) : ''
  );
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? automationApi.update(automation!.id, data) : automationApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedConditions: unknown = null;
    if (conditions.trim()) {
      try {
        parsedConditions = JSON.parse(conditions);
      } catch {
        setError('Conditions must be valid JSON');
        return;
      }
    }

    let parsedActionConfig: unknown = null;
    if (actionConfig.trim()) {
      try {
        parsedActionConfig = JSON.parse(actionConfig);
      } catch {
        setError('Action config must be valid JSON');
        return;
      }
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      trigger_type: triggerType,
      action_type: actionType,
      delay_minutes: delayMinutes,
      is_active: isActive,
      conditions: parsedConditions,
      action_config: parsedActionConfig,
    };
    mutation.mutate(payload);
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <Modal open={true} onClose={onClose} title={isEdit ? 'Edit Automation' : 'Create Automation'} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Automation name"
              className={inputClass}
            />
          </div>

          {/* Delay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delay (minutes)</label>
            <input
              type="number"
              min={0}
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              placeholder="0"
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
            placeholder="Brief description of this automation"
            rows={2}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Trigger Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type *</label>
            <select
              required
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as AutomationTrigger)}
              className={inputClass}
            >
              {TRIGGER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action Type *</label>
            <select
              required
              value={actionType}
              onChange={(e) => setActionType(e.target.value as AutomationAction)}
              className={inputClass}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
              isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">{isActive ? 'Active' : 'Inactive'}</span>
        </div>

        {/* Conditions JSON */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conditions (JSON)</label>
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder='{"min_cart_value": 50}'
            rows={3}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>

        {/* Action Config JSON */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action Config (JSON)</label>
          <textarea
            value={actionConfig}
            onChange={(e) => setActionConfig(e.target.value)}
            placeholder='{"template_id": 1, "subject": "Hello"}'
            rows={3}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Automation Logs Modal                                              */
/* ------------------------------------------------------------------ */

function AutomationLogsModal({
  automation,
  onClose,
}: {
  automation: Automation;
  onClose: () => void;
}) {
  const [logsPage, setLogsPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['automation-logs', automation.id, logsPage],
    queryFn: () =>
      automationApi.logs(automation.id, { page: logsPage, per_page: 10 }).then((res) => res.data),
  });

  const logs: AutomationLog[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <Modal open={true} onClose={onClose} title={`Logs — ${automation.name}`} size="lg">
      <div className="p-6">
        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No logs yet"
            description="This automation has not been executed yet."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Result</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-gray-900">{log.customer?.name ?? `Customer #${log.customer_id}`}</td>
                      <td className="px-4 py-2">{logStatusBadge(log.status)}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs max-w-[200px] truncate">{log.result ?? '—'}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Logs pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-3 mt-3">
                <p className="text-xs text-gray-500">
                  Page {meta.current_page} of {meta.last_page}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setLogsPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setLogsPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
