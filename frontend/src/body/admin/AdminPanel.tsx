'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@/body/redux/api/adminApi';
import { ListingResponseDto } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

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
  [ListingStatus.Pending]: 'bg-amber-100 text-amber-800 ring-amber-200',
  [ListingStatus.Active]: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  [ListingStatus.Inactive]: 'bg-gray-100 text-gray-700 ring-gray-200',
  [ListingStatus.Sold]: 'bg-blue-100 text-blue-800 ring-blue-200',
  [ListingStatus.Rented]: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  [ListingStatus.Rejected]: 'bg-rose-100 text-rose-800 ring-rose-200',
  [ListingStatus.Expired]: 'bg-orange-100 text-orange-800 ring-orange-200',
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
  // const pagination = useAppSelector(selectAdminPagination); // Kullanılmıyor - local pagination kullanılıyor
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
  const itemsPerPage = 5;

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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest'); // Yeniden eskiye varsayılan
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending'); // Tab state

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

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !user)) {
      console.log('Admin panel: auth yok, login sayfasına yönlendiriliyor');
      router.push('/login');
    }

    if (!isAuthLoading && user && !user.isAdmin) {
      console.log('Admin panel: admin değil, ana sayfaya yönlendiriliyor');
      router.push('/');
    }
  }, [isAuthLoading, isAuthenticated, router, user]);

  useEffect(() => {
    if (user?.isAdmin) {
      console.log('Admin panel: veri yükleniyor (mount/user change)', filters);
      dispatch(fetchAdminListings(undefined));
    }
  }, [dispatch, user?.isAdmin]);

  // Debug için listings değişimini izle
  useEffect(() => {
    console.log('Redux listings güncellendi:', {
      total: listings.length,
      pending: listings.filter(l => l.status === ListingStatus.Pending).length,
      rejected: listings.filter(l => l.status === ListingStatus.Rejected).length,
      activeTab
    });
  }, [listings, activeTab]);

  const handleRefresh = () => {
    console.log('İlan listesi manuel yenileniyor...');
    dispatch(fetchAdminListings(undefined));
  };

  // İlanları console'da göster
  useEffect(() => {
    if (listings && listings.length > 0) {
      console.log('=== ADMIN PANEL İLAN LİSTESİ ===');
      console.log('Toplam ilan sayısı:', listings.length);
      listings.forEach((listing, index) => {
        console.log(`\n--- İlan ${index + 1} ---`);
        console.log('ID:', listing.id);
        console.log('İlan Numarası:', listing.listingNumber);
        console.log('Başlık:', listing.title);
        console.log('Durum:', listing.status, '(0=Pending, 1=Active, 2=Inactive, 5=Rejected)');
        console.log('Fiyat:', listing.price);
        console.log('Şehir:', listing.city);
        console.log('İlçe:', listing.district);
        console.log('Oda Sayısı:', listing.roomCount);
        console.log('Sahip:', listing.ownerName, listing.ownerSurname);
        console.log('Email:', listing.ownerEmail);
        console.log('Oluşturulma:', listing.createdAt);
        console.log('Tüm Detaylar:', listing);
      });
      console.log('\n=== İLAN LİSTESİ SONU ===\n');
    }
  }, [listings]);

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

    // İlan numarası kontrolü: Sadece rakamlardan oluşuyorsa ve 6+ karakter ise
    if (searchTerm && /^\d{6,}$/.test(searchTerm)) {
      console.log('İlan numarası formatı tespit edildi, detay getiriliyor:', searchTerm);
      setIsDetailLoading(true);
      setSelectedListing(null);

      try {
        const result = await getAdminListingByNumberApi(searchTerm);
        if (result.success && result.listing) {
          setSelectedListing(result);
          // Arama alanını temizle
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

    // Normal arama
    dispatch(setFilters(localFilters));
    dispatch(fetchAdminListings(localFilters));
  };

  // Modal açma fonksiyonları
  const openMessageModal = (action: 'approve' | 'reject' | 'activate' | 'revoke', listingId: number, listingTitle: string) => {
    setMessageModal({
      isOpen: true,
      action,
      listingId,
      listingTitle,
    });
    setMessageType('auto');
    setCustomMessage('');
  };

  const closeMessageModal = () => {
    setMessageModal({
      isOpen: false,
      action: null,
      listingId: null,
      listingTitle: '',
    });
    setMessageType('auto');
    setCustomMessage('');
  };

  // Otomatik mesaj şablonları
  const getAutoMessage = (action: 'approve' | 'reject' | 'activate' | 'revoke'): string => {
    switch (action) {
      case 'approve':
        return 'İlanınız incelendi ve onaylandı. Artık yayında!';
      case 'reject':
        return 'İlanınız incelendi ancak site kurallarına uygun olmadığı için reddedildi. Lütfen ilan detaylarını kontrol edip tekrar deneyin.';
      case 'activate':
        return 'İlanınız yeniden yayına alındı.';
      case 'revoke':
        return 'İlanınız yayından kaldırıldı.';
      default:
        return '';
    }
  };

  // Mesaj ile işlem yapma
  const handleActionWithMessage = async () => {
    if (!messageModal.listingId || !messageModal.action) return;

    const message = messageType === 'auto' ? getAutoMessage(messageModal.action) : customMessage;

    // Özel mesaj seçiliyse ve boşsa uyarı ver
    if (messageType === 'custom' && !customMessage.trim()) {
      alert('Lütfen bir mesaj yazın veya otomatik mesaj seçeneğini kullanın.');
      return;
    }

    closeMessageModal();

    try {
      console.log(`� [ADMIN PANEL] ${messageModal.action} işlemi mesaj ile yapılıyor:`, {
        listingId: messageModal.listingId,
        message,
        messageType,
        timestamp: new Date().toISOString()
      });

      // İşlemi gerçekleştir
      switch (messageModal.action) {
        case 'approve':
          await handleApproveAction(messageModal.listingId, message);
          break;
        case 'reject':
          await handleRejectAction(messageModal.listingId, message);
          break;
        case 'activate':
          await handleActivateAction(messageModal.listingId, message);
          break;
        case 'revoke':
          await handleRevokeAction(messageModal.listingId, message);
          break;
      }
    } catch (error: any) {
      console.error('❌ [ADMIN PANEL] Mesaj ile işlem hatası:', error);
      alert(`İşlem sırasında hata oluştu: ${error?.message || 'Bilinmeyen hata'}`);
    }
  };

  // Gerçek işlem fonksiyonları (mesaj ile)
  const handleApproveAction = async (listingId: number, message: string) => {
    console.log('� [ADMIN PANEL] İlan onaylama başlatıldı:', { listingId, message, timestamp: new Date().toISOString() });
    const result = await dispatch(approveListing({ listingId, auto: false })).unwrap();
    console.log('✅ [ADMIN PANEL] İlan onaylama başarılı:', result);
    // TODO: Burada mesajı kullanıcıya gönder (backend API'si gerekli)
    console.log('📧 Kullanıcıya gönderilecek mesaj:', message);
    dispatch(fetchAdminListings(undefined));
    if (selectedListing?.listing) {
      const refreshResult = await getAdminListingByNumberApi(selectedListing.listing.listingNumber);
      if (refreshResult.success && refreshResult.listing) {
        setSelectedListing(refreshResult);
      }
    }
  };

  const handleRejectAction = async (listingId: number, message: string) => {
    console.log('🔴 [ADMIN PANEL] İlan reddetme başlatıldı:', { listingId, message, timestamp: new Date().toISOString() });
    const result = await dispatch(rejectListing({ listingId, note: message })).unwrap();
    console.log('✅ [ADMIN PANEL] İlan reddetme başarılı:', result);
    // TODO: Burada mesajı kullanıcıya gönder (backend API'si gerekli)
    console.log('� Kullanıcıya gönderilecek mesaj:', message);
    dispatch(fetchAdminListings(undefined));
    if (selectedListing?.listing) {
      const refreshResult = await getAdminListingByNumberApi(selectedListing.listing.listingNumber);
      if (refreshResult.success && refreshResult.listing) {
        setSelectedListing(refreshResult);
      }
    }
  };

  const handleActivateAction = async (listingId: number, message: string) => {
    console.log('▶️ [ADMIN PANEL] İlan yayına alma başlatıldı:', { listingId, message, timestamp: new Date().toISOString() });
    const result = await dispatch(updateListingStatus({ listingId, status: ListingStatus.Active })).unwrap();
    console.log('✅ [ADMIN PANEL] İlan yayına alma başarılı:', result);
    // TODO: Burada mesajı kullanıcıya gönder (backend API'si gerekli)
    console.log('📧 Kullanıcıya gönderilecek mesaj:', message);
    if (selectedListing?.listing) {
      const refreshResult = await getAdminListingByNumberApi(selectedListing.listing.listingNumber);
      if (refreshResult.success && refreshResult.listing) {
        setSelectedListing(refreshResult);
      }
    }
  };

  const handleRevokeAction = async (listingId: number, message: string) => {
    console.log('⏸️ [ADMIN PANEL] İlan yayından geri çekme başlatıldı:', { listingId, message, timestamp: new Date().toISOString() });
    const result = await dispatch(updateListingStatus({ listingId, status: ListingStatus.Inactive })).unwrap();
    console.log('✅ [ADMIN PANEL] İlan yayından geri çekme başarılı:', result);
    // TODO: Burada mesajı kullanıcıya gönder (backend API'si gerekli)
    console.log('� Kullanıcıya gönderilecek mesaj:', message);
    if (selectedListing?.listing) {
      const refreshResult = await getAdminListingByNumberApi(selectedListing.listing.listingNumber);
      if (refreshResult.success && refreshResult.listing) {
        setSelectedListing(refreshResult);
      }
    }
  };

  // Eski handler fonksiyonlarını modal açacak şekilde güncelle
  const handleApprove = async (listingId: number, listingTitle: string = 'Bu ilan') => {
    openMessageModal('approve', listingId, listingTitle);
  };

  const handleReject = async (listingId: number, listingTitle: string = 'Bu ilan') => {
    openMessageModal('reject', listingId, listingTitle);
  };

  const handleReopen = async (listingId: number) => {
    if (confirm('Bu ilanı tekrar açmak istediğinizden emin misiniz? İlan onay bekliyor durumuna dönecektir.')) {
      try {
        console.log('🔄 [ADMIN PANEL] İlan tekrar açma başlatıldı:', { listingId, timestamp: new Date().toISOString() });
        const result = await dispatch(reopenListing({ listingId })).unwrap();
        console.log('✅ [ADMIN PANEL] İlan tekrar açma başarılı:', result);
        dispatch(fetchAdminListings(undefined));
      } catch (error: any) {
        console.error('❌ [ADMIN PANEL] İlan tekrar açma hatası:', {
          listingId,
          error: error?.message || error,
          fullError: error,
          timestamp: new Date().toISOString()
        });
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
    try {
      console.log('Admin Panel: Çıkış yapılıyor...');
      await dispatch(logoutAsync()).unwrap();
      router.push('/login');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      // Hata olsa bile login'e yönlendir
      router.push('/login');
    }
  };

  const matchesAutoRules = (listing: ListingListDto) => {
    const {
      isAutomataEnabled,
      blockedKeywords,
    } = adminModerationRules;

    if (!isAutomataEnabled) return false;

    // Sadece yasaklı kelimeler kontrolü - tüm ilanlar için geçerli
    if (blockedKeywords && blockedKeywords.length > 0) {
      const title = listing.title?.toLowerCase() ?? '';
      const hasBlocked = blockedKeywords.some((k) =>
        title.includes(k.toLowerCase())
      );
      if (hasBlocked) return false;
    }
    return true;
  };

  const handleAutoApproveMatching = async () => {
    // Tüm pending ilanları al
    const pendingListings = listings.filter((l) => l.status === ListingStatus.Pending);

    if (pendingListings.length === 0) {
      return { processed: 0, approved: 0, rejected: 0 };
    }

    // İlanları filtreden geçip geçmemelerine göre ayır
    const passedListings = pendingListings.filter((l) => matchesAutoRules(l));
    const failedListings = pendingListings.filter((l) => !matchesAutoRules(l));


    console.log('Otomatik onaylanacak ilanlar (Aktif):', passedListings.map((c) => c.id));
    console.log('Otomatik reddedilecek ilanlar (Pasif):', failedListings.map((c) => c.id));

    try {
      // Filtreden geçen ilanları aktif yap
      for (const item of passedListings) {
        await dispatch(approveListing({ listingId: item.id, auto: true }));
      }

      // Filtreden geçemeyen ilanları pasif yap
      for (const item of failedListings) {
        await dispatch(updateListingStatus({ listingId: item.id, status: ListingStatus.Inactive }));
      }

      return {
        processed: pendingListings.length,
        approved: passedListings.length,
        rejected: failedListings.length
      };
    } catch (error) {
      console.error('Otomatik onaylama hatası:', error);
      throw error;
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
      setAdminModerationRules({
        ...adminModerationRules,
        ...saved,
      });

      // Eğer otomatik onay açıksa, mevcut pending ilanları işle
      if (saved.isAutomataEnabled) {
        setIsAutoProcessing(true);
        try {
          const result = await handleAutoApproveMatching();

          // İlan listesini yenile
          dispatch(fetchAdminListings(undefined));

          // Kullanıcıya bilgi ver
          if (result.processed > 0) {
            const message = `Kurallar kaydedildi ve otomatik onaylama tamamlandı!\n\n✅ Aktif yapılan: ${result.approved} ilan\n❌ Pasif yapılan: ${result.rejected} ilan\n📊 Toplam işlenen: ${result.processed} ilan`;
            alert(message);
          } else {
            alert('Kurallar başarıyla kaydedildi! (İşlenecek pending ilan bulunamadı)');
          }
        } catch (error) {
          console.error('Otomatik onaylama hatası:', error);
          alert('Kurallar kaydedildi ancak otomatik onaylama sırasında bir hata oluştu.');
        } finally {
          setIsAutoProcessing(false);
        }
      } else {
        alert('Kurallar başarıyla kaydedildi!');
      }
    } catch (err) {
      console.error('Auto approve rule save error', err);
      setRuleError('Oto-onay kuralı kaydedilemedi');
    } finally {
      setIsRuleLoading(false);
    }
  };

  const statusOptions = useMemo(
    () => Object.values(ListingStatus).filter((value) => typeof value === 'number') as ListingStatus[],
    []
  );

  const renderStatus = (status: ListingStatus) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ${statusBadges[status]}`}
    >
      {statusLabels[status]}
    </span>
  );

  const renderRow = (listing: ListingListDto) => (
    <div
      key={listing.id}
      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition"
    >
      <div className="md:col-span-4">
        <p className="text-sm text-gray-600 font-medium font-mono">#{listing.listingNumber}</p>
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{listing.title}</h3>
        <p className="text-sm text-gray-700 mt-1">
          {listing.city} / {listing.district} {listing.neighborhood ? `/ ${listing.neighborhood}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {renderStatus(listing.status)}
          {listing.status === ListingStatus.Rejected && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
              ⚠️ Admin Tarafından Reddedildi
            </span>
          )}
        </div>
        {listing.status === ListingStatus.Rejected && listing.rejectionReason && (
          <p className="text-xs text-rose-600 mt-1 italic">
            Sebep: {listing.rejectionReason}
          </p>
        )}
      </div>
      <div className="md:col-span-2 flex flex-col gap-1">
        <p className="text-sm text-gray-600 font-medium">Fiyat</p>
        <p className="text-base font-bold text-gray-900">{listing.price.toLocaleString('tr-TR')} ₺</p>
        <p className="text-xs text-gray-600">Oda: {listing.roomCount ?? '-'}</p>
      </div>
      <div className="md:col-span-2 flex flex-col gap-1">
        <p className="text-sm text-gray-600 font-medium">İlan Sahibi</p>
        <p className="text-xs font-bold text-gray-900 truncate">
          {listing.ownerName ? `${listing.ownerName} ${listing.ownerSurname ?? ''}` : 'Bilinmiyor'}
        </p>
        <p className="text-xs text-gray-700 truncate">{listing.ownerEmail ?? '—'}</p>
      </div>
      <div className="md:col-span-1 flex flex-col gap-1">
        <p className="text-sm text-gray-600 font-medium">Tarih</p>
        <p className="text-xs font-bold text-gray-800 whitespace-nowrap">
          {new Date(listing.createdAt).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          })}
        </p>
        <p className="text-xs text-gray-600 whitespace-nowrap">
          {new Date(listing.createdAt).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
      <div className="md:col-span-3 flex flex-wrap gap-2 justify-start md:justify-end">
        {listing.status === ListingStatus.Rejected ? (
          <button
            onClick={() => handleReopen(listing.id)}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            İlanı Aç
          </button>
        ) : (
          <>
            <button
              onClick={() => handleApprove(listing.id, listing.title)}
              disabled={isUpdating}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Onayla
            </button>
            <button
              onClick={() => handleReject(listing.id, listing.title)}
              disabled={isUpdating}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold shadow hover:bg-rose-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reddet
            </button>
          </>
        )}
      </div>

      {/* Red Sebebi - Sadece reddedilen ilanlar için */}
      {listing.status === ListingStatus.Rejected && listing.rejectionReason && (
        <div className="md:col-span-12 mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-rose-600 font-semibold text-sm">❌ Red Sebebi:</span>
            <span className="text-rose-800 text-sm flex-1">{listing.rejectionReason}</span>
          </div>
        </div>
      )}
    </div>
  );

  if (!user?.isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-600">Admin erişimi gerekiyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin İlan Yönetimi</h1>
            <p className="text-gray-600 mt-1">
              Kullanıcı ilanlarını inceleyin, filtreleyin ve manuel/otomatik onaylayın.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-semibold shadow hover:bg-gray-700 transition whitespace-nowrap"
          >
            Çıkış Yap
          </button>
        </header>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">İlan Numarası</label>
              <input
                value={localFilters.searchTerm ?? ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="İlan numarası (örn: 123456789) - Benzersiz numara ile direkt ilan bulunur"
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isDetailLoading}
              className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDetailLoading ? 'Aranıyor...' : 'Bul'}
            </button>
          </div>

          {/* İlan Detay Accordion - İlan numarası yazıldığında hemen altında açılır */}
          {selectedListing && selectedListing.listing && (
            <div className="mt-4">
              <Accordion type="single" className="w-full" defaultValue="listing-detail">
                <AccordionItem value="listing-detail" className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline">
                    <span className="font-semibold text-gray-900 text-left">
                      İlan Detayları - #{selectedListing.listing.listingNumber} - {selectedListing.listing.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <div className="px-6 pb-6">
                      {isDetailLoading ? (
                        <div className="flex justify-center py-10">
                          <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Sol Kolon - Temel Bilgiler */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedListing.listing.title}</h3>
                              <p className="text-gray-600">{selectedListing.listing.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">İlan Numarası</p>
                                <p className="font-semibold text-gray-900">#{selectedListing.listing.listingNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Durum</p>
                                {renderStatus(selectedListing.listing.status)}
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Kategori</p>
                                <p className="font-semibold text-gray-900">{categoryLabels[selectedListing.listing.category as ListingCategory] || selectedListing.listing.category}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Tip</p>
                                <p className="font-semibold text-gray-900">{typeLabels[selectedListing.listing.type as ListingType] || selectedListing.listing.type}</p>
                              </div>
                              {selectedListing.listing.propertyType && (
                                <div>
                                  <p className="text-sm text-gray-600">Mülk Tipi</p>
                                  <p className="font-semibold text-gray-900">{propertyTypeLabels[selectedListing.listing.propertyType as PropertyType] || selectedListing.listing.propertyType}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-gray-600">Fiyat</p>
                                <p className="font-semibold text-lg text-gray-900">{selectedListing.listing.price.toLocaleString('tr-TR')} ₺</p>
                              </div>
                              {selectedListing.listing.monthlyDues && (
                                <div>
                                  <p className="text-sm text-gray-500">Aidat</p>
                                  <p className="font-semibold">{selectedListing.listing.monthlyDues.toLocaleString('tr-TR')} ₺</p>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-sm text-gray-500 mb-2">Konum</p>
                              <p className="font-semibold">
                                {selectedListing.listing.city} / {selectedListing.listing.district}
                                {selectedListing.listing.neighborhood && ` / ${selectedListing.listing.neighborhood}`}
                              </p>
                              {selectedListing.listing.latitude && selectedListing.listing.longitude && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Koordinat: {selectedListing.listing.latitude.toFixed(6)}, {selectedListing.listing.longitude.toFixed(6)}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {selectedListing.listing.grossSquareMeters && (
                                <div>
                                  <p className="text-sm text-gray-500">Brüt m²</p>
                                  <p className="font-semibold">{selectedListing.listing.grossSquareMeters} m²</p>
                                </div>
                              )}
                              {selectedListing.listing.netSquareMeters && (
                                <div>
                                  <p className="text-sm text-gray-500">Net m²</p>
                                  <p className="font-semibold">{selectedListing.listing.netSquareMeters} m²</p>
                                </div>
                              )}
                              {selectedListing.listing.roomCount && (
                                <div>
                                  <p className="text-sm text-gray-500">Oda Sayısı</p>
                                  <p className="font-semibold">{selectedListing.listing.roomCount}</p>
                                </div>
                              )}
                              {selectedListing.listing.bathroomCount && (
                                <div>
                                  <p className="text-sm text-gray-500">Banyo Sayısı</p>
                                  <p className="font-semibold">{selectedListing.listing.bathroomCount}</p>
                                </div>
                              )}
                              {selectedListing.listing.floorNumber && (
                                <div>
                                  <p className="text-sm text-gray-500">Kat</p>
                                  <p className="font-semibold">{selectedListing.listing.floorNumber}/{selectedListing.listing.totalFloors}</p>
                                </div>
                              )}
                              {selectedListing.listing.buildingAge && (
                                <div>
                                  <p className="text-sm text-gray-500">Bina Yaşı</p>
                                  <p className="font-semibold">{selectedListing.listing.buildingAge} yıl</p>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                              <div>
                                <p className="text-sm text-gray-500">Görüntülenme</p>
                                <p className="font-semibold">{selectedListing.listing.viewCount || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Favori Sayısı</p>
                                <p className="font-semibold">{selectedListing.listing.favoriteCount || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Oluşturulma</p>
                                <p className="font-semibold text-xs">
                                  {new Date(selectedListing.listing.createdAt).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                              {selectedListing.listing.publishedAt && (
                                <div>
                                  <p className="text-sm text-gray-500">Yayınlanma</p>
                                  <p className="font-semibold text-xs">
                                    {new Date(selectedListing.listing.publishedAt).toLocaleDateString('tr-TR')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sağ Kolon - Sahip Bilgileri ve İşlemler */}
                          <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3">İlan Sahibi</h4>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-sm text-gray-500">Ad Soyad</p>
                                  <p className="font-semibold">
                                    {selectedListing.listing.owner.name} {selectedListing.listing.owner.surname}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Email</p>
                                  <p className="font-semibold break-all">{selectedListing.listing.owner.email}</p>
                                </div>
                                {selectedListing.listing.owner.phone && (
                                  <div>
                                    <p className="text-sm text-gray-500">Telefon</p>
                                    <p className="font-semibold">{selectedListing.listing.owner.phone}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {(() => {
                              // Status değerini number'a çevir (string geliyorsa)
                              const statusValue = typeof selectedListing.listing.status === 'string'
                                ? ListingStatus[selectedListing.listing.status as keyof typeof ListingStatus]
                                : selectedListing.listing.status;
                              const statusNumber = typeof statusValue === 'number' ? statusValue : Number(statusValue);

                              return (
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h4 className="font-semibold text-gray-900 mb-3">İşlemler</h4>
                                  <div className="mb-3">
                                    <p className="text-sm text-gray-500">Durum</p>
                                    <p className="font-semibold">{statusLabels[statusNumber as ListingStatus] || 'Bilinmeyen'}</p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {statusNumber === ListingStatus.Pending ? (
                                      // İlan onay bekliyorsa, onayla ve reddet butonları
                                      <>
                                        <button
                                          onClick={() => {
                                            if (selectedListing.listing) {
                                              handleApprove(selectedListing.listing.id, selectedListing.listing.title);
                                              setSelectedListing(null);
                                            }
                                          }}
                                          disabled={isUpdating}
                                          className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                          ✅ İlanı Onayla
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (selectedListing.listing) {
                                              handleReject(selectedListing.listing.id, selectedListing.listing.title);
                                              setSelectedListing(null);
                                            }
                                          }}
                                          disabled={isUpdating}
                                          className="w-full px-4 py-3 rounded-lg bg-rose-600 text-white font-semibold shadow hover:bg-rose-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                          ❌ İlanı Reddet
                                        </button>
                                      </>
                                    ) : statusNumber === ListingStatus.Active ? (
                                      // İlan aktifse, yayından geri çek butonu
                                      <button
                                        onClick={() => {
                                          if (selectedListing.listing) {
                                            handleRevokeApproval(selectedListing.listing.id, selectedListing.listing.title);
                                          }
                                        }}
                                        disabled={isUpdating}
                                        className="w-full px-4 py-3 rounded-lg bg-amber-600 text-white font-semibold shadow hover:bg-amber-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        ⏸️ Yayından Kaldır (Pasif Yap)
                                      </button>
                                    ) : statusNumber === ListingStatus.Inactive ? (
                                      // İlan pasifse, yayına al butonu
                                      <button
                                        onClick={() => {
                                          if (selectedListing.listing) {
                                            handleActivateListing(selectedListing.listing.id, selectedListing.listing.title);
                                          }
                                        }}
                                        disabled={isUpdating}
                                        className="w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        ▶️ Yayına Al
                                      </button>
                                    ) : statusNumber === ListingStatus.Rejected ? (
                                      // İlan reddedilmişse, tekrar aç butonu
                                      <button
                                        onClick={() => {
                                          if (selectedListing.listing) {
                                            handleReopen(selectedListing.listing.id);
                                            setSelectedListing(null);
                                          }
                                        }}
                                        disabled={isUpdating}
                                        className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        🔄 İncelemeye Geri Al (Pending Yap)
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })()}

                            {selectedListing.listing.images && selectedListing.listing.images.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Görseller ({selectedListing.listing.images.length})</h4>
                                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                  {selectedListing.listing.images.map((img, idx) => (
                                    <div key={idx} className="relative">
                                      <img
                                        src={img.imageUrl}
                                        alt={img.altText || `İlan görseli ${idx + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                      />
                                      {img.isCoverImage && (
                                        <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                          Kapak
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(selectedListing.listing.interiorFeatures?.length > 0 || selectedListing.listing.exteriorFeatures?.length > 0) && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Özellikler</h4>
                                {selectedListing.listing.interiorFeatures && selectedListing.listing.interiorFeatures.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-sm text-gray-500 mb-1">İç Özellikler</p>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedListing.listing.interiorFeatures.map((feature, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                          {feature}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selectedListing.listing.exteriorFeatures && selectedListing.listing.exteriorFeatures.length > 0 && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Dış Özellikler</p>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedListing.listing.exteriorFeatures.map((feature, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                          {feature}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Ek Bilgiler</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {selectedListing.listing.isSuitableForCredit !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className={selectedListing.listing.isSuitableForCredit ? 'text-emerald-600' : 'text-gray-400'}>
                                      {selectedListing.listing.isSuitableForCredit ? '✓' : '✗'}
                                    </span>
                                    <span>Krediye Uygun</span>
                                  </div>
                                )}
                                {selectedListing.listing.isSuitableForTrade !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className={selectedListing.listing.isSuitableForTrade ? 'text-emerald-600' : 'text-gray-400'}>
                                      {selectedListing.listing.isSuitableForTrade ? '✓' : '✗'}
                                    </span>
                                    <span>Takasa Uygun</span>
                                  </div>
                                )}
                                {selectedListing.listing.isNegotiable !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className={selectedListing.listing.isNegotiable ? 'text-emerald-600' : 'text-gray-400'}>
                                      {selectedListing.listing.isNegotiable ? '✓' : '✗'}
                                    </span>
                                    <span>Fiyat Pazarlığa Açık</span>
                                  </div>
                                )}
                                {selectedListing.listing.isFeatured && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-600">★</span>
                                    <span>Öne Çıkan İlan</span>
                                  </div>
                                )}
                                {selectedListing.listing.isUrgent && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-rose-600">⚡</span>
                                    <span>Acil İlan</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Otomatik Onay Kuralları</h2>
              <p className="text-sm text-gray-600">
                Seçilen kurala uyan bekleyen ilanları otomatik yayına al. Kurallar veritabanında saklanır.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSaveRules}
                disabled={isRuleLoading || isAutoProcessing}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRuleLoading || isAutoProcessing ? 'Kaydediliyor...' : 'Kuralları Kaydet'}
              </button>
            </div>
          </div>
          {ruleError && (
            <div className="mb-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {ruleError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Otomatik Onay Açık mı?</label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={adminModerationRules.isAutomataEnabled ?? false}
                  onChange={(e) => handleRuleChange('isAutomataEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Aktif
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Yasaklı Kelimeler (tek tek ekle)</label>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={blockedInput}
                    onChange={(e) => setBlockedInput(e.target.value)}
                    placeholder="kelime yaz ve ekle"
                    className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlockedKeyword}
                    className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold shadow hover:bg-amber-700 transition"
                  >
                    Ekle
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(adminModerationRules.blockedKeywords ?? []).length === 0 && (
                    <span className="text-xs text-gray-500">Henüz eklenmiş kelime yok.</span>
                  )}
                  {(adminModerationRules.blockedKeywords ?? []).map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs border border-rose-200"
                    >
                      {k}
                      <button
                        type="button"
                        onClick={() => handleRemoveBlockedKeyword(k)}
                        className="text-rose-600 hover:text-rose-800"
                        aria-label={`${k} sil`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-amber-700">
                  Başlık veya açıklamada bu kelimeler geçerse otomatik onaylanmaz.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-3">
            <p className="text-sm text-gray-700 font-semibold">Aktif kurallar</p>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs border ${adminModerationRules.isAutomataEnabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
              >
                {adminModerationRules.isAutomataEnabled ? 'Otomatik Onay: Açık (Tüm İlanlar)' : 'Otomatik Onay: Kapalı'}
              </span>
              {adminModerationRules.city && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs border border-blue-200">
                  Şehir: {adminModerationRules.city}
                </span>
              )}
              {adminModerationRules.district && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs border border-blue-200">
                  İlçe: {adminModerationRules.district}
                </span>
              )}
              {adminModerationRules.ownerEmail && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                  Sahip: {adminModerationRules.ownerEmail}
                </span>
              )}
              {adminModerationRules.blockedKeywords?.length ? (
                adminModerationRules.blockedKeywords.map((k) => (
                  <span key={`kw-${k}`} className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs border border-rose-200">
                    Yasak: {k}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs border border-gray-200">
                  Yasaklı kelime yok
                </span>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Sıralama ve Yenile Butonları - Liste Üstünde */}
        {!isLoading && (
          <div className="flex justify-end items-center gap-3">
            {/* Yenile Butonu */}
            <button
              onClick={handleRefresh}
              className="group relative flex items-center justify-center p-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
              title="Listeyi Yenile"
            >
              <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={() => {
                setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
                setCurrentPage(1);
              }}
              className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              {/* Animasyonlu Arka Plan */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* İçerik */}
              <div className="relative flex items-center gap-3">
                {/* Animasyonlu İkon */}
                <div className={`transform transition-transform duration-500 ${sortOrder === 'newest' ? 'rotate-0' : 'rotate-180'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>

                {/* Metin */}
                <span className="text-sm font-bold tracking-wide">
                  {sortOrder === 'newest' ? 'Yeniden Eskiye' : 'Eskiden Yeniye'}
                </span>

                {/* Pulse Efekti */}
                <div className="absolute -inset-1 bg-white opacity-20 rounded-xl blur group-hover:opacity-30 transition-opacity duration-300" />
              </div>
            </button>
          </div>
        )}

        {/* Tab Seçimi - Onay Bekleyenler / Reddedilenler */}
        {!isLoading && (
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-100 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => {
                  setActiveTab('pending');
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${activeTab === 'pending'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏳</span>
                  <span>Onay Bekleyenler</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                    {listings.filter(l => l.status === ListingStatus.Pending).length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('rejected');
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${activeTab === 'rejected'
                  ? 'bg-white text-rose-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">❌</span>
                  <span>Reddedilenler</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                    {listings.filter(l => l.status === ListingStatus.Rejected).length}
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        <section className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : (() => {
            // Tab'a göre filtrele
            const filteredByTab = listings.filter(listing => {
              // Redux normalleştirme sonrası artık her zaman sayı (0, 5 vb.) gelmeli
              // Ama yine de her iki ihtimale karşı (0 veya "Pending") kontrol ediyoruz
              const status = listing.status as any;
              if (activeTab === 'pending') {
                return status === ListingStatus.Pending || status === 'Pending';
              } else {
                return status === ListingStatus.Rejected || status === 'Rejected';
              }
            });

            // Sıralamayı uygula
            const sortedListings = sortOrder === 'newest'
              ? [...filteredByTab].reverse()  // En yeni en başta
              : [...filteredByTab];            // En eski en başta

            // Sayfalama hesapla
            const totalPages = Math.ceil(sortedListings.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentListings = sortedListings.slice(startIndex, endIndex);

            return (
              <>
                {sortedListings.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-xl p-6 text-center text-gray-600">
                    {activeTab === 'pending'
                      ? '⏳ Onay bekleyen ilan bulunamadı.'
                      : '❌ Reddedilen ilan bulunamadı.'}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3">
                      {currentListings.map(renderRow)}
                    </div>

                    {/* Shadcn/ui Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-6">
                        <div className="mb-4 text-center text-sm text-gray-600">
                          Sayfa {currentPage} / {totalPages} • Toplam {sortedListings.length} ilan • Gösterilen: {startIndex + 1}-{Math.min(endIndex, sortedListings.length)}
                        </div>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              // Ellipsis mantığı: 7'den fazla sayfa varsa ellipsis göster
                              if (totalPages <= 7) {
                                // 7 veya daha az sayfa - hepsini göster
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => setCurrentPage(page)}
                                      isActive={page === currentPage}
                                      className="cursor-pointer"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              } else {
                                // 7'den fazla sayfa - ellipsis ile göster
                                const showPage =
                                  page === 1 ||
                                  page === totalPages ||
                                  (page >= currentPage - 1 && page <= currentPage + 1);

                                if (!showPage) {
                                  // Ellipsis göster (sadece gerekli yerlerde)
                                  if (page === 2 && currentPage > 3) {
                                    return (
                                      <PaginationItem key={`ellipsis-start`}>
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  }
                                  if (page === totalPages - 1 && currentPage < totalPages - 2) {
                                    return (
                                      <PaginationItem key={`ellipsis-end`}>
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    );
                                  }
                                  return null;
                                }

                                return (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => setCurrentPage(page)}
                                      isActive={page === currentPage}
                                      className="cursor-pointer"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              }
                            })}

                            <PaginationItem>
                              <PaginationNext
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </section>

      </div >

      {/* Mesaj Gönderme Modal'ı */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {messageModal.action === 'approve' && '✅ İlanı Onayla'}
                {messageModal.action === 'reject' && '❌ İlanı Reddet'}
                {messageModal.action === 'activate' && '▶️ Yayına Al'}
                {messageModal.action === 'revoke' && '⏸️ Yayından Kaldır'}
              </h3>
              <button
                onClick={closeMessageModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">İlan:</p>
              <p className="font-semibold text-gray-900">{messageModal.listingTitle}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Kullanıcıya mesaj gönder:</p>

              {/* Mesaj Tipi Seçimi */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setMessageType('auto')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${messageType === 'auto'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="font-semibold">Otomatik Mesaj</div>
                  <div className="text-xs mt-1">Hazır şablon kullan</div>
                </button>
                <button
                  onClick={() => setMessageType('custom')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${messageType === 'custom'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="font-semibold">Özel Mesaj</div>
                  <div className="text-xs mt-1">Kendin yaz</div>
                </button>
              </div>

              {/* Mesaj Önizleme/Yazma Alanı */}
              {messageType === 'auto' ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-2">Gönderilecek mesaj:</p>
                  <p className="text-gray-900">{messageModal.action && getAutoMessage(messageModal.action)}</p>
                </div>
              ) : (
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Mesajınızı yazın:</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Kullanıcıya göndermek istediğiniz mesajı buraya yazın..."
                    className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customMessage.length} karakter
                  </p>
                </div>
              )}
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
              <button
                onClick={closeMessageModal}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                İptal
              </button>
              <button
                onClick={handleActionWithMessage}
                disabled={messageType === 'custom' && !customMessage.trim()}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition ${messageModal.action === 'approve' || messageModal.action === 'activate'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : messageModal.action === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {messageModal.action === 'approve' && 'Onayla ve Gönder'}
                {messageModal.action === 'reject' && 'Reddet ve Gönder'}
                {messageModal.action === 'activate' && 'Yayına Al ve Gönder'}
                {messageModal.action === 'revoke' && 'Kaldır ve Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}

