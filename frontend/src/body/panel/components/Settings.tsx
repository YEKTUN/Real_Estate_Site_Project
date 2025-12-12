'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/body/redux/hooks';
import { logoutAsync } from '@/body/redux/slices/auth/AuthSlice';

/**
 * Ayarlar Bileşeni
 * 
 * Hesap ayarları ve tercihler.
 * - Bildirim ayarları
 * - Gizlilik ayarları
 * - Hesap silme
 * - Çıkış yap
 */

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  newListings: boolean;
  priceDrops: boolean;
  messages: boolean;
}

interface PrivacySettings {
  showPhone: boolean;
  showEmail: boolean;
  profileVisible: boolean;
}

export default function Settings() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Bildirim ayarları
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
    newListings: true,
    priceDrops: true,
    messages: true,
  });

  // Gizlilik ayarları
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    showPhone: false,
    showEmail: true,
    profileVisible: true,
  });

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Success message
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  /**
   * Bildirim ayarı değiştir
   */
  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Gizlilik ayarı değiştir
   */
  const handlePrivacyChange = (key: keyof PrivacySettings) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Ayarları kaydet
   */
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: API call
      console.log('Ayarlar kaydediliyor:', { notifications, privacy });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Çıkış yap
   */
  const handleLogout = async () => {
    try {
      console.log('Settings: Çıkış yapılıyor...');
      await dispatch(logoutAsync()).unwrap();
      router.push('/login');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      // Hata olsa bile login'e yönlendir
      router.push('/login');
    }
  };

  /**
   * Hesabı sil
   */
  const handleDeleteAccount = () => {
    if (window.confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      console.log('Hesap siliniyor...');
      // TODO: API call
    }
  };

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <span className="text-xl">✅</span>
          <p>Ayarlarınız başarıyla kaydedildi!</p>
        </div>
      )}

      {/* Bildirim Ayarları */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <span>🔔</span> Bildirim Ayarları
        </h3>

        <div className="space-y-4">
          {/* Bildirim Kanalları */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Bildirim Kanalları</h4>
            <div className="space-y-3">
              <ToggleItem
                label="E-posta Bildirimleri"
                description="Önemli güncellemeleri e-posta ile al"
                checked={notifications.email}
                onChange={() => handleNotificationChange('email')}
              />
              <ToggleItem
                label="SMS Bildirimleri"
                description="Acil bildirimler için SMS al"
                checked={notifications.sms}
                onChange={() => handleNotificationChange('sms')}
              />
              <ToggleItem
                label="Anlık Bildirimler"
                description="Tarayıcı bildirimleri"
                checked={notifications.push}
                onChange={() => handleNotificationChange('push')}
              />
            </div>
          </div>

          {/* Bildirim Türleri */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Bildirim Türleri</h4>
            <div className="space-y-3">
              <ToggleItem
                label="Yeni İlanlar"
                description="Arama kriterlerinize uygun yeni ilanlar"
                checked={notifications.newListings}
                onChange={() => handleNotificationChange('newListings')}
              />
              <ToggleItem
                label="Fiyat Düşüşleri"
                description="Favori ilanlarınızda fiyat değişiklikleri"
                checked={notifications.priceDrops}
                onChange={() => handleNotificationChange('priceDrops')}
              />
              <ToggleItem
                label="Mesajlar"
                description="Yeni mesaj bildirimleri"
                checked={notifications.messages}
                onChange={() => handleNotificationChange('messages')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gizlilik Ayarları */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <span>🔒</span> Gizlilik Ayarları
        </h3>

        <div className="space-y-3">
          <ToggleItem
            label="Telefon Numaramı Göster"
            description="İlanlarınızda telefon numaranız görünsün"
            checked={privacy.showPhone}
            onChange={() => handlePrivacyChange('showPhone')}
          />
          <ToggleItem
            label="E-posta Adresimi Göster"
            description="İlanlarınızda e-posta adresiniz görünsün"
            checked={privacy.showEmail}
            onChange={() => handlePrivacyChange('showEmail')}
          />
          <ToggleItem
            label="Profil Görünürlüğü"
            description="Profiliniz diğer kullanıcılara görünsün"
            checked={privacy.profileVisible}
            onChange={() => handlePrivacyChange('profileVisible')}
          />
        </div>
      </div>

      {/* Kaydet Butonu */}
      <button
        onClick={handleSaveSettings}
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Hesap İşlemleri */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <span>⚠️</span> Hesap İşlemleri
        </h3>

        <div className="space-y-4">
          {/* Çıkış Yap */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
              <h4 className="font-medium text-gray-800">Çıkış Yap</h4>
              <p className="text-sm text-gray-600">Hesabınızdan güvenli çıkış yapın</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              🚪 Çıkış Yap
            </button>
          </div>

          {/* Hesabı Sil */}
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium text-red-600">Hesabı Sil</h4>
              <p className="text-sm text-gray-600">Bu işlem geri alınamaz!</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold"
            >
              🗑️ Hesabı Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Toggle Item Bileşeni
 */
interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleItem({ label, description, checked, onChange }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
