'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserByIdApi } from '@/body/redux/api/authApi';
import { getListingsByUserApi } from '@/body/redux/api/listingApi';
import type { UserDto } from '@/body/redux/slices/auth/DTOs/AuthDTOs';
import type { ListingListDto } from '@/body/redux/slices/listing/DTOs/ListingDTOs';
import UserAvatar from '@/body/panel/components/UserAvatar';
import { formatPrice } from '@/body/listing/components/formatPrice';

interface UserProfilePageProps {
  userId: string;
}

/**
 * Kullanıcı Profil Sayfası (Genel Profil)
 *
 * - Kullanıcı temel bilgileri (isim, e‑posta, telefon, profil fotoğrafı)
 * - Kullanıcının ilanları (varsa)
 *
 * Bu bileşen, dinamik route üzerinden ( /profile/[userId] ) çağrılır.
 */
export function UserProfilePage({ userId }: UserProfilePageProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserDto | null>(null);
  const [listings, setListings] = useState<ListingListDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (!user) return '';
    return `${user.name} ${user.surname}`.trim();
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('UserProfilePage: Profil yükleniyor', { userId });

        // Kullanıcı bilgilerini getir
        const userRes = await getUserByIdApi(userId);
        console.log('UserProfilePage: getUserByIdApi yanıtı', userRes);

        if (!userRes.success || !userRes.user) {
          if (!isMounted) return;
          setError(userRes.message || 'Kullanıcı bilgileri getirilemedi');
          setIsLoading(false);
          return;
        }

        // İlanları getir
        const listingsRes = await getListingsByUserApi(userId, 1, 20);
        console.log('UserProfilePage: getListingsByUserApi yanıtı', listingsRes);

        if (!isMounted) return;
        setUser(userRes.user);
        setListings(listingsRes.listings || []);
      } catch (err) {
        console.error('UserProfilePage: Profil yüklenirken hata', err);
        if (!isMounted) return;
        setError('Profil yüklenirken bir hata oluştu');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-gray-600 text-sm">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-5 max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold text-red-700">Profil yüklenemedi</h1>
          <p className="text-sm text-red-600">
            {error || 'Kullanıcı bilgileri bulunamadı.'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profil Başlığı */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={user.name}
            surname={user.surname}
            profilePictureUrl={user.profilePictureUrl}
            size="xl"
            className="shadow-lg ring-2 ring-indigo-500/40"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-600">{user.email}</p>
            {user.phone && (
              <p className="text-sm text-gray-600 mt-1">Telefon: {user.phone}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold">
            Toplam İlan: {listings.length}
          </div>
        </div>
      </section>

      {/* Kullanıcının İlanları */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Kullanıcının İlanları</h2>
          {listings.length > 0 && (
            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
              {listings.length} ilan
            </span>
          )}
        </div>

        {listings.length === 0 ? (
          <p className="text-sm text-gray-600">
            Bu kullanıcının şu anda yayında olan ilanı bulunmuyor.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => router.push(`/listing/${l.id}`)}
                className="group text-left bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  {l.coverImageUrl ? (
                    <img
                      src={l.coverImageUrl}
                      alt={l.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Görsel yok
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{l.title}</h3>
                  <p className="text-sm text-gray-500">
                    {l.city} / {l.district}
                    {l.neighborhood ? ` - ${l.neighborhood}` : ''}
                  </p>
                  <p className="text-sm font-semibold text-indigo-700">
                    {formatPrice(l.price, l.type, l.currency)}
                  </p>
                  <p className="text-xs text-gray-400">
                    İlan No: {l.listingNumber}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


