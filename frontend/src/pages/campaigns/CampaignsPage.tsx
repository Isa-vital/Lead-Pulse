import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from '@/api/endpoints';
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
  Megaphone,
  Mail,
  MessageSquare,
  Send,
  Eye,
  MousePointer,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
} from 'lucide-react';
import type { Campaign, CampaignType, CampaignStatus, CampaignStats } from '@/types';

/* ------------------------------------------------------------------ */
/*  Badge helpers                                                      */
/* ------------------------------------------------------------------ */

function typeBadge(type: CampaignType) {
  const map: Record<CampaignType, { variant: 'info' | 'success'; label: string }> = {
    email: { variant: 'info', label: 'Email' },
    sms: { variant: 'success', label: 'SMS' },
  };
  const cfg = map[type] ?? { variant: 'info' as const, label: type };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function statusBadge(status: CampaignStatus) {
  const map: Record<CampaignStatus, { variant: 'default' | 'info' | 'warning' | 'success' | 'danger'; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    scheduled: { variant: 'info', label: 'Scheduled' },
    sending: { variant: 'warning', label: 'Sending' },
    sent: { variant: 'success', label: 'Sent' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
  };
  const cfg = map[status] ?? { variant: 'default' as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
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

function rateDisplay(count: number, total: number): string {
  if (total === 0) return `${count}/${total} (0%)`;
  const rate = ((count / total) * 100).toFixed(1);
  return `${count}/${total} (${rate}%)`;
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null);

  // Campaigns list
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', page, search, statusFilter, typeFilter],
    queryFn: () =>
      campaignApi
        .list({
          page,
          per_page: 15,
          search: search || undefined,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
        })
        .then((res) => res.data),
  });

  // Campaign stats
  const { data: statsData } = useQuery({
    queryKey: ['campaign-stats'],
    queryFn: () => campaignApi.stats().then((res) => res.data.data),
  });

  const campaigns: Campaign[] = data?.data ?? [];
  const meta = data?.meta;
  const stats: CampaignStats | undefined = statsData;

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => campaignApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-stats'] });
      toast.success('Campaign deleted');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Failed to delete campaign');
      setDeleteTarget(null);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: number) => campaignApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-stats'] });
      toast.success('Campaign is being sent');
      setSendTarget(null);
    },
    onError: () => {
      toast.error('Failed to send campaign');
      setSendTarget(null);
    },
  });

  const statCards = [
    { label: 'Total Campaigns', value: stats?.total ?? 0, icon: Megaphone, color: 'text-gray-600 bg-gray-100' },
    { label: 'Draft', value: stats?.draft ?? 0, icon: FileText, color: 'text-yellow-600 bg-yellow-100' },
    { label: 'Sent', value: stats?.sent ?? 0, icon: Send, color: 'text-green-600 bg-green-100' },
    { label: 'Avg Open Rate', value: `${(stats?.avg_open_rate ?? 0).toFixed(1)}%`, icon: Eye, color: 'text-blue-600 bg-blue-100' },
    { label: 'Avg Click Rate', value: `${(stats?.avg_click_rate ?? 0).toFixed(1)}%`, icon: MousePointer, color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Campaigns"
        subtitle={`${stats?.total ?? 0} total campaigns`}
        breadcrumbs={[{ label: 'Campaigns' }]}
        actions={
          <Button onClick={() => { setEditingCampaign(null); setShowFormModal(true); }}>
            <Plus className="h-4 w-4" />
            New Campaign
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
              placeholder="Search by campaign name..."
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
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
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
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Recipients</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Open Rate</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Click Rate</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Sent At</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.length > 0 ? campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{campaign.name}</td>
                      <td className="px-6 py-4">{typeBadge(campaign.type)}</td>
                      <td className="px-6 py-4">{statusBadge(campaign.status)}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{campaign.total_recipients}</td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {rateDisplay(campaign.open_count, campaign.sent_count)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {rateDisplay(campaign.click_count, campaign.sent_count)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(campaign.sent_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Details"
                            onClick={() => setDetailCampaign(campaign)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {campaign.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Send Campaign"
                              className="text-green-600"
                              onClick={() => setSendTarget(campaign)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit"
                              onClick={() => { setEditingCampaign(campaign); setShowFormModal(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-600"
                            title="Delete"
                            onClick={() => setDeleteTarget(campaign)}
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
                          icon={Megaphone}
                          title="No campaigns found"
                          description={search ? 'Try adjusting your search or filters.' : 'No campaigns have been created yet.'}
                          action={!search ? { label: 'New Campaign', onClick: () => { setEditingCampaign(null); setShowFormModal(true); } } : undefined}
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
        <CampaignFormModal
          campaign={editingCampaign}
          onClose={() => { setShowFormModal(false); setEditingCampaign(null); }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingCampaign(null);
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['campaign-stats'] });
            toast.success(editingCampaign ? 'Campaign updated' : 'Campaign created');
          }}
        />
      )}

      {/* Detail Modal */}
      {detailCampaign && (
        <CampaignDetailModal
          campaign={detailCampaign}
          onClose={() => setDetailCampaign(null)}
        />
      )}

      {/* Send Confirmation */}
      <ConfirmDialog
        open={!!sendTarget}
        title="Send Campaign"
        message={`Are you sure you want to send campaign "${sendTarget?.name}"? This will deliver it to all recipients.`}
        confirmLabel="Send Now"
        variant="danger"
        loading={sendMutation.isPending}
        onConfirm={() => sendTarget && sendMutation.mutate(sendTarget.id)}
        onCancel={() => setSendTarget(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Campaign"
        message={`Are you sure you want to delete campaign "${deleteTarget?.name}"? This action cannot be undone.`}
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
/*  Campaign Form Modal (Create / Edit)                                */
/* ------------------------------------------------------------------ */

function CampaignFormModal({
  campaign,
  onClose,
  onSuccess,
}: {
  campaign: Campaign | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!campaign;

  const [name, setName] = useState(campaign?.name ?? '');
  const [type, setType] = useState<CampaignType>(campaign?.type ?? 'email');
  const [subject, setSubject] = useState(campaign?.subject ?? '');
  const [content, setContent] = useState(campaign?.content ?? '');
  const [scheduledAt, setScheduledAt] = useState(campaign?.scheduled_at?.slice(0, 16) ?? '');
  const [segmentFilters, setSegmentFilters] = useState(
    campaign?.segment_filters ? JSON.stringify(campaign.segment_filters, null, 2) : ''
  );
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? campaignApi.update(campaign!.id, data) : campaignApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedFilters: unknown = null;
    if (segmentFilters.trim()) {
      try {
        parsedFilters = JSON.parse(segmentFilters);
      } catch {
        setError('Segment filters must be valid JSON');
        return;
      }
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      type,
      subject: type === 'email' ? subject.trim() || null : null,
      content: content.trim() || null,
      scheduled_at: scheduledAt || null,
      segment_filters: parsedFilters,
    };
    mutation.mutate(payload);
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <Modal open={true} onClose={onClose} title={isEdit ? 'Edit Campaign' : 'Create Campaign'} size="lg">
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
              placeholder="Campaign name"
              className={inputClass}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value as CampaignType)}
              className={inputClass}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>

        {/* Subject (email only) */}
        {type === 'email' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              className={inputClass}
            />
          </div>
        )}

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder={type === 'email' ? 'Email body content...' : 'SMS message content...'}
            className={inputClass}
          />
        </div>

        {/* Scheduled At */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Send</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">Leave empty to send manually or save as draft.</p>
        </div>

        {/* Segment Filters (JSON) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Segment Filters (JSON, optional)</label>
          <textarea
            value={segmentFilters}
            onChange={(e) => setSegmentFilters(e.target.value)}
            rows={3}
            placeholder='e.g. [{"field": "city", "operator": "=", "value": "Kampala"}]'
            className={`${inputClass} font-mono text-xs`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Campaign Detail Modal                                              */
/* ------------------------------------------------------------------ */

function CampaignDetailModal({
  campaign,
  onClose,
}: {
  campaign: Campaign;
  onClose: () => void;
}) {
  const openRate = campaign.sent_count > 0 ? ((campaign.open_count / campaign.sent_count) * 100) : 0;
  const clickRate = campaign.sent_count > 0 ? ((campaign.click_count / campaign.sent_count) * 100) : 0;

  const metrics = [
    { label: 'Total Recipients', value: campaign.total_recipients, icon: Megaphone },
    { label: 'Sent', value: campaign.sent_count, icon: Send },
    { label: 'Opened', value: campaign.open_count, icon: Eye },
    { label: 'Clicked', value: campaign.click_count, icon: MousePointer },
    { label: 'Bounced', value: campaign.bounce_count, icon: Mail },
    { label: 'Unsubscribed', value: campaign.unsubscribe_count, icon: MessageSquare },
  ];

  return (
    <Modal open={true} onClose={onClose} title="Campaign Details" size="lg">
      <div className="p-6 space-y-6">
        {/* Campaign Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
            {typeBadge(campaign.type)}
            {statusBadge(campaign.status)}
          </div>

          {campaign.subject && (
            <div>
              <span className="text-sm font-medium text-gray-500">Subject: </span>
              <span className="text-sm text-gray-700">{campaign.subject}</span>
            </div>
          )}

          {campaign.content && (
            <div>
              <span className="text-sm font-medium text-gray-500">Content:</span>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                {campaign.content}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {campaign.scheduled_at && (
              <span>
                <Clock className="inline h-3.5 w-3.5 mr-1" />
                Scheduled: {formatDate(campaign.scheduled_at)}
              </span>
            )}
            {campaign.sent_at && (
              <span>
                <Send className="inline h-3.5 w-3.5 mr-1" />
                Sent: {formatDate(campaign.sent_at)}
              </span>
            )}
            <span>Created: {formatDate(campaign.created_at)}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-gray-200 p-3 text-center">
              <m.icon className="h-4 w-4 mx-auto text-gray-400 mb-1" />
              <p className="text-xl font-bold text-gray-900">{m.value}</p>
              <p className="text-xs text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Open Rate Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Open Rate</span>
            <span className="text-gray-500">
              {rateDisplay(campaign.open_count, campaign.sent_count)}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(openRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Click Rate Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Click Rate</span>
            <span className="text-gray-500">
              {rateDisplay(campaign.click_count, campaign.sent_count)}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(clickRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Close */}
        <div className="flex justify-end pt-2 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
