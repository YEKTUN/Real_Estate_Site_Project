using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateAPI.Models;

/// <summary>
/// İç Özellikler (İç Mekan Özellikleri)
/// 
/// Sahibinden.com'daki iç özellikler listesine benzer.
/// Many-to-Many ilişkisi için ara tablo.
/// </summary>
public class ListingInteriorFeature
{
    /// <summary>
    /// ID
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// İlan ID'si
    /// </summary>
    [Required]
    public int ListingId { get; set; }

    /// <summary>
    /// İlan referansı
    /// </summary>
    [ForeignKey("ListingId")]
    public virtual Listing? Listing { get; set; }

    /// <summary>
    /// İç özellik tipi
    /// </summary>
    [Required]
    public InteriorFeatureType FeatureType { get; set; }
}

/// <summary>
/// Dış Özellikler (Dış Mekan Özellikleri)
/// 
/// Site içi özellikler ve dış mekan özellikleri için.
/// Many-to-Many ilişkisi için ara tablo.
/// </summary>
public class ListingExteriorFeature
{
    /// <summary>
    /// ID
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// İlan ID'si
    /// </summary>
    [Required]
    public int ListingId { get; set; }

    /// <summary>
    /// İlan referansı
    /// </summary>
    [ForeignKey("ListingId")]
    public virtual Listing? Listing { get; set; }

    /// <summary>
    /// Dış özellik tipi
    /// </summary>
    [Required]
    public ExteriorFeatureType FeatureType { get; set; }
}

/// <summary>
/// İç Özellik Tipleri
/// </summary>
public enum InteriorFeatureType
{
    // ============================================================================
    // MUTFAK
    // ============================================================================

    /// <summary>Ankastre Fırın</summary>
    BuiltInOven = 1,

    /// <summary>Bulaşık Makinesi</summary>
    Dishwasher = 2,

    /// <summary>Buzdolabı</summary>
    Refrigerator = 3,

    /// <summary>Davlumbaz</summary>
    RangeHood = 4,

    /// <summary>Set Üstü Ocak</summary>
    Cooktop = 5,

    /// <summary>Amerikan Mutfak</summary>
    AmericanKitchen = 6,

    /// <summary>Laminat Mutfak</summary>
    LaminateKitchen = 7,

    /// <summary>Granit Tezgah</summary>
    GraniteCountertop = 8,

    // ============================================================================
    // BANYO / TUVALETe
    // ============================================================================

    /// <summary>Duşakabin</summary>
    ShowerCabin = 10,

    /// <summary>Küvet</summary>
    Bathtub = 11,

    /// <summary>Hilton Banyo</summary>
    HiltonBathroom = 12,

    /// <summary>Klozet</summary>
    Toilet = 13,

    /// <summary>Alaturka Tuvalet</summary>
    SquatToilet = 14,

    // ============================================================================
    // MOBİLYA
    // ============================================================================

    /// <summary>Eşyalı</summary>
    Furnished = 20,

    /// <summary>Vestiyer</summary>
    Vestibule = 21,

    /// <summary>Gömme Dolap</summary>
    BuiltInCloset = 22,

    /// <summary>Kartonpiyer</summary>
    Cornice = 23,

    /// <summary>Spot Aydınlatma</summary>
    SpotLighting = 24,

    // ============================================================================
    // ISITMA / SOĞUTMA
    // ============================================================================

    /// <summary>Klima</summary>
    AirConditioner = 30,

    /// <summary>Şömine</summary>
    Fireplace = 31,

    /// <summary>Merkezi Isıtma</summary>
    CentralHeating = 32,

    /// <summary>Yerden Isıtma</summary>
    UnderfloorHeating = 33,

    /// <summary>Güneş Enerjisi</summary>
    SolarEnergy = 34,

    // ============================================================================
    // GÜVENLİK
    // ============================================================================

    /// <summary>Çelik Kapı</summary>
    SteelDoor = 40,

    /// <summary>Alarm (Hırsız)</summary>
    BurglarAlarm = 41,

    /// <summary>Video Kapı Sistemi</summary>
    VideoDoorSystem = 42,

    /// <summary>Yangın Merdiveni</summary>
    FireEscape = 43,

    /// <summary>Yangın Alarm Sistemi</summary>
    FireAlarmSystem = 44,

    // ============================================================================
    // DİĞER
    // ============================================================================

    /// <summary>Fiber İnternet</summary>
    FiberInternet = 50,

    /// <summary>Teras</summary>
    Terrace = 51,

    /// <summary>Balkon</summary>
    Balcony = 52,

    /// <summary>Giyinme Odası</summary>
    DressingRoom = 53,

    /// <summary>Kiler</summary>
    PantryRoom = 54,

    /// <summary>Çamaşır Odası</summary>
    LaundryRoom = 55,

    /// <summary>Ebeveyn Banyosu</summary>
    MasterBathroom = 56,

    /// <summary>Jakuzi</summary>
    Jacuzzi = 57,

    /// <summary>Sauna</summary>
    Sauna = 58,

    /// <summary>Asansör</summary>
    Elevator = 59,

    /// <summary>PVC Pencere</summary>
    PVCWindows = 60,

    /// <summary>Parke Zemin</summary>
    ParquetFlooring = 61,

    /// <summary>Seramik Zemin</summary>
    CeramicFlooring = 62,

    /// <summary>Laminat Zemin</summary>
    LaminateFlooring = 63
}

/// <summary>
/// Dış Özellik Tipleri (Site / Çevre Özellikleri)
/// </summary>
public enum ExteriorFeatureType
{
    // ============================================================================
    // SPOR / SOSYAL
    // ============================================================================

    /// <summary>Açık Havuz</summary>
    OutdoorPool = 1,

    /// <summary>Kapalı Havuz</summary>
    IndoorPool = 2,

    /// <summary>Fitness Salonu</summary>
    FitnessCenter = 3,

    /// <summary>Tenis Kortu</summary>
    TennisCourt = 4,

    /// <summary>Basketbol Sahası</summary>
    BasketballCourt = 5,

    /// <summary>Voleybol Sahası</summary>
    VolleyballCourt = 6,

    /// <summary>Çocuk Parkı</summary>
    Playground = 7,

    /// <summary>Sauna</summary>
    Sauna = 8,

    /// <summary>Türk Hamamı</summary>
    TurkishBath = 9,

    /// <summary>SPA</summary>
    Spa = 10,

    // ============================================================================
    // GÜVENLİK
    // ============================================================================

    /// <summary>24 Saat Güvenlik</summary>
    Security24Hours = 20,

    /// <summary>Güvenlik Kamerası</summary>
    SecurityCamera = 21,

    /// <summary>Kartlı Giriş Sistemi</summary>
    CardAccessSystem = 22,

    /// <summary>Kapıcı</summary>
    Doorman = 23,

    // ============================================================================
    // OTOPARK
    // ============================================================================

    /// <summary>Açık Otopark</summary>
    OpenParking = 30,

    /// <summary>Kapalı Otopark</summary>
    IndoorParking = 31,

    /// <summary>Kapalı Garaj</summary>
    Garage = 32,

    /// <summary>Vale Parking</summary>
    ValetParking = 33,

    // ============================================================================
    // DİĞER TESİSLER
    // ============================================================================

    /// <summary>Jeneratör</summary>
    Generator = 40,

    /// <summary>Su Deposu</summary>
    WaterTank = 41,

    /// <summary>Hidrofor</summary>
    Hydrophore = 42,

    /// <summary>Yangın Söndürme Sistemi</summary>
    FireExtinguishingSystem = 43,

    /// <summary>Isı Yalıtımı</summary>
    ThermalInsulation = 44,

    /// <summary>Ses Yalıtımı</summary>
    SoundInsulation = 45,

    /// <summary>Asansör</summary>
    Elevator = 46,

    // ============================================================================
    // BAHÇE / DIŞ ALAN
    // ============================================================================

    /// <summary>Bahçe</summary>
    Garden = 50,

    /// <summary>Bahçe Katı</summary>
    GardenFloor = 51,

    /// <summary>Müşterek Bahçe</summary>
    SharedGarden = 52,

    /// <summary>Mangal Alanı</summary>
    BBQArea = 53,

    /// <summary>Teras</summary>
    Terrace = 54,

    /// <summary>Balkon</summary>
    Balcony = 55,

    // ============================================================================
    // KONUM ÖZELLİKLERİ
    // ============================================================================

    /// <summary>Deniz Manzarası</summary>
    SeaView = 60,

    /// <summary>Göl Manzarası</summary>
    LakeView = 61,

    /// <summary>Doğa Manzarası</summary>
    NatureView = 62,

    /// <summary>Şehir Manzarası</summary>
    CityView = 63,

    /// <summary>Denize Sıfır</summary>
    Beachfront = 64,

    /// <summary>Cadde Cephesi</summary>
    StreetFront = 65,

    /// <summary>Ara Sokak</summary>
    SideStreet = 66,

    /// <summary>Merkezi Konum</summary>
    CentralLocation = 67,

    // ============================================================================
    // ULAŞIM
    // ============================================================================

    /// <summary>Metro Yakını</summary>
    NearMetro = 70,

    /// <summary>Metrobüs Yakını</summary>
    NearMetrobus = 71,

    /// <summary>Otobüs Durağı</summary>
    BusStop = 72,

    /// <summary>Minibüs Durağı</summary>
    MinibusStop = 73,

    /// <summary>Dolmuş Durağı</summary>
    DolmusStop = 74,

    /// <summary>Tramvay Durağı</summary>
    TramStop = 75,

    /// <summary>Marmaray Yakını</summary>
    NearMarmaray = 76,

    /// <summary>Vapur İskelesi</summary>
    FerryDock = 77,

    /// <summary>Sahil Yolu</summary>
    CoastalRoad = 78,

    /// <summary>Ana Yol Üzeri</summary>
    MainRoad = 79,

    /// <summary>E5 Yakını</summary>
    NearE5 = 80,

    /// <summary>TEM Yakını</summary>
    NearTEM = 81,

    // ============================================================================
    // ÇEVRE
    // ============================================================================

    /// <summary>Okul Yakını</summary>
    NearSchool = 90,

    /// <summary>Üniversite Yakını</summary>
    NearUniversity = 91,

    /// <summary>Hastane Yakını</summary>
    NearHospital = 92,

    /// <summary>Alışveriş Merkezi</summary>
    NearMall = 93,

    /// <summary>Market</summary>
    NearMarket = 94,

    /// <summary>Cami</summary>
    NearMosque = 95,

    /// <summary>Park</summary>
    NearPark = 96,

    /// <summary>Spor Salonu</summary>
    NearGym = 97,

    /// <summary>Eczane</summary>
    NearPharmacy = 98,

    /// <summary>Banka</summary>
    NearBank = 99
}
