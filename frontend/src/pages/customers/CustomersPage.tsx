import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, importExportApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Upload,
  Users,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Customer } from '@/types';

export function CustomersPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [filters] = useState<Record<string, string>>({});

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, filters],
    queryFn: () =>
      customerApi
        .list({ page, per_page: 15, search: search || undefined, ...filters })
        .then((res) => res.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => customerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted', 'The customer has been removed.');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Delete failed', 'Could not delete this customer.');
      setDeleteTarget(null);
    },
  });

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Customers"
        subtitle={`${data?.meta?.total ?? 0} total customers`}
        breadcrumbs={[{ label: 'Customers' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              importExportApi.exportCustomers().then((res) => {
                const url = URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url; a.download = 'customers.csv'; a.click();
                URL.revokeObjectURL(url);
                toast.success('Export complete', 'CSV file downloaded.');
              }).catch(() => toast.error('Export failed'));
            }}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" as-child="true">
                <span className="inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </span>
              </Button>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  importExportApi.importCustomers(file).then((res) => {
                    queryClient.invalidateQueries({ queryKey: ['customers'] });
                    toast.success('Import complete', `${res.data.data.imported} customers imported.`);
                  }).catch(() => toast.error('Import failed', 'Please check your CSV format.'));
                }
                e.target.value = '';
              }} />
            </label>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        }
      />

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Contact</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Company</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Tags</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">LTV</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Added</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.data && data.data.length > 0 ? data.data.map((customer: Customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {getInitials(customer.name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            {customer.source && <p className="text-xs text-gray-500">{customer.source}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {customer.company && (
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Building className="h-3.5 w-3.5 text-gray-400" />
                            {customer.company}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {customer.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="info">{tag}</Badge>
                          ))}
                          {customer.tags && customer.tags.length > 3 && (
                            <Badge>+{customer.tags.length - 3}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-green-600">
                        {formatCurrency(customer.lifetime_value)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(customer)} className="text-danger-600 hover:text-danger-700" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4">
                        <EmptyState
                          icon={Users}
                          title="No customers found"
                          description={search ? 'Try adjusting your search terms.' : 'Add your first customer to get started.'}
                          action={!search ? { label: 'Add Customer', onClick: () => setShowForm(true) } : undefined}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.meta && data.meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                <p className="text-sm text-gray-500">
                  Page {data.meta.current_page} of {data.meta.last_page} ({data.meta.total} results)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.meta.current_page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.meta.current_page >= data.meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Customer Form Modal */}
      <CustomerFormModal
        open={showForm}
        customer={editingCustomer}
        onClose={handleFormClose}
        onSuccess={() => {
          handleFormClose();
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          toast.success(editingCustomer ? 'Customer updated' : 'Customer created');
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// Customer Form Modal
function CustomerFormModal({
  open,
  customer,
  onClose,
  onSuccess,
}: {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    company: customer?.company ?? '',
    source: customer?.source ?? '',
    notes: customer?.notes ?? '',
    tags: customer?.tags?.join(', ') ?? '',
  });
  const [error, setError] = useState('');

  // Reset form when customer changes
  useState(() => {
    setForm({
      name: customer?.name ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      company: customer?.company ?? '',
      source: customer?.source ?? '',
      notes: customer?.notes ?? '',
      tags: customer?.tags?.join(', ') ?? '',
    });
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      customer ? customerApi.update(customer.id, data) : customerApi.create(data),
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Something went wrong');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      source: form.source || null,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={customer ? 'Edit Customer' : 'Add Customer'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g., website, referral" />
        </div>
        <Input label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} helperText="Comma-separated: vip, wholesale" />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {customer ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
