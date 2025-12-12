/**
 * Listing DTO'ları
 * 
 * İlan işlemleri için tip tanımlamaları.
 * Backend API'leri ile uyumlu.
 */

// ============================================================================
// ENUM TİPLERİ
// ============================================================================

export enum ListingCategory {
  Residential = 1,
  Commercial = 2,
  Land = 3,
  Building = 4,
  TouristicFacility = 5,
  TimeShare = 6,
}

export enum ListingType {
  ForSale = 1,
  ForRent = 2,
  DailyRent = 3,
  Swap = 4,
}

export enum PropertyType {
  Apartment = 1,
  Residence = 2,
  Villa = 3,
  Farmhouse = 4,
  Mansion = 5,
  WaterSideHouse = 6,
  SummerHouse = 7,
  Cooperative = 8,
  Prefabricated = 9,
  Detached = 10,
}

export enum Currency {
  TRY = 1,
  USD = 2,
  EUR = 3,
  GBP = 4,
}

export enum HeatingType {
  Individual = 1,
  Central = 2,
  FloorHeating = 3,
  AirConditioning = 4,
  FuelOil = 5,
  Coal = 6,
  NaturalGas = 7,
  Electric = 8,
  Solar = 9,
  Geothermal = 10,
  Fireplace = 11,
  None = 12,
}

export enum BuildingStatus {
  Zero = 1,
  SecondHand = 2,
  UnderConstruction = 3,
  Renovated = 4,
}

export enum UsageStatus {
  Empty = 1,
  TenantOccupied = 2,
  OwnerOccupied = 3,
}

export enum FacingDirection {
  North = 1,
  South = 2,
  East = 3,
  West = 4,
  NorthEast = 5,
  NorthWest = 6,
  SouthEast = 7,
  SouthWest = 8,
}

export enum DeedStatus {
  Title = 1,
  SharedTitle = 2,
  Cooperative = 3,
  Construction = 4,
  RightOfResidence = 5,
  Other = 6,
}

export enum ListingOwnerType {
  Owner = 1,
  RealEstateAgent = 2,
  Builder = 3,
  Authorized = 4,
}

export enum ListingStatus {
  Pending = 0,
  Active = 1,
  Inactive = 2,
  Sold = 3,
  Rented = 4,
  Rejected = 5,
  Expired = 6,
}

export enum ListingSortBy {
  Newest = 1,
  Oldest = 2,
  PriceAsc = 3,
  PriceDesc = 4,
  MostViewed = 5,
  MostFavorited = 6,
}

// ============================================================================
// İLAN DTO'LARI
// ============================================================================

/**
 * İlan Listesi için DTO (Özet bilgiler)
 */
export interface ListingListDto {
  id: number;
  listingNumber: string;
  title: string;
  category: ListingCategory;
  type: ListingType;
  propertyType: PropertyType;
  price: number;
  currency: Currency;
  city: string;
  district: string;
  neighborhood?: string;
  grossSquareMeters?: number;
  netSquareMeters?: number;
  roomCount?: string;
  buildingAge?: number;
  floorNumber?: number;
  coverImageUrl?: string;
  status: ListingStatus;
  ownerType: ListingOwnerType;
  createdAt: string;
  viewCount: number;
  favoriteCount: number;
  isFeatured: boolean;
  isUrgent: boolean;
}

/**
 * İlan Sahibi Bilgileri DTO
 */
export interface ListingOwnerDto {
  id: string;
  name: string;
  surname: string;
  phone?: string;
  email?: string;
  profilePictureUrl?: string;
  memberSince: string;
  totalListings: number;
}

/**
 * İlan Görseli DTO
 */
export interface ListingImageDto {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  isCoverImage: boolean;
  displayOrder: number;
}

/**
 * İlan Detay için DTO (Tüm bilgiler)
 */
export interface ListingDetailDto {
  id: number;
  listingNumber: string;
  title: string;
  description: string;
  category: ListingCategory;
  type: ListingType;
  propertyType: PropertyType;
  price: number;
  currency: Currency;
  monthlyDues?: number;
  deposit?: number;
  isNegotiable: boolean;
  city: string;
  district: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  grossSquareMeters?: number;
  netSquareMeters?: number;
  roomCount?: string;
  bathroomCount?: number;
  buildingAge?: number;
  floorNumber?: number;
  totalFloors?: number;
  heatingType?: HeatingType;
  buildingStatus?: BuildingStatus;
  usageStatus?: UsageStatus;
  facingDirection?: FacingDirection;
  deedStatus?: DeedStatus;
  isSuitableForCredit: boolean;
  isSuitableForTrade: boolean;
  interiorFeatures: number[];
  exteriorFeatures: number[];
  images: ListingImageDto[];
  owner: ListingOwnerDto;
  ownerType: ListingOwnerType;
  status: ListingStatus;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  viewCount: number;
  favoriteCount: number;
  commentCount: number;
  isFeatured: boolean;
  isUrgent: boolean;
  isFavorited: boolean;
}

/**
 * İlan Oluşturma için DTO
 */
export interface CreateListingDto {
  title: string;
  description: string;
  category: ListingCategory;
  type: ListingType;
  propertyType: PropertyType;
  price: number;
  currency?: Currency;
  monthlyDues?: number;
  deposit?: number;
  isNegotiable?: boolean;
  city: string;
  district: string;
  neighborhood?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  grossSquareMeters?: number;
  netSquareMeters?: number;
  roomCount?: string;
  bathroomCount?: number;
  buildingAge?: number;
  floorNumber?: number;
  totalFloors?: number;
  heatingType?: HeatingType;
  buildingStatus?: BuildingStatus;
  usageStatus?: UsageStatus;
  facingDirection?: FacingDirection;
  deedStatus?: DeedStatus;
  isSuitableForCredit?: boolean;
  isSuitableForTrade?: boolean;
  interiorFeatures?: number[];
  exteriorFeatures?: number[];
  ownerType?: ListingOwnerType;
}

/**
 * İlan Güncelleme için DTO
 */
export interface UpdateListingDto {
  title?: string;
  description?: string;
  category?: ListingCategory;
  type?: ListingType;
  propertyType?: PropertyType;
  price?: number;
  currency?: Currency;
  monthlyDues?: number;
  deposit?: number;
  isNegotiable?: boolean;
  city?: string;
  district?: string;
  neighborhood?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  grossSquareMeters?: number;
  netSquareMeters?: number;
  roomCount?: string;
  bathroomCount?: number;
  buildingAge?: number;
  floorNumber?: number;
  totalFloors?: number;
  heatingType?: HeatingType;
  buildingStatus?: BuildingStatus;
  usageStatus?: UsageStatus;
  facingDirection?: FacingDirection;
  deedStatus?: DeedStatus;
  isSuitableForCredit?: boolean;
  isSuitableForTrade?: boolean;
  interiorFeatures?: number[];
  exteriorFeatures?: number[];
  ownerType?: ListingOwnerType;
}

/**
 * İlan Arama/Filtreleme için DTO
 */
export interface ListingSearchDto {
  searchTerm?: string;
  category?: ListingCategory;
  type?: ListingType;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  currency?: Currency;
  city?: string;
  district?: string;
  neighborhood?: string;
  minSquareMeters?: number;
  maxSquareMeters?: number;
  roomCount?: string;
  roomCounts?: string[];
  minBuildingAge?: number;
  maxBuildingAge?: number;
  minFloor?: number;
  maxFloor?: number;
  heatingType?: HeatingType;
  buildingStatus?: BuildingStatus;
  usageStatus?: UsageStatus;
  deedStatus?: DeedStatus;
  ownerType?: ListingOwnerType;
  isSuitableForCredit?: boolean;
  isSuitableForTrade?: boolean;
  isFeatured?: boolean;
  isUrgent?: boolean;
  interiorFeatures?: number[];
  exteriorFeatures?: number[];
  sortBy?: ListingSortBy;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Görsel Yükleme DTO
 */
export interface UploadImageDto {
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  isCoverImage?: boolean;
  displayOrder?: number;
}

// ============================================================================
// RESPONSE DTO'LARI
// ============================================================================

/**
 * Sayfalama Bilgileri DTO
 */
export interface PaginationDto {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * İlan İşlemleri için Genel Response DTO
 */
export interface ListingResponseDto {
  success: boolean;
  message: string;
  listingId?: number;
  listing?: ListingDetailDto;
}

/**
 * İlan Listesi için Response DTO (Sayfalama dahil)
 */
export interface ListingListResponseDto {
  success: boolean;
  message: string;
  listings: ListingListDto[];
  pagination: PaginationDto;
}

/**
 * Görsel İşlemleri için Response DTO
 */
export interface ImageResponseDto {
  success: boolean;
  message: string;
  image?: ListingImageDto;
}

/**
 * Görsel Listesi için Response DTO
 */
export interface ImageListResponseDto {
  success: boolean;
  message: string;
  images: ListingImageDto[];
}

// ============================================================================
// STATE TİPİ
// ============================================================================

export interface ListingState {
  // Liste
  listings: ListingListDto[];
  featuredListings: ListingListDto[];
  latestListings: ListingListDto[];
  similarListings: ListingListDto[];
  myListings: ListingListDto[];
  
  // Detay
  currentListing: ListingDetailDto | null;
  currentListingImages: ListingImageDto[];
  
  // Sayfalama
  pagination: PaginationDto | null;
  
  // Arama
  searchParams: ListingSearchDto | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingDetail: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error
  error: string | null;
}
