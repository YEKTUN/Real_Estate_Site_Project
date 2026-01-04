'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  Building2,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Settings as SettingsIcon,
  Tag,
  MapPin,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/body/components/ui/accordion';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/body/components/ui/pagination';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import { selectIsAuthenticated, selectIsLoading, selectUser, logoutAsync } from '@/body/redux/slices/auth/AuthSlice';
import {
  approveListing,
  fetchAdminListings,
  rejectListing,
  reopenListing,
  selectAdminError,
  selectAdminFilters,
  selectAdminListings,
  selectAdminLoading,
  selectAdminPagination,
  selectAdminUpdating,
  setFilters,
  updateListingStatus,
} from '@/body/redux/slices/admin/AdminListingSlice';
import { ListingListDto, ListingStatus, ListingCategory, ListingType, PropertyType } from '@/body/redux/slices/listing/DTOs/ListingDTOs';
import {
  AdminListingFilter,
  AdminModerationRuleDto,
  getAdminListingByNumberApi,
  getAdminModerationRuleApi,
  saveAdminModerationRuleApi,
  findUserByEmailApi,
  toggleAdminUserStatusApi,
} from '@/body/redux/api/adminApi';
import { ListingResponseDto } from '@/body/redux/slices/listing/DTOs/ListingDTOs';
import { UserDto } from '@/body/redux/slices/auth/DTOs/AuthDTOs';

type AdminModerationRules = AdminListingFilter & {
  blockedKeywords?: string[];
  isAutomataEnabled?: boolean;
};

const statusLabels: Record<ListingStatus, string> = {
  [ListingStatus.Pending]: 'Onay Bekliyor',
  [ListingStatus.Active]: 'Aktif',
  [ListingStatus.Inactive]: 'Pasif',
  [ListingStatus.Sold]: 'Satıldı',
  [ListingStatus.Rented]: 'Kiralandı',
  [ListingStatus.Rejected]: 'Reddedildi',
  [ListingStatus.Expired]: 'Süresi Doldu',
};

const statusBadges: Record<ListingStatus, string> = {
  [ListingStatus.Pending]: 'bg-amber-100/80 text-amber-800 ring-amber-200/50 backdrop-blur-sm',
  [ListingStatus.Active]: 'bg-emerald-100/80 text-emerald-800 ring-emerald-200/50 backdrop-blur-sm',
  [ListingStatus.Inactive]: 'bg-slate-100/80 text-slate-700 ring-slate-200/50 backdrop-blur-sm',
  [ListingStatus.Sold]: 'bg-blue-100/80 text-blue-800 ring-blue-200/50 backdrop-blur-sm',
  [ListingStatus.Rented]: 'bg-indigo-100/80 text-indigo-800 ring-indigo-200/50 backdrop-blur-sm',
  [ListingStatus.Rejected]: 'bg-rose-100/80 text-rose-800 ring-rose-200/50 backdrop-blur-sm',
  [ListingStatus.Expired]: 'bg-orange-100/80 text-orange-800 ring-orange-200/50 backdrop-blur-sm',
};

const categoryLabels: Record<ListingCategory, string> = {
  [ListingCategory.Residential]: 'Konut',
  [ListingCategory.Commercial]: 'İşyeri',
  [ListingCategory.Land]: 'Arsa',
  [ListingCategory.Building]: 'Bina',
  [ListingCategory.TouristicFacility]: 'Turistik Tesis',
  [ListingCategory.TimeShare]: 'Time Share',
};

const typeLabels: Record<ListingType, string> = {
  [ListingType.ForSale]: 'Satılık',
  [ListingType.ForRent]: 'Kiralık',
  [ListingType.DailyRent]: 'Günlük Kiralık',
  [ListingType.Swap]: 'Takas',
};

const propertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.Apartment]: 'Daire',
  [PropertyType.Residence]: 'Rezidans',
  [PropertyType.Villa]: 'Villa',
  [PropertyType.Farmhouse]: 'Çiftlik Evi',
  [PropertyType.Mansion]: 'Köşk',
  [PropertyType.WaterSideHouse]: 'Sahil Evi',
  [PropertyType.SummerHouse]: 'Yazlık',
  [PropertyType.Cooperative]: 'Kooperatif',
  [PropertyType.Prefabricated]: 'Prefabrik',
  [PropertyType.Detached]: 'Müstakil Ev',
};

export default function AdminPanel() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAuthLoading = useAppSelector(selectIsLoading);

  const listings = useAppSelector(selectAdminListings);
  const filters = useAppSelector(selectAdminFilters);
  const isLoading = useAppSelector(selectAdminLoading);
  const isUpdating = useAppSelector(selectAdminUpdating);
  const error = useAppSelector(selectAdminError);

  const [localFilters, setLocalFilters] = useState<AdminListingFilter>(filters);
  const [adminModerationRules, setAdminModerationRules] = useState<AdminModerationRules>({
    isAutomataEnabled: false,
  });
  const [isAutoProcessing, setIsAutoProcessing] = useState<boolean>(false);
  const [isRuleLoading, setIsRuleLoading] = useState<boolean>(false);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [blockedInput, setBlockedInput] = useState<string>('');
  const [selectedListing, setSelectedListing] = useState<ListingResponseDto | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Mesaj gönderme modal state'leri
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | 'activate' | 'revoke' | null;
    listingId: number | null;
    listingTitle: string;
  }>({
    isOpen: false,
    action: null,
    listingId: null,
    listingTitle: '',
  });
  const [messageType, setMessageType] = useState<'auto' | 'custom'>('auto');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');

  // Kullanıcı yönetimi state'leri
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [searchedUser, setSearchedUser] = useState<UserDto | null>(null);
  const [isUserSearching, setIsUserSearching] = useState<boolean>(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false);

  // Admin moderasyon kurallarını backend'den yükle
  useEffect(() => {
    const loadRules = async () => {
      setIsRuleLoading(true);
      setRuleError(null);
      try {
        const result = await getAdminModerationRuleApi();
        if (result) {
          setAdminModerationRules({
            blockedKeywords: result.blockedKeywords ?? [],
            isAutomataEnabled: result.isAutomataEnabled,
          });
        }
      } catch (err) {
        console.error('Admin moderasyon kuralı yükleme hatası', err);
        setRuleError('Admin moderasyon kuralı yüklenemedi');
      } finally {
        setIsRuleLoading(false);
      }
    };
    loadRules();
  }, []);

  // Middleware handles initial redirect, but keep this for mid-session changes
  useEffect(() => {
    if (isAuthenticated && user && !user.isAdmin) {
      router.push('/');
    }
  }, [isAuthenticated, router, user]);

  useEffect(() => {
    if (user?.isAdmin) {
      dispatch(fetchAdminListings(undefined));
    }
  }, [dispatch, user?.isAdmin]);

  const handleRefresh = () => {
    dispatch(fetchAdminListings(undefined));
  };

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof AdminListingFilter, value: unknown) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRuleChange = (key: keyof AdminModerationRules, value: unknown) => {
    setAdminModerationRules((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddBlockedKeyword = () => {
    const keyword = blockedInput.trim();
    if (!keyword) return;
    setAdminModerationRules((prev) => ({
      ...prev,
      blockedKeywords: [...(prev.blockedKeywords ?? []), keyword],
    }));
    setBlockedInput('');
    setRuleError(null);
  };

  const handleRemoveBlockedKeyword = (keyword: string) => {
    setAdminModerationRules((prev) => ({
      ...prev,
      blockedKeywords: (prev.blockedKeywords ?? []).filter((k) => k !== keyword),
    }));
  };

  const handleSearch = async () => {
    const searchTerm = localFilters.searchTerm?.trim();
    if (searchTerm && /^\d{6,}$/.test(searchTerm)) {
      setIsDetailLoading(true);
      setSelectedListing(null);
      try {
        const result = await getAdminListingByNumberApi(searchTerm);
        if (result.success && result.listing) {
          setSelectedListing(result);
          setLocalFilters({ ...localFilters, searchTerm: '' });
        } else {
          alert(result.message || 'İlan bulunamadı');
        }
      } catch (error) {
        console.error('İlan detay getirme hatası:', error);
        alert('İlan detayları getirilirken bir hata oluştu');
      } finally {
        setIsDetailLoading(false);
      }
      return;
    }
    dispatch(setFilters(localFilters));
    dispatch(fetchAdminListings(localFilters));
  };

  const openMessageModal = (action: 'approve' | 'reject' | 'activate' | 'revoke', listingId: number, listingTitle: string) => {
    setMessageModal({ isOpen: true, action, listingId, listingTitle });
    setMessageType('auto');
    setCustomMessage('');
  };

  const closeMessageModal = () => {
    setMessageModal({ isOpen: false, action: null, listingId: null, listingTitle: '' });
    setMessageType('auto');
    setCustomMessage('');
  };

  const getAutoMessage = (action: 'approve' | 'reject' | 'activate' | 'revoke'): string => {
    switch (action) {
      case 'approve': return 'İlanınız incelendi ve onaylandı. Artık yayında!';
      case 'reject': return 'İlanınız incelendi ancak site kurallarına uygun olmadığı için reddedildi. Lütfen ilan detaylarını kontrol edip tekrar deneyin.';
      case 'activate': return 'İlanınız yeniden yayına alındı.';
      case 'revoke': return 'İlanınız yayından kaldırıldı.';
      default: return '';
    }
  };

  const handleActionWithMessage = async () => {
    if (!messageModal.listingId || !messageModal.action) return;
    const message = messageType === 'auto' ? getAutoMessage(messageModal.action) : customMessage;
    if (messageType === 'custom' && !customMessage.trim()) {
      alert('Lütfen bir mesaj yazın veya otomatik mesaj seçeneğini kullanın.');
      return;
    }
    closeMessageModal();
    try {
      switch (messageModal.action) {
        case 'approve': await handleApproveAction(messageModal.listingId, message); break;
        case 'reject': await handleRejectAction(messageModal.listingId, message); break;
        case 'activate': await handleActivateAction(messageModal.listingId, message); break;
        case 'revoke': await handleRevokeAction(messageModal.listingId, message); break;
      }
    } catch (error: any) {
      alert(`İşlem sırasında hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
    }
  };

  const handleApproveAction = async (listingId: number, message: string) => {
    await dispatch(approveListing({ listingId, auto: false })).unwrap();
    dispatch(fetchAdminListings(undefined));
    if (selectedListing?.listing) {
      const refreshResult = await getAdminListingByNumberApi(selectedListing.listing.listingNumber);
      if (refreshResult.success && refreshResult.listing) setSelectedListing(refreshResult);
    }
  };

  const handleRejectAction = async (listingId: number, message: string) => {
    await dispatch(rejectListing({ listingId, note: message })).unwrap();
    dispatch(fetchAdminListings(undefined));
    if (selectedListing?.listing) {
      const refreshResult = await getAdminListingByNumberApi(selectedListing.listing.listingNumber);
      if (refreshResult.success && refreshResult.listing) setSelectedListing(refreshResult);
    }
  };

  const handleActivateAction = async (listingId: number, message: string) => {
    await dispatch(updateListingStatus({ listingId, status: ListingStatus.Active })).unwrap();
    if (selectedListing?.listing) {
      const refreshResult = await getAdminListingByNumberApi(selectedListing.listing.listingNumber);
      if (refreshResult.success && refreshResult.listing) setSelectedListing(refreshResult);
    }
    dispatch(fetchAdminListings(undefined));
  };

  const handleRevokeAction = async (listingId: number, message: string) => {
    await dispatch(updateListingStatus({ listingId, status: ListingStatus.Inactive })).unwrap();
    if (selectedListing?.listing) {
      const refreshResult = await getAdminListingByNumberApi(selectedListing.listing.listingNumber);
      if (refreshResult.success && refreshResult.listing) setSelectedListing(refreshResult);
    }
    dispatch(fetchAdminListings(undefined));
  };

  const handleApprove = async (listingId: number, listingTitle: string = 'Bu ilan') => {
    openMessageModal('approve', listingId, listingTitle);
  };

  const handleReject = async (listingId: number, listingTitle: string = 'Bu ilan') => {
    openMessageModal('reject', listingId, listingTitle);
  };

  const handleReopen = async (listingId: number) => {
    if (confirm('Bu ilanı tekrar açmak istediğinizden emin misiniz?')) {
      try {
        await dispatch(reopenListing({ listingId })).unwrap();
        dispatch(fetchAdminListings(undefined));
      } catch (error: any) {
        alert(`İlan tekrar açılırken hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
      }
    }
  };

  const handleRevokeApproval = async (listingId: number, listingTitle: string = 'Bu ilan') => {
    openMessageModal('revoke', listingId, listingTitle);
  };

  const handleActivateListing = async (listingId: number, listingTitle: string = 'Bu ilan') => {
    openMessageModal('activate', listingId, listingTitle);
  };

  const handleLogout = async () => {
    await dispatch(logoutAsync()).unwrap();
    router.push('/login');
  };

  const handleUserSearch = async () => {
    const term = userSearchTerm.trim().toLowerCase();
    if (!term) {
      setUserSearchError('Lütfen bir e-posta adresi girin');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(term)) {
      setUserSearchError('Geçerli bir e-posta adresi girin');
      return;
    }

    setIsUserSearching(true);
    setUserSearchError(null);
    setSearchedUser(null);

    try {
      console.log('🔍 Kullanıcı aranıyor:', term);
      const response = await findUserByEmailApi(term);
      console.log('📥 API yanıtı:', response);

      if (response.success && response.user) {
        setSearchedUser(response.user);
        setUserSearchError(null);
        console.log('✅ Kullanıcı bulundu:', response.user);
      } else {
        const errorMsg = response.message || 'Kullanıcı bulunamadı';
        setUserSearchError(errorMsg);
        console.log('❌ Kullanıcı bulunamadı:', errorMsg);
      }
    } catch (err: any) {
      console.error('❌ Kullanıcı arama hatası:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Arama sırasında bir hata oluştu';
      setUserSearchError(errorMessage);
    } finally {
      setIsUserSearching(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!searchedUser) {
      console.warn('⚠️ Toggle çağrıldı ama searchedUser null');
      return;
    }

    // Kullanıcıya onay sor
    const action = searchedUser.isActive ? 'pasif' : 'aktif';
    const confirmMessage = `${searchedUser.name} ${searchedUser.surname} (${searchedUser.email}) kullanıcısını ${action} yapmak istediğinizden emin misiniz?`;

    if (!confirm(confirmMessage)) {
      console.log('🚫 Kullanıcı işlemi iptal etti');
      return;
    }

    setIsTogglingStatus(true);
    console.log('🔄 Kullanıcı durumu değiştiriliyor:', {
      userId: searchedUser.id,
      currentStatus: searchedUser.isActive,
      targetStatus: !searchedUser.isActive
    });

    try {
      const response = await toggleAdminUserStatusApi(searchedUser.id);
      console.log('📥 Toggle API yanıtı:', response);

      if (response.success && response.user) {
        // State'i güncelle
        setSearchedUser(response.user);

        // Başarı mesajı
        const statusText = response.user.isActive ? 'aktif' : 'pasif';
        alert(`✅ ${response.message || `Kullanıcı başarıyla ${statusText} yapıldı`}`);

        console.log('✅ Kullanıcı durumu güncellendi:', response.user);

        // Eğer ilanlar da pasif olduysa ana listeyi yenileyelim
        if (!response.user.isActive) {
          console.log('📋 Kullanıcı pasif yapıldı, ilanlar yenileniyor...');
          dispatch(fetchAdminListings(undefined));
        }
      } else {
        const errorMsg = response.message || 'Durum güncellenirken hata oluştu';
        alert(`❌ ${errorMsg}`);
        console.error('❌ Toggle başarısız:', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'İşlem sırasında bir hata oluştu';
      alert(`❌ ${errorMsg}`);
      console.error('❌ Toggle hatası:', err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleSaveRules = async () => {
    setIsRuleLoading(true);
    setRuleError(null);
    try {
      const payload: AdminModerationRuleDto = {
        isAutomataEnabled: adminModerationRules.isAutomataEnabled ?? false,
        blockedKeywords: adminModerationRules.blockedKeywords,
      };
      const saved = await saveAdminModerationRuleApi(payload);
      setAdminModerationRules({ ...adminModerationRules, ...saved });
      if (saved.isAutomataEnabled) {
        setIsAutoProcessing(true);
        dispatch(fetchAdminListings(undefined));
        setIsAutoProcessing(false);
        alert('Kurallar kaydedildi ve otomatik onaylama sistemi aktif edildi.');
      } else {
        alert('Kurallar başarıyla kaydedildi!');
      }
    } catch (err) {
      setRuleError('Oto-onay kuralı kaydedilemedi');
    } finally {
      setIsRuleLoading(false);
    }
  };

  const renderStatus = (status: ListingStatus) => (
    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ring-1 transition-all ${statusBadges[status]}`}>
      {statusLabels[status]}
    </span>
  );

  const renderRow = (listing: ListingListDto) => (
    <div key={listing.id} className="group bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-4 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        {/* Info Column */}
        <div className="flex-1 space-y-2 w-full">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-blue-500 tracking-widest uppercase">#{listing.listingNumber}</span>
            <div className="h-px w-6 bg-slate-100" />
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">
              {new Date(listing.createdAt).toLocaleDateString('tr-TR')}
            </span>
          </div>
          <h3 className="text-sm font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase truncate max-w-md">{listing.title}</h3>
          <div className="flex items-center gap-1 text-slate-500">
            <MapPin className="w-3 h-3" />
            <p className="text-[9px] font-black uppercase tracking-tight">
              {listing.city} / {listing.district}
            </p>
          </div>
        </div>

        {/* User & Price Column */}
        <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto">
          <div className="space-y-0.5 lg:text-right">
            <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase">FİYAT</p>
            <p className="text-base font-black text-slate-900 tracking-tighter">
              {listing.price.toLocaleString('tr-TR')} <span className="text-[10px]">₺</span>
            </p>
          </div>
          <div className="w-px h-6 bg-slate-100 hidden lg:block mx-1" />
          <div className="space-y-0.5 lg:text-right">
            <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase">İLAN SAHİBİ</p>
            <p className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[120px]">
              {listing.ownerName} {listing.ownerSurname}
            </p>
          </div>
        </div>

        {/* Actions Column */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="flex gap-2 w-full lg:w-auto">
            {listing.status === ListingStatus.Rejected ? (
              <button
                onClick={() => handleReopen(listing.id)}
                disabled={isUpdating}
                className="flex-1 lg:w-28 h-9 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest shadow shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                İNCELE
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleApprove(listing.id, listing.title)}
                  disabled={isUpdating}
                  className="flex-1 lg:w-24 h-9 rounded-xl bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest shadow shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  ONAYLA
                </button>
                <button
                  onClick={() => handleReject(listing.id, listing.title)}
                  disabled={isUpdating}
                  className="flex-1 lg:w-24 h-9 rounded-xl bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest shadow shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  REDDET
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {listing.status === ListingStatus.Rejected && listing.rejectionReason && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="text-[9px] font-bold text-rose-800 uppercase tracking-tight leading-relaxed line-clamp-1">HATA: {listing.rejectionReason}</p>
        </div>
      )}
    </div>
  );

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-4 text-slate-900 selection:bg-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">

        {/* Compact Header Section */}
        <header className="flex items-center justify-between bg-white/70 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-200/40">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-white" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">RealEstimate Admin</h1>
              <p className="text-[9px] font-black text-blue-500 tracking-[0.3em] mt-1 uppercase opacity-80">Moderasyon</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col items-end">
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{user.name} {user.surname}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[8px] text-slate-400 font-black tracking-widest uppercase">Admin</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md relative ring-2 ring-blue-50">
                {user?.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt={`${user.name} ${user.surname}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                    alt="Admin"
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100 mx-1 hidden sm:block" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              ÇIKIŞ
            </button>
          </div>
        </header>

        {/* Main Dashboard Layout - More Compact Gap */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* Left Column: Filters & Controls - 1/5 width */}
          <aside className="xl:col-span-1 space-y-4">

            {/* Search Box - Compact */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 shadow-md shadow-slate-200/20 p-5 space-y-3">
              <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">İLAN ARA</p>
              <div className="relative">
                <input
                  value={localFilters.searchTerm ?? ''}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="İLAN NO..."
                  className="w-full h-10 pl-10 pr-4 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold uppercase transition-all tracking-wider placeholder:text-slate-300"
                />
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button
                onClick={handleSearch}
                disabled={isDetailLoading}
                className="w-full h-10 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                BUL
              </button>
            </div>

            {/* Auto Moderation Rules - Compact */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-md shadow-slate-200/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">OTOSİSTEM</p>
                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${adminModerationRules.isAutomataEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {adminModerationRules.isAutomataEnabled ? 'AÇIK' : 'KAPALI'}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer group hover:border-emerald-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={adminModerationRules.isAutomataEnabled ?? false}
                    onChange={(e) => handleRuleChange('isAutomataEnabled', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">OTO-ONAY</span>
                </label>

                <div className="space-y-2">
                  <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase">YASAKLI KELİMELER</p>
                  <div className="flex gap-1.5">
                    <input
                      value={blockedInput}
                      onChange={(e) => setBlockedInput(e.target.value)}
                      placeholder="..."
                      className="flex-1 h-9 px-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[10px] font-bold uppercase transition-all"
                    />
                    <button
                      onClick={handleAddBlockedKeyword}
                      className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {adminModerationRules.blockedKeywords?.map((k) => (
                      <span key={k} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[9px] font-black text-slate-700 uppercase tracking-tight hover:bg-rose-50 hover:text-rose-700 group transition-all">
                        {k}
                        <button onClick={() => handleRemoveBlockedKeyword(k)} className="opacity-40 group-hover:opacity-100">
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveRules}
                  disabled={isRuleLoading}
                  className="w-full h-10 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  KAYDET
                </button>
              </div>
            </div>

            {/* User Management Section */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-md shadow-slate-200/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">KULLANICI YÖNETİMİ</p>
                {searchedUser && (
                  <button
                    onClick={() => {
                      setSearchedUser(null);
                      setUserSearchTerm('');
                      setUserSearchError(null);
                    }}
                    className="text-[8px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-wider transition-colors"
                  >
                    TEMİZLE
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    value={userSearchTerm}
                    onChange={(e) => {
                      setUserSearchTerm(e.target.value);
                      // Clear error when user starts typing
                      if (userSearchError) setUserSearchError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                    placeholder="E-POSTA ADRESİ..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-[10px] font-bold uppercase transition-all placeholder:text-slate-300"
                  />
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <button
                  onClick={handleUserSearch}
                  disabled={isUserSearching || !userSearchTerm.trim()}
                  className="w-full h-9 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUserSearching ? 'ARANIYOR...' : 'E-POSTA İLE BUL'}
                </button>

                {userSearchError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                    <p className="text-[9px] font-black text-rose-600 uppercase text-center">{userSearchError}</p>
                  </div>
                )}

                {searchedUser && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white shadow-sm ring-1 ring-slate-200">
                        <img
                          src={searchedUser.profilePictureUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-slate-900 uppercase truncate">{searchedUser.name} {searchedUser.surname}</p>
                        <p className="text-[8px] font-bold text-slate-400 truncate tracking-tight">{searchedUser.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div className="flex flex-col">
                        <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase">DURUM</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${searchedUser.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <p className={`text-[9px] font-black uppercase ${searchedUser.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {searchedUser.isActive ? 'AKTİF' : 'PASİF'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleToggleUserStatus}
                        disabled={isTogglingStatus}
                        className={`px-4 h-8 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-sm ${searchedUser.isActive
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 hover:shadow-rose-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:shadow-emerald-200'
                          }`}
                      >
                        {isTogglingStatus ? 'İŞLENİYOR...' : searchedUser.isActive ? 'PASİFE AL' : 'AKTİF ET'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Right Column: Listings Management - 4/5 width */}
          <main className="xl:col-span-4 space-y-4">

            {/* Top Bar: Tabs & Sort - More Compact */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="bg-white/70 backdrop-blur-xl p-1 rounded-2xl border border-white/40 shadow-md flex gap-1">
                <button
                  onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'pending' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  BEKLEYENLER ({listings.filter(l => l.status === ListingStatus.Pending).length})
                </button>
                <button
                  onClick={() => { setActiveTab('rejected'); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'rejected' ? 'bg-rose-600 text-white shadow-md shadow-rose-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  REDDEDİLENLER ({listings.filter(l => l.status === ListingStatus.Rejected).length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 shadow-sm transition-all active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 mx-auto ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => { setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest'); setCurrentPage(1); }}
                  className="h-10 px-4 rounded-xl bg-white border border-slate-100 text-[9px] font-black text-slate-600 uppercase tracking-widest shadow-sm hover:text-blue-600 transition-all flex items-center gap-2"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {sortOrder === 'newest' ? 'YENİ' : 'ESKİ'}
                </button>
              </div>
            </div>

            {/* Selected Listing Detail Accordion - Compact */}
            {selectedListing && selectedListing.listing && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <Accordion type="single" className="w-full" defaultValue="listing-detail">
                  <AccordionItem value="listing-detail" className="bg-slate-900 rounded-3xl border-none shadow-xl overflow-hidden p-1">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline text-white group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-[8px] font-black text-blue-400 tracking-widest uppercase opacity-80">DETAY</p>
                          <h4 className="text-sm font-black uppercase">#{selectedListing.listing.listingNumber} - {selectedListing.listing.title}</h4>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 px-6 pb-6 text-white/90">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div className="space-y-4">
                          <p className="text-xs font-bold leading-relaxed text-white/70 uppercase">{selectedListing.listing.description}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-white/5">
                              <p className="text-[8px] font-black text-white/40 mb-1">FİYAT</p>
                              <p className="text-sm font-black text-blue-400">{selectedListing.listing.price.toLocaleString('tr-TR')} ₺</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5">
                              <p className="text-[8px] font-black text-white/40 mb-1">KONUM</p>
                              <p className="text-[10px] font-black uppercase truncate">{selectedListing.listing.city} / {selectedListing.listing.district}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
                            {selectedListing.listing.images?.map((img, idx) => (
                              <img key={idx} src={img.imageUrl} className="w-full h-16 object-cover rounded-xl border border-white/5" />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { handleApprove(selectedListing.listing!.id, selectedListing.listing!.title); setSelectedListing(null); }} className="flex-1 h-10 rounded-xl bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">ONAYLA</button>
                            <button onClick={() => { handleReject(selectedListing.listing!.id, selectedListing.listing!.title); setSelectedListing(null); }} className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all">REDDET</button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* List Results */}
            <div className="space-y-4 min-h-[600px]">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <div className="animate-spin h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-600" />
                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">VERİLER YÜKLENİYOR...</p>
                </div>
              ) : (() => {
                const filteredByTab = listings.filter(l => activeTab === 'pending' ? l.status === ListingStatus.Pending : l.status === ListingStatus.Rejected);
                const sortedListings = sortOrder === 'newest' ? [...filteredByTab].reverse() : [...filteredByTab];
                const totalPages = Math.ceil(sortedListings.length / itemsPerPage);
                const currentListings = sortedListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                if (sortedListings.length === 0) {
                  return (
                    <div className="h-64 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/40 flex flex-col items-center justify-center gap-3 text-center p-6">
                      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-1">
                        {activeTab === 'pending' ? <Clock className="w-7 h-7 text-amber-500 opacity-20" /> : <XCircle className="w-7 h-7 text-rose-500 opacity-20" />}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">İÇERİK BULUNAMADI</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs">{activeTab === 'pending' ? 'ŞU ANDA ONAY BEKLEYEN İLAN YOK.' : 'REDDEDİLMİŞ İLAN KAYDI YOK.'}</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      {currentListings.map(renderRow)}
                    </div>

                    {/* Shadcn/ui Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-12 flex flex-col items-center gap-6">
                        <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase bg-white/70 backdrop-blur-sm px-6 py-2 rounded-full border border-white">SAYFA {currentPage} / {totalPages} • {sortedListings.length} İLAN</p>
                        <Pagination>
                          <PaginationContent className="bg-white/70 backdrop-blur-xl p-0.5 rounded-2xl border border-white/40 shadow-md">
                            <PaginationItem>
                              <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={`h-9 w-9 rounded-xl ${currentPage === 1 ? 'pointer-events-none opacity-20' : 'cursor-pointer hover:bg-slate-50'}`} />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink onClick={() => setCurrentPage(page)} isActive={page === currentPage} className={`h-9 w-9 rounded-xl cursor-pointer font-bold text-[10px] ${page === currentPage ? 'bg-blue-600 text-white shadow shadow-blue-100' : 'hover:bg-slate-50'}`}>
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={`h-9 w-9 rounded-xl ${currentPage === totalPages ? 'pointer-events-none opacity-20' : 'cursor-pointer hover:bg-slate-50'}`} />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </main>
        </div>
      </div >

      {/* Mesaj Gönderme Modal'ı */}
      {
        messageModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 space-y-6 animate-in zoom-in-95 duration-200 border border-white">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <button onClick={closeMessageModal} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <XCircle className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  {messageModal.action === 'approve' && 'İlan Onayı'}
                  {messageModal.action === 'reject' && 'İlan Reddi'}
                  {messageModal.action === 'activate' && 'Yayına Al'}
                  {messageModal.action === 'revoke' && 'Yayından Kaldır'}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  İLAN: <span className="text-slate-900">{messageModal.listingTitle}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                  <button
                    onClick={() => setMessageType('auto')}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${messageType === 'auto' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                  >
                    Şablon
                  </button>
                  <button
                    onClick={() => setMessageType('custom')}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${messageType === 'custom' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                  >
                    Özel
                  </button>
                </div>

                {messageType === 'auto' ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 min-h-[80px] flex items-center">
                    <p className="text-[10px] font-bold text-slate-800 uppercase leading-relaxed tracking-tight">{messageModal.action && getAutoMessage(messageModal.action)}</p>
                  </div>
                ) : (
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="MESAJI YAZIN..."
                    className="w-full h-24 p-4 bg-slate-50 border-none ring-1 ring-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-[10px] font-bold uppercase resize-none"
                  />
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={closeMessageModal}
                  className="flex-1 h-11 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  İPTAL
                </button>
                <button
                  onClick={handleActionWithMessage}
                  disabled={messageType === 'custom' && !customMessage.trim()}
                  className={`flex-1 h-11 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 disabled:opacity-50 ${messageModal.action === 'approve' || messageModal.action === 'activate'
                    ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'
                    : 'bg-rose-600 shadow-rose-100 hover:bg-rose-700'}`}
                >
                  GÖNDER
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

