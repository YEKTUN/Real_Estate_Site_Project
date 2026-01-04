'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/body/redux/hooks';
import { logoutAsync, deactivateAccount } from '@/body/redux/slices/auth/AuthSlice';
import axiosInstance from '@/body/redux/api/axiosInstance';
import {
  Bell,
  Lock,
  ShieldAlert,
  LogOut,
  Trash2,
  Save,
  Check,
  Smartphone,
  Mail,
  Globe,
  AlertTriangle,
  X
} from 'lucide-react';

/**
 * Ayarlar Bileşeni
 * 
 * Hesap ayarları ve tercihler.
 * Premium tasarım güncellemesi.
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

  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axiosInstance.get('/usersettings');
        const data = response.data;

        console.log('🔍 Backend\'den gelen ayarlar:', data);

        setNotifications({
          email: data.emailNotifications,
          sms: data.smsNotifications,
          push: data.pushNotifications,
          newListings: data.newListingNotifications,
          priceDrops: data.priceDropNotifications,
          messages: data.messageNotifications,
        });

        setPrivacy({
          showPhone: data.showPhone,
          showEmail: data.showEmail,
          profileVisible: data.profileVisible,
        });

        console.log('✅ Gizlilik ayarları set edildi:', {
          showPhone: data.showPhone,
          showEmail: data.showEmail,
          profileVisible: data.profileVisible
        });
      } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
      }
    };

    fetchSettings();
  }, []);

  /**
   * Ayarları veritabanına kaydet
   */
  const saveSettingsToDb = async (newNotifications: NotificationSettings, newPrivacy: PrivacySettings) => {
    setIsAutoSaving(true);
    try {
      const payload = {
        EmailNotifications: newNotifications.email,
        SmsNotifications: newNotifications.sms,
        PushNotifications: newNotifications.push,
        NewListingNotifications: newNotifications.newListings,
        PriceDropNotifications: newNotifications.priceDrops,
        MessageNotifications: newNotifications.messages,
        ShowPhone: newPrivacy.showPhone,
        ShowEmail: newPrivacy.showEmail,
        ProfileVisible: newPrivacy.profileVisible,
      };

      console.log('💾 Veritabanına kaydedilecek payload (Güncel):', payload);

      const response = await axiosInstance.put('/usersettings', payload);
      console.log('✅ Backend yanıtı:', response.data);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('❌ Ayarlar kaydedilirken hata:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  /**
   * Bildirim ayarı değiştir ve otomatik kaydet
   */
  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveSettingsToDb(updated, privacy);
      return updated;
    });
  };

  /**
   * Gizlilik ayarı değiştir ve otomatik kaydet
   */
  const handlePrivacyChange = (key: keyof PrivacySettings) => {
    setPrivacy((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      console.log(`🔄 Gizlilik ayarı değişiyor - ${key}:`, {
        önceki: prev[key],
        yeni: updated[key],
        tümAyarlar: updated
      });
      saveSettingsToDb(notifications, updated);
      return updated;
    });
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
      router.push('/login');
    }
  };

  /**
   * Hesabı sil (Pasife al)
   */
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const resultAction = await dispatch(deactivateAccount());
      if (deactivateAccount.fulfilled.match(resultAction)) {
        // Başarılı deactivasyon sonrası otomatik logout ve yönlendirme
        // AuthSlice'daki deactivateAccount.fulfilled state'i temizleyeceği için 
        // buradaki logout opsiyoneldir ama garanti olsun.
        router.push('/');
      } else {
        setDeleteError(resultAction.payload as string || 'Hesap kapatılırken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Hesap silme hatası:', error);
      setDeleteError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto p-6 md:p-8">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Hesap Ayarları</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-500 font-medium">Bildirim ve gizlilik tercihlerinizi yönetin.</p>
            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Otomatik Kaydedilir</span>
          </div>
        </div>

        {/* Saving Status Indicators */}
        <div className="flex items-center gap-3">
          {isAutoSaving && (
            <div className="flex items-center gap-2 text-slate-400 animate-pulse">
              <div className="w-3 h-3 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Kaydediliyor...</span>
            </div>
          )}
          {showSuccess && !isAutoSaving && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm animate-in slide-in-from-right duration-300">
              <Check className="w-3.5 h-3.5" />
              <span className="font-bold text-xs">Değişiklikler Kaydedildi</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Bildirim Ayarları */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 space-y-5 h-full">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Bildirim Tercihleri</h3>
              <p className="text-[10px] font-medium text-slate-400">İletişim kanallarını yönet</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kanallar</h4>
              <ToggleItem
                icon={<Mail className="w-3.5 h-3.5" />}
                label="E-posta"
                description="Önemli güncellemeler için."
                checked={notifications.email}
                onChange={() => handleNotificationChange('email')}
                isDisabled={isAutoSaving}
              />
              <ToggleItem
                icon={<Smartphone className="w-3.5 h-3.5" />}
                label="SMS"
                description="Acil durumlar için."
                checked={notifications.sms}
                onChange={() => handleNotificationChange('sms')}
                isDisabled={isAutoSaving}
              />
              <ToggleItem
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Anlık Bildirim"
                description="Tarayıcı bildirimleri."
                checked={notifications.push}
                onChange={() => handleNotificationChange('push')}
                isDisabled={isAutoSaving}
              />
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-50">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Konular</h4>
              <ToggleItem
                label="Yeni İlanlar"
                description="Aramalarınıza uygun ilanlar."
                checked={notifications.newListings}
                onChange={() => handleNotificationChange('newListings')}
                isDisabled={isAutoSaving}
              />
              <ToggleItem
                label="Fiyat İndirimi"
                description="Favorilerde fiyat düşünce."
                checked={notifications.priceDrops}
                onChange={() => handleNotificationChange('priceDrops')}
                isDisabled={isAutoSaving}
              />
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Gizlilik ve Hesap */}
        <div className="space-y-5">

          {/* Gizlilik Ayarları */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-50">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Gizlilik</h3>
                <p className="text-[10px] font-medium text-slate-400">Görünürlük ayarları</p>
              </div>
            </div>

            <div className="space-y-2">
              <ToggleItem
                label="Telefon No"
                description="İlanlarda telefon görünsün."
                checked={privacy.showPhone}
                onChange={() => handlePrivacyChange('showPhone')}
                isDisabled={isAutoSaving}
              />
              <ToggleItem
                label="E-posta"
                description="İlanlarda e-posta görünsün."
                checked={privacy.showEmail}
                onChange={() => handlePrivacyChange('showEmail')}
                isDisabled={isAutoSaving}
              />
            </div>
          </div>

          {/* Hesap Bölgesi */}
          <div className="bg-white border border-rose-100 shadow-sm rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hesap İşlemleri</h3>
                <p className="text-[10px] font-medium text-slate-400">Güvenlik ve çıkış</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 hover:bg-slate-100 transition-all group"
              >
                <LogOut className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                <span className="text-xs font-bold">Çıkış Yap</span>
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 hover:bg-rose-100 transition-all group"
              >
                <Trash2 className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                <span className="text-xs font-bold">Hesabı Sil</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Account Deactivation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="relative h-24 bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-lg translate-y-8">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-8 pt-12 pb-8 text-center space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Hesabınızı Silmek İstiyor Musunuz?</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Hesabınızı sildiğinizde sistemde pasif duruma geçecek ve tüm ilanlarınız yayından kaldırılacaktır. Bilgileriniz sistemde güvenli bir şekilde saklanmaya devam edecektir.
                </p>
              </div>

              {deleteError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-bold animate-in shake-in duration-300">
                  {deleteError}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    'Hesabı Silmeyi Onayla'
                  )}
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Toggle Item Bileşeni - Minimal Stil
 */
interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
  isDisabled?: boolean;
}

function ToggleItem({ label, description, checked, onChange, icon, isDisabled }: ToggleItemProps) {
  return (
    <div
      onClick={() => !isDisabled && onChange()}
      className={`group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${isDisabled ? 'cursor-wait opacity-80' : 'cursor-pointer'
        } ${checked
          ? 'bg-blue-50/50 border-blue-100'
          : 'bg-white border-transparent hover:bg-slate-50'
        }`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${checked ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
            }`}>
            {icon}
          </div>
        )}
        <div>
          <p className={`text-xs font-bold transition-colors ${checked ? 'text-blue-900' : 'text-slate-700'}`}>{label}</p>
          <p className="text-[10px] font-medium text-slate-400 leading-tight">{description}</p>
        </div>
      </div>

      <div className={`relative w-8 h-4.5 rounded-full transition-colors duration-300 ${checked ? 'bg-blue-600' : 'bg-slate-200'
        }`}>
        <div
          className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-4' : 'translate-x-0.5'
            }`}
        />
      </div>
    </div>
  );
}
