'use client';

import { useState, useRef } from 'react';
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
      console.log('İlan oluşturuluyor:', formData);
      
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
      
      console.log('CreateListingDto oluşturuldu:', createDto);

      // İlanı oluştur
      const result = await dispatch(createListing(createDto)).unwrap();
      
      if (result.success && result.listingId) {
        setCreatedListingId(result.listingId);
        
        // Görselleri yükle
        if (selectedImages.length > 0) {
          try {
            await uploadImages(result.listingId);
          } catch (imageError) {
            console.error('Görsel yükleme hatası:', imageError);
            // Görsel yükleme hatası olsa bile ilan oluşturuldu
          }
        }

        setSuccessMessage('İlanınız başarıyla oluşturuldu! İnceleme sonrası yayına alınacaktır.');
        
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
    } catch (err) {
      console.error('İlan oluşturma hatası:', err);
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
            {/* İlan Kategorisi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                İlan Kategorisi *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: ListingCategory.Residential, label: '🏠 Konut' },
                  { value: ListingCategory.Commercial, label: '🏢 İşyeri' },
                  { value: ListingCategory.Land, label: '🌳 Arsa' },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: cat.value }))}
                    className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                      formData.category === cat.value
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* İlan Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                İlan Tipi *
              </label>
              <div className="flex gap-4">
                {[
                  { value: ListingType.ForSale, label: '🏷️ Satılık' },
                  { value: ListingType.ForRent, label: '🔑 Kiralık' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                    className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${
                      formData.type === type.value
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mülk Tipi */}
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
                Mülk Tipi *
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={(e) => setFormData(prev => ({ ...prev, propertyType: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value={PropertyType.Apartment}>Daire</option>
                <option value={PropertyType.Residence}>Rezidans</option>
                <option value={PropertyType.Villa}>Villa</option>
                <option value={PropertyType.Detached}>Müstakil Ev</option>
                <option value={PropertyType.Farmhouse}>Çiftlik Evi</option>
              </select>
            </div>

            {/* İlan Başlığı */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                İlan Başlığı *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Örn: Deniz Manzaralı 3+1 Lüks Daire"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                minLength={10}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 karakter</p>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                minLength={50}
                maxLength={5000}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/5000 karakter (min: 50)</p>
            </div>

            {/* Fiyat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Fiyat *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Örn: 2500000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.type === ListingType.ForRent ? 'Aylık kira bedeli' : 'Satış fiyatı'}
                </p>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isNegotiable"
                    checked={formData.isNegotiable}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Pazarlık Payı Var</span>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            {/* Konum */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  İl *
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seçiniz</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                  İlçe *
                </label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="Örn: Kadıköy"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                Mahalle
              </label>
              <input
                type="text"
                id="neighborhood"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                placeholder="Örn: Caferağa"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            {/* Oda Sayısı ve Alan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roomCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Oda Sayısı
                </label>
                <select
                  id="roomCount"
                  name="roomCount"
                  value={formData.roomCount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seçiniz</option>
                  <option value="1+0">1+0 (Stüdyo)</option>
                  <option value="1+1">1+1</option>
                  <option value="2+1">2+1</option>
                  <option value="3+1">3+1</option>
                  <option value="4+1">4+1</option>
                  <option value="5+1">5+1</option>
                  <option value="5+2">5+2</option>
                  <option value="6+">6+</option>
                </select>
              </div>
              <div>
                <label htmlFor="bathroomCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Banyo Sayısı
                </label>
                <select
                  id="bathroomCount"
                  name="bathroomCount"
                  value={formData.bathroomCount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seçiniz</option>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="grossSquareMeters" className="block text-sm font-medium text-gray-700 mb-2">
                  Brüt m²
                </label>
                <input
                  type="number"
                  id="grossSquareMeters"
                  name="grossSquareMeters"
                  value={formData.grossSquareMeters}
                  onChange={handleChange}
                  placeholder="Örn: 150"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label htmlFor="netSquareMeters" className="block text-sm font-medium text-gray-700 mb-2">
                  Net m²
                </label>
                <input
                  type="number"
                  id="netSquareMeters"
                  name="netSquareMeters"
                  value={formData.netSquareMeters}
                  onChange={handleChange}
                  placeholder="Örn: 130"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Kat Bilgisi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="floorNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Bulunduğu Kat
                </label>
                <input
                  type="number"
                  id="floorNumber"
                  name="floorNumber"
                  value={formData.floorNumber}
                  onChange={handleChange}
                  placeholder="Örn: 5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label htmlFor="totalFloors" className="block text-sm font-medium text-gray-700 mb-2">
                  Toplam Kat Sayısı
                </label>
                <input
                  type="number"
                  id="totalFloors"
                  name="totalFloors"
                  value={formData.totalFloors}
                  onChange={handleChange}
                  placeholder="Örn: 10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Bina Yaşı ve Isıtma */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="buildingAge" className="block text-sm font-medium text-gray-700 mb-2">
                  Bina Yaşı
                </label>
                <input
                  type="number"
                  id="buildingAge"
                  name="buildingAge"
                  value={formData.buildingAge}
                  onChange={handleChange}
                  placeholder="Örn: 5"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label htmlFor="heatingType" className="block text-sm font-medium text-gray-700 mb-2">
                  Isıtma Tipi
                </label>
                <select
                  id="heatingType"
                  name="heatingType"
                  value={formData.heatingType}
                  onChange={(e) => setFormData(prev => ({ ...prev, heatingType: parseInt(e.target.value) || '' as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seçiniz</option>
                  <option value={HeatingType.Individual}>Bireysel (Kombi)</option>
                  <option value={HeatingType.Central}>Merkezi</option>
                  <option value={HeatingType.FloorHeating}>Yerden Isıtma</option>
                  <option value={HeatingType.NaturalGas}>Doğalgaz</option>
                  <option value={HeatingType.AirConditioning}>Klima</option>
                  <option value={HeatingType.None}>Yok</option>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.interiorFeatures.includes(feature.id)
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
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.exteriorFeatures.includes(feature.id)
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
                className={`border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
                  isDragging
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
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white backdrop-blur-sm bg-black/30 ${
                    formData.type === ListingType.ForSale ? 'bg-blue-600/80' : 'bg-green-600/80'
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
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <p className="text-red-700">{error}</p>
          <button onClick={() => dispatch(clearError())} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between overflow-x-auto pb-4">
        {steps.map((step, index) => {
          const stepOrder: Step[] = ['basic', 'details', 'photos', 'preview'];
          const currentIndex = stepOrder.indexOf(currentStep);
          const stepIndex = stepOrder.indexOf(step.id);
          const isActive = step.id === currentStep;
          const isCompleted = stepIndex < currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span>{isCompleted ? '✓' : step.icon}</span>
                <span className="hidden sm:inline font-medium">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-8 lg:w-16 h-1 mx-2 rounded ${
                  isCompleted ? 'bg-green-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-gray-50 rounded-2xl p-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 'basic'}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Geri
        </button>

        {currentStep === 'preview' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isCreating || uploadingImages}
            className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating || uploadingImages ? (
              <>
                <span className="animate-spin">⏳</span>
                {isCreating ? 'Yayınlanıyor...' : `Görseller yükleniyor... ${uploadProgress}%`}
              </>
            ) : (
              <>
                🚀 İlanı Yayınla
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            İleri →
          </button>
        )}
      </div>
    </div>
  );
}
