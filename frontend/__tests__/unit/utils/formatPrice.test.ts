/**
 * formatPrice Utility Function Tests
 * 
 * Fiyat formatlama fonksiyonunun tüm senaryolarını test eder.
 */

import { formatPrice } from '@/body/listing/components/formatPrice';
import { ListingType, Currency } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

describe('formatPrice', () => {
  describe('TRY Currency', () => {
    test('should format ForSale listing correctly', () => {
      const result = formatPrice(1000000, ListingType.ForSale, Currency.TRY);
      expect(result).toBe('₺1.000.000');
    });

    test('should format ForRent listing correctly', () => {
      const result = formatPrice(5000, ListingType.ForRent, Currency.TRY);
      expect(result).toBe('₺5.000/ay');
    });

    test('should handle large numbers correctly', () => {
      const result = formatPrice(15000000, ListingType.ForSale, Currency.TRY);
      expect(result).toBe('₺15.000.000');
    });

    test('should handle small numbers correctly', () => {
      const result = formatPrice(100, ListingType.ForRent, Currency.TRY);
      expect(result).toBe('₺100/ay');
    });
  });

  describe('USD Currency', () => {
    test('should format ForSale listing correctly', () => {
      const result = formatPrice(100000, ListingType.ForSale, Currency.USD);
      expect(result).toBe('$100.000');
    });

    test('should format ForRent listing correctly', () => {
      const result = formatPrice(500, ListingType.ForRent, Currency.USD);
      expect(result).toBe('$500/ay');
    });
  });

  describe('EUR Currency', () => {
    test('should format ForSale listing correctly', () => {
      const result = formatPrice(100000, ListingType.ForSale, Currency.EUR);
      expect(result).toBe('€100.000');
    });

    test('should format ForRent listing correctly', () => {
      const result = formatPrice(500, ListingType.ForRent, Currency.EUR);
      expect(result).toBe('€500/ay');
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero price', () => {
      const result = formatPrice(0, ListingType.ForSale, Currency.TRY);
      expect(result).toBe('₺0');
    });

    test('should format price with thousand separators correctly', () => {
      const result = formatPrice(1234567, ListingType.ForSale, Currency.TRY);
      expect(result).toBe('₺1.234.567');
    });

    test('should add /ay suffix only for ForRent listings', () => {
      const saleResult = formatPrice(1000, ListingType.ForSale, Currency.TRY);
      const rentResult = formatPrice(1000, ListingType.ForRent, Currency.TRY);
      
      expect(saleResult).not.toContain('/ay');
      expect(rentResult).toContain('/ay');
    });
  });
});

