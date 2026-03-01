import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, categoryApi, importExportApi } from '@/api/endpoints';
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
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Product, Category } from '@/types';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, filterCategory, filterStock],
    queryFn: () =>
      productApi
        .list({
          page,
          per_page: 15,
          search: search || undefined,
          category_id: filterCategory || undefined,
          low_stock: filterStock || undefined,
        })
        .then((res) => res.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list({ roots_only: true, with_children: true }).then((res) => res.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
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
        title="Products"
        subtitle={`${data?.meta?.total ?? 0} total products`}
        breadcrumbs={[{ label: 'Products' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              importExportApi.exportProducts().then((res) => {
                const url = URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url; a.download = 'products.csv'; a.click();
                URL.revokeObjectURL(url);
                toast.success('Export complete');
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
                  importExportApi.importProducts(file).then((res) => {
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    toast.success('Import complete', `${res.data.data.imported} products imported.`);
                  }).catch(() => toast.error('Import failed', 'Please check your CSV format.'));
                }
                e.target.value = '';
              }} />
            </label>
            <Button onClick={() => { setEditingProduct(null); setShowForm(true); }}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categoriesData?.map((cat: Category) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filterStock}
              onChange={(e) => { setFilterStock(e.target.checked); setPage(1); }}
              className="rounded border-gray-300"
            />
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Low Stock
          </label>
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
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Product</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">SKU</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Category</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Price</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Stock</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.data && data.data.length > 0 ? data.data.map((product: Product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.tags?.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {product.tags.slice(0, 2).map((tag) => (
                                  <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">{product.sku}</td>
                      <td className="px-6 py-4 text-gray-600">{product.category?.name ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{formatCurrency(product.price)}</p>
                          {product.cost > 0 && (
                            <p className="text-xs text-gray-500">Cost: {formatCurrency(product.cost)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={product.stock <= product.low_stock_threshold ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                            {product.stock}
                          </span>
                          {product.stock <= product.low_stock_threshold && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={product.is_active ? 'success' : 'default'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setShowForm(true); }} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(product)} className="text-danger-600 hover:text-danger-700" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4">
                        <EmptyState
                          icon={Package}
                          title="No products found"
                          description={search ? 'Try adjusting your search or filters.' : 'Add your first product to get started.'}
                          action={!search ? { label: 'Add Product', onClick: () => { setEditingProduct(null); setShowForm(true); } } : undefined}
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

      <ProductFormModal
        open={showForm}
        product={editingProduct}
        categories={categoriesData ?? []}
        onClose={() => { setShowForm(false); setEditingProduct(null); }}
        onSuccess={() => {
          setShowForm(false);
          setEditingProduct(null);
          queryClient.invalidateQueries({ queryKey: ['products'] });
          toast.success(editingProduct ? 'Product updated' : 'Product created');
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
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

function ProductFormModal({
  open,
  product,
  categories,
  onClose,
  onSuccess,
}: {
  open: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    category_id: product?.category_id?.toString() ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    cost: product?.cost?.toString() ?? '',
    stock: product?.stock?.toString() ?? '',
    low_stock_threshold: product?.low_stock_threshold?.toString() ?? '5',
    tags: product?.tags?.join(', ') ?? '',
    is_active: product?.is_active ?? true,
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      product ? productApi.update(product.id, data) : productApi.create(data),
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
      sku: form.sku,
      category_id: form.category_id ? Number(form.category_id) : null,
      description: form.description || null,
      price: Number(form.price),
      cost: Number(form.cost) || 0,
      stock: Number(form.stock),
      low_stock_threshold: Number(form.low_stock_threshold),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      is_active: form.is_active,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">{error}</div>
        )}
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Price (UGX)" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="Cost (UGX)" type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
          <Input label="Low Stock Threshold" type="number" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
        </div>
        <Input label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} helperText="Comma-separated" />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm dark:text-gray-300">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-gray-300" />
          Active
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
