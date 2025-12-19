'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/body/redux/hooks';
import { selectUser, selectIsAuthenticated, selectIsLoading, logoutAsync } from '@/body/redux/slices/auth/AuthSlice';
import ProfileSection from '@/body/panel/components/ProfileSection';
import MyListings from './components/MyListings';
import CreateListing from '@/body/panel/components/CreateListing';
import FavoriteListings from '@/body/panel/components/FavoriteListings';
import Settings from '@/body/panel/components/Settings';
import Messages from '@/body/panel/components/Messages';
import { selectTotalUnread } from '@/body/redux/slices/message/MessageSlice';
import UserAvatar from '@/body/panel/components/UserAvatar';

/**
 * Panel Ana Bileşeni
 * 
 * Kullanıcı paneli ana yapısı:
 * - Sidebar: Navigasyon menüsü
 * - Content: Seçilen bölümün içeriği
 * 
 * Bölümler:
 * - Profil: Kullanıcı bilgileri düzenleme
 * - İlanlarım: Kullanıcının ilanları
 * - İlan Ver: Yeni ilan oluşturma
 * - Favorilerim: Favori ilanlar
 * - Ayarlar: Hesap ayarları
 */

// Panel menü öğeleri tipi
interface MenuItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}

// Menü öğeleri
const menuItems: MenuItem[] = [
  {
    id: 'profile',
    label: 'Profilim',
    icon: '👤',
    description: 'Kişisel bilgilerinizi düzenleyin',
  },
  {
    id: 'my-listings',
    label: 'İlanlarım',
    icon: '🏠',
    description: 'İlanlarınızı yönetin',
  },
  {
    id: 'create-listing',
    label: 'İlan Ver',
    icon: '➕',
    description: 'Yeni ilan oluşturun',
  },
  {
    id: 'favorites',
    label: 'Favorilerim',
    icon: '❤️',
    description: 'Favori ilanlarınız',
  },
  {
    id: 'messages',
    label: 'Mesajlarım',
    icon: '💬',
    description: 'Gelen mesaj ve teklifler',
  },
  {
    id: 'settings',
    label: 'Ayarlar',
    icon: '⚙️',
    description: 'Hesap ayarları',
  },
];

// Türkçe karakterlerde encoding bozulmalarını düzeltmek için yardımcı fonksiyon
const fixEncoding = (value?: string | null) => {
  if (!value) return '';
  try {
    // Eğer UTF-8 string Latin1 olarak çözülmüşse, yeniden kodlayıp çöz
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
};

export default function Panel() {
  // Router ve dispatch
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const totalUnread = useAppSelector(selectTotalUnread);

  // Aktif menü
  const [activeMenu, setActiveMenu] = useState<string>('profile');

  // Sidebar collapse durumu (mobil için)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Kullanıcı bilgilerini encoding sorunu olmadan göstermek için normalize et
  const displayName = useMemo(
    () => `${fixEncoding(user?.name)} ${fixEncoding(user?.surname)}`.trim(),
    [user?.name, user?.surname]
  );
  const displayEmail = useMemo(() => fixEncoding(user?.email), [user?.email]);
  const displayInitial = useMemo(() => {
    const source = fixEncoding(user?.name || user?.email || '?');
    return source.charAt(0).toUpperCase() || '?';
  }, [user?.name, user?.email]);

  /**
   * Çıkış yap handler
   */
  const handleLogout = async () => {
    try {
      console.log('Panel: Çıkış yapılıyor...');
      await dispatch(logoutAsync()).unwrap();
      router.push('/login');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      // Hata olsa bile login'e yönlendir
      router.push('/login');
    }
  };

  // Auth kontrolü - giriş yapmamış kullanıcıları yönlendir
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('Panel: Kullanıcı giriş yapmamış, login sayfasına yönlendiriliyor...');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  /**
   * Aktif menüye göre içerik render et
   */
  const renderContent = () => {
    switch (activeMenu) {
      case 'profile':
        return <ProfileSection />;
      case 'my-listings':
        return <MyListings />;
      case 'create-listing':
        return <CreateListing />;
      case 'favorites':
        return <FavoriteListings />;
      case 'messages':
        return <Messages />;
      case 'settings':
        return <Settings />;
      default:
        return <ProfileSection />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Auth check - kullanıcı yoksa null döndür (yönlendirme useEffect'te)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Yönlendiriliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Panel Container */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={user.name}
              surname={user.surname}
              profilePictureUrl={user.profilePictureUrl}
              size="lg"
              className="shadow-md ring-2 ring-blue-500/40"
            />
            <div>
              <h2 className="font-semibold text-gray-800">{displayName}</h2>
              <p className="text-sm text-gray-500">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-2xl">{isSidebarCollapsed ? '☰' : '✕'}</span>
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`
            lg:w-80 bg-white rounded-2xl shadow-lg overflow-hidden
            ${isSidebarCollapsed ? 'hidden' : 'block'} lg:block
            transition-all duration-300
          `}
        >
          {/* User Info - Desktop */}
          <div className="hidden lg:block p-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={user.name}
                surname={user.surname}
                profilePictureUrl={user.profilePictureUrl}
                size="xl"
                className="border-2 border-white/70 shadow-xl"
              />
              <div>
                <h2 className="text-xl font-bold">{displayName}</h2>
                <p className="text-blue-100 text-sm">{displayEmail}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 flex gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-lg">0</p>
                <p className="text-blue-100">İlan</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">0</p>
                <p className="text-blue-100">Favori</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">0</p>
                <p className="text-blue-100">Mesaj</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveMenu(item.id);
                      setIsSidebarCollapsed(true); // Mobilde menü seçince kapat
                    }}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${
                        activeMenu === item.id
                          ? 'bg-blue-50 text-blue-600 shadow-sm'
                          : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <span className="text-2xl relative inline-block">
                      {item.icon}
                      {item.id === 'messages' && totalUnread > 0 && (
                        <>
                          <span
                            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white"
                            aria-hidden="true"
                          />
                          <span
                            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 opacity-75 animate-ping"
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </span>
                    <div className="text-left">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                    {activeMenu === item.id && (
                      <span className="ml-auto text-blue-600">→</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <span className="text-2xl">🚪</span>
              <div className="text-left">
                <p className="font-semibold">Çıkış Yap</p>
                <p className="text-xs text-gray-500">Hesabınızdan çıkın</p>
              </div>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white rounded-2xl shadow-lg p-6 lg:p-8">
          {/* Content Header */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              {menuItems.find((item) => item.id === activeMenu)?.label}
            </h1>
            <p className="text-gray-500 mt-1">
              {menuItems.find((item) => item.id === activeMenu)?.description}
            </p>
          </div>

          {/* Dynamic Content */}
          <div className="animate-fadeIn">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
