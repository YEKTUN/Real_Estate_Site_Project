import { ListingType, Currency } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

/**
 * Fiyat Formatlama Utility Fonksiyonu
 * 
 * Fiyat değerini para birimi ve ilan tipine göre formatlar.
 */

export const formatPrice = (price: number, type: ListingType, currency: Currency): string => {
  const currencySymbol = currency === Currency.TRY ? '₺' : currency === Currency.USD ? '$' : '€';
  const formatted = new Intl.NumberFormat('tr-TR').format(price);
  return type === ListingType.ForRent ? `${currencySymbol}${formatted}/ay` : `${currencySymbol}${formatted}`;
};

