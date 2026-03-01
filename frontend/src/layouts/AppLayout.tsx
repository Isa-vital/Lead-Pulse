import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn, getInitials } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Target,
  MessageSquare,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Mail,
  HeadphonesIcon,
  RotateCcw,
  Ticket,
  Star,
  Megaphone,
  ShoppingBasket,
  Zap,
  Filter,
  MessagesSquare,
} from 'lucide-react';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationBell } from '@/components/NotificationBell';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: null },
  { name: 'Customers', href: '/customers', icon: Users, permission: 'view customers' },
  { name: 'Products', href: '/products', icon: Package, permission: 'view products' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, permission: 'view orders' },
  { name: 'Pipeline', href: '/pipeline', icon: Target, permission: 'view leads' },
  { name: 'Communications', href: '/communications', icon: MessageSquare, permission: 'view interactions' },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone, permission: null },
  { name: 'Support Tickets', href: '/support-tickets', icon: HeadphonesIcon, permission: null },
  { name: 'Live Chat', href: '/chat', icon: MessagesSquare, permission: null },
  { name: 'Returns', href: '/returns', icon: RotateCcw, permission: null },
  { name: 'Coupons', href: '/coupons', icon: Ticket, permission: null },
  { name: 'Loyalty', href: '/loyalty', icon: Star, permission: null },
  { name: 'Abandoned Carts', href: '/abandoned-carts', icon: ShoppingBasket, permission: null },
  { name: 'Segments', href: '/segments', icon: Filter, permission: null },
  { name: 'Automations', href: '/automations', icon: Zap, permission: null },
  { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'view reports' },
  { name: 'Email Templates', href: '/email-templates', icon: Mail, permission: 'manage settings' },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'manage settings' },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const { user, logout, hasPermission } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const filteredNavigation = navigation.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );

  const handleLogout = async () => {
    try {
      const { authApi } = await import('@/api/endpoints');
      await authApi.logout();
    } catch {
      // Logout even if API fails
    }
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Target className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Lead Pulse</span>
          </Link>
          <button
            className="lg:hidden p-1 rounded text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500')} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-sm font-semibold text-primary-700 dark:text-primary-300">
              {getInitials(user?.name ?? 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-600 p-0.5">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  theme === 'light' ? 'bg-gray-100 dark:bg-gray-600 text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
                title="Light mode"
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  theme === 'dark' ? 'bg-gray-100 dark:bg-gray-600 text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
                title="Dark mode"
              >
                <Moon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  theme === 'system' ? 'bg-gray-100 dark:bg-gray-600 text-green-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
                title="System preference"
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg p-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-xs font-semibold text-primary-700 dark:text-primary-300">
                  {getInitials(user?.name ?? 'U')}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 z-40 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:bg-gray-800 dark:border-gray-700">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setProfileOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => setProfileOpen(false)}
                    >
                      Settings
                    </Link>
                    <hr className="my-1 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-gray-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
