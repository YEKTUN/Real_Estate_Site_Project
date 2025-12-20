'use client';

import { useState, useMemo, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/body/redux/hooks';
import { selectUser, updateProfilePicture } from '@/body/redux/slices/auth/AuthSlice';
import { uploadFile, selectIsUploadingFile } from '@/body/redux/slices/cloudinary/CloudinarySlice';
import { changePasswordApi } from '@/body/redux/api/authApi';
import UserAvatar from '@/body/panel/components/UserAvatar';

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

// UTF-8 -> Latin1 bozulmalarını düzeltmek için yardımcı
const fixEncoding = (value?: string | null) => {
  if (!value) return '';
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
};

export default function ProfileSection() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isUploading = useAppSelector(selectIsUploadingFile);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Kullanıcı bilgilerini normalize et
  const displayName = useMemo(() => fixEncoding(user?.name), [user?.name]);
  const displaySurname = useMemo(() => fixEncoding(user?.surname), [user?.surname]);
  const displayEmail = useMemo(() => fixEncoding(user?.email), [user?.email]);
  const displayPhone = useMemo(() => fixEncoding(user?.phone), [user?.phone]);
  const displayInitial = useMemo(
    () => (displayName || displayEmail || '?').charAt(0).toUpperCase() || '?',
    [displayName, displayEmail]
  );

  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    name: displayName,
    surname: displaySurname,
    phone: displayPhone,
    email: displayEmail,
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
      name: displayName,
      surname: displaySurname,
      phone: displayPhone,
      email: displayEmail,
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Profil fotoğrafı en fazla 5MB olabilir.');
      return;
    }

    try {
      const uploadRes: any = await dispatch(uploadFile({ file, folder: 'profiles' })).unwrap();
      if (!uploadRes.success || !uploadRes.url) {
        alert(uploadRes.message || 'Profil fotoğrafı yüklenemedi');
        return;
      }

      const url = uploadRes.url as string;
      const result = await dispatch(updateProfilePicture(url)).unwrap();
      if (!result.success) {
        alert(result.message || 'Profil fotoğrafı güncellenemedi');
        return;
      }

      setMessage({ type: 'success', text: 'Profil fotoğrafınız güncellendi.' });
    } catch (err) {
      console.error('Profil fotoğrafı güncelleme hatası:', err);
      alert('Profil fotoğrafı güncellenirken bir hata oluştu.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
          <button
            type="button"
            onClick={handleAvatarClick}
            className="relative group"
          >
            <UserAvatar
              name={displayName || 'Kullanıcı'}
              surname={displaySurname || ''}
              profilePictureUrl={user?.profilePictureUrl}
              size="xl"
              className="shadow-lg"
            />
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-semibold transition-opacity">
              Değiştir
            </div>
          </button>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              JPG, PNG veya GIF. Maksimum 5MB. Yeni fotoğraf yüklendiğinde eski fotoğrafınızın yerini alır.
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
      <ChangePasswordSection />

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

/**
 * Şifre Değiştirme Bölümü Bileşeni
 * 
 * Kullanıcının mevcut şifresi ile yeni şifre belirlemesi için form.
 */
function ChangePasswordSection() {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  /**
   * Form değişikliği handler
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Yazarken mesajı temizle
    if (message) {
      setMessage(null);
    }
  };

  /**
   * Form submit handler
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validasyon
    if (!formData.currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Lütfen mevcut şifrenizi giriniz' });
      setIsLoading(false);
      return;
    }

    if (!formData.newPassword.trim()) {
      setMessage({ type: 'error', text: 'Lütfen yeni şifrenizi giriniz' });
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 8 karakter olmalıdır' });
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor' });
      setIsLoading(false);
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setMessage({ type: 'error', text: 'Yeni şifre mevcut şifrenizden farklı olmalıdır' });
      setIsLoading(false);
      return;
    }

    try {
      const result = await changePasswordApi(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: result.message || 'Şifreniz başarıyla değiştirildi' 
        });
        // Formu temizle
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsEditing(false);
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Şifre değiştirme işlemi başarısız oldu' 
        });
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      setMessage({ 
        type: 'error', 
        text: 'Şifre değiştirme işlemi sırasında bir hata oluştu' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Düzenlemeyi iptal et
   */
  const handleCancel = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Şifre Değiştir</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-semibold"
          >
            🔐 Şifre Değiştir
          </button>
        )}
      </div>

      {!isEditing ? (
        <p className="text-gray-600">
          Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirmenizi öneririz.
        </p>
      ) : (
        <>
          {/* Mesaj */}
          {message && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 mb-4 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
              <p className="flex-1 text-sm font-medium">{message.text}</p>
              <button
                onClick={() => setMessage(null)}
                className="hover:opacity-70"
              >
                ✕
              </button>
            </div>
          )}

          {/* Şifre Değiştirme Formu */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mevcut Şifre */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mevcut Şifre
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Mevcut şifrenizi giriniz"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPasswords.current ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Yeni Şifre */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Yeni Şifre
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="En az 8 karakter"
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPasswords.new ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Yeni Şifre Tekrarı */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Yeni Şifre Tekrarı
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Yeni şifrenizi tekrar giriniz"
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPasswords.confirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Değiştiriliyor...
                  </>
                ) : (
                  <>
                    💾 Şifreyi Değiştir
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
          </form>
        </>
      )}
    </div>
  );
}
