'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgetPasswordApi } from '@/body/redux/api/authApi';

/**
 * Forget Password Component
 * 
 * Şifre sıfırlama isteği formu bileşeni.
 * Email adresi girilir, sistem email'e şifre sıfırlama linki gönderir.
 */

export default function ForgetPasswordPage() {
  // Form state
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /**
   * Form submit handler
   * Şifre sıfırlama isteğini gönderir
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasyon
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Lütfen email adresinizi giriniz' });
      return;
    }

    // Email format kontrolü
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
          text: result.message || 'Şifre sıfırlama linki email adresinize gönderilmiştir.'
        });
        setEmail(''); // Formu temizle
      } else {
        // Backend'den gelen hata mesajını göster
        setMessage({
          type: 'error',
          text: result.message || 'Şifre sıfırlama isteği gönderilirken bir hata oluştu'
        });
      }
    } catch (error) {
      console.error('Forget password error:', error);
      setMessage({
        type: 'error',
        text: 'Şifre sıfırlama isteği gönderilirken bir hata oluştu'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Input change handler
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
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
          <h2 className="text-3xl font-bold text-gray-800">Şifremi Unuttum</h2>
          <p className="text-gray-600 mt-2">
            Email adresinize şifre sıfırlama linki göndereceğiz
          </p>
        </div>

        {/* Mesaj gösterimi */}
        {message && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
              }`}
          >
            <span className="text-lg flex-shrink-0">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            <p className="text-sm font-medium flex-1">{message.text}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Adresi
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="ornek@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
          >
            {isLoading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
          </button>
        </form>

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

