'use client';

import { useState, useMemo, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/body/redux/hooks';
import { selectUser, updateProfilePicture } from '@/body/redux/slices/auth/AuthSlice';
import { uploadFile, selectIsUploadingFile } from '@/body/redux/slices/cloudinary/CloudinarySlice';
import { changePasswordApi } from '@/body/redux/api/authApi';
import { sanitizePhoneInput, formatPhone, getPhoneError } from '@/body/auth/utils/validation';
import UserAvatar from '@/body/panel/components/UserAvatar';
import PhoneVerificationModal from '@/body/components/PhoneVerificationModal';

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

  // Phone verification modal
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState<boolean>(false);
  const [phoneToVerify, setPhoneToVerify] = useState<string>('');
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);

  /**
   * Form değişikliği handler
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Telefon alanı için sadece rakam kabul et
    if (name === 'phone') {
      const sanitizedValue = sanitizePhoneInput(value);
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  /**
   * Form submit handler
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Telefon numarası değişmiş mi kontrol et
    const phoneChanged = formData.phone !== displayPhone;

    if (phoneChanged) {
      // Telefon değişmişse önce doğrulama yap
      const phoneError = getPhoneError(formData.phone);
      if (phoneError) {
        setMessage({ type: 'error', text: phoneError });
        return;
      }

      // Doğrulama modalını aç
      setPhoneToVerify(formData.phone);
      setIsPhoneModalOpen(true);
      return;
    }

    // Telefon değişmemişse direkt kaydet
    await saveProfile();
  };

  /**
   * Profil kaydetme fonksiyonu
   */
  const saveProfile = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Telefon numarası zaten backend'de doğrulama sırasında kaydedildi
      // Diğer profil bilgileri için API çağrısı yapılabilir (ad, soyad vb.)
      console.log('Profile güncelleme:', formData);

      // Başarı mesajı göster
      setMessage({ type: 'success', text: 'Telefon numaranız başarıyla güncellendi!' });
      setIsEditing(false);
      setIsPhoneVerified(false); // Reset verification state
    } catch (error) {
      console.error('Profile güncelleme hatası:', error);
      setMessage({ type: 'error', text: 'Profil güncellenirken bir hata oluştu.' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Telefon doğrulama başarılı olduğunda
   */
  const handlePhoneVerificationSuccess = async () => {
    setIsPhoneVerified(true);
    setIsPhoneModalOpen(false);

    // Doğrulama başarılı, profili kaydet
    await saveProfile();
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
    <>
      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={handlePhoneVerificationSuccess}
        initialPhone={phoneToVerify}
      />

      <div className="space-y-8">
        {/* Mesaj */}
        {message && (
          <div
            className={`px-4 py-2.5 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-700 border border-red-100'
              }`}
          >
            <span className="text-lg">{message.type === 'success' ? '✅' : '❌'}</span>
            <p className="text-xs font-bold leading-none">{message.text}</p>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-[10px] font-black opacity-40 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Profil Fotoğrafı & Kişisel Bilgiler Merge */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-50">
            {/* Photos Side */}
            <div className="p-6 md:w-1/3 flex flex-col items-center justify-center bg-gray-50/50">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="relative group mb-4"
              >
                <UserAvatar
                  name={displayName || 'Kullanıcı'}
                  surname={displaySurname || ''}
                  profilePictureUrl={user?.profilePictureUrl}
                  size="xl"
                  className="shadow-xl ring-4 ring-white"
                />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-black uppercase tracking-widest transition-all duration-300 backdrop-blur-[2px]">
                  DEĞİŞTİR
                </div>
              </button>
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
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {isUploading ? 'YÜKLENİYOR...' : 'YENİ FOTOĞRAF'}
              </button>
              <p className="text-[9px] font-bold text-gray-400 mt-3 uppercase tracking-tighter text-center max-w-[140px]">
                JPG, PNG VEYA GIF. MAX 5MB.
              </p>
            </div>

            {/* Form Side */}
            <div className="p-6 flex-1">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Kişisel Bilgiler</h3>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest"
                  >
                    DÜZENLE
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">AD</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold outline-none transition-all ${isEditing ? 'bg-white border-2 border-blue-50 focus:border-blue-500 shadow-sm' : 'bg-gray-100/50 border-2 border-transparent text-gray-500'
                        }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">SOYAD</label>
                    <input
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold outline-none transition-all ${isEditing ? 'bg-white border-2 border-blue-50 focus:border-blue-500 shadow-sm' : 'bg-gray-100/50 border-2 border-transparent text-gray-500'
                        }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-POSTA</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-gray-100/50 border-2 border-transparent text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">TELEFON</label>
                    <input
                      type="tel"
                      name="phone"
                      value={isEditing ? formData.phone : formatPhone(formData.phone)}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="05xx-xxx-xx-xx"
                      className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold outline-none transition-all ${isEditing ? 'bg-white border-2 border-blue-50 focus:border-blue-500 shadow-sm' : 'bg-gray-100/50 border-2 border-transparent text-gray-500'
                        }`}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-gray-50">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                    >
                      {isLoading ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      İPTAL
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Şifre Değiştirme */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 overflow-hidden">
            <ChangePasswordSection />
          </div>

          {/* Hesap Bilgileri */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Hesap Durumu</h3>
            <div className="space-y-3">
              {[
                { label: 'ÜYELİK TARİHİ', value: '-' },
                { label: 'SON GİRİŞ', value: 'ŞİMDİ' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-[9px] font-black text-gray-400 tracking-widest leading-none">{item.label}</span>
                  <span className="text-[10px] font-black text-gray-800 leading-none">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2">
                <span className="text-[9px] font-black text-gray-400 tracking-widest leading-none">DURUM</span>
                <span className={`px-2 py-1 text-[8px] font-black rounded-full tracking-widest leading-none uppercase ${user?.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {user?.isActive ? 'AKTİF' : 'PASİF'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Şifre İşlemleri</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest"
          >
            ŞİFRE DEĞİŞTİR
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-lg shadow-sm">🔐</div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">GÜVENLİĞİNİZ İÇİN ŞİFRENİZİ DÜZENLİ OLARAK GÜNCELLEYİN.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-3">
            {[
              { id: 'currentPassword', label: 'MEVCUT ŞİFRE', show: showPasswords.current, toggle: 'current' },
              { id: 'newPassword', label: 'YENİ ŞİFRE', show: showPasswords.new, toggle: 'new', hint: 'EN AZ 8 KARAKTER' },
              { id: 'confirmPassword', label: 'YENİ ŞİFRE TEKRAR', show: showPasswords.confirm, toggle: 'confirm' }
            ].map((field) => (
              <div key={field.id}>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.show ? 'text' : 'password'}
                    name={field.id}
                    value={(formData as any)[field.id]}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-white border-2 border-blue-50 focus:border-blue-500 rounded-xl text-xs font-bold outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, [field.toggle]: !(prev as any)[field.toggle] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {field.show ? '🙈' : '👁️'}
                  </button>
                </div>
                {field.hint && <p className="text-[8px] font-black text-blue-400 mt-1 uppercase tracking-tighter ml-1">{field.hint}</p>}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 disabled:opacity-50">
              {isLoading ? 'DEĞİŞTİRİLİYOR...' : 'ŞİFREYİ GÜNCELLE'}
            </button>
            <button onClick={handleCancel} type="button" className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">İPTAL</button>
          </div>
        </form>
      )}
    </div>
  );
}
