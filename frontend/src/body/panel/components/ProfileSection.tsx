'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/body/redux/hooks';
import { selectUser } from '@/body/redux/slices/auth/AuthSlice';

/**
 * Profil Bölümü Bileşeni
 * 
 * Kullanıcı profil bilgilerini görüntüleme ve düzenleme.
 * - Kişisel bilgiler (ad, soyad, telefon)
 * - Profil fotoğrafı
 * - Şifre değiştirme
 */

interface ProfileFormData {
  name: string;
  surname: string;
  phone: string;
  email: string;
}

export default function ProfileSection() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    surname: user?.surname || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  // Edit mode
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Success/Error message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /**
   * Form değişikliği handler
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Form submit handler
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // TODO: API call to update profile
      console.log('Profile güncelleme:', formData);
      
      // Simüle edilmiş başarı
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Profiliniz başarıyla güncellendi!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile güncelleme hatası:', error);
      setMessage({ type: 'error', text: 'Profil güncellenirken bir hata oluştu.' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Düzenlemeyi iptal et
   */
  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      surname: user?.surname || '',
      phone: user?.phone || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="space-y-8">
      {/* Mesaj */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
          <p>{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* Profil Fotoğrafı */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Profil Fotoğrafı</h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
              Fotoğraf Yükle
            </button>
            <p className="text-sm text-gray-500 mt-2">
              JPG, PNG veya GIF. Maksimum 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Kişisel Bilgiler Formu */}
      <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Kişisel Bilgiler</h3>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-semibold"
            >
              ✏️ Düzenle
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ad */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Ad
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${
                isEditing
                  ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                  : 'border-transparent bg-gray-100 text-gray-600'
              }`}
            />
          </div>

          {/* Soyad */}
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-2">
              Soyad
            </label>
            <input
              type="text"
              id="surname"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${
                isEditing
                  ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                  : 'border-transparent bg-gray-100 text-gray-600'
              }`}
            />
          </div>

          {/* E-posta (Readonly) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-posta
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border border-transparent bg-gray-100 text-gray-500 rounded-xl cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez</p>
          </div>

          {/* Telefon */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="5XX XXX XX XX"
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all ${
                isEditing
                  ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                  : 'border-transparent bg-gray-100 text-gray-600'
              }`}
            />
          </div>
        </div>

        {/* Düzenleme Butonları */}
        {isEditing && (
          <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  💾 Değişiklikleri Kaydet
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:cursor-not-allowed"
            >
              İptal
            </button>
          </div>
        )}
      </form>

      {/* Şifre Değiştirme */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Şifre Değiştir</h3>
        <p className="text-gray-600 mb-4">
          Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirmenizi öneririz.
        </p>
        <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold">
          🔐 Şifre Değiştir
        </button>
      </div>

      {/* Hesap Bilgileri */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Hesap Bilgileri</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Üyelik Tarihi</span>
            <span className="text-gray-800 font-medium">-</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Son Giriş</span>
            <span className="text-gray-800 font-medium">Şimdi</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Hesap Durumu</span>
            <span className="text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Aktif
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
