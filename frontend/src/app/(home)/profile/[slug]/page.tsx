'use client';

import { useParams } from 'next/navigation';
import { UserProfilePage } from '@/body/profile/UserProfilePage';

/**
 * Genel Kullanıcı Profil Sayfası Route'u
 *
 * /profile/[slug] -> slug burada userId olarak kullanılacak.
 */
export default function ProfileSlugPage() {
  const params = useParams<{ slug?: string }>();
  const userId = params?.slug ?? '';

  if (!userId) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-5 max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold text-red-700">Geçersiz profil bilgisi</h1>
          <p className="text-sm text-red-600">
            Profil adresi hatalı görünüyor. Lütfen bağlantıyı kontrol edin.
          </p>
        </div>
      </div>
    );
  }

  return <UserProfilePage userId={userId} />;
}


