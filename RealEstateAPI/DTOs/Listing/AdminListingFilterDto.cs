using System.ComponentModel.DataAnnotations;
using RealEstateAPI.Models;

namespace RealEstateAPI.DTOs.Listing;

/// <summary>
/// Admin paneli için ilan filtreleme DTO'su
/// </summary>
public class AdminListingFilterDto
{
    /// <summary>Arama terimi (başlık, açıklama, şehir, ilçe)</summary>
    [StringLength(200)]
    public string? SearchTerm { get; set; }

    /// <summary>Durum filtreleri</summary>
    public List<ListingStatus>? Statuses { get; set; }

    /// <summary>Şehir filtresi</summary>
    [StringLength(50)]
    public string? City { get; set; }

    /// <summary>İlçe filtresi</summary>
    [StringLength(50)]
    public string? District { get; set; }

    /// <summary>Sahip e-posta filtresi</summary>
    [EmailAddress]
    public string? OwnerEmail { get; set; }

    /// <summary>İlan tipi filtresi</summary>
    public ListingType? Type { get; set; }

    /// <summary>Kategori filtresi</summary>
    public ListingCategory? Category { get; set; }

    /// <summary>Sayfa numarası</summary>
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    /// <summary>Sayfa boyutu</summary>
    [Range(1, 200)]
    public int PageSize { get; set; } = 20;
}

