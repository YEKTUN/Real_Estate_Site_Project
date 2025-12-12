namespace RealEstateAPI.Models;

/// <summary>
/// İlan Kategorisi
/// </summary>
public enum ListingCategory
{
    /// <summary>Konut (Daire, ev, villa, vb.)</summary>
    Residential = 1,

    /// <summary>İşyeri (Ofis, dükkan, vb.)</summary>
    Commercial = 2,

    /// <summary>Arsa</summary>
    Land = 3,

    /// <summary>Bina</summary>
    Building = 4,

    /// <summary>Turistik Tesis</summary>
    TouristicFacility = 5,

    /// <summary>Devre Mülk</summary>
    TimeShare = 6
}

/// <summary>
/// İlan Tipi
/// </summary>
public enum ListingType
{
    /// <summary>Satılık</summary>
    ForSale = 1,

    /// <summary>Kiralık</summary>
    ForRent = 2,

    /// <summary>Devren Satılık</summary>
    TransferSale = 3,

    /// <summary>Devren Kiralık</summary>
    TransferRent = 4,

    /// <summary>Günlük Kiralık</summary>
    DailyRent = 5
}

/// <summary>
/// Emlak Tipi
/// </summary>
public enum PropertyType
{
    // ============================================================================
    // KONUT
    // ============================================================================

    /// <summary>Daire</summary>
    Apartment = 1,

    /// <summary>Rezidans</summary>
    Residence = 2,

    /// <summary>Müstakil Ev</summary>
    DetachedHouse = 3,

    /// <summary>Villa</summary>
    Villa = 4,

    /// <summary>Yazlık</summary>
    SummerHouse = 5,

    /// <summary>Çiftlik Evi</summary>
    FarmHouse = 6,

    /// <summary>Köşk / Konak</summary>
    Mansion = 7,

    /// <summary>Yalı</summary>
    Waterfront = 8,

    /// <summary>Prefabrik Ev</summary>
    PrefabricatedHouse = 9,

    /// <summary>Kooperatif</summary>
    Cooperative = 10,

    // ============================================================================
    // İŞYERİ
    // ============================================================================

    /// <summary>Dükkan / Mağaza</summary>
    Shop = 20,

    /// <summary>Ofis / Büro</summary>
    Office = 21,

    /// <summary>AVM Dükkanı</summary>
    MallShop = 22,

    /// <summary>Plaza Katı</summary>
    PlazaFloor = 23,

    /// <summary>Depo / Antrepo</summary>
    Warehouse = 24,

    /// <summary>Fabrika</summary>
    Factory = 25,

    /// <summary>Atölye</summary>
    Workshop = 26,

    /// <summary>Akaryakıt İstasyonu</summary>
    GasStation = 27,

    /// <summary>Sağlık Tesisi</summary>
    HealthFacility = 28,

    /// <summary>Eğitim Tesisi</summary>
    EducationFacility = 29,

    // ============================================================================
    // ARSA
    // ============================================================================

    /// <summary>Konut İmarlı</summary>
    ResidentialLand = 40,

    /// <summary>Ticari İmarlı</summary>
    CommercialLand = 41,

    /// <summary>Tarla</summary>
    Field = 42,

    /// <summary>Bağ / Bahçe</summary>
    Garden = 43,

    /// <summary>Hobi Bahçesi</summary>
    HobbyGarden = 44,

    // ============================================================================
    // TURİSTİK
    // ============================================================================

    /// <summary>Otel</summary>
    Hotel = 60,

    /// <summary>Apart Otel</summary>
    ApartHotel = 61,

    /// <summary>Pansiyon</summary>
    Guesthouse = 62,

    /// <summary>Tatil Köyü</summary>
    HolidayVillage = 63
}

/// <summary>
/// Para Birimi
/// </summary>
public enum Currency
{
    /// <summary>Türk Lirası</summary>
    TRY = 1,

    /// <summary>Amerikan Doları</summary>
    USD = 2,

    /// <summary>Euro</summary>
    EUR = 3,

    /// <summary>İngiliz Sterlini</summary>
    GBP = 4
}

/// <summary>
/// Isınma Tipi
/// </summary>
public enum HeatingType
{
    /// <summary>Yok</summary>
    None = 0,

    /// <summary>Doğalgaz (Kombi)</summary>
    NaturalGasCombi = 1,

    /// <summary>Doğalgaz (Kat Kaloriferi)</summary>
    NaturalGasFloorHeating = 2,

    /// <summary>Merkezi Sistem</summary>
    CentralHeating = 3,

    /// <summary>Merkezi (Pay Ölçer)</summary>
    CentralWithMeter = 4,

    /// <summary>Soba</summary>
    Stove = 5,

    /// <summary>Yerden Isıtma</summary>
    UnderfloorHeating = 6,

    /// <summary>Klima</summary>
    AirConditioner = 7,

    /// <summary>Şömine</summary>
    Fireplace = 8,

    /// <summary>Güneş Enerjisi</summary>
    SolarEnergy = 9,

    /// <summary>Jeotermal</summary>
    Geothermal = 10,

    /// <summary>Fuel-Oil</summary>
    FuelOil = 11,

    /// <summary>Isı Pompası</summary>
    HeatPump = 12
}

/// <summary>
/// Yapı Durumu
/// </summary>
public enum BuildingStatus
{
    /// <summary>Sıfır</summary>
    New = 1,

    /// <summary>İkinci El (Az Kullanılmış)</summary>
    LightlyUsed = 2,

    /// <summary>İkinci El (Orta)</summary>
    ModeratelyUsed = 3,

    /// <summary>İkinci El (Bakımlı)</summary>
    WellMaintained = 4,

    /// <summary>İkinci El (Tadilat Gerektirir)</summary>
    NeedsRenovation = 5
}

/// <summary>
/// Kullanım Durumu
/// </summary>
public enum UsageStatus
{
    /// <summary>Boş</summary>
    Empty = 1,

    /// <summary>Kiracılı</summary>
    Rented = 2,

    /// <summary>Mal Sahibi</summary>
    OwnerOccupied = 3
}

/// <summary>
/// Cephe Yönü
/// </summary>
public enum FacingDirection
{
    /// <summary>Kuzey</summary>
    North = 1,

    /// <summary>Güney</summary>
    South = 2,

    /// <summary>Doğu</summary>
    East = 3,

    /// <summary>Batı</summary>
    West = 4,

    /// <summary>Kuzey-Doğu</summary>
    NorthEast = 5,

    /// <summary>Kuzey-Batı</summary>
    NorthWest = 6,

    /// <summary>Güney-Doğu</summary>
    SouthEast = 7,

    /// <summary>Güney-Batı</summary>
    SouthWest = 8
}

/// <summary>
/// Tapu Durumu
/// </summary>
public enum DeedStatus
{
    /// <summary>Kat Mülkiyetli</summary>
    FloorOwnership = 1,

    /// <summary>Kat İrtifaklı</summary>
    FloorEasement = 2,

    /// <summary>Hisseli Tapu</summary>
    SharedDeed = 3,

    /// <summary>Müstakil Tapulu</summary>
    IndependentDeed = 4,

    /// <summary>Kooperatif Hissesi</summary>
    CooperativeShare = 5,

    /// <summary>Tahsis</summary>
    Allocation = 6
}

/// <summary>
/// İlan Sahibi Tipi
/// </summary>
public enum ListingOwnerType
{
    /// <summary>Sahibinden</summary>
    Owner = 1,

    /// <summary>Emlakçıdan</summary>
    RealEstateAgent = 2,

    /// <summary>İnşaat Firmasından</summary>
    ConstructionCompany = 3,

    /// <summary>Bankadan</summary>
    Bank = 4
}

/// <summary>
/// İlan Durumu
/// </summary>
public enum ListingStatus
{
    /// <summary>Onay Bekliyor</summary>
    Pending = 0,

    /// <summary>Aktif</summary>
    Active = 1,

    /// <summary>Pasif (Yayından kaldırıldı)</summary>
    Inactive = 2,

    /// <summary>Satıldı</summary>
    Sold = 3,

    /// <summary>Kiralandı</summary>
    Rented = 4,

    /// <summary>Reddedildi</summary>
    Rejected = 5,

    /// <summary>Süresi Doldu</summary>
    Expired = 6
}
