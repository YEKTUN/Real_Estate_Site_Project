'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import {
    updateListing,
    fetchMyListings,
    fetchListingById,
    fetchListingImages,
    uploadMultipleListingImageFiles,
    deleteListingImage,
    setCoverImage
} from '@/body/redux/slices/listing/ListingSlice';
import {
    UpdateListingDto,
    ListingCategory,
    ListingType,
    PropertyType,
    Currency,
    HeatingType,
    BuildingStatus,
    UsageStatus,
    FacingDirection,
    DeedStatus
} from '@/body/redux/slices/listing/DTOs/ListingDTOs';

interface UpdateListingModalProps {
    listingId: number;
    onClose: () => void;
    currentPage: number;
}

// Enum Labels for UI
const categoryLabels: Record<ListingCategory, string> = {
    [ListingCategory.Residential]: 'Konut',
    [ListingCategory.Commercial]: 'İşyeri',
    [ListingCategory.Land]: 'Arsa',
    [ListingCategory.Building]: 'Bina',
    [ListingCategory.TouristicFacility]: 'Turistik Tesis',
    [ListingCategory.TimeShare]: 'Devre Mülk',
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
    [PropertyType.Mansion]: 'Köşk / Konak',
    [PropertyType.WaterSideHouse]: 'Yalı',
    [PropertyType.SummerHouse]: 'Yazlık',
    [PropertyType.Cooperative]: 'Kooperatif',
    [PropertyType.Prefabricated]: 'Prefabrik',
    [PropertyType.Detached]: 'Müstakil',
};

const heatingTypeLabels: Record<HeatingType, string> = {
    [HeatingType.Individual]: 'Bireysel (Kombi)',
    [HeatingType.Central]: 'Merkezi',
    [HeatingType.FloorHeating]: 'Yerden Isıtma',
    [HeatingType.AirConditioning]: 'Klima',
    [HeatingType.FuelOil]: 'Fuel Oil',
    [HeatingType.Coal]: 'Kömür',
    [HeatingType.NaturalGas]: 'Doğalgaz',
    [HeatingType.Electric]: 'Elektrik',
    [HeatingType.Solar]: 'Güneş Enerjisi',
    [HeatingType.Geothermal]: 'Jeotermal',
    [HeatingType.Fireplace]: 'Şömine',
    [HeatingType.None]: 'Yok',
};

const buildingStatusLabels: Record<BuildingStatus, string> = {
    [BuildingStatus.Zero]: 'Sıfır',
    [BuildingStatus.SecondHand]: 'İkinci El',
    [BuildingStatus.UnderConstruction]: 'İnşaat Halinde',
    [BuildingStatus.Renovated]: 'Yenilenmiş',
};

const usageStatusLabels: Record<UsageStatus, string> = {
    [UsageStatus.Empty]: 'Boş',
    [UsageStatus.TenantOccupied]: 'Kiracılı',
    [UsageStatus.OwnerOccupied]: 'Mülk Sahibi Oturuyor',
};

const facingDirectionLabels: Record<FacingDirection, string> = {
    [FacingDirection.North]: 'Kuzey',
    [FacingDirection.South]: 'Güney',
    [FacingDirection.East]: 'Doğu',
    [FacingDirection.West]: 'Batı',
    [FacingDirection.NorthEast]: 'Kuzey Doğu',
    [FacingDirection.NorthWest]: 'Kuzey Batı',
    [FacingDirection.SouthEast]: 'Güney Doğu',
    [FacingDirection.SouthWest]: 'Güney Batı',
};

const deedStatusLabels: Record<DeedStatus, string> = {
    [DeedStatus.Title]: 'Kat Mülkiyetli',
    [DeedStatus.SharedTitle]: 'Kat İrtifaklı',
    [DeedStatus.Cooperative]: 'Hisseli',
    [DeedStatus.Construction]: 'Arsa Tapulu',
    [DeedStatus.RightOfResidence]: 'Müstakil Tapulu',
    [DeedStatus.Other]: 'Diğer',
};

export default function UpdateListingModal({ listingId, onClose, currentPage }: UpdateListingModalProps) {
    const dispatch = useAppDispatch();
    const { currentListingImages } = useAppSelector(state => state.listing);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'location' | 'details' | 'features'>('general');
    const [formData, setFormData] = useState<UpdateListingDto>({});

    // Get current listing details
    useEffect(() => {
        const loadDetails = async () => {
            try {
                // Fetch details and images in parallel
                await Promise.all([
                    dispatch(fetchListingById(listingId)).unwrap(),
                    dispatch(fetchListingImages(listingId)).unwrap()
                ]);

                const result = await dispatch(fetchListingById(listingId)).unwrap();
                if (result.listing) {
                    const l = result.listing;
                    setFormData({
                        title: l.title,
                        description: l.description,
                        category: l.category,
                        type: l.type,
                        propertyType: l.propertyType,
                        price: l.price,
                        currency: l.currency,
                        monthlyDues: l.monthlyDues,
                        deposit: l.deposit,
                        isNegotiable: l.isNegotiable,
                        city: l.city,
                        district: l.district,
                        neighborhood: l.neighborhood,
                        fullAddress: l.fullAddress,
                        latitude: l.latitude,
                        longitude: l.longitude,
                        grossSquareMeters: l.grossSquareMeters,
                        netSquareMeters: l.netSquareMeters,
                        roomCount: l.roomCount,
                        bathroomCount: l.bathroomCount,
                        buildingAge: l.buildingAge,
                        floorNumber: l.floorNumber,
                        totalFloors: l.totalFloors,
                        heatingType: l.heatingType,
                        buildingStatus: l.buildingStatus,
                        usageStatus: l.usageStatus,
                        facingDirection: l.facingDirection,
                        deedStatus: l.deedStatus,
                        isSuitableForCredit: l.isSuitableForCredit,
                        isSuitableForTrade: l.isSuitableForTrade,
                        interiorFeatures: l.interiorFeatures,
                        exteriorFeatures: l.exteriorFeatures,
                    });
                }
            } catch (err) {
                console.error('İlan detayları yüklenemedi:', err);
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [listingId, dispatch]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setImageUploading(true);
        try {
            const fileArray = Array.from(files);
            await dispatch(uploadMultipleListingImageFiles({ listingId, files: fileArray })).unwrap();
            // Refresh images
            dispatch(fetchListingImages(listingId));
        } catch (err) {
            console.error('Görsel yükleme hatası:', err);
        } finally {
            setImageUploading(false);
            // Re-fetch listing to ensure cover image etc are correct if needed
            dispatch(fetchListingById(listingId));
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return;
        try {
            await dispatch(deleteListingImage({ listingId, imageId })).unwrap();
            dispatch(fetchListingImages(listingId));
        } catch (err) {
            console.error('Görsel silme hatası:', err);
        }
    };

    const handleSetCover = async (imageId: number) => {
        try {
            await dispatch(setCoverImage({ listingId, imageId })).unwrap();
            dispatch(fetchListingImages(listingId));
        } catch (err) {
            console.error('Kapak fotoğrafı değiştirme hatası:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await dispatch(updateListing({ listingId, data: formData })).unwrap();
            dispatch(fetchMyListings({ page: currentPage, pageSize: 10 }));
            onClose();
        } catch (err) {
            console.error('Güncelleme hatası:', err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mb-4"></div>
                <p className="font-bold text-gray-500">Yükleniyor...</p>
            </div>
        </div>
    );

    const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
            <span className="text-xl">{icon}</span>
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">{title}</h3>
        </div>
    );

    const InputField = ({ label, children }: { label: string, children: React.ReactNode }) => (
        <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{label}</label>
            {children}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gray-50 rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col scale-in-center">

                {/* Header */}
                <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                            ✏️
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 tracking-tight">İlanı Düzenle</h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">İlanınızı güncelleyin ve daha fazla detay ekleyin</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-gray-400 text-xl font-bold"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 py-2 bg-white gap-2 border-b border-gray-100">
                    {[
                        { id: 'general', label: 'GENEL', icon: '📝' },
                        { id: 'location', label: 'KONUM', icon: '📍' },
                        { id: 'details', label: 'DETAYLAR', icon: '📊' },
                        { id: 'features', label: 'ÖZELLİKLER', icon: '✨' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                : 'text-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">

                    {/* General Info Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <SectionHeader title="Temel Bilgiler" icon="📋" />
                            <InputField label="İlan Başlığı">
                                <input
                                    type="text"
                                    required
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    placeholder="Örn: Modern Deniz Manzaralı Villa"
                                />
                            </InputField>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField label="Kategori">
                                    <select
                                        value={formData.category ?? ''}
                                        onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    >
                                        {Object.entries(categoryLabels).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </InputField>
                                <InputField label="İlan Tipi">
                                    <select
                                        value={formData.type ?? ''}
                                        onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    >
                                        {Object.entries(typeLabels).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </InputField>
                                <InputField label="Emlak Tipi">
                                    <select
                                        value={formData.propertyType ?? ''}
                                        onChange={(e) => setFormData({ ...formData, propertyType: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    >
                                        {Object.entries(propertyTypeLabels).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </InputField>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <InputField label="Fiyat">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            value={formData.price || ''}
                                            onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                            className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <select
                                                value={formData.currency ?? ''}
                                                onChange={(e) => setFormData({ ...formData, currency: parseInt(e.target.value) })}
                                                className="bg-blue-50 border-none text-xs font-black text-blue-600 px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                                            >
                                                <option value={Currency.TRY}>TRY (₺)</option>
                                                <option value={Currency.USD}>USD ($)</option>
                                                <option value={Currency.EUR}>EUR (€)</option>
                                            </select>
                                        </div>
                                    </div>
                                </InputField>
                                <InputField label="Aidat (Opsiyonel)">
                                    <input
                                        type="number"
                                        value={formData.monthlyDues || ''}
                                        onChange={(e) => setFormData({ ...formData, monthlyDues: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <InputField label="Depozito (Opsiyonel)">
                                    <input
                                        type="number"
                                        value={formData.deposit || ''}
                                        onChange={(e) => setFormData({ ...formData, deposit: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <div className="flex items-end pb-2 pl-2 gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isNegotiable || false}
                                            onChange={(e) => setFormData({ ...formData, isNegotiable: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 font-bold"></div>
                                        <span className="ml-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pazarlık Var</span>
                                    </label>
                                </div>
                            </div>

                            <InputField label="Açıklama">
                                <textarea
                                    rows={6}
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700 resize-none"
                                    placeholder="İlanınız hakkında detaylı bilgi verin..."
                                />
                            </InputField>
                        </div>
                    )}

                    {/* Location Tab */}
                    {activeTab === 'location' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <SectionHeader title="Konum Bilgileri" icon="📍" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InputField label="Şehir">
                                    <input
                                        type="text"
                                        required
                                        value={formData.city || ''}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <InputField label="İlçe">
                                    <input
                                        type="text"
                                        required
                                        value={formData.district || ''}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <InputField label="Mahalle">
                                    <input
                                        type="text"
                                        value={formData.neighborhood || ''}
                                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                            </div>

                            <InputField label="Tam Adres">
                                <textarea
                                    rows={3}
                                    value={formData.fullAddress || ''}
                                    onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700 resize-none"
                                    placeholder="Cadde, sokak, no, kapı no..."
                                />
                            </InputField>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-3xl">
                                <InputField label="Enlem (Latitude)">
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitude || ''}
                                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white/70 border border-transparent rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <InputField label="Boylam (Longitude)">
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitude || ''}
                                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white/70 border border-transparent rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <p className="col-span-full text-[10px] text-blue-400 font-black uppercase text-center mt-1">
                                    💡 Haritadaki yerini tam göstermek için koordinat girebilirsiniz
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <SectionHeader title="Mülk Detayları" icon="📊" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <InputField label="Brüt Alan (m²)">
                                    <input
                                        type="number"
                                        value={formData.grossSquareMeters || ''}
                                        onChange={(e) => setFormData({ ...formData, grossSquareMeters: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <InputField label="Net Alan (m²)">
                                    <input
                                        type="number"
                                        value={formData.netSquareMeters || ''}
                                        onChange={(e) => setFormData({ ...formData, netSquareMeters: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <InputField label="Oda Sayısı">
                                    <input
                                        type="text"
                                        value={formData.roomCount || ''}
                                        onChange={(e) => setFormData({ ...formData, roomCount: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                        placeholder="Örn: 3+1"
                                    />
                                </InputField>

                                <InputField label="Banyo Sayısı">
                                    <input
                                        type="number"
                                        value={formData.bathroomCount || ''}
                                        onChange={(e) => setFormData({ ...formData, bathroomCount: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <InputField label="Bina Yaşı">
                                    <input
                                        type="number"
                                        value={formData.buildingAge || ''}
                                        onChange={(e) => setFormData({ ...formData, buildingAge: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    />
                                </InputField>
                                <div className="grid grid-cols-2 gap-2">
                                    <InputField label="Kat">
                                        <input
                                            type="number"
                                            value={formData.floorNumber || ''}
                                            onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) })}
                                            className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                        />
                                    </InputField>
                                    <InputField label="Toplam Kat">
                                        <input
                                            type="number"
                                            value={formData.totalFloors || ''}
                                            onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value) })}
                                            className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                        />
                                    </InputField>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                                <InputField label="Isınma Tipi">
                                    <select
                                        value={formData.heatingType ?? ''}
                                        onChange={(e) => setFormData({ ...formData, heatingType: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Object.entries(heatingTypeLabels).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </InputField>
                                <InputField label="Yapı Durumu">
                                    <select
                                        value={formData.buildingStatus ?? ''}
                                        onChange={(e) => setFormData({ ...formData, buildingStatus: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Object.entries(buildingStatusLabels).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </InputField>
                                <InputField label="Kullanım Durumu">
                                    <select
                                        value={formData.usageStatus ?? ''}
                                        onChange={(e) => setFormData({ ...formData, usageStatus: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Object.entries(usageStatusLabels).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </InputField>
                                <InputField label="Cephe">
                                    <select
                                        value={formData.facingDirection ?? ''}
                                        onChange={(e) => setFormData({ ...formData, facingDirection: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Object.entries(facingDirectionLabels).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </InputField>
                                <InputField label="Tapu Durumu">
                                    <select
                                        value={formData.deedStatus ?? ''}
                                        onChange={(e) => setFormData({ ...formData, deedStatus: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-blue-500 outline-none shadow-sm transition-all font-bold text-gray-700"
                                    >
                                        <option value="">Seçiniz</option>
                                        {Object.entries(deedStatusLabels).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </InputField>
                            </div>
                        </div>
                    )}

                    {/* Features Tab */}
                    {activeTab === 'features' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <SectionHeader title="Ek Özellikler & Kriterler" icon="✨" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                        💳 Finansal & Takas
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group" onClick={() => setFormData({ ...formData, isSuitableForCredit: !formData.isSuitableForCredit })}>
                                            <span className="text-sm font-bold text-gray-600">Krediye Uygun</span>
                                            <div className={`w-12 h-6 rounded-full transition-all relative ${formData.isSuitableForCredit ? 'bg-green-500' : 'bg-gray-200'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isSuitableForCredit ? 'left-7' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group" onClick={() => setFormData({ ...formData, isSuitableForTrade: !formData.isSuitableForTrade })}>
                                            <span className="text-sm font-bold text-gray-600">Takasa Uygun</span>
                                            <div className={`w-12 h-6 rounded-full transition-all relative ${formData.isSuitableForTrade ? 'bg-green-500' : 'bg-gray-200'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isSuitableForTrade ? 'left-7' : 'left-1'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-blue-600 rounded-[32px] text-white shadow-xl shadow-blue-100 flex flex-col justify-center items-center text-center">
                                    <span className="text-4xl mb-4">🚀</span>
                                    <h4 className="text-xl font-black mb-2 tracking-tight">Daha Fazla Detay Ekle</h4>
                                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                        İç ve dış özellikleri detaylandırarak ilanınızın <br />
                                        öne çıkma şansını %50 artırabilirsiniz.
                                    </p>
                                </div>
                            </div>

                            {/* Image Management */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        📸 Fotoğraflar ({currentListingImages?.length || 0})
                                    </h4>
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={imageUploading}
                                        />
                                        <div className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${imageUploading
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:scale-105 active:scale-95'
                                            }`}>
                                            {imageUploading ? 'YÜKLENİYOR...' : 'FOTOĞRAF EKLE'}
                                        </div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {currentListingImages && currentListingImages.map((img) => (
                                        <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border-2 border-transparent hover:border-blue-500 transition-all shadow-sm">
                                            <img
                                                src={img.imageUrl}
                                                alt={img.altText || 'İlan görseli'}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />

                                            {/* Badge for Cover */}
                                            {img.isCoverImage && (
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-tighter rounded-lg shadow-lg">
                                                    KAPAK
                                                </div>
                                            )}

                                            {/* Actions Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                                {!img.isCoverImage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetCover(img.id)}
                                                        className="w-full py-2 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/20"
                                                    >
                                                        KAPAK YAP
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteImage(img.id)}
                                                    className="w-full py-2 bg-red-500/20 backdrop-blur-md hover:bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/20"
                                                >
                                                    SİL
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Upload Trigger Placeholder */}
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all group">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={imageUploading}
                                        />
                                        <span className="text-2xl group-hover:scale-125 transition-transform duration-300">➕</span>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">EKLE</span>
                                    </label>
                                </div>

                                <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    💡 Kapak fotoğrafı, listede ilk görünen ana fotoğraftır.
                                </p>
                            </div>
                        </div>
                    )}

                </form>

                {/* Footer */}
                <div className="p-8 bg-white border-t border-gray-100 shrink-0 flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-8 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-200 transition-all font-bold"
                    >
                        İPTAL
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={updating}
                        className="flex-[2] px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-100 disabled:opacity-50 transition-all"
                    >
                        {updating ? 'GÜNCELLENİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                    </button>
                </div>
            </div>
        </div>
    );
}
