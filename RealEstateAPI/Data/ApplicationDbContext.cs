using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Models;

namespace RealEstateAPI.Data;

/**
 * Application Database Context
 * 
 * Entity Framework Core DbContext.
 * IdentityUserContext kullanılarak Role tabloları kaldırıldı.
 * 
 * Oluşturulan tablolar:
 * - AspNetUsers: Kullanıcı bilgileri
 * - AspNetUserClaims: Kullanıcı claim'leri (şifre sıfırlama, email onay için gerekli)
 * - AspNetUserLogins: Harici login (Google login için)
 * - AspNetUserTokens: Token'lar (email onay, şifre sıfırlama)
 * - RefreshTokens: JWT token yenileme
 * - Listings: Emlak ilanları
 * - ListingImages: İlan görselleri
 * - ListingInteriorFeatures: İlan iç özellikleri
 * - ListingExteriorFeatures: İlan dış özellikleri
 * - ListingComments: İlan yorumları
 * - FavoriteListings: Favori ilanlar
 * 
 * Kaldırılan tablolar: AspNetRoles, AspNetUserRoles, AspNetRoleClaims
 */
public class ApplicationDbContext : IdentityUserContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // ============================================================================
    // AUTH TABLOLARI
    // ============================================================================

    /// <summary>
    /// Refresh Token'lar
    /// </summary>
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    /// <summary>
    /// Kullanıcı Ayarları
    /// </summary>
    public DbSet<UserSettings> UserSettings { get; set; }

    // ============================================================================
    // İLAN TABLOLARI
    // ============================================================================

    /// <summary>
    /// Emlak İlanları
    /// </summary>
    public DbSet<Listing> Listings { get; set; }

    /// <summary>
    /// İlan Görselleri
    /// </summary>
    public DbSet<ListingImage> ListingImages { get; set; }

    /// <summary>
    /// İlan İç Özellikleri
    /// </summary>
    public DbSet<ListingInteriorFeature> ListingInteriorFeatures { get; set; }

    /// <summary>
    /// İlan Dış Özellikleri
    /// </summary>
    public DbSet<ListingExteriorFeature> ListingExteriorFeatures { get; set; }

    /// <summary>
    /// İlan Yorumları
    /// </summary>
    public DbSet<ListingComment> ListingComments { get; set; }

    /// <summary>
    /// Favori İlanlar
    /// </summary>
    public DbSet<FavoriteListing> FavoriteListings { get; set; }

    /// <summary>
    /// İlan Mesajlaşma Kanalları
    /// </summary>
    public DbSet<ListingMessageThread> ListingMessageThreads { get; set; }

    /// <summary>
    /// İlan Mesajları
    /// </summary>
    public DbSet<ListingMessage> ListingMessages { get; set; }
    public DbSet<RealEstateAPI.Models.Admin.AdminModerationRule> AdminModerationRules { get; set; }

    /// <summary>
    /// Model yapılandırması
    /// </summary>
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ApplicationUser yapılandırması
        builder.Entity<ApplicationUser>(entity =>
        {
            // Unique index'ler
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.UserName).IsUnique();
            entity.HasIndex(e => e.Phone);

            // String uzunlukları
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.Surname).HasMaxLength(50);
            entity.Property(e => e.Phone).HasMaxLength(20);
        });

        // RefreshToken yapılandırması
        builder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(e => e.Id);
            
            // Index'ler
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);

            // İlişki
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // UserSettings yapılandırması
        builder.Entity<UserSettings>(entity =>
        {
            entity.ToTable("UserSettings");
            entity.HasKey(e => e.Id);
            
            entity.HasIndex(e => e.UserId).IsUnique(); // Bir kullanıcının sadece bir ayar kaydı olabilir

            entity.HasOne(e => e.User)
                .WithOne() // One-to-One
                .HasForeignKey<UserSettings>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ============================================================================
        // İLAN TABLOLARI YAPILANDIRMASI
        // ============================================================================

        // Listing (İlan) yapılandırması
        builder.Entity<Listing>(entity =>
        {
            entity.ToTable("Listings");
            entity.HasKey(e => e.Id);

            // Index'ler
            entity.HasIndex(e => e.ListingNumber).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.City);
            entity.HasIndex(e => e.District);
            entity.HasIndex(e => e.Price);
            entity.HasIndex(e => e.CreatedAt);

            // String uzunlukları
            entity.Property(e => e.ListingNumber).HasMaxLength(20);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(5000);
            entity.Property(e => e.City).HasMaxLength(50);
            entity.Property(e => e.District).HasMaxLength(50);
            entity.Property(e => e.Neighborhood).HasMaxLength(100);
            entity.Property(e => e.FullAddress).HasMaxLength(300);
            entity.Property(e => e.RoomCount).HasMaxLength(20);

            // Decimal hassasiyeti
            entity.Property(e => e.Price).HasPrecision(18, 2);
            entity.Property(e => e.MonthlyDues).HasPrecision(18, 2);
            entity.Property(e => e.Deposit).HasPrecision(18, 2);

            // Kullanıcı ilişkisi
            entity.HasOne(e => e.User)
                .WithMany(u => u.Listings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ListingImage (Görsel) yapılandırması
        builder.Entity<ListingImage>(entity =>
        {
            entity.ToTable("ListingImages");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.ListingId);

            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(500);
            entity.Property(e => e.AltText).HasMaxLength(200);

            entity.HasOne(e => e.Listing)
                .WithMany(l => l.Images)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ListingInteriorFeature (İç Özellik) yapılandırması
        builder.Entity<ListingInteriorFeature>(entity =>
        {
            entity.ToTable("ListingInteriorFeatures");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.ListingId);
            entity.HasIndex(e => new { e.ListingId, e.FeatureType }).IsUnique();

            entity.HasOne(e => e.Listing)
                .WithMany(l => l.InteriorFeatures)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ListingExteriorFeature (Dış Özellik) yapılandırması
        builder.Entity<ListingExteriorFeature>(entity =>
        {
            entity.ToTable("ListingExteriorFeatures");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.ListingId);
            entity.HasIndex(e => new { e.ListingId, e.FeatureType }).IsUnique();

            entity.HasOne(e => e.Listing)
                .WithMany(l => l.ExteriorFeatures)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ListingComment (Yorum) yapılandırması
        builder.Entity<ListingComment>(entity =>
        {
            entity.ToTable("ListingComments");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.ListingId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ParentCommentId);
            entity.HasIndex(e => e.IsActive);

            entity.Property(e => e.Content).HasMaxLength(1000);

            // İlan ilişkisi
            entity.HasOne(e => e.Listing)
                .WithMany(l => l.Comments)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            // Kullanıcı ilişkisi
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Self-referencing ilişki (Yanıtlar)
            entity.HasOne(e => e.ParentComment)
                .WithMany(e => e.Replies)
                .HasForeignKey(e => e.ParentCommentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // FavoriteListing (Favori) yapılandırması
        builder.Entity<FavoriteListing>(entity =>
        {
            entity.ToTable("FavoriteListings");
            entity.HasKey(e => e.Id);

            // Unique constraint: Bir kullanıcı bir ilanı bir kez favoriye ekleyebilir
            entity.HasIndex(e => new { e.UserId, e.ListingId }).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ListingId);

            entity.Property(e => e.Note).HasMaxLength(500);

            // İlan ilişkisi
            entity.HasOne(e => e.Listing)
                .WithMany(l => l.FavoritedBy)
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            // Kullanıcı ilişkisi
            entity.HasOne(e => e.User)
                .WithMany(u => u.FavoriteListings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ListingMessageThread yapılandırması
        builder.Entity<ListingMessageThread>(entity =>
        {
            entity.ToTable("ListingMessageThreads");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.ListingId);
            entity.HasIndex(e => new { e.ListingId, e.BuyerId, e.SellerId }).IsUnique();
            entity.HasIndex(e => e.LastMessageAt);

            entity.Property(e => e.SellerId).HasMaxLength(450);
            entity.Property(e => e.BuyerId).HasMaxLength(450);

            entity.HasOne(e => e.Listing)
                .WithMany()
                .HasForeignKey(e => e.ListingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Seller)
                .WithMany()
                .HasForeignKey(e => e.SellerId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Buyer)
                .WithMany()
                .HasForeignKey(e => e.BuyerId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ListingMessage yapılandırması
        builder.Entity<ListingMessage>(entity =>
        {
            entity.ToTable("ListingMessages");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.ThreadId);
            entity.HasIndex(e => e.SenderId);
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.Content).HasMaxLength(1000);
            entity.Property(e => e.OfferPrice).HasPrecision(18, 2);

            entity.HasOne(e => e.Thread)
                .WithMany(t => t.Messages)
                .HasForeignKey(e => e.ThreadId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sender)
                .WithMany()
                .HasForeignKey(e => e.SenderId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // AdminModerationRule yapılandırması
        builder.Entity<RealEstateAPI.Models.Admin.AdminModerationRule>(entity =>
        {
            entity.ToTable("AdminModerationRules");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.AdminUserId);
            entity.Property(e => e.Statuses).HasColumnType("integer[]");
            entity.Property(e => e.BlockedKeywords).HasColumnType("text[]");
        });
    }

    /// <summary>
    /// SaveChanges override (otomatik timestamp güncelleme)
    /// </summary>
    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    /// <summary>
    /// SaveChangesAsync override (otomatik timestamp güncelleme)
    /// </summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Timestamp'leri otomatik güncelle
    /// </summary>
    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries<ApplicationUser>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}
