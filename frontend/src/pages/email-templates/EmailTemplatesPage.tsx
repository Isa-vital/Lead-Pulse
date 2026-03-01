import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailTemplateApi, type EmailTemplateData } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatDateTime } from '@/lib/utils';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  Code,
  Mail,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EmailTemplateData | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewing, setPreviewing] = useState<{ subject: string; body: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplateData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['email-templates', search],
    queryFn: () =>
      emailTemplateApi.list({ search: search || undefined, per_page: 100 }).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emailTemplateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete template'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => emailTemplateApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template duplicated');
    },
    onError: () => toast.error('Failed to duplicate template'),
  });

  const handlePreview = async (template: EmailTemplateData) => {
    try {
      const res = await emailTemplateApi.preview(template.id);
      setPreviewing(res.data.data);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        subtitle="Manage reusable email templates with variable placeholders"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Email Templates' }]}
        actions={
          <Button onClick={() => { setEditing(null); setCreating(true); }}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        }
      />

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          />
        </div>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data && data.data.length > 0 ? data.data.map((template: EmailTemplateData) => (
            <Card key={template.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{template.name}</h3>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  template.is_active
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {template.is_active ? (
                    <><ToggleRight className="h-3 w-3" /> Active</>
                  ) : (
                    <><ToggleLeft className="h-3 w-3" /> Inactive</>
                  )}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-1">
                <span className="font-medium">Subject:</span> {template.subject}
              </p>

              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2 mb-3 line-clamp-3 font-mono flex-1">
                {template.body.substring(0, 200)}...
              </div>

              {template.variables && template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.variables.map((v) => (
                    <span key={v} className="inline-flex items-center gap-1 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
                      <Code className="h-3 w-3" />
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400">{formatDateTime(template.updated_at)}</p>
                <div className="flex gap-1">
                  <button onClick={() => handlePreview(template)} className="p-1.5 rounded text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700" title="Preview">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setEditing(template); setCreating(true); }} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => duplicateMutation.mutate(template.id)} className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700" title="Duplicate">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(template)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          )) : (
            <div className="col-span-full">
              <EmptyState
                icon={Mail}
                title="No templates found"
                description="Create your first email template to get started"
                action={{ label: 'New Template', onClick: () => { setEditing(null); setCreating(true); } }}
              />
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {creating && (
        <TemplateFormModal
          template={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSuccess={() => {
            setCreating(false);
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast.success(editing ? 'Template updated' : 'Template created');
          }}
        />
      )}

      {/* Preview Modal */}
      <Modal open={!!previewing} onClose={() => setPreviewing(null)} title="Template Preview" size="md">
        {previewing && (
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Subject</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{previewing.subject}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Body</p>
              <div
                className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                dangerouslySetInnerHTML={{ __html: previewing.body.replace(/\n/g, '<br/>') }}
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function TemplateFormModal({
  template,
  onClose,
  onSuccess,
}: {
  template: EmailTemplateData | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!template;
  const [name, setName] = useState(template?.name ?? '');
  const [subject, setSubject] = useState(template?.subject ?? '');
  const [body, setBody] = useState(template?.body ?? '');
  const [variables, setVariables] = useState(template?.variables?.join(', ') ?? '');
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isEdit ? emailTemplateApi.update(template!.id, data) : emailTemplateApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: any) => {
      setError(err.response?.data?.message ?? 'An error occurred');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vars = variables
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    mutation.mutate({
      name,
      subject,
      body,
      variables: vars.length > 0 ? vars : null,
      is_active: isActive,
    });
  };

  const insertVariable = (varName: string) => {
    setBody((prev) => prev + `{${varName}}`);
  };

  const parsedVars = variables
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <Modal open={true} onClose={onClose} title={isEdit ? 'Edit Template' : 'New Template'} size="lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Welcome Email"
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="e.g., Welcome to Lead Pulse, {customer_name}!"
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Variables <span className="font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder="e.g., customer_name, order_number, total"
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
            {parsedVars.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {parsedVars.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="inline-flex items-center gap-1 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2 py-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                    title={`Insert {${v}} into body`}
                  >
                    <Code className="h-3 w-3" />
                    {`{${v}}`}
                  </button>
                ))}
                <span className="text-xs text-gray-400 self-center ml-1">← Click to insert</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={10}
              placeholder="Write your email body here. Use {variable_name} for dynamic content."
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 font-mono"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEdit ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
