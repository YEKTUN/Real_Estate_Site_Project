'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/body/redux/hooks';
import { selectIsAuthenticated, selectUser, logoutAsync } from '@/body/redux/slices/auth/AuthSlice';

/**
 * Navbar Component
 * 
 * Ana navigasyon bileşeni.
 * Responsive tasarım ile desktop ve mobile görünümler.
 * Auth durumuna göre farklı butonlar gösterir.
 * Token kontrolü AuthGuard tarafından global olarak yapılır.
 */

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Auth state
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

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
      // Hata olsa bile login'e yönlendir
      router.push('/login');
    }
  };

  /**
   * Navbar menü öğeleri
   */
  const navItems = [
    { name: 'Ana Sayfa', href: '/' },
    { name: 'İlanlar', href: '/properties' },
    { name: 'Hakkımızda', href: '/about' },
    { name: 'İletişim', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-3xl">🏠</span>
            <span className="text-2xl font-bold text-gray-800">
              Real Estate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-lg font-medium transition-colors hover:text-blue-600 ${
                  pathname === item.href
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Giriş yapmış kullanıcı için */}
                {/* Panel'de değilse "Panel'e Git" göster */}
                {pathname !== '/panel' && (
                  <Link
                    href="/panel"
                    className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                  >
                    <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                    <span className="font-medium">Panel'e Git</span>
                  </Link>
                )}
                {/* Panel'deyse sadece avatar göster */}
                {pathname === '/panel' && (
                  <div className="hidden md:flex items-center gap-2 px-4 py-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                    <span className="font-medium text-gray-700">{user?.name}</span>
                  </div>
                )}
                {/* Çıkış Yap butonu */}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <span>🚪</span>
                  <span>Çıkış Yap</span>
                </button>
              </>
            ) : (
              <>
                {/* Giriş yapmamış kullanıcı için */}
                <Link
                  href="/login"
                  className="hidden md:block px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 flex flex-wrap gap-4 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {item.name}
            </Link>
          ))}
          {/* Mobil için auth butonları */}
          {isAuthenticated ? (
            <>
              {pathname !== '/panel' && (
                <Link
                  href="/panel"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Çıkış
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Giriş Yap
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

