'use client';

import { useState } from 'react';

/**
 * Kullanıcı Avatar Bileşeni
 * 
 * Profil resmi varsa gösterir, yoksa kullanıcının baş harflerini içeren
 * renkli bir avatar gösterir.
 * 
 * @param name - Kullanıcının adı
 * @param surname - Kullanıcının soyadı
 * @param profilePictureUrl - Profil resmi URL'i (opsiyonel)
 * @param size - Avatar boyutu (varsayılan: 'md')
 */

interface UserAvatarProps {
  name: string;
  surname: string;
  profilePictureUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export default function UserAvatar({
  name,
  surname,
  profilePictureUrl,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  // Baş harfleri oluştur
  const initials = `${name?.charAt(0)?.toUpperCase() || ''}${surname?.charAt(0)?.toUpperCase() || ''}`;

  // Resim yükleme hatası durumunu takip et
  const [imageError, setImageError] = useState(false);

  // Profil resmi varsa ve hata yoksa göster
  if (profilePictureUrl && !imageError) {
    return (
      <img
        src={profilePictureUrl}
        alt={`${name} ${surname}`}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={() => {
          // Resim yüklenemezse baş harf avatarına geç
          console.log('Profil resmi yüklenemedi, baş harf avatarı gösteriliyor:', profilePictureUrl);
          setImageError(true);
        }}
      />
    );
  }

  // Profil resmi yoksa veya hata varsa baş harf avatarı yerine placeholder görsel göster
  return (
    <img
      src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
      alt={`${name} ${surname}`}
      className={`${sizeClasses[size]} rounded-full object-cover opacity-80 shadow-sm ${className}`}
      title={`${name} ${surname}`}
    />
  );
}

