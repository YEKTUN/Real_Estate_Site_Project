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
 * 
 * Kaldırılan tablolar: AspNetRoles, AspNetUserRoles, AspNetRoleClaims
 */
public class ApplicationDbContext : IdentityUserContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Refresh Token'lar
    /// </summary>
    public DbSet<RefreshToken> RefreshTokens { get; set; }

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
