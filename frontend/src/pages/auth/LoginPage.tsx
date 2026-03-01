import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Target } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authApi.login({ email, password });
      setAuth(data.data.user, data.data.token);
      navigate('/');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Lead Pulse</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to your CRM dashboard</p>
        </div>

        {/* Login form */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              placeholder="admin@leadpulse.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Demo: admin@leadpulse.com / password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
