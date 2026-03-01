import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthGuard, GuestGuard } from '@/components/guards/AuthGuard';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { OrdersPage } from '@/pages/orders/OrdersPage';
import { PipelinePage } from '@/pages/pipeline/PipelinePage';
import { CommunicationsPage } from '@/pages/communications/CommunicationsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { EmailTemplatesPage } from '@/pages/email-templates/EmailTemplatesPage';
import { SupportTicketsPage } from '@/pages/support/SupportTicketsPage';
import { ReturnsPage } from '@/pages/returns/ReturnsPage';
import { CouponsPage } from '@/pages/coupons/CouponsPage';
import { LoyaltyPage } from '@/pages/loyalty/LoyaltyPage';
import { CampaignsPage } from '@/pages/campaigns/CampaignsPage';
import { AbandonedCartsPage } from '@/pages/carts/AbandonedCartsPage';
import { AutomationsPage } from '@/pages/automations/AutomationsPage';
import { SegmentsPage } from '@/pages/segments/SegmentsPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { ToastContainer } from '@/components/ui/Toast';
import { FileX, Home } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          {/* Guest routes */}
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/communications" element={<CommunicationsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/email-templates" element={<EmailTemplatesPage />} />
              <Route path="/support-tickets" element={<SupportTicketsPage />} />
              <Route path="/returns" element={<ReturnsPage />} />
              <Route path="/coupons" element={<CouponsPage />} />
              <Route path="/loyalty" element={<LoyaltyPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/abandoned-carts" element={<AbandonedCartsPage />} />
              <Route path="/automations" element={<AutomationsPage />} />
              <Route path="/segments" element={<SegmentsPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <FileX className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
                <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist.</p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">It may have been moved or deleted.</p>
                <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
                  <Home className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
