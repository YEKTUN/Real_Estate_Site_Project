import Link from 'next/link';

/**
 * Footer Component
 * 
 * Ana footer bileşeni.
 * Şirket bilgileri, hızlı linkler ve iletişim bilgileri.
 */

export default function Footer() {
  const navItems = [
    { name: 'Tüm İlanlar', href: '/' },
    { name: 'Satılık', href: '/?type=1' },
    { name: 'Kiralık', href: '/?type=2' },
    { name: 'Konut', href: '/?category=1' },
    { name: 'İş Yeri', href: '/?category=2' },
  ];

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">🏠 Real Estimate</h3>
            <p className="text-gray-400">
              Hayalinizdeki evi bulmak için en iyi platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Hızlı Bağlantılar</h4>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">İletişim</h4>
            <ul className="space-y-2 text-gray-400">
              <li>📧 info@realestimate.com</li>
              <li>📞 +90 555 123 4567</li>
              <li>📍 İstanbul, Türkiye</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>© 2024 Real Estimate. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}

