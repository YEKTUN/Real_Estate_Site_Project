import type { Metadata } from "next";
import Image from "next/image";

/**
 * Auth Layout
 * 
 * Bu layout, authentication (kimlik doğrulama) sayfaları için kullanılır.
 * Login, Register, Forgot Password gibi sayfalar bu layout'u kullanır.
 * 
 * Özellikler:
 * - Merkezi ve minimal tasarım
 * - Navbar/Footer yok
 * - Tam ekran auth formları
 * - Gradient arka plan
 */

export const metadata: Metadata = {
  title: "Giriş Yap | Real Estimate",
  description: "Real Estimate platformuna giriş yapın veya kayıt olun",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Auth Container - Merkezi ve minimal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo veya Branding Alanı */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Image
                src="/real_estimate.png"
                alt="Real Estimate Logo"
                width={50}
                height={50}
                className="object-contain"
                unoptimized
              />
              <h1 className="text-4xl font-bold text-gray-800">
                Real Estimate
              </h1>
            </div>
            <p className="text-gray-600">
              Hayalinizdeki evi bulun
            </p>
          </div>

          {/* Auth Content - Login/Register Forms */}
          <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-90">
            {children}
          </div>

          {/* Footer Text */}
          <div className="text-center mt-6 text-sm text-gray-600">
            <p>© 2024 Real Estimate. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

