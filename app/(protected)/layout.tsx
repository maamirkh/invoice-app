'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { SessionUser } from '@/lib/types';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const WARNING_SECONDS = 60;              // show warning 60s before logout

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_SECONDS);

  const lastActivityRef = useRef(Date.now());
  const warningShownAtRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownAtRef.current = null;
    setShowWarning(false);
    setCountdown(WARNING_SECONDS);
  }, []);

  // Idle detection — runs a tick every second after user data loads
  useEffect(() => {
    if (loading) return;

    const events: string[] = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));

    const tick = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      const timeLeftMs = IDLE_TIMEOUT_MS - idleMs;

      if (timeLeftMs <= 0) {
        clearInterval(tick);
        handleLogout();
        return;
      }

      if (timeLeftMs <= WARNING_SECONDS * 1000) {
        setShowWarning(true);
        setCountdown(Math.ceil(timeLeftMs / 1000));
      }
    }, 1000);

    return () => {
      clearInterval(tick);
      events.forEach((e) => window.removeEventListener(e, resetActivity));
    };
  }, [loading, resetActivity]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const nav = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/invoices', label: 'Invoices' },
    { href: '/invoices/new', label: 'New Invoice' },
  ];

  function isActive(item: { href: string }) {
    return (
      pathname === item.href ||
      (item.href !== '/dashboard' &&
        pathname.startsWith(item.href) &&
        item.href !== '/invoices/new' &&
        pathname !== '/invoices/new')
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <img src="/logo.jpeg" alt="Logo" className="h-9" />
              <span className="font-bold text-gray-900 hidden sm:block text-sm md:text-base">
                Perfect Power Energy
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm text-gray-600 hidden sm:block truncate max-w-[120px]">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Sign Out
              </button>
              {/* Hamburger - mobile only */}
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {/* User name on mobile */}
              {user?.name && (
                <p className="text-xs text-gray-500 px-3 py-1 mb-2 font-medium">{user.name}</p>
              )}
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(item)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Auto-logout warning modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 mx-4 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Session Expiring</h2>
            <p className="text-sm text-gray-500 mb-4">
              You will be automatically signed out in
            </p>
            <p className="text-4xl font-bold text-red-600 mb-5 tabular-nums">
              {countdown}s
            </p>
            <button
              onClick={resetActivity}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Stay Signed In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
