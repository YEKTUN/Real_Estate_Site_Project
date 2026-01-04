'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgetPasswordApi } from '@/body/redux/api/authApi';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

/**
 * Forget Password Component
 * Premium and original design for password recovery.
 */
export default function ForgetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Background decoration pattern
  const BackgroundPattern = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl animate-pulse" />
      <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-3xl delay-700 animate-pulse" />
      <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-sky-100/50 blur-3xl delay-1000 animate-pulse" />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Lütfen email adresinizi giriniz' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir email adresi giriniz' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await forgetPasswordApi(email);
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Şifre sıfırlama talimatları email adresinize gönderildi.'
        });
        setEmail('');
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.'
        });
      }
    } catch (error) {
      console.error('Forget password error:', error);
      setMessage({
        type: 'error',
        text: 'Sunucu ile iletişim kurulamadı. Lütfen internet bağlantınızı kontrol ediniz.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (message) setMessage(null);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans text-slate-800">
      <BackgroundPattern />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand / Logo Area could go here if needed */}

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden transition-all duration-300 hover:shadow-blue-900/5">
          {/* Header Section with Gradient */}
          <div className="relative h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm border border-white/20 shadow-inner">
              <KeyRound className="w-10 h-10 text-white drop-shadow-md" strokeWidth={1.5} />
            </div>
          </div>

          <div className="p-8 pt-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Şifrenizi mi Unuttunuz?</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Endişelenmeyin, hesabınızı kurtarmanıza yardımcı olacağız.
                Email adresinizi girin ve size sıfırlama linkini gönderelim.
              </p>
            </div>

            {/* Notification Area */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 border ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                  }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="group">
                <label
                  htmlFor="email"
                  className={`block text-xs font-semibold uppercase tracking-wider mb-2 transition-colors duration-200 ${isFocused ? 'text-blue-600' : 'text-slate-500'
                    }`}
                >
                  Email Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail
                      className={`h-5 w-5 transition-colors duration-200 ${isFocused ? 'text-blue-500' : 'text-gray-400'
                        }`}
                    />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    required
                    disabled={isLoading}
                    className="block w-full pl-10 pr-3 py-3 border-gray-200 rounded-xl leading-5 bg-gray-50 text-slate-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ease-in-out sm:text-sm"
                    placeholder="ornek@email.com"
                  />
                  {/* Validation Icon (Optional flair) */}
                  {email.length > 5 && email.includes('@') && !message && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in">
                      <Sparkles className="h-4 w-4 text-blue-400 opacity-50" />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    İşleniyor...
                  </span>
                ) : (
                  'Sıfırlama Linki Gönder'
                )}
              </button>
            </form>
          </div>

          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100/50 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Giriş Sayfasına Dön
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} EmlakPortal. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}

