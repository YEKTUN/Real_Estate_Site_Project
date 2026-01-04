'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, Rocket, ArrowRight, Check, Info, Sparkles } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import {
  createListing,
  uploadListingImageFile,
  uploadMultipleListingImageFiles,
  selectListingCreating,
  selectListingError,
  clearError
} from '@/body/redux/slices/listing/ListingSlice';
import {
  CreateListingDto,
  ListingCategory,
  ListingType,
  PropertyType,
  Currency,
  HeatingType,
  BuildingStatus,
  UsageStatus,
  ListingOwnerType,
} from '@/body/redux/slices/listing/DTOs/ListingDTOs';
import rawSampleListings from '../sampleListings.json';

// Örnek ilan tipi - sampleListings.json için tip güvenliği
type SampleListing = {
  id: number;
  title: string;
  description: string;
  category: ListingCategory;
  type: ListingType;
  propertyType: PropertyType;
  price: number;
  currency: Currency;
  monthlyDues: number | null;
  deposit: number | null;
  isNegotiable: boolean;
  city: string;
  district: string;
  neighborhood: string | null;
  fullAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  grossSquareMeters: number | null;
  netSquareMeters: number | null;
  roomCount: string | null;
  bathroomCount: number | null;
  buildingAge: number | null;
  floorNumber: number | null;
  totalFloors: number | null;
  heatingType: HeatingType | null;
  buildingStatus: BuildingStatus | null;
  usageStatus: UsageStatus | null;
  facingDirection: number | null;
  deedStatus: number | null;
  isSuitableForCredit: boolean;
  isSuitableForTrade: boolean;
  interiorFeatures: number[];
  exteriorFeatures: number[];
  ownerType: ListingOwnerType;
};

// JSON'dan gelen örnek ilanları tipli hale getir
const sampleListings = rawSampleListings as SampleListing[];

/**
 * İlan Ver Bileşeni
 * 
 * Yeni ilan oluşturma formu - Redux entegrasyonu ile.
 * - Temel bilgiler (başlık, açıklama, fiyat)
 * - Konum bilgileri
 * - Özellikler (oda sayısı, alan, vb.)
 * - Fotoğraf yükleme (TODO)
 */

// Form adımları
type Step = 'basic' | 'details' | 'photos' | 'preview';

// İç özellikler enum değerleri
const interiorFeatures = [
  { id: 1, label: 'ADSL' },
  { id: 2, label: 'Alarm' },
  { id: 3, label: 'Ankastre Fırın' },
  { id: 4, label: 'Barbekü' },
  { id: 5, label: 'Beyaz Eşya' },
  { id: 6, label: 'Bulaşık Makinesi' },
  { id: 7, label: 'Çamaşır Makinesi' },
  { id: 8, label: 'Duşakabin' },
  { id: 9, label: 'Giyinme Odası' },
  { id: 10, label: 'Jakuzi' },
  { id: 11, label: 'Klima' },
  { id: 12, label: 'Kiler' },
  { id: 13, label: 'Panjur' },
  { id: 14, label: 'Wifi' },
];

// Dış özellikler enum değerleri
const exteriorFeatures = [
  { id: 1, label: 'Asansör' },
  { id: 2, label: 'Güvenlik' },
  { id: 3, label: 'Havuz' },
  { id: 4, label: 'Jeneratör' },
  { id: 5, label: 'Kapıcı' },
  { id: 6, label: 'Otopark' },
  { id: 7, label: 'Oyun Parkı' },
  { id: 8, label: 'Sauna' },
  { id: 9, label: 'Spor Salonu' },
  { id: 10, label: 'Yangın Merdiveni' },
];

// İl listesi
const cities = [
  'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana',
  'Konya', 'Gaziantep', 'Mersin', 'Kayseri', 'Trabzon', 'Samsun'
];

export default function CreateListing() {
  const dispatch = useAppDispatch();

  // Redux state
  const isCreating = useAppSelector(selectListingCreating);
  const error = useAppSelector(selectListingError);

  // Aktif adım
  const [currentStep, setCurrentStep] = useState<Step>('basic');

  // Seçili örnek ilan id'si (formu otomatik doldurmak için)
  const [selectedSampleId, setSelectedSampleId] = useState<number | ''>('');

  // Form verileri
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: ListingCategory;
    type: ListingType;
    propertyType: PropertyType;
    price: string;
    currency: Currency;
    monthlyDues: string;
    deposit: string;
    isNegotiable: boolean;
    city: string;
    district: string;
    neighborhood: string;
    fullAddress: string;
    grossSquareMeters: string;
    netSquareMeters: string;
    roomCount: string;
    bathroomCount: string;
    buildingAge: string;
    floorNumber: string;
    totalFloors: string;
    heatingType: HeatingType | '';
    buildingStatus: BuildingStatus | '';
    usageStatus: UsageStatus | '';
    isSuitableForCredit: boolean;
    isSuitableForTrade: boolean;
    ownerType: ListingOwnerType;
    interiorFeatures: number[];
    exteriorFeatures: number[];
  }>({
    title: '',
    description: '',
    category: ListingCategory.Residential,
    type: ListingType.ForSale,
    propertyType: PropertyType.Apartment,
    price: '',
    currency: Currency.TRY,
    monthlyDues: '',
    deposit: '',
    isNegotiable: false,
    city: '',
    district: '',
    neighborhood: '',
    fullAddress: '',
    grossSquareMeters: '',
    netSquareMeters: '',
    roomCount: '',
    bathroomCount: '',
    buildingAge: '',
    floorNumber: '',
    totalFloors: '',
    heatingType: '',
    buildingStatus: '',
    usageStatus: '',
    isSuitableForCredit: true,
    isSuitableForTrade: false,
    ownerType: ListingOwnerType.Owner,
    interiorFeatures: [],
    exteriorFeatures: [],
  });

  // Başarı mesajı
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Görsel yükleme state'leri
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);

  // Adım listesi
  const steps: { id: Step; label: string; icon: string }[] = [
    { id: 'basic', label: 'Temel Bilgiler', icon: '📝' },
    { id: 'details', label: 'Detaylar', icon: '🏠' },
    { id: 'photos', label: 'Fotoğraflar', icon: '📸' },
    { id: 'preview', label: 'Önizleme', icon: '👁️' },
  ];

  /**
   * Input değişikliği handler
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Error'u temizle
    if (error) {
      dispatch(clearError());
    }
  };

  /**
   * Örnek ilanı form alanlarına uygula
   */
  const applySampleListing = (sampleId: number) => {
    const sample = sampleListings.find((s) => s.id === sampleId);
    if (!sample) {
      console.warn('CreateListing: Örnek ilan bulunamadı', { sampleId });
      return;
    }

    console.log('CreateListing: Örnek ilan uygulanıyor', sample);

    setFormData((prev) => ({
      ...prev,
      title: sample.title,
      description: sample.description,
      category: sample.category,
      type: sample.type,
      propertyType: sample.propertyType,
      price: sample.price ? sample.price.toString() : '',
      currency: sample.currency,
      monthlyDues: sample.monthlyDues != null ? sample.monthlyDues.toString() : '',
      deposit: sample.deposit != null ? sample.deposit.toString() : '',
      isNegotiable: sample.isNegotiable,
      city: sample.city,
      district: sample.district,
      neighborhood: sample.neighborhood ?? '',
      fullAddress: sample.fullAddress ?? '',
      grossSquareMeters: sample.grossSquareMeters != null ? sample.grossSquareMeters.toString() : '',
      netSquareMeters: sample.netSquareMeters != null ? sample.netSquareMeters.toString() : '',
      roomCount: sample.roomCount ?? '',
      bathroomCount: sample.bathroomCount != null ? sample.bathroomCount.toString() : '',
      buildingAge: sample.buildingAge != null ? sample.buildingAge.toString() : '',
      floorNumber: sample.floorNumber != null ? sample.floorNumber.toString() : '',
      totalFloors: sample.totalFloors != null ? sample.totalFloors.toString() : '',
      heatingType: sample.heatingType ?? '',
      buildingStatus: sample.buildingStatus ?? '',
      usageStatus: sample.usageStatus ?? '',
      isSuitableForCredit: sample.isSuitableForCredit,
      isSuitableForTrade: sample.isSuitableForTrade,
      ownerType: sample.ownerType,
      interiorFeatures: [...sample.interiorFeatures],
      exteriorFeatures: [...sample.exteriorFeatures],
    }));
  };

  /**
   * İç özellik toggle handler
   */
  const handleInteriorFeatureToggle = (featureId: number) => {
    setFormData((prev) => ({
      ...prev,
      interiorFeatures: prev.interiorFeatures.includes(featureId)
        ? prev.interiorFeatures.filter((f) => f !== featureId)
        : [...prev.interiorFeatures, featureId],
    }));
  };

  /**
   * Dış özellik toggle handler
   */
  const handleExteriorFeatureToggle = (featureId: number) => {
    setFormData((prev) => ({
      ...prev,
      exteriorFeatures: prev.exteriorFeatures.includes(featureId)
        ? prev.exteriorFeatures.filter((f) => f !== featureId)
        : [...prev.exteriorFeatures, featureId],
    }));
  };

  /**
   * Sonraki adım
   */
  const handleNext = () => {
    const stepOrder: Step[] = ['basic', 'details', 'photos', 'preview'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  /**
   * Önceki adım
   */
  const handleBack = () => {
    const stepOrder: Step[] = ['basic', 'details', 'photos', 'preview'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  /**
   * Dosya işleme helper fonksiyonu
   */
  const processFiles = (files: File[]) => {
    // Maksimum 20 dosya kontrolü
    if (selectedImages.length + files.length > 20) {
      alert('Maksimum 20 fotoğraf yükleyebilirsiniz!');
      return;
    }

    // Dosya boyutu kontrolü (5MB)
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} dosyası çok büyük! Maksimum 5MB olmalıdır.`);
        return false;
      }
      return true;
    });

    // Dosya tipi kontrolü
    const imageFiles = validFiles.filter((file) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} geçersiz dosya tipi! Sadece resim dosyaları yükleyebilirsiniz.`);
        return false;
      }
      return true;
    });

    // Yeni dosyaları ekle
    const newFiles = [...selectedImages, ...imageFiles];
    setSelectedImages(newFiles);

    // Önizlemeleri oluştur
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Dosya seçme handler
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);

    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Drag & Drop handlers
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  /**
   * Görsel sil
   */
  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Görsel sıralamasını değiştir
   */
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedImages.length - 1) return;

    const newImages = [...selectedImages];
    const newPreviews = [...imagePreviews];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    [newPreviews[index], newPreviews[newIndex]] = [newPreviews[newIndex], newPreviews[index]];

    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  /**
   * Görselleri yükle (Cloudinary ile)
   */
  const uploadImages = async (listingId: number) => {
    if (selectedImages.length === 0) return;

    setUploadingImages(true);
    setUploadProgress(0);

    try {
      console.log('📤 Görseller yükleniyor:', { listingId, count: selectedImages.length });

      // Çoklu görsel yükleme
      const result = await dispatch(
        uploadMultipleListingImageFiles({
          listingId,
          files: selectedImages,
        })
      ).unwrap();

      if (result.success) {
        console.log('✅ Görseller başarıyla yüklendi:', result);
        setUploadProgress(100);
      } else {
        throw new Error(result.message || 'Görseller yüklenirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('❌ Görsel yükleme hatası:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  /**
   * Form submit - Redux ile
   */
  const handleSubmit = async () => {
    try {
      console.log('📝 İlan oluşturuluyor:', formData);

      // CreateListingDto oluştur
      const createDto: CreateListingDto = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        propertyType: formData.propertyType,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency,
        monthlyDues: formData.monthlyDues ? parseFloat(formData.monthlyDues) : undefined,
        deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
        isNegotiable: formData.isNegotiable,
        city: formData.city,
        district: formData.district,
        neighborhood: formData.neighborhood || undefined,
        fullAddress: formData.fullAddress || undefined,
        grossSquareMeters: formData.grossSquareMeters ? parseInt(formData.grossSquareMeters) : undefined,
        netSquareMeters: formData.netSquareMeters ? parseInt(formData.netSquareMeters) : undefined,
        roomCount: formData.roomCount || undefined,
        bathroomCount: formData.bathroomCount ? parseInt(formData.bathroomCount) : undefined,
        buildingAge: formData.buildingAge ? parseInt(formData.buildingAge) : undefined,
        floorNumber: formData.floorNumber ? parseInt(formData.floorNumber) : undefined,
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
        // Enum alanları: boş string ise undefined, değilse enum değeri gönder
        heatingType: formData.heatingType === '' ? undefined : formData.heatingType as HeatingType,
        buildingStatus: formData.buildingStatus === '' ? undefined : formData.buildingStatus as BuildingStatus,
        usageStatus: formData.usageStatus === '' ? undefined : formData.usageStatus as UsageStatus,
        isSuitableForCredit: formData.isSuitableForCredit,
        isSuitableForTrade: formData.isSuitableForTrade,
        ownerType: formData.ownerType,
        // Özellikler: boş array ise undefined gönder (backend List<InteriorFeatureType> bekliyor)
        interiorFeatures: formData.interiorFeatures.length > 0 ? formData.interiorFeatures : undefined,
        exteriorFeatures: formData.exteriorFeatures.length > 0 ? formData.exteriorFeatures : undefined,
      };

      console.log('📤 CreateListingDto oluşturuldu:', createDto);

      // İlanı oluştur
      const result = await dispatch(createListing(createDto)).unwrap();

      if (result.success && result.listingId) {
        setCreatedListingId(result.listingId);
        console.log('✅ İlan başarıyla oluşturuldu:', result.listingId);

        // Görselleri yükle
        if (selectedImages.length > 0) {
          try {
            await uploadImages(result.listingId);
          } catch (imageError: any) {
            console.error('❌ Görsel yükleme hatası:', imageError);
            alert(`⚠️ İlan oluşturuldu ancak görseller yüklenirken hata oluştu: ${imageError?.message || 'Bilinmeyen hata'}`);
          }
        }

        setSuccessMessage('✅ İlanınız başarıyla oluşturuldu! İnceleme sonrası yayına alınacaktır.');

        // Formu sıfırla
        setFormData({
          title: '',
          description: '',
          category: ListingCategory.Residential,
          type: ListingType.ForSale,
          propertyType: PropertyType.Apartment,
          price: '',
          currency: Currency.TRY,
          monthlyDues: '',
          deposit: '',
          isNegotiable: false,
          city: '',
          district: '',
          neighborhood: '',
          fullAddress: '',
          grossSquareMeters: '',
          netSquareMeters: '',
          roomCount: '',
          bathroomCount: '',
          buildingAge: '',
          floorNumber: '',
          totalFloors: '',
          heatingType: '',
          buildingStatus: '',
          usageStatus: '',
          isSuitableForCredit: true,
          isSuitableForTrade: false,
          ownerType: ListingOwnerType.Owner,
          interiorFeatures: [],
          exteriorFeatures: [],
        });
        setSelectedImages([]);
        setImagePreviews([]);
        setCurrentStep('basic');
        setCreatedListingId(null);
      }
    } catch (err: any) {
      console.error('❌ İlan oluşturma hatası:', err);
      // Error Redux state'inde tutulduğu için UI'da otomatik gösterilecek
      // Alert'e gerek yok
    }
  };

  /**
   * Fiyat formatla
   */
  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return '₺0';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(num);
  };

  /**
   * Adım içeriğini render et
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            {/* Akıllı Form Doldurma - Compact Banner */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-indigo-50">
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="grow">
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Akıllı Doldurma</h4>
                    <p className="text-[11px] text-indigo-700/60 font-medium">Örnek seçerek formu hızlandırın.</p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedSampleId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          setSelectedSampleId('');
                          return;
                        }
                        const id = parseInt(value, 10);
                        setSelectedSampleId(id);
                        applySampleListing(id);
                      }}
                      className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-[11px] font-bold text-indigo-900 shadow-sm"
                    >
                      <option value="">İlan Seçin</option>
                      {sampleListings.map((s) => (
                        <option key={s.id} value={s.id}>#{s.id} - {s.title}</option>
                      ))}
                    </select>
                    {selectedSampleId && (
                      <button
                        onClick={() => applySampleListing(Number(selectedSampleId))}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                      >
                        OK
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Kategori ve Tip - Horizontal Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* İlan Kategorisi */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: ListingCategory.Residential, label: 'Konut', icon: '🏠' },
                    { value: ListingCategory.Commercial, label: 'İşyeri', icon: '🏢' },
                    { value: ListingCategory.Land, label: 'Arsa', icon: '🌳' },
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, category: cat.value }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 ${formData.category === cat.value
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <span className="text-xl mb-1">{cat.icon}</span>
                      <span className={`text-[11px] font-bold ${formData.category === cat.value ? 'text-indigo-900' : 'text-slate-600'}`}>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* İlan Tipi */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İşlem Tipi</label>
                </div>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                  {[
                    { value: ListingType.ForSale, label: 'Satılık', icon: '🏷️' },
                    { value: ListingType.ForRent, label: 'Kiralık', icon: '🔑' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${formData.type === type.value
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      <span>{type.icon}</span> {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Başlık ve Mülk Tipi Grubu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label htmlFor="propertyType" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mülk Tipi</label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyType: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none h-11"
                >
                  <option value={PropertyType.Apartment}>Daire</option>
                  <option value={PropertyType.Residence}>Rezidans</option>
                  <option value={PropertyType.Villa}>Villa</option>
                  <option value={PropertyType.Detached}>Müstakil</option>
                  <option value={PropertyType.Farmhouse}>Çiftlik</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">İlan Başlığı</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Deniz Manzaralı 3+1..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none h-11"
                  maxLength={200}
                />
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="İlanınız hakkında detaylı bilgi verin..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                minLength={50}
                maxLength={5000}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/5000 karakter (min: 50)</p>
            </div>

            {/* Fiyat Grubu - Optimized */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="price" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fiyat</label>
                <div className="relative">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="2.500.000"
                    className="w-full pl-4 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none h-11"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">₺</div>
                </div>
              </div>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isNegotiable ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200 bg-white group-hover:border-indigo-300'}`}>
                    {formData.isNegotiable && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    name="isNegotiable"
                    checked={formData.isNegotiable}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Pazarlık Payı</span>
                </label>
              </div>
            </div>

            {/* Aidat ve Depozito (Kiralık için) */}
            {formData.type === ListingType.ForRent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="monthlyDues" className="block text-sm font-medium text-gray-700 mb-2">
                    Aidat (₺/ay)
                  </label>
                  <input
                    type="number"
                    id="monthlyDues"
                    name="monthlyDues"
                    value={formData.monthlyDues}
                    onChange={handleChange}
                    placeholder="Örn: 500"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="deposit" className="block text-sm font-medium text-gray-700 mb-2">
                    Depozito (₺)
                  </label>
                  <input
                    type="number"
                    id="deposit"
                    name="deposit"
                    value={formData.deposit}
                    onChange={handleChange}
                    placeholder="Örn: 15000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            {/* Konum Grubu - Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Şehir</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 h-11 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seç</option>
                  {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="district" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">İlçe</label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Kadıköy"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold h-11 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="neighborhood" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mahalle</label>
                <input
                  type="text"
                  id="neighborhood"
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  placeholder="Acıbadem"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold h-11 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            {/* Properties Grid - Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="roomCount" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Oda Sayısı</label>
                <select id="roomCount" name="roomCount" value={formData.roomCount} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 h-10 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Seçiniz</option>
                  <option value="1+0">1+0</option>
                  <option value="1+1">1+1</option>
                  <option value="2+1">2+1</option>
                  <option value="3+1">3+1</option>
                  <option value="4+1">4+1</option>
                  <option value="5+1">5+1</option>
                </select>
              </div>
              <div>
                <label htmlFor="bathroomCount" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Banyo</label>
                <select id="bathroomCount" name="bathroomCount" value={formData.bathroomCount} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 h-10 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Seçiniz</option>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="grossSquareMeters" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Brüt m²</label>
                <input type="number" id="grossSquareMeters" name="grossSquareMeters" value={formData.grossSquareMeters} onChange={handleChange} placeholder="150" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold h-10 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="netSquareMeters" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Net m²</label>
                <input type="number" id="netSquareMeters" name="netSquareMeters" value={formData.netSquareMeters} onChange={handleChange} placeholder="130" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold h-10 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label htmlFor="floorNumber" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bulunduğu Kat</label>
                <input type="number" id="floorNumber" name="floorNumber" value={formData.floorNumber} onChange={handleChange} placeholder="5" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold h-10 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="totalFloors" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Toplam Kat</label>
                <input type="number" id="totalFloors" name="totalFloors" value={formData.totalFloors} onChange={handleChange} placeholder="10" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold h-10 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="buildingAge" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bina Yaşı</label>
                <input type="number" id="buildingAge" name="buildingAge" value={formData.buildingAge} onChange={handleChange} placeholder="0-30" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold h-10 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="heatingType" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Isıtma</label>
                <select id="heatingType" name="heatingType" value={formData.heatingType} onChange={(e) => setFormData(p => ({ ...p, heatingType: parseInt(e.target.value) || '' as any }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 h-10 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Seçiniz</option>
                  <option value={HeatingType.Individual}>Kombi</option>
                  <option value={HeatingType.Central}>Merkezi</option>
                  <option value={HeatingType.NaturalGas}>Doğalgaz</option>
                  <option value={HeatingType.AirConditioning}>Klima</option>
                </select>
              </div>
            </div>

            {/* Bina Durumu ve Kullanım */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="buildingStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  Yapı Durumu
                </label>
                <select
                  id="buildingStatus"
                  name="buildingStatus"
                  value={formData.buildingStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, buildingStatus: parseInt(e.target.value) || '' as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seçiniz</option>
                  <option value={BuildingStatus.Zero}>Sıfır</option>
                  <option value={BuildingStatus.SecondHand}>İkinci El</option>
                  <option value={BuildingStatus.Renovated}>Yenilenmiş</option>
                  <option value={BuildingStatus.UnderConstruction}>Yapım Aşamasında</option>
                </select>
              </div>
              <div>
                <label htmlFor="usageStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  Kullanım Durumu
                </label>
                <select
                  id="usageStatus"
                  name="usageStatus"
                  value={formData.usageStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageStatus: parseInt(e.target.value) || '' as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seçiniz</option>
                  <option value={UsageStatus.Empty}>Boş</option>
                  <option value={UsageStatus.TenantOccupied}>Kiracılı</option>
                  <option value={UsageStatus.OwnerOccupied}>Sahibi Oturuyor</option>
                </select>
              </div>
            </div>

            {/* Krediye ve Takasa Uygunluk */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isSuitableForCredit"
                  checked={formData.isSuitableForCredit}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Krediye Uygun</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isSuitableForTrade"
                  checked={formData.isSuitableForTrade}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Takasa Uygun</span>
              </label>
            </div>

            {/* İç Özellikler */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                İç Özellikler
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interiorFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => handleInteriorFeatureToggle(feature.id)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${formData.interiorFeatures.includes(feature.id)
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {feature.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dış Özellikler */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dış Özellikler
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {exteriorFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => handleExteriorFeatureToggle(feature.id)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${formData.exteriorFeatures.includes(feature.id)
                      ? 'border-green-600 bg-green-50 text-green-600'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {feature.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-6">
            {/* Dosya Seçme Alanı */}
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${isDragging
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-blue-400'
                  }`}
              >
                <div className="text-6xl mb-4">📷</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Fotoğraf Yükleyin
                </h3>
                <p className="text-gray-600 mb-4">
                  Sürükle bırak veya tıklayarak fotoğraf ekleyin
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  Fotoğraf Seç
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Maksimum 20 fotoğraf, her biri en fazla 5MB
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Seçilen: {selectedImages.length}/20
                </p>
              </div>
            </div>

            {/* Seçilen Görseller */}
            {selectedImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Seçilen Fotoğraflar ({selectedImages.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedImages.map((file, index) => (
                    <div
                      key={index}
                      className="relative group border-2 border-gray-200 rounded-xl overflow-hidden"
                    >
                      {/* Görsel Önizleme */}
                      <div className="aspect-square bg-gray-100 relative">
                        <img
                          src={imagePreviews[index]}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Kapak Fotoğrafı Badge */}
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            Kapak
                          </div>
                        )}
                        {/* Silme Butonu */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          ✕
                        </button>
                        {/* Sıralama Butonları */}
                        <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleMoveImage(index, 'up')}
                            disabled={index === 0}
                            className="flex-1 bg-black/50 text-white py-1 rounded text-xs font-semibold hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveImage(index, 'down')}
                            disabled={index === selectedImages.length - 1}
                            className="flex-1 bg-black/50 text-white py-1 rounded text-xs font-semibold hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                      {/* Dosya Adı */}
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* İpucu */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <p className="text-yellow-800 text-sm">
                İpucu: Kaliteli fotoğraflar ilanınızın %50 daha fazla görüntülenmesini sağlar! İlk fotoğraf kapak fotoğrafı olarak kullanılacaktır.
              </p>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-yellow-800">
                İlanınızı yayınlamadan önce bilgilerinizi kontrol edin.
              </p>
            </div>

            {/* Önizleme Kartı */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden">
                {/* Kapak Fotoğrafı veya Gradient */}
                {imagePreviews.length > 0 ? (
                  <img
                    src={imagePreviews[0]}
                    alt="Kapak fotoğrafı"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl text-white/50">📷</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white backdrop-blur-sm bg-black/30 ${formData.type === ListingType.ForSale ? 'bg-blue-600/80' : 'bg-green-600/80'
                    }`}>
                    {formData.type === ListingType.ForSale ? 'Satılık' : 'Kiralık'}
                  </span>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {imagePreviews.length} Fotoğraf
                  </div>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {formData.title || 'İlan Başlığı'}
                </h2>
                <p className="text-gray-600 flex items-center gap-1 mb-4">
                  📍 {formData.district || 'İlçe'}, {formData.city || 'İl'}
                </p>

                <div className="flex gap-4 mb-4 text-gray-600">
                  <span>🛏️ {formData.roomCount || '-'}</span>
                  <span>📐 {formData.grossSquareMeters || '-'}m²</span>
                  <span>🏢 {formData.floorNumber || '-'}. Kat</span>
                </div>

                <div className="text-3xl font-bold text-blue-600">
                  {formatPrice(formData.price)}
                  {formData.type === ListingType.ForRent && <span className="text-lg font-normal">/ay</span>}
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-2">Açıklama</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {formData.description || 'Açıklama girilmedi.'}
              </p>
            </div>

            {/* Seçilen Özellikler */}
            {(formData.interiorFeatures.length > 0 || formData.exteriorFeatures.length > 0) && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Özellikler</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.interiorFeatures.map((featureId) => {
                    const feature = interiorFeatures.find((f) => f.id === featureId);
                    return (
                      <span key={featureId} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {feature?.label}
                      </span>
                    );
                  })}
                  {formData.exteriorFeatures.map((featureId) => {
                    const feature = exteriorFeatures.find((f) => f.id === featureId);
                    return (
                      <span key={featureId} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {feature?.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Yüklenen Fotoğraflar Önizlemesi */}
            {imagePreviews.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Fotoğraflar ({imagePreviews.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-semibold">
                          Kapak
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Başarı mesajı göster
  if (successMessage) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Başarılı!</h2>
        <p className="text-gray-600 mb-6">{successMessage}</p>
        <button
          onClick={() => setSuccessMessage(null)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
        >
          Yeni İlan Ver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 lg:px-0">
      {/* Error Alert - Premium */}
      {error && (
        <div className="bg-rose-50/80 backdrop-blur-sm border-2 border-rose-200 rounded-2xl p-5 mb-6 animate-in slide-in-from-top duration-300 shadow-lg shadow-rose-100/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center shrink-0 border border-rose-100">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1 space-y-2">
              <h5 className="font-black text-rose-900 text-sm uppercase tracking-tight">İşlem Başarısız</h5>
              <p className="text-rose-700 text-sm font-medium leading-relaxed">{error}</p>

              {/* Telefon doğrulama hatası için özel mesaj */}
              {(error.toLowerCase().includes('phone') || error.toLowerCase().includes('telefon')) && (
                <div className="mt-3 p-3 bg-white/80 rounded-xl border border-rose-100">
                  <p className="text-xs text-rose-600 font-bold mb-2">💡 Nasıl düzeltilir?</p>
                  <p className="text-xs text-slate-600 mb-3">
                    İlan oluşturabilmek için telefon numaranızı doğrulamanız gerekmektedir.
                  </p>
                  <button
                    onClick={() => {
                      // Panel'deki activeMenu state'ini değiştirmek için custom event gönder
                      window.dispatchEvent(new CustomEvent('switchPanelTab', { detail: { tab: 'profile' } }));
                      // Error'u temizle
                      dispatch(clearError());
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-rose-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    <span>📱</span>
                    Telefonu Doğrula
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => dispatch(clearError())}
              className="p-2 hover:bg-white rounded-xl transition-colors text-rose-400 hover:text-rose-600 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Progress Header - Minimized */}
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="shrink-0">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">İLAN OLUŞTUR</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5 opacity-80">Yeni Kayıt</p>
          </div>

          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black transition-all ${steps.indexOf(steps.find(s => s.id === currentStep)!) >= i - 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                  {i}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Minimized Progress Bar */}
        <div className="relative h-1 bg-slate-50 rounded-full overflow-hidden mb-6">
          <div
            className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${((steps.indexOf(steps.find(s => s.id === currentStep)!) + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content Area - Tighter padding */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[400px]">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation - More Compact */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-100 p-3 rounded-2xl shadow-lg flex justify-between gap-3 sticky bottom-4 z-30">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 'basic'}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-30 border border-slate-200"
        >
          <ChevronLeft className="w-4 h-4" /> geri
        </button>

        {currentStep === 'preview' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isCreating || uploadingImages}
            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {isCreating || uploadingImages ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Rocket className="w-3.5 h-3.5" />}
            {isCreating || uploadingImages ? 'Yayınlanıyor...' : 'Yayınla'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-[0.2em] group"
          >
            İlerle <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}

