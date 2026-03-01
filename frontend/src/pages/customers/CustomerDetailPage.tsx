import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '@/api/endpoints';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/Loading';
import { formatCurrency, formatDate, timeAgo, getInitials } from '@/lib/utils';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  ShoppingCart,
  Target,
  MessageSquare,
  Clock,
  User,
  Tag,
} from 'lucide-react';
import type { Customer, Order, Interaction } from '@/types';

type Tab = 'overview' | 'orders' | 'leads' | 'interactions';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.get(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  const { data: timelineData } = useQuery({
    queryKey: ['customer-timeline', id],
    queryFn: () => customerApi.timeline(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const customer: Customer | undefined = customerData?.data;

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Customer not found</h2>
        <Button className="mt-4" onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'orders', label: 'Orders', icon: ShoppingCart, count: customer.orders?.length },
    { key: 'leads', label: 'Leads', icon: Target, count: customer.leads?.length },
    { key: 'interactions', label: 'Timeline', icon: MessageSquare, count: customer.interactions?.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
              {getInitials(customer.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {customer.company && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" />
                    {customer.company}
                  </span>
                )}
                {customer.source && (
                  <Badge variant="default" className="text-xs">
                    {customer.source}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Lifetime Value</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.lifetime_value)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 pb-3 pt-2 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab customer={customer} />}
      {activeTab === 'orders' && <OrdersTab orders={customer.orders ?? []} />}
      {activeTab === 'leads' && <LeadsTab leads={customer.leads ?? []} />}
      {activeTab === 'interactions' && (
        <InteractionsTab
          interactions={customer.interactions ?? []}
          timeline={timelineData?.data ?? []}
        />
      )}
    </div>
  );
}

function OverviewTab({ customer }: { customer: Customer }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contact Info */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="space-y-3">
          {customer.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <a href={`mailto:${customer.email}`} className="text-primary-600 hover:underline">
                {customer.email}
              </a>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <a href={`tel:${customer.phone}`} className="text-primary-600 hover:underline">
                {customer.phone}
              </a>
            </div>
          )}
          {customer.company && (
            <div className="flex items-center gap-3 text-sm">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{customer.company}</span>
            </div>
          )}
          {customer.address && (customer.address.street || customer.address.city) && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="text-gray-700">
                {[customer.address.street, customer.address.city, customer.address.state, customer.address.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">Customer since {formatDate(customer.created_at)}</span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total Orders</span>
            <span className="text-lg font-semibold text-gray-900">{customer.order_count ?? customer.orders?.length ?? 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Active Leads</span>
            <span className="text-lg font-semibold text-gray-900">{customer.leads?.length ?? 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Interactions</span>
            <span className="text-lg font-semibold text-gray-900">{customer.interactions?.length ?? 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Lifetime Value</span>
            <span className="text-lg font-semibold text-green-600">{formatCurrency(customer.lifetime_value)}</span>
          </div>
        </div>
      </Card>

      {/* Tags & Notes */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags & Notes</h3>
        {customer.tags && customer.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {customer.tags.map((tag) => (
                <Badge key={tag} variant="default">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {customer.notes ? (
          <p className="text-sm text-gray-600">{customer.notes}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No notes added</p>
        )}
      </Card>
    </div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No orders yet</p>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-primary-600">{order.order_number}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[order.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LeadsTab({ leads }: { leads: Array<{ id: number; title: string; value: number; stage?: { name: string; color: string }; created_at: string }> }) {
  if (leads.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Target className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No leads yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <Card key={lead.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: lead.stage?.color ?? '#6366f1' }}
              />
              <div>
                <p className="font-medium text-gray-900">{lead.title}</p>
                <p className="text-sm text-gray-500">
                  {lead.stage?.name ?? 'Unknown Stage'} &middot; {timeAgo(lead.created_at)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(lead.value)}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InteractionsTab({
  interactions,
  timeline,
}: {
  interactions: Interaction[];
  timeline: unknown[];
}) {
  const items = interactions.length > 0 ? interactions : (timeline as Interaction[]);

  if (!items || items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No interactions yet</p>
      </Card>
    );
  }

  const typeIcons: Record<string, React.ElementType> = {
    email: Mail,
    call: Phone,
    meeting: User,
    note: MessageSquare,
    task: Clock,
  };

  const typeColors: Record<string, string> = {
    email: 'bg-blue-100 text-blue-700',
    call: 'bg-green-100 text-green-700',
    meeting: 'bg-purple-100 text-purple-700',
    note: 'bg-yellow-100 text-yellow-700',
    task: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-4">
        {items.map((interaction) => {
          const Icon = typeIcons[interaction.type] ?? MessageSquare;
          return (
            <div key={interaction.id} className="relative flex gap-4 pl-2">
              <div
                className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${typeColors[interaction.type] ?? 'bg-gray-100 text-gray-700'}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <Card className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{interaction.subject ?? interaction.type}</p>
                    {interaction.body && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{interaction.body}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      {interaction.user && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {interaction.user.name}
                        </span>
                      )}
                      {interaction.channel && (
                        <Badge variant="default" className="text-xs">
                          {interaction.channel}
                        </Badge>
                      )}
                      {interaction.completed_at && (
                        <span className="text-green-600">Completed</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {timeAgo(interaction.created_at)}
                  </span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
