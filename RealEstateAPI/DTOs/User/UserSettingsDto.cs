namespace RealEstateAPI.DTOs.User;

public class UserSettingsDto
{
    public bool EmailNotifications { get; set; }
    public bool SmsNotifications { get; set; } 
    public bool PushNotifications { get; set; }
    public bool NewListingNotifications { get; set; }
    public bool PriceDropNotifications { get; set; }
    public bool MessageNotifications { get; set; }

    public bool ShowPhone { get; set; }
    public bool ShowEmail { get; set; } 
    public bool ProfileVisible { get; set; }
}
