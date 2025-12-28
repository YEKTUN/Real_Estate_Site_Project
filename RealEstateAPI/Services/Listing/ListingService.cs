using Microsoft.Extensions.Logging;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Listing;

namespace RealEstateAPI.Services.Listing;

/// <summary>
/// İlan Service Implementasyonu
/// 
/// İlan iş mantığını yönetir.
/// </summary>
public class ListingService : IListingService
{
    private readonly IListingRepository _listingRepository;
    private readonly IFavoriteRepository _favoriteRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly Services.Admin.IAdminModerationRuleService _adminModerationRuleService;
    private readonly IMessageService _messageService;
    private readonly ILogger<ListingService> _logger;

    public ListingService(
        IListingRepository listingRepository,
        IFavoriteRepository favoriteRepository,
        ICommentRepository commentRepository,
        Services.Admin.IAdminModerationRuleService adminModerationRuleService,
        IMessageService messageService,
        ILogger<ListingService> logger)
    {
        _listingRepository = listingRepository;
        _favoriteRepository = favoriteRepository;
        _commentRepository = commentRepository;
        _adminModerationRuleService = adminModerationRuleService;
        _messageService = messageService;
        _logger = logger;
    }

    // ============================================================================
    // İLAN CRUD İŞLEMLERİ
    // ============================================================================

    public async Task<ListingResponseDto> CreateAsync(CreateListingDto dto, string userId)
    {
        try
        {
            _logger.LogInformation("İlan oluşturuluyor. UserId: {UserId}", userId);

            var listing = new Models.Listing
            {
                Title = dto.Title,
                Description = dto.Description,
                Category = dto.Category,
                Type = dto.Type,
                PropertyType = dto.PropertyType,
                Price = dto.Price,
                Currency = dto.Currency,
                MonthlyDues = dto.MonthlyDues,
                Deposit = dto.Deposit,
                IsNegotiable = dto.IsNegotiable,
                City = dto.City,
                District = dto.District,
                Neighborhood = dto.Neighborhood,
                FullAddress = dto.FullAddress,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                GrossSquareMeters = dto.GrossSquareMeters,
                NetSquareMeters = dto.NetSquareMeters,
                RoomCount = dto.RoomCount,
                BathroomCount = dto.BathroomCount,
                BuildingAge = dto.BuildingAge,
                FloorNumber = dto.FloorNumber,
                TotalFloors = dto.TotalFloors,
                HeatingType = dto.HeatingType,
                BuildingStatus = dto.BuildingStatus,
                UsageStatus = dto.UsageStatus,
                FacingDirection = dto.FacingDirection,
                DeedStatus = dto.DeedStatus,
                IsSuitableForCredit = dto.IsSuitableForCredit,
                IsSuitableForTrade = dto.IsSuitableForTrade,
                OwnerType = dto.OwnerType,
                UserId = userId,
                Status = ListingStatus.Pending
            };

            var createdListing = await _listingRepository.CreateAsync(listing);
            await TryAutoApproveAsync(createdListing);

            // Özellikleri ekle (null kontrolü ile)
            if (dto.InteriorFeatures != null && dto.InteriorFeatures.Any())
            {
                await _listingRepository.UpdateInteriorFeaturesAsync(createdListing.Id, dto.InteriorFeatures);
            }

            if (dto.ExteriorFeatures != null && dto.ExteriorFeatures.Any())
            {
                await _listingRepository.UpdateExteriorFeaturesAsync(createdListing.Id, dto.ExteriorFeatures);
            }

            _logger.LogInformation("İlan oluşturuldu. ListingId: {ListingId}", createdListing.Id);

            return new ListingResponseDto
            {
                Success = true,
                Message = "İlan başarıyla oluşturuldu",
                ListingId = createdListing.Id
            };
        }
        catch (Exception ex)
        {
            // Detaylı hata loglama - Database hatalarını da yakalayalım
            _logger.LogError(ex, "İlan oluşturma hatası. Exception: {ExceptionMessage}, InnerException: {InnerException}, StackTrace: {StackTrace}", 
                ex.Message, 
                ex.InnerException?.Message, 
                ex.StackTrace);
            
            // Development ortamında detaylı hata mesajı gönder
            var errorMessage = "İlan oluşturulurken bir hata oluştu";
            if (ex.InnerException != null)
            {
                errorMessage += $": {ex.InnerException.Message}";
            }
            else
            {
                errorMessage += $": {ex.Message}";
            }
            
            return new ListingResponseDto
            {
                Success = false,
                Message = errorMessage
            };
        }
    }

    private async Task TryAutoApproveAsync(Models.Listing listing)
    {
        try
        {
            var rule = await _adminModerationRuleService.GetEnabledAsync();
            if (rule == null || !rule.IsAutomataEnabled)
            {
                return;
            }

            if (rule.Statuses != null && rule.Statuses.Any() && !rule.Statuses.Contains(listing.Status))
                return;

            if (rule.BlockedKeywords != null && rule.BlockedKeywords.Count > 0)
            {
                var title = listing.Title?.ToLowerInvariant() ?? string.Empty;
                var desc = listing.Description?.ToLowerInvariant() ?? string.Empty;
                var hasBlocked = rule.BlockedKeywords.Any(k =>
                {
                    var kw = k.ToLowerInvariant();
                    return title.Contains(kw) || desc.Contains(kw);
                });
                if (hasBlocked) return;
            }

            var updated = await _listingRepository.UpdateStatusAsync(listing.Id, ListingStatus.Active, null);
            if (updated)
            {
                _logger.LogInformation("Otomatik onay uygulandı. ListingId: {ListingId}", listing.Id);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Otomatik onay kontrolü sırasında hata. ListingId: {ListingId}", listing.Id);
        }
    }

    public async Task<ListingResponseDto> UpdateAsync(int listingId, UpdateListingDto dto, string userId)
    {
        try
        {
            // Yetki kontrolü
            if (!await _listingRepository.IsOwnerAsync(listingId, userId))
            {
                return new ListingResponseDto
                {
                    Success = false,
                    Message = "Bu ilanı düzenleme yetkiniz yok"
                };
            }

            var listing = await _listingRepository.GetByIdAsync(listingId);
            if (listing == null)
            {
                return new ListingResponseDto
                {
                    Success = false,
                    Message = "İlan bulunamadı"
                };
            }

            // Güncelleme
            if (dto.Title != null) listing.Title = dto.Title;
            if (dto.Description != null) listing.Description = dto.Description;
            if (dto.Category.HasValue) listing.Category = dto.Category.Value;
            if (dto.Type.HasValue) listing.Type = dto.Type.Value;
            if (dto.PropertyType.HasValue) listing.PropertyType = dto.PropertyType.Value;
            if (dto.Price.HasValue) listing.Price = dto.Price.Value;
            if (dto.Currency.HasValue) listing.Currency = dto.Currency.Value;
            if (dto.MonthlyDues.HasValue) listing.MonthlyDues = dto.MonthlyDues;
            if (dto.Deposit.HasValue) listing.Deposit = dto.Deposit;
            if (dto.IsNegotiable.HasValue) listing.IsNegotiable = dto.IsNegotiable.Value;
            if (dto.City != null) listing.City = dto.City;
            if (dto.District != null) listing.District = dto.District;
            if (dto.Neighborhood != null) listing.Neighborhood = dto.Neighborhood;
            if (dto.FullAddress != null) listing.FullAddress = dto.FullAddress;
            if (dto.Latitude.HasValue) listing.Latitude = dto.Latitude;
            if (dto.Longitude.HasValue) listing.Longitude = dto.Longitude;
            if (dto.GrossSquareMeters.HasValue) listing.GrossSquareMeters = dto.GrossSquareMeters;
            if (dto.NetSquareMeters.HasValue) listing.NetSquareMeters = dto.NetSquareMeters;
            if (dto.RoomCount != null) listing.RoomCount = dto.RoomCount;
            if (dto.BathroomCount.HasValue) listing.BathroomCount = dto.BathroomCount;
            if (dto.BuildingAge.HasValue) listing.BuildingAge = dto.BuildingAge;
            if (dto.FloorNumber.HasValue) listing.FloorNumber = dto.FloorNumber;
            if (dto.TotalFloors.HasValue) listing.TotalFloors = dto.TotalFloors;
            if (dto.HeatingType.HasValue) listing.HeatingType = dto.HeatingType;
            if (dto.BuildingStatus.HasValue) listing.BuildingStatus = dto.BuildingStatus;
            if (dto.UsageStatus.HasValue) listing.UsageStatus = dto.UsageStatus;
            if (dto.FacingDirection.HasValue) listing.FacingDirection = dto.FacingDirection;
            if (dto.DeedStatus.HasValue) listing.DeedStatus = dto.DeedStatus;
            if (dto.IsSuitableForCredit.HasValue) listing.IsSuitableForCredit = dto.IsSuitableForCredit.Value;
            if (dto.IsSuitableForTrade.HasValue) listing.IsSuitableForTrade = dto.IsSuitableForTrade.Value;
            if (dto.OwnerType.HasValue) listing.OwnerType = dto.OwnerType.Value;

            await _listingRepository.UpdateAsync(listing);

            // Özellikleri güncelle
            if (dto.InteriorFeatures != null)
            {
                await _listingRepository.UpdateInteriorFeaturesAsync(listingId, dto.InteriorFeatures);
            }

            if (dto.ExteriorFeatures != null)
            {
                await _listingRepository.UpdateExteriorFeaturesAsync(listingId, dto.ExteriorFeatures);
            }

            _logger.LogInformation("İlan güncellendi. ListingId: {ListingId}", listingId);

            return new ListingResponseDto
            {
                Success = true,
                Message = "İlan başarıyla güncellendi",
                ListingId = listingId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İlan güncelleme hatası. ListingId: {ListingId}", listingId);
            return new ListingResponseDto
            {
                Success = false,
                Message = "İlan güncellenirken bir hata oluştu"
            };
        }
    }

    public async Task<ListingResponseDto> DeleteAsync(int listingId, string userId)
    {
        try
        {
            // Yetki kontrolü
            if (!await _listingRepository.IsOwnerAsync(listingId, userId))
            {
                return new ListingResponseDto
                {
                    Success = false,
                    Message = "Bu ilanı silme yetkiniz yok"
                };
            }

            var result = await _listingRepository.DeleteAsync(listingId);
            if (!result)
            {
                return new ListingResponseDto
                {
                    Success = false,
                    Message = "İlan bulunamadı"
                };
            }

            _logger.LogInformation("İlan silindi. ListingId: {ListingId}", listingId);

            return new ListingResponseDto
            {
                Success = true,
                Message = "İlan başarıyla silindi"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İlan silme hatası. ListingId: {ListingId}", listingId);
            return new ListingResponseDto
            {
                Success = false,
                Message = "İlan silinirken bir hata oluştu"
            };
        }
    }

    public async Task<ListingResponseDto> GetByIdAsync(int listingId, string? userId = null)
    {
        try
        {
            var listing = await _listingRepository.GetByIdWithDetailsAsync(listingId);
            if (listing == null)
            {
                return new ListingResponseDto
                {
                    Success = false,
                    Message = "İlan bulunamadı"
                };
            }

            // Görüntülenme sayısını artır (İlan sahibi değilse)
            if (string.IsNullOrEmpty(userId) || listing.UserId != userId)
            {
                await _listingRepository.IncrementViewCountAsync(listingId);
            }

            var detailDto = MapToDetailDto(listing);
            
            // Kullanıcı favorisi mi kontrol et
            if (!string.IsNullOrEmpty(userId))
            {
                detailDto.IsFavorited = await _favoriteRepository.IsFavoritedAsync(userId, listingId);
            }

            // Yorum sayısı
            detailDto.CommentCount = await _commentRepository.GetCommentCountAsync(listingId);

            return new ListingResponseDto
            {
                Success = true,
                Message = "İlan başarıyla getirildi",
                Listing = detailDto
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İlan getirme hatası. ListingId: {ListingId}", listingId);
            return new ListingResponseDto
            {
                Success = false,
                Message = "İlan getirilirken bir hata oluştu"
            };
        }
    }

    public async Task<ListingResponseDto> GetByListingNumberAsync(string listingNumber, string? userId = null)
    {
        try
        {
            var listing = await _listingRepository.GetByListingNumberAsync(listingNumber);
            if (listing == null)
            {
                return new ListingResponseDto
                {
                    Success = false,
                    Message = "İlan bulunamadı"
                };
            }

            return await GetByIdAsync(listing.Id, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İlan getirme hatası. ListingNumber: {ListingNumber}", listingNumber);
            return new ListingResponseDto
            {
                Success = false,
                Message = "İlan getirilirken bir hata oluştu"
            };
        }
    }

    // ============================================================================
    // İLAN LİSTELEME & ARAMA
    // ============================================================================

    public async Task<ListingListResponseDto> GetAllAsync(int page = 1, int pageSize = 20)
    {
        try
        {
            var (listings, totalCount) = await _listingRepository.GetAllAsync(page, pageSize);

            return new ListingListResponseDto
            {
                Success = true,
                Message = "İlanlar başarıyla getirildi",
                Listings = listings.Select(MapToListDto).ToList(),
                Pagination = CreatePagination(page, pageSize, totalCount)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İlan listesi getirme hatası");
            return new ListingListResponseDto
            {
                Success = false,
                Message = "İlanlar getirilirken bir hata oluştu"
            };
        }
    }

    public async Task<ListingListResponseDto> SearchAsync(ListingSearchDto searchDto)
    {
        try
        {
            var (listings, totalCount) = await _listingRepository.SearchAsync(searchDto);

            return new ListingListResponseDto
            {
                Success = true,
                Message = $"{totalCount} ilan bulundu",
                Listings = listings.Select(MapToListDto).ToList(),
                Pagination = CreatePagination(searchDto.Page, searchDto.PageSize, totalCount)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İlan arama hatası");
            return new ListingListResponseDto
            {
                Success = false,
                Message = "İlan araması yapılırken bir hata oluştu"
            };
        }
    }

    public async Task<ListingListResponseDto> GetMyListingsAsync(string userId, int page = 1, int pageSize = 20)
    {
        try
        {
            var (listings, totalCount) = await _listingRepository.GetByUserIdAsync(userId, page, pageSize);

            return new ListingListResponseDto
            {
                Success = true,
                Message = "İlanlarınız başarıyla getirildi",
                Listings = listings.Select(MapToListDto).ToList(),
                Pagination = CreatePagination(page, pageSize, totalCount)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kullanıcı ilanları getirme hatası. UserId: {UserId}", userId);
            return new ListingListResponseDto
            {
                Success = false,
                Message = "İlanlarınız getirilirken bir hata oluştu"
            };
        }
    }

    public async Task<ListingListResponseDto> GetFeaturedAsync(int count = 10)
    {
        try
        {
            var listings = await _listingRepository.GetFeaturedAsync(count);

            return new ListingListResponseDto
            {
                Success = true,
                Message = "Öne çıkan ilanlar getirildi",
                Listings = listings.Select(MapToListDto).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Öne çıkan ilanlar getirme hatası");
            return new ListingListResponseDto
            {
                Success = false,
                Message = "Öne çıkan ilanlar getirilirken bir hata oluştu"
            };
        }
    }

    public async Task<ListingListResponseDto> GetLatestAsync(int count = 10)
    {
        try
        {
            var listings = await _listingRepository.GetLatestAsync(count);

            return new ListingListResponseDto
            {
                Success = true,
                Message = "Son eklenen ilanlar getirildi",
                Listings = listings.Select(MapToListDto).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Son ilanlar getirme hatası");
            return new ListingListResponseDto
            {
                Success = false,
                Message = "Son ilanlar getirilirken bir hata oluştu"
            };
        }
    }

    public async Task<ListingListResponseDto> GetForAdminAsync(AdminListingFilterDto filter)
    {
        try
        {
            var (listings, totalCount) = await _listingRepository.GetForAdminAsync(filter);

            return new ListingListResponseDto
            {
                Success = true,
                Message = $"{totalCount} ilan bulundu",
                Listings = listings.Select(MapToListDto).ToList(),
                Pagination = CreatePagination(filter.Page, filter.PageSize, totalCount)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin ilan listesi alınırken hata oluştu");
            return new ListingListResponseDto
            {
                Success = false,
                Message = "Admin ilan listesi alınırken bir hata oluştu"
            };
        }
    }

    public async Task<ListingListResponseDto> GetSimilarAsync(int listingId, int count = 6)
    {
        try
        {
            var listings = await _listingRepository.GetSimilarAsync(listingId, count);

            return new ListingListResponseDto
            {
                Success = true,
                Message = "Benzer ilanlar getirildi",
                Listings = listings.Select(MapToListDto).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Benzer ilanlar getirme hatası. ListingId: {ListingId}", listingId);
            return new ListingListResponseDto
            {
                Success = false,
                Message = "Benzer ilanlar getirilirken bir hata oluştu"
            };
        }
    }

    // ============================================================================
    // İLAN DURUMU
    // ============================================================================

    public async Task<ListingResponseDto> UpdateStatusAsync(int listingId, ListingStatus status, string userId)
    {
        try
        {
            var listing = await _listingRepository.GetByIdAsync(listingId);
            if (listing == null)
            {
                return new ListingResponseDto { Success = false, Message = "İlan bulunamadı" };
            }

            if (listing.UserId != userId)
            {
                return new ListingResponseDto { Success = false, Message = "Bu ilanın durumunu değiştirme yetkiniz yok" };
            }

            // KULLANICI YETKİ KONTROLLERİ
            // 1. Kullanıcı sadece Active (Yayında) veya Inactive (Yayında Değil) yapabilir
            if (status != ListingStatus.Active && status != ListingStatus.Inactive)
            {
                return new ListingResponseDto { Success = false, Message = "Bu duruma geçiş yetkiniz yok" };
            }

            // 2. Eğer ilan Rejected (Reddedildi) ise, kullanıcı bunu Aktif yapamaz
            // Reddedilen ilanı sadece Admin tekrar Pending yapabilir veya Admin onaylayabilir.
            if (listing.Status == ListingStatus.Rejected && status == ListingStatus.Active)
            {
                return new ListingResponseDto { Success = false, Message = "Reddedilen ilanı yayına alamazsınız. Lütfen admin ile iletişime geçin." };
            }

            // 3. Eğer ilan Pending (Bekliyor) ise, kullanıcı bunu Aktif yapamaz (Admin onayı beklemeli)
            if (listing.Status == ListingStatus.Pending && status == ListingStatus.Active)
            {
                return new ListingResponseDto { Success = false, Message = "İlanınız henüz onaylanmamış. Lütfen onaylanmasını bekleyin." };
            }

            var result = await _listingRepository.UpdateStatusAsync(listingId, status, null);
            return new ListingResponseDto
            {
                Success = true,
                Message = status == ListingStatus.Active ? "İlan yayına alındı" : "İlan yayından kaldırıldı (Pasif)"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İlan durumu güncelleme hatası. ListingId: {ListingId}", listingId);
            return new ListingResponseDto
            {
                Success = false,
                Message = "İlan durumu güncellenirken bir hata oluştu"
            };
        }
    }

    public async Task<ListingResponseDto> UpdateStatusAsAdminAsync(int listingId, ListingStatus status, string adminUserId, string? note = null, bool autoApprove = false)
    {
        try
        {
            var exists = await _listingRepository.ExistsAsync(listingId);
            if (!exists)
            {
                return new ListingResponseDto
                {
                    Success = false,
                    Message = "İlan bulunamadı"
                };
            }

            // İlan bilgilerini al (mesaj göndermek için)
            var listing = await _listingRepository.GetByIdAsync(listingId);
            if (listing == null)
            {
                return new ListingResponseDto
                {
                    Success = false,
                    Message = "İlan bulunamadı"
                };
            }

            // Reddedilme durumunda note'u rejectionReason olarak kullan
            string? rejectionReason = status == ListingStatus.Rejected ? note : null;
            var updateResult = await _listingRepository.UpdateStatusAsync(listingId, status, rejectionReason);
            if (!updateResult)
            {
                return new ListingResponseDto
                {
                    Success = false,
                    Message = "İlan durumu güncellenemedi"
                };
            }

            var action = autoApprove ? "otomatik" : "manuel";
            _logger.LogInformation("Admin ilan durumu güncelledi. ListingId: {ListingId}, Status: {Status}, AdminId: {AdminId}, Mode: {Mode}, Note: {Note}",
                listingId, status, adminUserId, action, note ?? "-");

            // İlan sahibine mesaj gönder
            try
            {
                string messageContent = status switch
                {
                    ListingStatus.Active => $"İlanınız (#{listing.ListingNumber} - {listing.Title}) onaylandı ve yayına alındı. İlanınız artık aktif durumda.",
                    ListingStatus.Rejected => $"İlanınız (#{listing.ListingNumber} - {listing.Title}) reddedildi." + 
                        (!string.IsNullOrEmpty(rejectionReason) ? $" Red sebebi: {rejectionReason}" : ""),
                    ListingStatus.Pending => $"İlanınız (#{listing.ListingNumber} - {listing.Title}) onay bekliyor durumuna döndürüldü. İnceleme sonrası tekrar değerlendirilecektir.",
                    ListingStatus.Inactive => $"İlanınız (#{listing.ListingNumber} - {listing.Title}) yayından kaldırıldı. İlanınız artık pasif durumda.",
                    _ => $"İlanınızın (#{listing.ListingNumber} - {listing.Title}) durumu güncellendi."
                };

                _logger.LogInformation("İlan sahibine mesaj gönderme denemesi başlatılıyor. ListingId: {ListingId}, Status: {Status}, SellerId: {SellerId}", 
                    listingId, status, listing.UserId);
                
                var messageSent = await _messageService.SendAdminNotificationAsync(listingId, adminUserId, messageContent);
                
                if (messageSent)
                {
                    _logger.LogInformation("İlan sahibine bildirim mesajı başarıyla gönderildi. ListingId: {ListingId}, Status: {Status}", listingId, status);
                }
                else
                {
                    _logger.LogWarning("İlan sahibine bildirim mesajı gönderilemedi (false döndü). ListingId: {ListingId}, Status: {Status}", listingId, status);
                }
            }
            catch (Exception ex)
            {
                // Mesaj gönderme hatası durumunda işlemi durdurmuyoruz, sadece logluyoruz
                _logger.LogError(ex, "İlan sahibine bildirim mesajı gönderilirken exception oluştu. ListingId: {ListingId}, Error: {Error}", 
                    listingId, ex.Message);
            }

            return new ListingResponseDto
            {
                Success = true,
                Message = "İlan durumu güncellendi"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin ilan durumu güncelleme hatası. ListingId: {ListingId}", listingId);
            return new ListingResponseDto
            {
                Success = false,
                Message = "İlan durumu güncellenirken bir hata oluştu"
            };
        }
    }

    // ============================================================================
    // GÖRSEL İŞLEMLERİ
    // ============================================================================

    public async Task<ImageResponseDto> AddImageAsync(int listingId, UploadImageDto dto, string userId)
    {
        try
        {
            if (!await _listingRepository.IsOwnerAsync(listingId, userId))
            {
                return new ImageResponseDto
                {
                    Success = false,
                    Message = "Bu ilana görsel ekleme yetkiniz yok"
                };
            }

            var image = new ListingImage
            {
                ListingId = listingId,
                ImageUrl = dto.ImageUrl,
                ThumbnailUrl = dto.ThumbnailUrl,
                CloudinaryPublicId = dto.CloudinaryPublicId,
                AltText = dto.AltText,
                IsCoverImage = dto.IsCoverImage,
                DisplayOrder = dto.DisplayOrder
            };

            var addedImage = await _listingRepository.AddImageAsync(image);

            return new ImageResponseDto
            {
                Success = true,
                Message = "Görsel başarıyla eklendi",
                Image = MapToImageDto(addedImage)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Görsel ekleme hatası. ListingId: {ListingId}", listingId);
            return new ImageResponseDto
            {
                Success = false,
                Message = "Görsel eklenirken bir hata oluştu"
            };
        }
    }

    public async Task<ImageResponseDto> DeleteImageAsync(int listingId, int imageId, string userId)
    {
        try
        {
            if (!await _listingRepository.IsOwnerAsync(listingId, userId))
            {
                return new ImageResponseDto
                {
                    Success = false,
                    Message = "Bu görseli silme yetkiniz yok"
                };
            }

            var result = await _listingRepository.DeleteImageAsync(imageId);
            if (!result)
            {
                return new ImageResponseDto
                {
                    Success = false,
                    Message = "Görsel bulunamadı"
                };
            }

            return new ImageResponseDto
            {
                Success = true,
                Message = "Görsel başarıyla silindi"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Görsel silme hatası. ImageId: {ImageId}", imageId);
            return new ImageResponseDto
            {
                Success = false,
                Message = "Görsel silinirken bir hata oluştu"
            };
        }
    }

    public async Task<ImageResponseDto> SetCoverImageAsync(int listingId, int imageId, string userId)
    {
        try
        {
            if (!await _listingRepository.IsOwnerAsync(listingId, userId))
            {
                return new ImageResponseDto
                {
                    Success = false,
                    Message = "Bu işlem için yetkiniz yok"
                };
            }

            await _listingRepository.SetCoverImageAsync(listingId, imageId);

            return new ImageResponseDto
            {
                Success = true,
                Message = "Kapak fotoğrafı değiştirildi"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kapak fotoğrafı değiştirme hatası. ImageId: {ImageId}", imageId);
            return new ImageResponseDto
            {
                Success = false,
                Message = "Kapak fotoğrafı değiştirilirken bir hata oluştu"
            };
        }
    }

    public async Task<ImageListResponseDto> GetImagesAsync(int listingId)
    {
        try
        {
            var images = await _listingRepository.GetImagesAsync(listingId);

            return new ImageListResponseDto
            {
                Success = true,
                Message = "Görseller getirildi",
                Images = images.Select(MapToImageDto).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Görseller getirme hatası. ListingId: {ListingId}", listingId);
            return new ImageListResponseDto
            {
                Success = false,
                Message = "Görseller getirilirken bir hata oluştu"
            };
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private static ListingListDto MapToListDto(Models.Listing listing)
    {
        return new ListingListDto
        {
            Id = listing.Id,
            ListingNumber = listing.ListingNumber,
            Title = listing.Title,
            Category = listing.Category,
            Type = listing.Type,
            PropertyType = listing.PropertyType,
            Price = listing.Price,
            Currency = listing.Currency,
            City = listing.City,
            District = listing.District,
            Neighborhood = listing.Neighborhood,
            GrossSquareMeters = listing.GrossSquareMeters,
            NetSquareMeters = listing.NetSquareMeters,
            RoomCount = listing.RoomCount,
            BuildingAge = listing.BuildingAge,
            FloorNumber = listing.FloorNumber,
            CoverImageUrl = listing.Images.FirstOrDefault(i => i.IsCoverImage)?.ImageUrl 
                            ?? listing.Images.FirstOrDefault()?.ImageUrl,
            Status = listing.Status,
            OwnerType = listing.OwnerType,
            OwnerId = listing.User?.Id,
            OwnerName = listing.User?.Name,
            OwnerSurname = listing.User?.Surname,
            OwnerEmail = listing.User?.Email,
            CreatedAt = listing.CreatedAt,
            ViewCount = listing.ViewCount,
            FavoriteCount = listing.FavoriteCount,
            IsFeatured = listing.IsFeatured,
            IsUrgent = listing.IsUrgent,
            RejectionReason = listing.RejectionReason,
            RejectedAt = listing.RejectedAt
        };
    }

    private static ListingDetailDto MapToDetailDto(Models.Listing listing)
    {
        return new ListingDetailDto
        {
            Id = listing.Id,
            ListingNumber = listing.ListingNumber,
            Title = listing.Title,
            Description = listing.Description,
            Category = listing.Category,
            Type = listing.Type,
            PropertyType = listing.PropertyType,
            Price = listing.Price,
            Currency = listing.Currency,
            MonthlyDues = listing.MonthlyDues,
            Deposit = listing.Deposit,
            IsNegotiable = listing.IsNegotiable,
            City = listing.City,
            District = listing.District,
            Neighborhood = listing.Neighborhood,
            FullAddress = listing.FullAddress,
            Latitude = listing.Latitude,
            Longitude = listing.Longitude,
            GrossSquareMeters = listing.GrossSquareMeters,
            NetSquareMeters = listing.NetSquareMeters,
            RoomCount = listing.RoomCount,
            BathroomCount = listing.BathroomCount,
            BuildingAge = listing.BuildingAge,
            FloorNumber = listing.FloorNumber,
            TotalFloors = listing.TotalFloors,
            HeatingType = listing.HeatingType,
            BuildingStatus = listing.BuildingStatus,
            UsageStatus = listing.UsageStatus,
            FacingDirection = listing.FacingDirection,
            DeedStatus = listing.DeedStatus,
            IsSuitableForCredit = listing.IsSuitableForCredit,
            IsSuitableForTrade = listing.IsSuitableForTrade,
            InteriorFeatures = listing.InteriorFeatures.Select(f => f.FeatureType).ToList(),
            ExteriorFeatures = listing.ExteriorFeatures.Select(f => f.FeatureType).ToList(),
            Images = listing.Images.Select(MapToImageDto).ToList(),
            Owner = new ListingOwnerDto
            {
                Id = listing.User?.Id ?? string.Empty,
                Name = listing.User?.Name ?? string.Empty,
                Surname = listing.User?.Surname ?? string.Empty,
                Phone = listing.User?.Phone,
                Email = listing.User?.Email,
                ProfilePictureUrl = listing.User?.ProfilePictureUrl,
                MemberSince = listing.User?.CreatedAt ?? DateTime.MinValue
            },
            OwnerType = listing.OwnerType,
            Status = listing.Status,
            CreatedAt = listing.CreatedAt,
            UpdatedAt = listing.UpdatedAt,
            PublishedAt = listing.PublishedAt,
            ViewCount = listing.ViewCount,
            FavoriteCount = listing.FavoriteCount,
            IsFeatured = listing.IsFeatured,
            IsUrgent = listing.IsUrgent,
            RejectionReason = listing.RejectionReason,
            RejectedAt = listing.RejectedAt
        };
    }

    private static ListingImageDto MapToImageDto(ListingImage image)
    {
        return new ListingImageDto
        {
            Id = image.Id,
            ImageUrl = image.ImageUrl,
            ThumbnailUrl = image.ThumbnailUrl,
            CloudinaryPublicId = image.CloudinaryPublicId,
            AltText = image.AltText,
            IsCoverImage = image.IsCoverImage,
            DisplayOrder = image.DisplayOrder
        };
    }

    private static PaginationDto CreatePagination(int page, int pageSize, int totalCount)
    {
        return new PaginationDto
        {
            CurrentPage = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }
}
