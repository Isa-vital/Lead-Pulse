import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToastStore } from '@/stores/toastStore';
import { getInitials } from '@/lib/utils';
import { User, Mail, Phone, Lock } from 'lucide-react';

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const toast = useToastStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const profileMutation = useMutation({
    mutationFn: (data: { name: string; email: string; phone: string | null }) =>
      authApi.updateProfile(data).then((r) => r.data),
    onSuccess: (response) => {
      if (response.data?.user) {
        setUser(response.data.user);
      }
      toast.success('Profile updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { current_password: string; password: string; password_confirmation: string }) =>
      authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: () => {
      toast.error('Failed to change password. Check your current password.');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ name, email, phone: phone || null });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    passwordMutation.mutate({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="My Profile"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Profile' }]}
      />

      {/* User Info Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
            {getInitials(user?.name ?? 'U')}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 capitalize mt-1">
              Role: {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 border-b-2 pb-3 pt-2 px-1 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="h-4 w-4" />
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 border-b-2 pb-3 pt-2 px-1 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock className="h-4 w-4" />
            Change Password
          </button>
        </nav>
      </div>

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  placeholder="+256..."
                />
              </div>
            </div>

            <Button type="submit" disabled={profileMutation.isPending}>
              {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>
      )}

      {/* Password Form */}
      {activeTab === 'password' && (
        <Card className="p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
