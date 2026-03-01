import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi, customerApi } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PipelineStage, PipelineLead, Customer } from '@/types';

export function PipelinePage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [draggedLead, setDraggedLead] = useState<number | null>(null);

  const { data: board, isLoading } = useQuery({
    queryKey: ['pipeline-board'],
    queryFn: () => leadApi.board().then((res) => res.data.data),
  });

  const moveMutation = useMutation({
    mutationFn: ({ leadId, stageId, position }: { leadId: number; stageId: number; position?: number }) =>
      leadApi.moveStage(leadId, { pipeline_stage_id: stageId, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-board'] });
      toast.success('Lead moved');
    },
    onError: () => toast.error('Failed to move lead'),
  });

  const handleDragStart = (leadId: number) => setDraggedLead(leadId);

  const handleDrop = (stageId: number) => {
    if (draggedLead) {
      moveMutation.mutate({ leadId: draggedLead, stageId });
      setDraggedLead(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  const stages: PipelineStage[] = board ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Sales Pipeline"
        subtitle={`${stages.reduce((sum, s) => sum + (s.leads_count ?? s.leads?.length ?? 0), 0)} total leads · ${formatCurrency(stages.reduce((sum, s) => sum + Number(s.total_value ?? 0), 0))} pipeline value`}
        breadcrumbs={[{ label: 'Pipeline' }]}
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        }
      />

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            isDragging={draggedLead !== null}
            onLeadClick={setSelectedLead}
          />
        ))}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          stages={stages}
          onClose={() => setSelectedLead(null)}
          onMoveStage={(stageId) => {
            moveMutation.mutate({ leadId: selectedLead.id, stageId });
            setSelectedLead(null);
          }}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['pipeline-board'] })}
        />
      )}

      {/* New Lead Modal */}
      {showForm && (
        <NewLeadModal
          stages={stages}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['pipeline-board'] });
            toast.success('Lead created');
          }}
        />
      )}
    </div>
  );
}

function KanbanColumn({
  stage,
  onDragStart,
  onDrop,
  isDragging,
  onLeadClick,
}: {
  stage: PipelineStage;
  onDragStart: (leadId: number) => void;
  onDrop: (stageId: number) => void;
  isDragging: boolean;
  onLeadClick: (lead: PipelineLead) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const leads: PipelineLead[] = stage.leads ?? [];
  const count = stage.leads_count ?? leads.length;
  const value = stage.total_value ?? leads.reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  const colorMap: Record<string, string> = {
    'New': 'bg-blue-500',
    'Contacted': 'bg-yellow-500',
    'Qualified': 'bg-purple-500',
    'Proposal': 'bg-indigo-500',
    'Negotiation': 'bg-orange-500',
    'Won': 'bg-green-500',
    'Lost': 'bg-red-500',
  };
  const barColor = colorMap[stage.name] ?? 'bg-gray-500';

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col bg-gray-50 rounded-xl border border-gray-200 ${isDragging ? 'ring-2 ring-primary-300 ring-offset-1' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(stage.id)}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200">
        <div className={`h-1 w-full rounded-full ${barColor} mb-2`} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">{stage.name}</h3>
            <span className="inline-flex items-center justify-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
              {count}
            </span>
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-gray-600">
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatCurrency(Number(value))}
        </p>
      </div>

      {/* Cards */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-340px)]">
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-gray-400">
              No leads
            </div>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                draggable
                onDragStart={() => onDragStart(lead.id)}
                onClick={() => onLeadClick(lead)}
                className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{lead.customer?.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-primary-600">{formatCurrency(Number(lead.value ?? 0))}</span>
                      {lead.probability != null && (
                        <span className="text-xs text-gray-400">{lead.probability}%</span>
                      )}
                    </div>
                    {lead.expected_close && (
                      <p className="text-xs text-gray-400 mt-1">Close: {lead.expected_close}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function LeadDetailModal({
  lead,
  stages,
  onClose,
  onMoveStage,
  onRefresh,
}: {
  lead: PipelineLead;
  stages: PipelineStage[];
  onClose: () => void;
  onMoveStage: (stageId: number) => void;
  onRefresh: () => void;
}) {
  const toast = useToastStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: (id: number) => leadApi.delete(id),
    onSuccess: () => { onClose(); onRefresh(); toast.success('Lead deleted'); },
    onError: () => toast.error('Failed to delete lead'),
  });

  return (
    <>
    <Modal open={true} onClose={onClose} title={lead.title}>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Customer</p>
              <p className="font-medium">{lead.customer?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Value</p>
              <p className="font-medium">{formatCurrency(Number(lead.value ?? 0))}</p>
            </div>
            <div>
              <p className="text-gray-500">Probability</p>
              <p className="font-medium">{lead.probability ?? 0}%</p>
            </div>
            <div>
              <p className="text-gray-500">Source</p>
              <p className="font-medium">{lead.source ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Expected Close</p>
              <p className="font-medium">{lead.expected_close ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Weighted Value</p>
              <p className="font-medium">{formatCurrency(Number(lead.weighted_value ?? 0))}</p>
            </div>
          </div>

          {/* Move to stage */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Move to Stage</p>
            <div className="flex flex-wrap gap-2">
              {stages.map((s) => (
                <Button key={s.id} variant="outline" size="sm" onClick={() => onMoveStage(s.id)}>
                  {s.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              Delete Lead
            </Button>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
    </Modal>
    <ConfirmDialog
      open={showDeleteConfirm}
      title="Delete Lead"
      message={`Are you sure you want to delete "${lead.title}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="danger"
      loading={deleteMutation.isPending}
      onConfirm={() => deleteMutation.mutate(lead.id)}
      onCancel={() => setShowDeleteConfirm(false)}
    />
    </>
  );
}

function NewLeadModal({
  stages,
  onClose,
  onSuccess,
}: {
  stages: PipelineStage[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    customer_id: '',
    pipeline_stage_id: stages[0]?.id?.toString() ?? '',
    value: '',
    probability: '50',
    source: '',
    expected_close_date: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => customerApi.list({ per_page: 100 }).then((res) => res.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => leadApi.create(data),
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
      pipeline_stage_id: Number(form.pipeline_stage_id),
      value: Number(form.value) || 0,
      probability: Number(form.probability),
    });
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });
  const inputCls = 'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <Modal open={true} onClose={onClose} title="New Lead">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">{error}</div>
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input value={form.title} onChange={(e) => update('title', e.target.value)} required className={inputCls} placeholder="e.g. Enterprise Plan Deal" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
              <select value={form.customer_id} onChange={(e) => update('customer_id', e.target.value)} required className={inputCls}>
                <option value="">Select...</option>
                {customers?.map((c: Customer) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stage</label>
              <select value={form.pipeline_stage_id} onChange={(e) => update('pipeline_stage_id', e.target.value)} required className={inputCls}>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Value (UGX)</label>
              <input type="number" step="0.01" min="0" value={form.value} onChange={(e) => update('value', e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Probability %</label>
              <input type="number" min="0" max="100" value={form.probability} onChange={(e) => update('probability', e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
              <select value={form.source} onChange={(e) => update('source', e.target.value)} className={inputCls}>
                <option value="">None</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social_media">Social Media</option>
                <option value="cold_call">Cold Call</option>
                <option value="email_campaign">Email</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Close Date</label>
            <input type="date" value={form.expected_close_date} onChange={(e) => update('expected_close_date', e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>Create Lead</Button>
          </div>
        </form>
    </Modal>
  );
}
