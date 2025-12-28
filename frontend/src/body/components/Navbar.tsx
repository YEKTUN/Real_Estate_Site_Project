'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/body/redux/hooks';
import { selectIsAuthenticated, selectUser, logoutAsync } from '@/body/redux/slices/auth/AuthSlice';

/**
 * Navbar Component
 * 
 * Ana navigasyon bileşeni.
 * Marka ismi: Real Estimate
 * Kategoriler: Satılık, Kiralık, Konut, İş Yeri
 */

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Auth state
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // Dropdown state for mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Çıkış yap handler
   */
  const handleLogout = async () => {
    try {
      console.log('Navbar: Çıkış yapılıyor...');
      await dispatch(logoutAsync()).unwrap();
      router.push('/login');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      router.push('/login');
    }
  };

  /**
   * Emlak kategorileri
   */
  const categories = [
    { name: 'Satılık', query: '?type=1' },
    { name: 'Kiralık', query: '?type=2' },
    { name: 'Konut', query: '?category=1' },
    { name: 'İş Yeri', query: '?category=2' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-100">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Image
                src="/real_estimate.png"
                alt="Real Estimate Logo"
                width={32}
                height={32}
                className="object-contain brightness-0 invert"
                unoptimized
              />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">
              Real<span className="text-blue-600">Estimate</span>
            </span>
          </Link>

          {/* Desktop Navigation - Emlak Menüsü */}
          <div className="hidden md:flex items-center space-x-1">
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-2 text-lg font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                <span>🏠 Emlak</span>
                <span className="text-xs opacity-50">▼</span>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top translate-y-2 group-hover:translate-y-0 z-50">
                <div className="p-2 space-y-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={`/${cat.query}`}
                      className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 my-1 pt-1">
                    <Link
                      href="/"
                      className="block px-4 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Tüm İlanlar
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href={user?.isAdmin ? '/admin' : '/panel'}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                  <span className="hidden sm:inline font-semibold text-gray-700">{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  title="Çıkış Yap"
                >
                  <span className="text-xl">🚪</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 font-semibold hover:text-blue-600 transition-colors"
                >
                  Giriş
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-gray-100 pt-4">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Emlak Kategorileri</p>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/${cat.query}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-lg font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-lg font-bold text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Tüm İlanlar
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}


