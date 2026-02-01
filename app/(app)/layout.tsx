'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/src/components/layout/Header';

interface User {
  id: string;
  email: string;
  username: string | null;
  role: string;
  subscription?: {
    plan: string;
    status: string;
  } | null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Unauthorized');
        }

        const data = await res.json();
        setUser(data.user);
      } catch {
        localStorage.removeItem('auth_token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        user={user ? {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        } : null}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {children}
      </main>
    </div>
  );
}
