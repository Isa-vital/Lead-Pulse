import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { segmentApi } from '@/api/endpoints';
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
  Users,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
} from 'lucide-react';
import type { Segment, SegmentRule, Customer } from '@/types';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'tier', label: 'Tier' },
  { value: 'lifetime_value', label: 'Lifetime Value' },
  { value: 'source', label: 'Source' },
  { value: 'is_active', label: 'Is Active' },
  { value: 'tag', label: 'Tag' },
  { value: 'orders_count', label: 'Orders Count' },
  { value: 'last_order_days', label: 'Last Order (days ago)' },
  { value: 'created_days_ago', label: 'Created (days ago)' },
];

const OPERATOR_OPTIONS: { value: string; label: string }[] = [
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ruleLabel(rule: SegmentRule): string {
  const fieldLabel = FIELD_OPTIONS.find((f) => f.value === rule.field)?.label ?? rule.field;
  return `${fieldLabel} ${rule.operator} ${rule.value}`;
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export function SegmentsPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Segment | null>(null);
  const [viewCustomersSegment, setViewCustomersSegment] = useState<Segment | null>(null);

  // Segments list
  const { data, isLoading } = useQuery({
    queryKey: ['segments', page, search, activeFilter],
    queryFn: () =>
      segmentApi
        .list({
          page,
          per_page: 12,
          search: search || undefined,
          is_active: activeFilter !== '' ? activeFilter : undefined,
        })
        .then((res) => res.data),
  });

  const segments: Segment[] = data?.data ?? [];
  const meta = data?.meta;
  const totalSegments = meta?.total ?? 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => segmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success('Segment deleted');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Failed to delete segment');
      setDeleteTarget(null);
    },
  });

  // Recalculate mutation
  const recalcMutation = useMutation({
    mutationFn: (id: number) => segmentApi.recalculate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success('Segment recalculated');
    },
    onError: () => {
      toast.error('Failed to recalculate segment');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Customer Segments"
        subtitle={`${totalSegments} segment${totalSegments !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Customer Segments' }]}
        actions={
          <Button onClick={() => { setEditingSegment(null); setShowFormModal(true); }}>
            <Plus className="h-4 w-4" />
            Create Segment
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
              placeholder="Search segments..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
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

      {/* Segment Cards Grid */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : segments.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No segments found"
            description={search ? 'Try adjusting your search or filters.' : 'No customer segments have been created yet.'}
            action={!search ? { label: 'Create Segment', onClick: () => { setEditingSegment(null); setShowFormModal(true); } } : undefined}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <Card key={segment.id}>
                <div className="space-y-4">
                  {/* Name & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{segment.name}</h3>
                      {segment.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{segment.description}</p>
                      )}
                    </div>
                    <Badge variant={segment.is_active ? 'success' : 'default'}>
                      {segment.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Customer Count (prominent) */}
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2.5 text-primary-600 bg-primary-100">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{segment.customer_count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">matching customers</p>
                    </div>
                  </div>

                  {/* Match type */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Match</span>
                    <Badge variant={segment.match_type === 'all' ? 'info' : 'success'}>
                      {segment.match_type === 'all' ? 'All rules' : 'Any rule'}
                    </Badge>
                  </div>

                  {/* Rules preview */}
                  {segment.rules.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {segment.rules.slice(0, 3).map((rule, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                        >
                          {ruleLabel(rule)}
                        </span>
                      ))}
                      {segment.rules.length > 3 && (
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                          +{segment.rules.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Calculated at */}
                  <p className="text-xs text-gray-400">
                    Calculated {relativeTime(segment.last_calculated_at)}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 border-t border-gray-100 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="View Customers"
                      onClick={() => setViewCustomersSegment(segment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Recalculate"
                      disabled={recalcMutation.isPending}
                      onClick={() => recalcMutation.mutate(segment.id)}
                    >
                      <RefreshCw className={`h-4 w-4 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Edit"
                      onClick={() => { setEditingSegment(segment); setShowFormModal(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-600"
                      title="Delete"
                      onClick={() => setDeleteTarget(segment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between">
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

      {/* Create / Edit Modal */}
      {showFormModal && (
        <SegmentFormModal
          segment={editingSegment}
          onClose={() => { setShowFormModal(false); setEditingSegment(null); }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingSegment(null);
            queryClient.invalidateQueries({ queryKey: ['segments'] });
            toast.success(editingSegment ? 'Segment updated' : 'Segment created');
          }}
        />
      )}

      {/* View Customers Modal */}
      {viewCustomersSegment && (
        <ViewCustomersModal
          segment={viewCustomersSegment}
          onClose={() => setViewCustomersSegment(null)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Segment"
        message={`Are you sure you want to delete segment "${deleteTarget?.name}"? This action cannot be undone.`}
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
/*  Segment Form Modal (Create / Edit) with Dynamic Rule Builder      */
/* ------------------------------------------------------------------ */

function SegmentFormModal({
  segment,
  onClose,
  onSuccess,
}: {
  segment: Segment | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!segment;

  const [name, setName] = useState(segment?.name ?? '');
  const [description, setDescription] = useState(segment?.description ?? '');
  const [matchType, setMatchType] = useState<'all' | 'any'>(segment?.match_type ?? 'all');
  const [rules, setRules] = useState<SegmentRule[]>(
    segment?.rules?.length ? segment.rules : [{ field: 'tier', operator: '=', value: '' }],
  );
  const [isActive, setIsActive] = useState(segment?.is_active ?? true);
  const [error, setError] = useState('');
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? segmentApi.update(segment!.id, data) : segmentApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      segmentApi.preview({
        rules: rules as unknown as Record<string, unknown>[],
        match_type: matchType,
      }),
    onSuccess: (res) => {
      setPreviewCount(res.data.data.customer_count);
    },
    onError: () => {
      setPreviewCount(null);
    },
  });

  const addRule = () => {
    setRules([...rules, { field: 'tier', operator: '=', value: '' }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof SegmentRule, value: string) => {
    setRules(rules.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rules.length === 0) {
      setError('At least one rule is required');
      return;
    }
    if (rules.some((r) => !r.value && r.value !== 0)) {
      setError('All rules must have a value');
      return;
    }
    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      match_type: matchType,
      rules,
      is_active: isActive,
    };
    saveMutation.mutate(payload);
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <Modal open={true} onClose={onClose} title={isEdit ? 'Edit Segment' : 'Create Segment'} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. High-Value Customers"
            className={inputClass}
          />
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

        {/* Match Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Match Type</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="match_type"
                value="all"
                checked={matchType === 'all'}
                onChange={() => setMatchType('all')}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Match <strong>all</strong> rules (AND)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="match_type"
                value="any"
                checked={matchType === 'any'}
                onChange={() => setMatchType('any')}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Match <strong>any</strong> rule (OR)</span>
            </label>
          </div>
        </div>

        {/* Rules Builder */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Rules *</label>
            <Button type="button" variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-3.5 w-3.5" /> Add Rule
            </Button>
          </div>
          <div className="space-y-2">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                {/* Field */}
                <select
                  value={rule.field}
                  onChange={(e) => updateRule(index, 'field', e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
                >
                  {FIELD_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  value={rule.operator}
                  onChange={(e) => updateRule(index, 'operator', e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-20"
                >
                  {OPERATOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Value */}
                <input
                  type="text"
                  value={String(rule.value)}
                  onChange={(e) => updateRule(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                {/* Remove */}
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="rounded-lg p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                    title="Remove rule"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview Count */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={previewMutation.isPending || rules.some((r) => !r.value && r.value !== 0)}
            onClick={() => previewMutation.mutate()}
          >
            <Eye className="h-4 w-4" />
            {previewMutation.isPending ? 'Checking...' : 'Preview Count'}
          </Button>
          {previewCount !== null && (
            <span className="text-sm font-medium text-primary-700">
              {previewCount.toLocaleString()} customer{previewCount !== 1 ? 's' : ''} match
            </span>
          )}
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
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update Segment' : 'Create Segment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  View Customers Modal                                              */
/* ------------------------------------------------------------------ */

function ViewCustomersModal({
  segment,
  onClose,
}: {
  segment: Segment;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['segment-customers', segment.id, page],
    queryFn: () =>
      segmentApi.customers(segment.id, { page, per_page: 10 }).then((res) => res.data),
  });

  const customers: Customer[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Customers in "${segment.name}"`}
      size="lg"
    >
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-500">
          {segment.customer_count.toLocaleString()} customer{segment.customer_count !== 1 ? 's' : ''} matching this segment.
        </p>

        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers"
            description="No customers match this segment."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Tier</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">Lifetime Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{customer.email ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={
                        customer.tier === 'platinum' ? 'info' :
                        customer.tier === 'gold' ? 'warning' :
                        customer.tier === 'silver' ? 'default' :
                        customer.tier === 'bronze' ? 'default' :
                        'default'
                      }>
                        {customer.tier}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                      {formatCurrency(customer.lifetime_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-3">
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

        <div className="flex justify-end pt-2 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
