'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordApi } from '@/body/redux/api/authApi';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';

/**
 * Reset Password Component
 * Premium and original design for password reset.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL'den token ve email al
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  // Form state
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Background decoration pattern (Consistent with ForgetPasswordPage)
  const BackgroundPattern = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl animate-pulse" />
      <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-3xl delay-700 animate-pulse" />
      <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-sky-100/50 blur-3xl delay-1000 animate-pulse" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );

  useEffect(() => {
    if (!token || !email) {
      setMessage({
        type: 'error',
        text: 'Geçersiz veya eksik bağlantı. Lütfen emailinizdeki linki tekrar kontrol ediniz.'
      });
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email) {
      setMessage({ type: 'error', text: 'Geçersiz veya eksik token' });
      return;
    }

    if (!formData.newPassword.trim()) {
      setMessage({ type: 'error', text: 'Lütfen yeni şifrenizi giriniz' });
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Şifre en az 8 karakter olmalıdır' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Şifreler birbiriyle eşleşmiyor' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await resetPasswordApi(
        token,
        email,
        formData.newPassword,
        formData.confirmPassword
      );

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Şifreniz başarıyla güncellendi.'
        });

        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Şifre sıfırlama işlemi başarısız oldu.'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({
        type: 'error',
        text: 'İşlem sırasında beklenmedik bir hata oluştu.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message && message.type === 'error') setMessage(null);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans text-slate-800">
      <BackgroundPattern />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden transition-all duration-300 hover:shadow-blue-900/5">

          {/* Header Section */}
          <div className="relative h-32 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm border border-white/20 shadow-inner">
              <Lock className="w-10 h-10 text-white drop-shadow-md" strokeWidth={1.5} />
            </div>
          </div>

          <div className="p-8 pt-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Yeni Şifre Belirle</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Hesabınız için güçlü ve güvenli yeni bir şifre oluşturun.
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
                <div className="flex-1">
                  <p>{message.text}</p>
                  {message.type === 'success' && (
                    <p className="text-xs mt-1.5 opacity-80 font-normal">
                      Giriş sayfasına yönlendiriliyorsunuz...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Token/Email Error State */}
            {(!token || !email) && !message && (
              <div className="p-4 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 text-sm flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>Geçersiz veya süresi dolmuş bağlantı. Lütfen emailinizdeki linki tekrar kontrol ediniz.</p>
              </div>
            )}

            {/* Form */}
            {token && email && (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Readonly Email Field */}
                <div className="group opacity-70">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
                    Email Adresi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="block w-full pl-10 pr-3 py-3 border-gray-200 rounded-xl leading-5 bg-gray-100 text-slate-500 cursor-not-allowed sm:text-sm"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="group">
                  <label
                    htmlFor="newPassword"
                    className={`block text-xs font-semibold uppercase tracking-wider mb-2 transition-colors duration-200 ${focusedField === 'newPassword' ? 'text-indigo-600' : 'text-slate-500'
                      }`}
                  >
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'newPassword' ? 'text-indigo-500' : 'text-gray-400'
                        }`} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('newPassword')}
                      onBlur={() => setFocusedField(null)}
                      required
                      placeholder="En az 8 karakter"
                      minLength={8}
                      className="block w-full pl-10 pr-10 py-3 border-gray-200 rounded-xl leading-5 bg-gray-50 text-slate-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="group">
                  <label
                    htmlFor="confirmPassword"
                    className={`block text-xs font-semibold uppercase tracking-wider mb-2 transition-colors duration-200 ${focusedField === 'confirmPassword' ? 'text-indigo-600' : 'text-slate-500'
                      }`}
                  >
                    Şifre Tekrarı
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'confirmPassword' ? 'text-indigo-500' : 'text-gray-400'
                        }`} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      required
                      placeholder="Şifrenizi doğrulayın"
                      minLength={8}
                      className="block w-full pl-10 pr-10 py-3 border-gray-200 rounded-xl leading-5 bg-gray-50 text-slate-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Güncelleniyor...
                    </span>
                  ) : (
                    'Şifreyi Güncelle'
                  )}
                </button>
              </form>
            )}
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

