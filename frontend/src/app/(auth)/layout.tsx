import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";

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
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-indigo-500/10 rounded-full blur-[80px]"></div>

      {/* Auth Container */}
      <div className="w-full max-w-[440px] relative z-10 py-4 lg:py-0">
        {/* Logo Section */}
        <div className="text-center mb-6 transform transition-all duration-700 hover:scale-105">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              <Building2 className="w-10 h-10 text-blue-500" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight leading-none">
                RealEstimate
              </h1>
              <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                Emlak Rehberiniz
              </p>
            </div>
          </Link>
        </div>

        {/* Auth Content Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-6 md:p-8 relative overflow-hidden group">
          {/* Subtle Glow inside card */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

          <div className="relative z-10">
            {children}
          </div>
        </div>

        {/* Improved Footer */}
        <div className="text-center mt-6 space-y-2">
          <div className="flex justify-center gap-4 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
            <Link href="/terms" className="hover:text-blue-400 transition-colors">Şartlar</Link>
            <Link href="/privacy" className="hover:text-blue-400 transition-colors">Gizlilik</Link>
            <Link href="/support" className="hover:text-blue-400 transition-colors">Destek</Link>
          </div>
          <p className="text-slate-500 text-[10px] font-light">
            © {new Date().getFullYear()} Real Estimate.
          </p>
        </div>
      </div>
    </div>
  );
}

