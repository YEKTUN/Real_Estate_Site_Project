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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      {/* Hero Section - Gradient Background */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <UserAvatar
                name={user.name}
                surname={user.surname}
                profilePictureUrl={user.profilePictureUrl}
                size="xl"
                className="relative w-32 h-32 ring-4 ring-white shadow-2xl"
              />
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                  {user.name} {user.surname}
                </h1>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                    <i className="fas fa-crown text-yellow-300"></i>
                    Yönetici
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {user.showEmail === true && user.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="group flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    <i className="fas fa-envelope group-hover:scale-110 transition-transform"></i>
                    <span className="font-medium">{user.email}</span>
                  </a>
                )}

                {user.showPhone === true && user.phone && (
                  <a
                    href={`tel:${user.phone}`}
                    className="group flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    <i className="fas fa-phone-alt group-hover:scale-110 transition-transform"></i>
                    <span className="font-medium">{user.phone}</span>
                  </a>
                )}

                {user.showEmail !== true && user.showPhone !== true && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-md rounded-xl text-white border border-amber-400/30">
                    <i className="fas fa-lock text-xs"></i>
                    <span className="text-sm font-medium">
                      {user.id === userId ? "Bilgileriniz gizli" : "İletişim bilgileri gizli"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-purple-400 rounded-2xl blur opacity-50"></div>
              <div className="relative bg-white rounded-2xl p-6 shadow-2xl min-w-[160px]">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-3">
                    <i className="fas fa-th-list text-white text-lg"></i>
                  </div>
                  <p className="text-3xl font-black text-gray-900 mb-1">{listings.length}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aktif İlan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Listings Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                <i className="fas fa-building text-indigo-500 mr-3"></i>
                İlanlar
              </h2>
              <p className="text-sm text-gray-500">Kullanıcının aktif emlak ilanları</p>
            </div>
            {listings.length > 0 && (
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg">
                {listings.length} İlan
              </div>
            )}
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <i className="fas fa-home text-gray-400 text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz İlan Yok</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Bu kullanıcının şu anda yayında olan ilanı bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => router.push(`/listing/${l.id}`)}
                  className="group text-left bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {l.coverImageUrl ? (
                      <img
                        src={l.coverImageUrl}
                        alt={l.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-image text-gray-300 text-4xl"></i>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-gray-700 shadow-lg">
                      #{l.listingNumber}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-gray-900 line-clamp-2 text-lg group-hover:text-indigo-600 transition-colors">
                      {l.title}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <i className="fas fa-map-marker-alt text-red-400"></i>
                      <span className="line-clamp-1">
                        {l.city} / {l.district}
                        {l.neighborhood ? ` - ${l.neighborhood}` : ''}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {formatPrice(l.price, l.type, l.currency)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


