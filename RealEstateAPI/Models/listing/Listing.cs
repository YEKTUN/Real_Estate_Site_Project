using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateAPI.Models;

/// <summary>
/// Emlak İlanı Ana Modeli
/// 
/// Sahibinden.com benzeri emlak ilanlarının ana veri modeli.
/// İlan tipi, fiyat, konum, özellikler ve ilişkili veriler bu model üzerinden yönetilir.
/// </summary>
public class Listing
{
    // ============================================================================
    // PRIMARY KEY
    // ============================================================================

    /// <summary>
    /// İlan benzersiz ID'si
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// İlan numarası (sahibinden.com'daki gibi benzersiz numara)
    /// </summary>
    [Required]
    [StringLength(20)]
    public string ListingNumber { get; set; } = string.Empty;

    // ============================================================================
    // TEMEL BİLGİLER
    // ============================================================================

    /// <summary>
    /// İlan başlığı
    /// </summary>
    [Required(ErrorMessage = "İlan başlığı zorunludur")]
    [StringLength(200, MinimumLength = 10, ErrorMessage = "Başlık 10-200 karakter arasında olmalıdır")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// İlan açıklaması
    /// </summary>
    [Required(ErrorMessage = "İlan açıklaması zorunludur")]
    [StringLength(5000, MinimumLength = 50, ErrorMessage = "Açıklama 50-5000 karakter arasında olmalıdır")]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// İlan kategorisi (Konut, İşyeri, Arsa, vb.)
    /// </summary>
    [Required]
    public ListingCategory Category { get; set; }

    /// <summary>
    /// İlan tipi (Satılık, Kiralık, Devren, vb.)
    /// </summary>
    [Required]
    public ListingType Type { get; set; }

    /// <summary>
    /// Emlak tipi (Daire, Villa, Müstakil Ev, vb.)
    /// </summary>
    [Required]
    public PropertyType PropertyType { get; set; }

    // ============================================================================
    // FİYAT BİLGİLERİ
    // ============================================================================

    /// <summary>
    /// Fiyat (TL)
    /// </summary>
    [Required(ErrorMessage = "Fiyat zorunludur")]
    [Range(1, 100000000000, ErrorMessage = "Geçerli bir fiyat giriniz")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    /// <summary>
    /// Para birimi
    /// </summary>
    [Required]
    public Currency Currency { get; set; } = Currency.TRY;

    /// <summary>
    /// Aidat (Aylık, opsiyonel)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? MonthlyDues { get; set; }

    /// <summary>
    /// Depozito (Kiralık için)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? Deposit { get; set; }

    /// <summary>
    /// Fiyat pazarlık yapılabilir mi?
    /// </summary>
    public bool IsNegotiable { get; set; } = false;

    // ============================================================================
    // KONUM BİLGİLERİ
    // ============================================================================

    /// <summary>
    /// İl
    /// </summary>
    [Required(ErrorMessage = "İl zorunludur")]
    [StringLength(50)]
    public string City { get; set; } = string.Empty;

    /// <summary>
    /// İlçe
    /// </summary>
    [Required(ErrorMessage = "İlçe zorunludur")]
    [StringLength(50)]
    public string District { get; set; } = string.Empty;

    /// <summary>
    /// Mahalle/Semt
    /// </summary>
    [StringLength(100)]
    public string? Neighborhood { get; set; }

    /// <summary>
    /// Tam adres (opsiyonel, gizli tutulabilir)
    /// </summary>
    [StringLength(300)]
    public string? FullAddress { get; set; }

    /// <summary>
    /// Enlem (Google Maps için)
    /// </summary>
    public double? Latitude { get; set; }

    /// <summary>
    /// Boylam (Google Maps için)
    /// </summary>
    public double? Longitude { get; set; }

    // ============================================================================
    // EMLAK ÖZELLİKLERİ
    // ============================================================================

    /// <summary>
    /// Brüt metrekare
    /// </summary>
    [Range(1, 100000, ErrorMessage = "Geçerli bir m² değeri giriniz")]
    public int? GrossSquareMeters { get; set; }

    /// <summary>
    /// Net metrekare
    /// </summary>
    [Range(1, 100000, ErrorMessage = "Geçerli bir m² değeri giriniz")]
    public int? NetSquareMeters { get; set; }

    /// <summary>
    /// Oda sayısı (örn: "3+1", "2+1", "Stüdyo")
    /// </summary>
    [StringLength(20)]
    public string? RoomCount { get; set; }

    /// <summary>
    /// Banyo sayısı
    /// </summary>
    [Range(0, 20)]
    public int? BathroomCount { get; set; }

    /// <summary>
    /// Bina yaşı
    /// </summary>
    [Range(0, 200)]
    public int? BuildingAge { get; set; }

    /// <summary>
    /// Bulunduğu kat
    /// </summary>
    public int? FloorNumber { get; set; }

    /// <summary>
    /// Toplam kat sayısı
    /// </summary>
    [Range(1, 100)]
    public int? TotalFloors { get; set; }

    /// <summary>
    /// Isınma tipi
    /// </summary>
    public HeatingType? HeatingType { get; set; }

    /// <summary>
    /// Yapı durumu (Sıfır, İkinci El, vb.)
    /// </summary>
    public BuildingStatus? BuildingStatus { get; set; }

    /// <summary>
    /// Kullanım durumu (Boş, Kiracılı, Mülk sahibi oturuyor)
    /// </summary>
    public UsageStatus? UsageStatus { get; set; }

    /// <summary>
    /// Cephe (Kuzey, Güney, Doğu, Batı)
    /// </summary>
    public FacingDirection? FacingDirection { get; set; }

    /// <summary>
    /// Tapu durumu
    /// </summary>
    public DeedStatus? DeedStatus { get; set; }

    /// <summary>
    /// Kredi uygun mu?
    /// </summary>
    public bool IsSuitableForCredit { get; set; } = true;

    /// <summary>
    /// Takasa uygun mu?
    /// </summary>
    public bool IsSuitableForTrade { get; set; } = false;

    // ============================================================================
    // ÖZELLİKLER (FEATURES)
    // ============================================================================

    /// <summary>
    /// İç özellikler (İlişkili tablo)
    /// </summary>
    public virtual ICollection<ListingInteriorFeature> InteriorFeatures { get; set; } = new List<ListingInteriorFeature>();

    /// <summary>
    /// Dış özellikler (İlişkili tablo)
    /// </summary>
    public virtual ICollection<ListingExteriorFeature> ExteriorFeatures { get; set; } = new List<ListingExteriorFeature>();

    // ============================================================================
    // GÖRSELLER
    // ============================================================================

    /// <summary>
    /// İlan görselleri (İlişkili tablo)
    /// </summary>
    public virtual ICollection<ListingImage> Images { get; set; } = new List<ListingImage>();

    // ============================================================================
    // İLAN SAHİBİ BİLGİLERİ
    // ============================================================================

    /// <summary>
    /// İlanı veren kullanıcı ID'si
    /// </summary>
    [Required]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// İlanı veren kullanıcı (Navigation Property)
    /// </summary>
    [ForeignKey("UserId")]
    public virtual ApplicationUser? User { get; set; }

    /// <summary>
    /// Kimden (Sahibinden, Emlakçıdan, İnşaat Firmasından)
    /// </summary>
    [Required]
    public ListingOwnerType OwnerType { get; set; } = ListingOwnerType.Owner;

    // ============================================================================
    // İLAN DURUMU
    // ============================================================================

    /// <summary>
    /// İlan durumu (Aktif, Pasif, Onay Bekliyor, vb.)
    /// </summary>
    [Required]
    public ListingStatus Status { get; set; } = ListingStatus.Pending;

    /// <summary>
    /// İlan oluşturulma tarihi
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Son güncelleme tarihi
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Yayın tarihi (Onaylandıktan sonra)
    /// </summary>
    public DateTime? PublishedAt { get; set; }

    /// <summary>
    /// İlan bitiş tarihi
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Reddedilme sebebi (Admin tarafından reddedildiğinde)
    /// </summary>
    [StringLength(1000)]
    public string? RejectionReason { get; set; }

    /// <summary>
    /// Reddedilme tarihi
    /// </summary>
    public DateTime? RejectedAt { get; set; }

    /// <summary>
    /// Görüntülenme sayısı
    /// </summary>
    public int ViewCount { get; set; } = 0;

    /// <summary>
    /// Favori sayısı
    /// </summary>
    public int FavoriteCount { get; set; } = 0;

    /// <summary>
    /// Öne çıkarılmış ilan mı?
    /// </summary>
    public bool IsFeatured { get; set; } = false;

    /// <summary>
    /// Acil satılık/kiralık mı?
    /// </summary>
    public bool IsUrgent { get; set; } = false;

    // ============================================================================
    // FAVORİLER
    // ============================================================================

    /// <summary>
    /// Bu ilanı favorilerine ekleyen kullanıcılar
    /// </summary>
    public virtual ICollection<FavoriteListing> FavoritedBy { get; set; } = new List<FavoriteListing>();

    // ============================================================================
    // YORUMLAR
    // ============================================================================

    /// <summary>
    /// İlana yapılan yorumlar
    /// </summary>
    public virtual ICollection<ListingComment> Comments { get; set; } = new List<ListingComment>();
}
