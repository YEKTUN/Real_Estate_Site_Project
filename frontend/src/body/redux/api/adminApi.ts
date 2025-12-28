import axiosInstance from './axiosInstance';
import {
  ListingCategory,
  ListingListResponseDto,
  ListingResponseDto,
  ListingStatus,
  ListingType,
} from '../slices/listing/DTOs/ListingDTOs';

export interface AdminModerationRuleDto {
  id?: number;
  isAutomataEnabled: boolean;
  statuses?: ListingStatus[];
  blockedKeywords?: string[];
}

export interface AdminListingFilter {
  searchTerm?: string;
  statuses?: ListingStatus[];
  city?: string;
  district?: string;
  ownerEmail?: string;
  type?: ListingType;
  category?: ListingCategory;
  page?: number;
  pageSize?: number;
}

export const getAdminListingsApi = async (filter: AdminListingFilter): Promise<ListingListResponseDto> => {
  console.log('Admin ilan listesi isteği:', filter);
  const response = await axiosInstance.get<ListingListResponseDto>('/admin/listings', {
    params: filter,
  });
  return response.data;
};

export const approveListingApi = async (listingId: number, autoApprove: boolean): Promise<ListingResponseDto> => {
  console.log('🟢 [API] Admin ilan onay isteği başlatıldı:', { listingId, autoApprove, timestamp: new Date().toISOString() });
  try {
    const response = await axiosInstance.patch<ListingResponseDto>(
      `/admin/listings/${listingId}/approve`,
      null,
      { params: { auto: autoApprove } }
    );
    console.log('✅ [API] Admin ilan onay isteği başarılı:', { listingId, response: response.data });
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Admin ilan onay isteği hatası:', {
      listingId,
      autoApprove,
      error: error?.response?.data || error?.message || error,
      status: error?.response?.status,
      fullError: error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const rejectListingApi = async (listingId: number, note?: string): Promise<ListingResponseDto> => {
  console.log('🔴 [API] Admin ilan red isteği başlatıldı:', { listingId, note, timestamp: new Date().toISOString() });
  try {
    const response = await axiosInstance.patch<ListingResponseDto>(`/admin/listings/${listingId}/reject`, note ?? '');
    console.log('✅ [API] Admin ilan red isteği başarılı:', { listingId, response: response.data });
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Admin ilan red isteği hatası:', {
      listingId,
      note,
      error: error?.response?.data || error?.message || error,
      status: error?.response?.status,
      fullError: error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const getAdminModerationRuleApi = async (): Promise<AdminModerationRuleDto | null> => {
  const response = await axiosInstance.get<AdminModerationRuleDto>('/admin/moderation-rule');
  return response.data ?? null;
};

export const saveAdminModerationRuleApi = async (payload: AdminModerationRuleDto): Promise<AdminModerationRuleDto> => {
  const response = await axiosInstance.put<AdminModerationRuleDto>('/admin/moderation-rule', payload);
  return response.data;
};

export const reopenListingApi = async (listingId: number): Promise<ListingResponseDto> => {
  console.log('🔄 [API] Admin ilanı tekrar açma isteği başlatıldı:', { listingId, timestamp: new Date().toISOString() });
  try {
    const response = await axiosInstance.patch<ListingResponseDto>(`/admin/listings/${listingId}/reopen`);
    console.log('✅ [API] Admin ilanı tekrar açma isteği başarılı:', { listingId, response: response.data });
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Admin ilanı tekrar açma isteği hatası:', {
      listingId,
      error: error?.response?.data || error?.message || error,
      status: error?.response?.status,
      fullError: error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const updateListingStatusApi = async (listingId: number, status: ListingStatus): Promise<ListingResponseDto> => {
  console.log('🔄 [API] Admin ilan durumu güncelleme isteği başlatıldı:', { listingId, status, timestamp: new Date().toISOString() });
  try {
    const response = await axiosInstance.patch<ListingResponseDto>(`/admin/listings/${listingId}/status`, status);
    console.log('✅ [API] Admin ilan durumu güncelleme isteği başarılı:', { listingId, status, response: response.data });
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] Admin ilan durumu güncelleme isteği hatası:', {
      listingId,
      status,
      error: error?.response?.data || error?.message || error,
      statusCode: error?.response?.status,
      fullError: error,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const getAdminListingByNumberApi = async (listingNumber: string): Promise<ListingResponseDto> => {
  console.log('Admin ilan numarası ile detay isteği:', listingNumber);
  try {
    const response = await axiosInstance.get<ListingResponseDto>(`/admin/listings/number/${listingNumber}`);
    return response.data;
  } catch (error) {
    console.error('Admin ilan numarası hatası:', error);
    return {
      success: false,
      message: 'İlan bulunamadı',
    } as ListingResponseDto;
  }
};

