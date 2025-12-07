import Navbar from '@/body/components/Navbar';
import Footer from '@/body/components/Footer';

/**
 * Home Layout
 * 
 * Bu layout, ana uygulama sayfaları için kullanılır.
 * Dashboard, Property Listings, Profile gibi sayfalar bu layout'u kullanır.
 * 
 * Özellikler:
 * - Navbar (üst menü)
 * - Footer (alt bilgi)
 * - Responsive tasarım
 * - Server Component (metadata desteği)
 */

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar - Client Component */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer - Server Component */}
      <Footer />
    </div>
  );
}
