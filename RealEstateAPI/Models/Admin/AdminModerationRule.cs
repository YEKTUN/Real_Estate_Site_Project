using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using RealEstateAPI.Models;

namespace RealEstateAPI.Models.Admin;

/// <summary>
/// Admin bazlı otomatik ilan onay ve moderasyon kuralı
/// </summary>
[Table("AdminModerationRules")]
public class AdminModerationRule
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string AdminUserId { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Name { get; set; }

    public bool IsAutomataEnabled { get; set; } = true;

    [Column(TypeName = "integer[]")]
    public List<int>? Statuses { get; set; }

    [Column(TypeName = "text[]")]
    public List<string>? BlockedKeywords { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

