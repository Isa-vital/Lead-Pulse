import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, userApi } from '@/api/endpoints';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { formatDateTime } from '@/lib/utils';
import {
  Save,
  User,
  Settings2,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { User as UserType, ActivityLogEntry } from '@/types';

type TabKey = 'general' | 'users' | 'activity';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'general', label: 'General', icon: <Settings2 className="h-4 w-4" /> },
  { key: 'users', label: 'Users', icon: <User className="h-4 w-4" /> },
  { key: 'activity', label: 'Activity Log', icon: <ScrollText className="h-4 w-4" /> },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage application settings and users"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'general' && <GeneralSettings />}
      {activeTab === 'users' && <UsersSettings />}
      {activeTab === 'activity' && <ActivityLog />}
    </div>
  );
}

function GeneralSettings() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then((r) => r.data.data),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize form when data loads
  if (settings && !initialized) {
    const flat: Record<string, string> = {};
    if (typeof settings === 'object') {
      Object.values(settings as Record<string, Array<{ key: string; value: string }>>).forEach((group) => {
        if (Array.isArray(group)) {
          group.forEach((s) => {
            flat[s.key] = s.value ?? '';
          });
        }
      });
    }
    setForm(flat);
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      settingsApi.update(Object.entries(data).map(([key, value]) => ({ key, value }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );

  const groups: Record<string, { key: string; value: string; label: string }[]> = {};
  if (settings && typeof settings === 'object') {
    Object.entries(settings as Record<string, Array<{ key: string; value: string }>>).forEach(([groupName, items]) => {
      if (Array.isArray(items)) {
        groups[groupName] = items.map((s) => ({
          key: s.key,
          value: form[s.key] ?? s.value ?? '',
          label: s.key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        }));
      }
    });
  }

  const handleSave = () => mutation.mutate(form);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([groupName, fields]) => (
        <Card key={groupName}>
          <CardHeader title={groupName.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} />
          <div className="mt-4 space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-48 flex-shrink-0">{field.label}</label>
                <input
                  value={form[field.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={mutation.isPending}>
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

function UsersSettings() {
  const queryClient = useQueryClient();
  const toast = useToastStore();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => userApi.list({ page, per_page: 15 }).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => userApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to update user status'),
  });

  if (isLoading) return <TableSkeleton rows={5} cols={6} />;

  return (
    <Card padding={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left font-medium text-gray-500">User</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Joined</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.data?.map((user: UserType) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  {user.roles?.map((r) => (
                    <Badge key={r.id} variant="default">{r.name}</Badge>
                  )) ?? <Badge variant="default">{user.role}</Badge>}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={user.is_active ? 'success' : 'danger'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-gray-500">{formatDateTime(user.created_at)}</td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant={user.is_active ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => toggleMutation.mutate(user.id)}
                    loading={toggleMutation.isPending}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data?.meta && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          <p className="text-sm text-gray-500">Page {data.meta.current_page} of {data.meta.last_page}</p>
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
    </Card>
  );
}

function ActivityLog() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['activity-log', page],
    queryFn: () => settingsApi.activityLog({ page, per_page: 20 }).then((r) => r.data),
  });

  if (isLoading) return <TableSkeleton rows={8} cols={3} />;

  return (
    <div className="space-y-3">
      {data?.data?.length ? (
        data.data.map((entry: ActivityLogEntry) => (
          <Card key={entry.id}>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mt-0.5">
                {entry.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium text-gray-900">{entry.user?.name ?? 'System'}</span>
                  {' '}
                  <span className="text-gray-600">{entry.action}</span>
                  {' '}
                  <span className="text-gray-500">{entry.model_type?.split('\\').pop()}</span>
                  {entry.model_id && (
                    <span className="text-gray-400"> #{entry.model_id}</span>
                  )}
                </p>
                {entry.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(entry.created_at)}</p>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Card>
          <div className="text-center py-12">
            <ScrollText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-400">No activity yet</p>
          </div>
        </Card>
      )}

      {data?.meta && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {data.meta.current_page} of {data.meta.last_page}</p>
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
  );
}
