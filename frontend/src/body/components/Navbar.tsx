'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navbar Component
 * 
 * Ana navigasyon bileşeni.
 * Responsive tasarım ile desktop ve mobile görünümler.
 */

export default function Navbar() {
  const pathname = usePathname();

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
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="hidden md:block px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              Profilim
            </Link>
            <Link
              href="/login"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Giriş Yap
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 flex flex-wrap gap-4">
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
        </div>
      </nav>
    </header>
  );
}

