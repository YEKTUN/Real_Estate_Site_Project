import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import {
  ListingListDto,
  ListingListResponseDto,
  ListingResponseDto,
  ListingStatus,
} from '../listing/DTOs/ListingDTOs';
import {
  AdminListingFilter,
  approveListingApi,
  getAdminListingsApi,
  rejectListingApi,
  reopenListingApi,
  updateListingStatusApi,
} from '../../api/adminApi';

export interface AdminListingState {
  items: ListingListDto[];
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  filters: AdminListingFilter;
  pagination: ListingListResponseDto['pagination'] | null;
}

const initialState: AdminListingState = {
  items: [],
  isLoading: false,
  isUpdating: false,
  error: null,
  filters: {
    page: 1,
    pageSize: 20,
    statuses: [ListingStatus.Pending, ListingStatus.Rejected],
  },
  pagination: null,
};

export const fetchAdminListings = createAsyncThunk<
  ListingListResponseDto,
  AdminListingFilter | undefined,
  { state: RootState; rejectValue: string }
>('adminListing/fetch', async (filter, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const activeFilters = filter ?? state.adminListing.filters;
    const response = await getAdminListingsApi(activeFilters);
    if (!response.success) {
      return rejectWithValue(response.message || 'Admin ilanları alınamadı');
    }
    return response;
  } catch (error) {
    console.error('Admin ilan listesi alınırken hata:', error);
    return rejectWithValue('Admin ilan listesi alınırken bir hata oluştu');
  }
});

export const approveListing = createAsyncThunk<
  { listingId: number; response: ListingResponseDto; auto: boolean },
  { listingId: number; auto?: boolean },
  { rejectValue: string }
>('adminListing/approve', async ({ listingId, auto = false }, { rejectWithValue }) => {
  try {
    console.log('🟢 [REDUX] approveListing thunk başlatıldı:', { listingId, auto });
    const response = await approveListingApi(listingId, auto);
    console.log('🟢 [REDUX] approveListing API yanıtı:', response);
    if (!response.success) {
      console.warn('⚠️ [REDUX] approveListing başarısız yanıt:', response);
      return rejectWithValue(response.message || 'İlan onaylanamadı');
    }
    console.log('✅ [REDUX] approveListing başarılı:', { listingId, response });
    return { listingId, response, auto };
  } catch (error: any) {
    console.error('❌ [REDUX] approveListing exception:', {
      listingId,
      auto,
      error: error?.message || error,
      fullError: error
    });
    return rejectWithValue(error?.response?.data?.message || error?.message || 'İlan onaylanırken bir hata oluştu');
  }
});

export const rejectListing = createAsyncThunk<
  { listingId: number; response: ListingResponseDto; note?: string },
  { listingId: number; note?: string },
  { rejectValue: string }
>('adminListing/reject', async ({ listingId, note }, { rejectWithValue }) => {
  try {
    console.log('🔴 [REDUX] rejectListing thunk başlatıldı:', { listingId, note });
    const response = await rejectListingApi(listingId, note);
    console.log('🔴 [REDUX] rejectListing API yanıtı:', response);
    if (!response.success) {
      console.warn('⚠️ [REDUX] rejectListing başarısız yanıt:', response);
      return rejectWithValue(response.message || 'İlan reddedilemedi');
    }
    console.log('✅ [REDUX] rejectListing başarılı:', { listingId, response });
    return { listingId, response, note };
  } catch (error: any) {
    console.error('❌ [REDUX] rejectListing exception:', {
      listingId,
      note,
      error: error?.message || error,
      fullError: error
    });
    return rejectWithValue(error?.response?.data?.message || error?.message || 'İlan reddedilirken bir hata oluştu');
  }
});

export const reopenListing = createAsyncThunk<
  { listingId: number; response: ListingResponseDto },
  { listingId: number },
  { rejectValue: string }
>('adminListing/reopen', async ({ listingId }, { rejectWithValue }) => {
  try {
    console.log('🔄 [REDUX] reopenListing thunk başlatıldı:', { listingId });
    const response = await reopenListingApi(listingId);
    console.log('🔄 [REDUX] reopenListing API yanıtı:', response);
    if (!response.success) {
      console.warn('⚠️ [REDUX] reopenListing başarısız yanıt:', response);
      return rejectWithValue(response.message || 'İlan açılamadı');
    }
    console.log('✅ [REDUX] reopenListing başarılı:', { listingId, response });
    return { listingId, response };
  } catch (error: any) {
    console.error('❌ [REDUX] reopenListing exception:', {
      listingId,
      error: error?.message || error,
      fullError: error
    });
    return rejectWithValue(error?.response?.data?.message || error?.message || 'İlan açılırken bir hata oluştu');
  }
});

export const updateListingStatus = createAsyncThunk<
  { listingId: number; status: ListingStatus; response: ListingResponseDto },
  { listingId: number; status: ListingStatus },
  { rejectValue: string }
>('adminListing/updateStatus', async ({ listingId, status }, { rejectWithValue }) => {
  try {
    const response = await updateListingStatusApi(listingId, status);
    if (!response.success) {
      return rejectWithValue(response.message || 'İlan durumu güncellenemedi');
    }
    return { listingId, status, response };
  } catch (error) {
    console.error('Admin ilan durumu güncelleme hatası:', error);
    return rejectWithValue('İlan durumu güncellenirken bir hata oluştu');
  }
});

const adminListingSlice = createSlice({
  name: 'adminListing',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<AdminListingFilter>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminListings.fulfilled, (state, action) => {
        state.isLoading = false;

        // Backend'den gelen string durumları (Pending, Rejected vb.) sayısal enum'a çevir
        const statusMap: Record<string, number> = {
          'Pending': ListingStatus.Pending,
          'Active': ListingStatus.Active,
          'Inactive': ListingStatus.Inactive,
          'Sold': ListingStatus.Sold,
          'Rented': ListingStatus.Rented,
          'Rejected': ListingStatus.Rejected,
          'Expired': ListingStatus.Expired
        };

        state.items = (action.payload.listings || []).map(item => ({
          ...item,
          status: typeof item.status === 'string'
            ? (statusMap[item.status] ?? item.status)
            : item.status
        }));

        state.pagination = action.payload.pagination || null;
        const incomingFilters = action.meta.arg ?? state.filters;
        state.filters = { ...state.filters, ...incomingFilters };
      })
      .addCase(fetchAdminListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Admin ilanları alınamadı';
      })
      .addCase(approveListing.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(approveListing.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Onaylanan ilanı listeden kaldır (sadece Pending ilanlar gösterilecek)
        state.items = state.items.filter((item) => item.id !== action.payload.listingId);
      })
      .addCase(approveListing.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = (action.payload as string) || 'İlan onaylanamadı';
      })
      .addCase(rejectListing.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(rejectListing.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Reddedilen ilanı listeden kaldır (sadece Pending ilanlar gösterilecek)
        state.items = state.items.filter((item) => item.id !== action.payload.listingId);
      })
      .addCase(rejectListing.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = (action.payload as string) || 'İlan reddedilemedi';
      })
      .addCase(reopenListing.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(reopenListing.fulfilled, (state, action) => {
        state.isUpdating = false;
        // İlan tekrar Pending durumuna döndü, listeyi yenile (backend'den güncel veriyi al)
        // State'te güncelleme yapmıyoruz, fetchAdminListings ile yeniden yüklenecek
      })
      .addCase(reopenListing.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = (action.payload as string) || 'İlan açılamadı';
      })
      .addCase(updateListingStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateListingStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Durum güncellemesi sonrası, ilan listeden kaldırılabilir veya güncellenebilir
        // Detay görünümü için state güncellemesi yapmıyoruz, component'te yeniden fetch yapılacak
      })
      .addCase(updateListingStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = (action.payload as string) || 'İlan durumu güncellenemedi';
      });
  },
});

export const { setFilters } = adminListingSlice.actions;

export const selectAdminListings = (state: RootState) => state.adminListing.items;
export const selectAdminFilters = (state: RootState) => state.adminListing.filters;
export const selectAdminLoading = (state: RootState) => state.adminListing.isLoading;
export const selectAdminUpdating = (state: RootState) => state.adminListing.isUpdating;
export const selectAdminPagination = (state: RootState) => state.adminListing.pagination;
export const selectAdminError = (state: RootState) => state.adminListing.error;

export default adminListingSlice.reducer;

