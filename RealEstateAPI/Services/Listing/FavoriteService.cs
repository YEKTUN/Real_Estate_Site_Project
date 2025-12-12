using Microsoft.Extensions.Logging;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Listing;

namespace RealEstateAPI.Services.Listing;

/// <summary>
/// Favori Service Implementasyonu
/// 
/// Favori iş mantığını yönetir.
/// </summary>
public class FavoriteService : IFavoriteService
{
    private readonly IFavoriteRepository _favoriteRepository;
    private readonly IListingRepository _listingRepository;
    private readonly ILogger<FavoriteService> _logger;

    public FavoriteService(
        IFavoriteRepository favoriteRepository,
        IListingRepository listingRepository,
        ILogger<FavoriteService> logger)
    {
        _favoriteRepository = favoriteRepository;
        _listingRepository = listingRepository;
        _logger = logger;
    }

    // ============================================================================
    // FAVORİ İŞLEMLERİ
    // ============================================================================

    public async Task<FavoriteResponseDto> AddToFavoritesAsync(int listingId, AddFavoriteDto? dto, string userId)
    {
        try
        {
            // İlan var mı kontrol et
            if (!await _listingRepository.ExistsAsync(listingId))
            {
                return new FavoriteResponseDto
                {
                    Success = false,
                    Message = "İlan bulunamadı"
                };
            }

            // Zaten favori mi kontrol et
            if (await _favoriteRepository.IsFavoritedAsync(userId, listingId))
            {
                return new FavoriteResponseDto
                {
                    Success = false,
                    Message = "Bu ilan zaten favorilerinizde",
                    IsFavorited = true
                };
            }

            var favorite = new FavoriteListing
            {
                UserId = userId,
                ListingId = listingId,
                Note = dto?.Note
            };

            await _favoriteRepository.AddAsync(favorite);

            _logger.LogInformation("Favori eklendi. UserId: {UserId}, ListingId: {ListingId}", userId, listingId);

            return new FavoriteResponseDto
            {
                Success = true,
                Message = "İlan favorilere eklendi",
                IsFavorited = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Favori ekleme hatası. ListingId: {ListingId}", listingId);
            return new FavoriteResponseDto
            {
                Success = false,
                Message = "Favori eklenirken bir hata oluştu"
            };
        }
    }

    public async Task<FavoriteResponseDto> RemoveFromFavoritesAsync(int listingId, string userId)
    {
        try
        {
            var result = await _favoriteRepository.RemoveAsync(userId, listingId);
            if (!result)
            {
                return new FavoriteResponseDto
                {
                    Success = false,
                    Message = "Favori bulunamadı",
                    IsFavorited = false
                };
            }

            _logger.LogInformation("Favori kaldırıldı. UserId: {UserId}, ListingId: {ListingId}", userId, listingId);

            return new FavoriteResponseDto
            {
                Success = true,
                Message = "İlan favorilerden kaldırıldı",
                IsFavorited = false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Favori kaldırma hatası. ListingId: {ListingId}", listingId);
            return new FavoriteResponseDto
            {
                Success = false,
                Message = "Favori kaldırılırken bir hata oluştu"
            };
        }
    }

    public async Task<FavoriteResponseDto> ToggleFavoriteAsync(int listingId, string userId)
    {
        try
        {
            if (await _favoriteRepository.IsFavoritedAsync(userId, listingId))
            {
                return await RemoveFromFavoritesAsync(listingId, userId);
            }
            else
            {
                return await AddToFavoritesAsync(listingId, null, userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Favori toggle hatası. ListingId: {ListingId}", listingId);
            return new FavoriteResponseDto
            {
                Success = false,
                Message = "Favori işlemi sırasında bir hata oluştu"
            };
        }
    }

    public async Task<FavoriteResponseDto> UpdateNoteAsync(int listingId, UpdateFavoriteNoteDto dto, string userId)
    {
        try
        {
            var result = await _favoriteRepository.UpdateNoteAsync(userId, listingId, dto.Note);
            if (result == null)
            {
                return new FavoriteResponseDto
                {
                    Success = false,
                    Message = "Favori bulunamadı"
                };
            }

            return new FavoriteResponseDto
            {
                Success = true,
                Message = "Favori notu güncellendi",
                IsFavorited = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Favori not güncelleme hatası. ListingId: {ListingId}", listingId);
            return new FavoriteResponseDto
            {
                Success = false,
                Message = "Favori notu güncellenirken bir hata oluştu"
            };
        }
    }

    // ============================================================================
    // FAVORİ LİSTELEME
    // ============================================================================

    public async Task<FavoriteListResponseDto> GetMyFavoritesAsync(string userId, int page = 1, int pageSize = 20)
    {
        try
        {
            var (favorites, totalCount) = await _favoriteRepository.GetByUserIdAsync(userId, page, pageSize);

            return new FavoriteListResponseDto
            {
                Success = true,
                Message = "Favorileriniz başarıyla getirildi",
                Favorites = favorites.Select(MapToDto).ToList(),
                Pagination = new PaginationDto
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Favoriler getirme hatası. UserId: {UserId}", userId);
            return new FavoriteListResponseDto
            {
                Success = false,
                Message = "Favorileriniz getirilirken bir hata oluştu"
            };
        }
    }

    public async Task<bool> IsFavoritedAsync(int listingId, string userId)
    {
        return await _favoriteRepository.IsFavoritedAsync(userId, listingId);
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private static FavoriteListingDto MapToDto(FavoriteListing favorite)
    {
        return new FavoriteListingDto
        {
            Id = favorite.Id,
            ListingId = favorite.ListingId,
            Listing = new ListingListDto
            {
                Id = favorite.Listing?.Id ?? 0,
                ListingNumber = favorite.Listing?.ListingNumber ?? string.Empty,
                Title = favorite.Listing?.Title ?? string.Empty,
                Category = favorite.Listing?.Category ?? ListingCategory.Residential,
                Type = favorite.Listing?.Type ?? ListingType.ForSale,
                PropertyType = favorite.Listing?.PropertyType ?? PropertyType.Apartment,
                Price = favorite.Listing?.Price ?? 0,
                Currency = favorite.Listing?.Currency ?? Currency.TRY,
                City = favorite.Listing?.City ?? string.Empty,
                District = favorite.Listing?.District ?? string.Empty,
                Neighborhood = favorite.Listing?.Neighborhood,
                GrossSquareMeters = favorite.Listing?.GrossSquareMeters,
                NetSquareMeters = favorite.Listing?.NetSquareMeters,
                RoomCount = favorite.Listing?.RoomCount,
                BuildingAge = favorite.Listing?.BuildingAge,
                FloorNumber = favorite.Listing?.FloorNumber,
                CoverImageUrl = favorite.Listing?.Images.FirstOrDefault(i => i.IsCoverImage)?.ImageUrl 
                                ?? favorite.Listing?.Images.FirstOrDefault()?.ImageUrl,
                Status = favorite.Listing?.Status ?? ListingStatus.Active,
                OwnerType = favorite.Listing?.OwnerType ?? ListingOwnerType.Owner,
                CreatedAt = favorite.Listing?.CreatedAt ?? DateTime.MinValue,
                ViewCount = favorite.Listing?.ViewCount ?? 0,
                FavoriteCount = favorite.Listing?.FavoriteCount ?? 0,
                IsFeatured = favorite.Listing?.IsFeatured ?? false,
                IsUrgent = favorite.Listing?.IsUrgent ?? false
            },
            Note = favorite.Note,
            CreatedAt = favorite.CreatedAt
        };
    }
}
