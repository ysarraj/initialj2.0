'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/src/components/ui/Card';
import Button from '@/src/components/ui/Button';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';
import PageHeader from '@/src/components/ui/PageHeader';
import { getDisplayUsername } from '@/src/lib/username';
import { getAuthToken } from '@/src/lib/client-auth';
import { formatDate } from '@/src/lib/utils';

interface User {
  id: string;
  email: string;
  username: string | null;
  usernameHidden: boolean;
  role: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
  _count: {
    kanjiProgress: number;
    vocabProgress: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Check if user is admin
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();

        if (data.user.role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }

        // Fetch all users
        const usersRes = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!usersRes.ok) {
          throw new Error('Failed to fetch users');
        }

        const usersData = await usersRes.json();
        setUsers(usersData.users);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const toggleUsernameVisibility = async (userId: string, currentHidden: boolean) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/hide-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hidden: !currentHidden }),
      });

      if (!res.ok) {
        throw new Error('Failed to update username visibility');
      }

      // Refresh users list
      const refreshRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (refreshRes.ok) {
        const usersData = await refreshRes.json();
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error toggling username visibility:', error);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <div className="mb-8">
        <PageHeader title="All Users" subtitle="Manage all user accounts" />
      </div>

        <Card className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200">
                  <th className="text-left py-4 px-4 text-sm font-light uppercase tracking-wide text-dark-600">
                    Email
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-light uppercase tracking-wide text-dark-600">
                    Username
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-light uppercase tracking-wide text-dark-600">
                    Actions
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-light uppercase tracking-wide text-dark-600">
                    Role
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-light uppercase tracking-wide text-dark-600">
                    Progress
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-light uppercase tracking-wide text-dark-600">
                    Subscription
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-light uppercase tracking-wide text-dark-600">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-dark-100 hover:bg-dark-50 transition-colors">
                    <td className="py-4 px-4 text-sm text-dark-900 font-light">
                      {u.email}
                    </td>
                    <td className="py-4 px-4 text-sm text-dark-600 font-light">
                      {getDisplayUsername(u.username, u.usernameHidden, u.id)}
                      {u.usernameHidden && (
                        <span className="ml-2 text-xs text-orange-600">(Hidden)</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUsernameVisibility(u.id, u.usernameHidden)}
                        className="text-xs"
                      >
                        {u.usernameHidden ? 'Show' : 'Hide'}
                      </Button>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-light tracking-wide uppercase px-3 py-1 ${
                        u.role === 'ADMIN'
                          ? 'bg-dark-900 text-white'
                          : 'bg-dark-100 text-dark-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-dark-600 font-light">
                      {u._count.kanjiProgress} kanji, {u._count.vocabProgress} vocab
                    </td>
                    <td className="py-4 px-4 text-sm text-dark-600 font-light">
                      {u.subscription ? (
                        <div>
                          <div className="font-light">{u.subscription.plan}</div>
                          <div className="text-xs text-dark-400">{u.subscription.status}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-dark-600 font-light">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 text-dark-500 font-light">
              No users found
            </div>
          )}
        </Card>
    </div>
  );
}
