'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/src/components/ui/Card';

interface User {
  id: string;
  email: string;
  username: string | null;
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
      const token = localStorage.getItem('auth_token');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-900" />
      </div>
    );
  }

  return (
    <div>
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-light text-dark-900 mb-2">
            All Users
          </h1>
          <p className="text-lg text-dark-600 font-light">
            Manage all user accounts
          </p>
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
                      {u.username || '—'}
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
