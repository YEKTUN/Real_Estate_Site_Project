'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordApi } from '@/body/redux/api/authApi';

/**
 * Reset Password Component
 * 
 * Şifre sıfırlama formu bileşeni.
 * Email'den gelen token ile yeni şifre belirlenir.
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

  /**
   * Token ve email kontrolü
   */
  useEffect(() => {
    if (!token || !email) {
      setMessage({ 
        type: 'error', 
        text: 'Geçersiz veya eksik token. Lütfen email\'inizdeki linki kullanın.' 
      });
    }
  }, [token, email]);

  /**
   * Form submit handler
   * Şifre sıfırlama işlemini gerçekleştirir
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasyon
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
      setMessage({ type: 'error', text: 'Şifreler eşleşmiyor' });
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
          text: result.message || 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.' 
        });
        
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Şifre sıfırlama işlemi başarısız oldu' 
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Şifre sıfırlama işlemi sırasında bir hata oluştu' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Input change handler
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Yazarken mesajı temizle
    if (message) {
      setMessage(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Başlık */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Şifre Sıfırla</h2>
          <p className="text-gray-600 mt-2">
            Yeni şifrenizi belirleyin
          </p>
        </div>

        {/* Mesaj gösterimi */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <p className="text-sm">{message.text}</p>
            {message.type === 'success' && (
              <p className="text-xs mt-2 text-green-600">
                Giriş sayfasına yönlendiriliyorsunuz...
              </p>
            )}
          </div>
        )}

        {/* Token/Email eksik uyarısı */}
        {(!token || !email) && !message && (
          <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200">
            <p className="text-sm">
              Geçersiz veya eksik token. Lütfen email'inizdeki linki kullanın.
            </p>
          </div>
        )}

        {/* Form */}
        {token && email && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email gösterimi (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Adresi
              </label>
              <input
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Yeni Şifre Input */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Yeni Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="En az 8 karakter"
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Şifre Tekrarı Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Şifre Tekrarı
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Şifrenizi tekrar giriniz"
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
            >
              {isLoading ? 'Sıfırlanıyor...' : 'Şifremi Sıfırla'}
            </button>
          </form>
        )}

        {/* Geri Dön Linki */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
          >
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
}

