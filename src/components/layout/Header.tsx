'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Button from '@/src/components/ui/Button';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  username: string | null;
  role: string;
}

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
}

export default function Header({ user: propUser = null, onLogout: propOnLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(propUser);
  const [loading, setLoading] = useState(!propUser);
  const pathname = usePathname();
  const router = useRouter();

  // Auto-detect user if not provided
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [propUser]);

  const handleLogout = () => {
    if (propOnLogout) {
      propOnLogout();
    } else {
      localStorage.removeItem('auth_token');
      router.push('/');
      setUser(null);
    }
  };

  const navItems = [
    { href: '/', label: 'Homepage' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/about', label: 'About' },
  ];

  // Add admin link if user is admin
  if (user?.role === 'ADMIN') {
    navItems.push({ href: '/admin/users', label: 'Admin' });
  }

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-dark-200/50 sticky top-0 z-50">
      <nav className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div 
              className="w-10 h-10 rounded-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1F2922 0%, #C73E1D 100%)' }}
            >
              <span className="text-white font-light text-xl transition-transform group-hover:scale-110">J</span>
            </div>
            <span 
              className="text-xl font-light tracking-tight transition-all duration-200 group-hover:scale-105 bg-clip-text text-transparent"
              style={{ 
                backgroundImage: 'linear-gradient(135deg, #1F2922 0%, #C73E1D 50%, #1F2922 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient-animate 3s ease infinite'
              }}
            >
              InitialJ
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-light tracking-wide uppercase transition-all duration-200 hover:scale-110 relative group ${
                  pathname === item.href
                    ? 'text-dark-900'
                    : 'text-dark-700 hover:text-dark-900'
                }`}
              >
                {item.label}
                <span className={`absolute bottom-0 left-0 h-0.5 transition-all duration-200 ${
                  pathname === item.href ? 'w-full bg-dark-900' : 'w-0 bg-dark-900 group-hover:w-full'
                }`}></span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {!loading && user ? (
              <Button variant="ghost" className="font-light" onClick={handleLogout}>
                Logout
              </Button>
            ) : !loading ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="font-light">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button className="font-light">Sign up</Button>
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-dark-700 hover:text-dark-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-dark-200 py-4">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-dark-700 hover:text-dark-900 font-light uppercase tracking-wide text-sm ${
                    pathname === item.href ? 'text-dark-900' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-dark-200 space-y-2">
                {!loading && user ? (
                  <Button variant="ghost" className="w-full font-light" onClick={handleLogout}>
                    Logout
                  </Button>
                ) : !loading ? (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="w-full">Log in</Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full">Sign up</Button>
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
