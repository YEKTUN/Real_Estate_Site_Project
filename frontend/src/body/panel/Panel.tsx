'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Home,
  PlusCircle,
  Heart,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Bell,
  Layers,
  LayoutDashboard
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/body/redux/hooks';
import { selectUser, selectIsAuthenticated, selectIsLoading, logoutAsync } from '@/body/redux/slices/auth/AuthSlice';
import ProfileSection from '@/body/panel/components/ProfileSection';
import MyListings from './components/MyListings';
import CreateListing from '@/body/panel/components/CreateListing';
import FavoriteListings from '@/body/panel/components/FavoriteListings';
import Settings from '@/body/panel/components/Settings';
import Messages from '@/body/panel/components/Messages';
import { selectTotalUnread, fetchThreads } from '@/body/redux/slices/message/MessageSlice';
import UserAvatar from '@/body/panel/components/UserAvatar';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export default function Panel() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const totalUnread = useAppSelector(selectTotalUnread);

  const [activeMenu, setActiveMenu] = useState<string>('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems: MenuItem[] = [
    { id: 'profile', label: 'Profilim', icon: <User className="w-5 h-5" />, description: 'Kişisel bilgilerinizi yönetin' },
    { id: 'my-listings', label: 'İlanlarım', icon: <Home className="w-5 h-5" />, description: 'Aktif ve pasif ilanlarınız' },
    { id: 'create-listing', label: 'İlan Ver', icon: <PlusCircle className="w-5 h-5" />, description: 'Yeni bir ilan oluşturun' },
    { id: 'favorites', label: 'Favorilerim', icon: <Heart className="w-5 h-5" />, description: 'Beğendiğiniz ilanlar' },
    { id: 'messages', label: 'Mesajlarım', icon: <MessageSquare className="w-5 h-5" />, description: 'Mesajlar ve teklifler' },
    { id: 'settings', label: 'Ayarlar', icon: <SettingsIcon className="w-5 h-5" />, description: 'Hesap ve bildirim ayarları' },
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user) dispatch(fetchThreads());
  }, [isAuthenticated, user, dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutAsync()).unwrap();
    router.push('/login');
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'profile': return <ProfileSection />;
      case 'my-listings': return <MyListings />;
      case 'create-listing': return <CreateListing />;
      case 'favorites': return <FavoriteListings />;
      case 'messages': return <Messages />;
      case 'settings': return <Settings />;
      default: return <ProfileSection />;
    }
  };

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      {!isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transition-all duration-300 transform ${!isSidebarOpen ? 'translate-x-[calc(-100%)] lg:w-20' : 'translate-x-0'}`}
      >
        <div className="h-full flex flex-col p-4">
          {/* Logo Area */}
          <div className="flex items-center gap-3 px-2 mb-8 h-12">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">YEKTUN</h1>
                <p className="text-[9px] font-black text-blue-500 tracking-[0.2em] mt-1 uppercase">KULLANICI PANELİ</p>
              </div>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-auto p-2 hover:bg-gray-100 rounded-lg lg:flex hidden">
              {isSidebarOpen ? <X className="w-4 h-4 text-gray-400" /> : <Menu className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative ${activeMenu === item.id ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <div className={`shrink-0 transition-transform duration-300 ${activeMenu === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                {isSidebarOpen && (
                  <div className="text-left animate-in fade-in slide-in-from-left-2 grow">
                    <p className="text-[13px] font-black uppercase tracking-tight">{item.label}</p>
                  </div>
                )}
                {item.id === 'messages' && totalUnread > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute" />
                    <div className="w-2 h-2 bg-red-500 rounded-full relative" />
                  </div>
                )}
                {activeMenu === item.id && isSidebarOpen && <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>
            ))}
          </nav>

          {/* User Profile (Sidebar Bottom) */}
          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className={`flex items-center gap-3 p-2 rounded-2xl bg-gray-50/50 mb-3 ${!isSidebarOpen && 'justify-center'}`}>
              <UserAvatar name={user.name} surname={user.surname} profilePictureUrl={user.profilePictureUrl} size="md" />
              {isSidebarOpen && (
                <div className="grow truncate animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-sm font-black text-gray-900 uppercase truncate">{user.name} {user.surname}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{user.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all ${!isSidebarOpen && 'justify-center'}`}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-[13px] font-black uppercase tracking-tight animate-in fade-in slide-in-from-left-2">OTURUMU KAPAT</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar (Content Only) */}
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                {menuItems.find(i => i.id === activeMenu)?.label}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                {menuItems.find(i => i.id === activeMenu)?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors group">
              <Bell className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
            </button>
            <div className="w-px h-6 bg-gray-100 mx-2" />
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
            >
              <Home className="w-3.5 h-3.5" /> SİTEYE DÖN
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth grow">
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Summary Widget (Example) */}
            {activeMenu === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">0</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AKTİF İLANLAR</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-red-100 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">0</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FAVORİLER</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-purple-100 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-900">{totalUnread}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">YENİ MESAJLAR</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
