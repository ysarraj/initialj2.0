'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Button from '@/src/components/ui/Button';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription?: {
    plan: string;
    status: string;
  } | null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/reviews', label: 'Reviews', icon: '📝' },
    { href: '/burned', label: 'Burned', icon: '🔥' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isPaid = user?.subscription?.plan !== 'FREE' && user?.subscription?.status === 'ACTIVE';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              InitialJ
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Subscription badge */}
            {isAdmin ? (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Admin
              </span>
            ) : isPaid ? (
              <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-medium rounded-full">
                Pro
              </span>
            ) : (
              <Link href="/pricing">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-200 cursor-pointer">
                  Free → Upgrade
                </span>
              </Link>
            )}

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="md:hidden flex items-center justify-around border-t py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-3 py-1 text-xs ${
                pathname === item.href
                  ? 'text-pink-600'
                  : 'text-gray-600'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
