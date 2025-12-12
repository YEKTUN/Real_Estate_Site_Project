/**
 * Validation Utilities Unit Tests
 * 
 * Form validasyon fonksiyonlarının testleri.
 * Email, password, phone ve diğer validasyon kuralları test edilir.
 */

import {
  isValidEmail,
  getEmailError,
  isValidPassword,
  validatePassword,
  doPasswordsMatch,
  isValidPhone,
  formatPhone,
  isValidName,
  getNameError,
  isNotEmpty,
  hasMinLength,
  hasMaxLength,
  validateLoginForm,
  validateRegisterForm,
} from '@/body/auth/utils/validation';

// ============================================================================
// EMAIL VALIDATION TESTS
// ============================================================================

describe('Email Validation', () => {
  describe('isValidEmail', () => {
    test('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
      expect(isValidEmail('user123@test.io')).toBe(true);
      expect(isValidEmail('a@b.co')).toBe(true);
    });

    test('should return false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('test@com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    test('should return false for null or undefined', () => {
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
    });

    test('should handle whitespace correctly', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
      expect(isValidEmail('   ')).toBe(false);
    });
  });

  describe('getEmailError', () => {
    test('should return null for valid email', () => {
      expect(getEmailError('test@example.com')).toBeNull();
    });

    test('should return error for empty email', () => {
      expect(getEmailError('')).toBe('E-posta adresi gereklidir');
      expect(getEmailError('   ')).toBe('E-posta adresi gereklidir');
    });

    test('should return error for invalid email format', () => {
      expect(getEmailError('invalid')).toBe('Geçerli bir e-posta adresi giriniz');
      expect(getEmailError('test@')).toBe('Geçerli bir e-posta adresi giriniz');
    });
  });
});

// ============================================================================
// PASSWORD VALIDATION TESTS
// ============================================================================

describe('Password Validation', () => {
  describe('isValidPassword', () => {
    test('should return true for passwords with 8+ characters', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('securePass!')).toBe(true);
      expect(isValidPassword('abcdefgh')).toBe(true);
    });

    test('should return false for short passwords', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('abc')).toBe(false);
    });

    test('should return false for null or undefined', () => {
      expect(isValidPassword(null as unknown as string)).toBe(false);
      expect(isValidPassword(undefined as unknown as string)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should return valid result for strong password', () => {
      const result = validatePassword('SecurePass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe('strong');
    });

    test('should return errors for weak password', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBe('weak');
    });

    test('should require minimum 8 characters', () => {
      const result = validatePassword('Short1');
      expect(result.errors).toContain('Şifre en az 8 karakter olmalıdır');
    });

    test('should require uppercase letter', () => {
      const result = validatePassword('lowercase123');
      expect(result.errors).toContain('Şifre en az bir büyük harf içermelidir');
    });

    test('should require lowercase letter', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.errors).toContain('Şifre en az bir küçük harf içermelidir');
    });

    test('should require number', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.errors).toContain('Şifre en az bir rakam içermelidir');
    });

    test('should calculate strength correctly', () => {
      // Weak: sadece küçük harf veya çok kısa - score < 2
      expect(validatePassword('abc').strength).toBe('weak');
      
      // Medium: score 2-3 (uzunluk + bir kriter daha)
      expect(validatePassword('abcdefgh').strength).toBe('medium'); // uzunluk + küçük harf = 2
      expect(validatePassword('Abcdefgh').strength).toBe('medium'); // uzunluk + küçük + büyük = 3
      expect(validatePassword('abcdefg1').strength).toBe('medium'); // uzunluk + küçük + rakam = 3
      
      // Strong: score >= 4 (tüm kriterler)
      expect(validatePassword('Abcdefg1').strength).toBe('strong'); // uzunluk + küçük + büyük + rakam = 4
      expect(validatePassword('Abcdefg1!').strength).toBe('strong'); // 4 + özel karakter = 5
    });

    test('should handle empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Şifre gereklidir');
    });

    test('should handle null or undefined', () => {
      const result = validatePassword(null as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Şifre gereklidir');
    });
  });

  describe('doPasswordsMatch', () => {
    test('should return true when passwords match', () => {
      expect(doPasswordsMatch('password123', 'password123')).toBe(true);
      expect(doPasswordsMatch('', '')).toBe(true);
    });

    test('should return false when passwords do not match', () => {
      expect(doPasswordsMatch('password123', 'password456')).toBe(false);
      expect(doPasswordsMatch('Password', 'password')).toBe(false);
      expect(doPasswordsMatch('pass', '')).toBe(false);
    });
  });
});

// ============================================================================
// PHONE VALIDATION TESTS
// ============================================================================

describe('Phone Validation', () => {
  describe('isValidPhone', () => {
    test('should return true for valid Turkish phone numbers', () => {
      expect(isValidPhone('5551234567')).toBe(true);
      expect(isValidPhone('05551234567')).toBe(true);
      expect(isValidPhone('+905551234567')).toBe(true);
      expect(isValidPhone('905551234567')).toBe(true);
      expect(isValidPhone('555 123 45 67')).toBe(true);
      expect(isValidPhone('555-123-45-67')).toBe(true);
      expect(isValidPhone('(555) 123 45 67')).toBe(true);
    });

    test('should return false for invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abcdefghij')).toBe(false);
      expect(isValidPhone('1234567890')).toBe(false); // 1 ile başlıyor
      expect(isValidPhone('4551234567')).toBe(false); // 5 ile başlamıyor
    });

    test('should return false for null or undefined', () => {
      expect(isValidPhone(null as unknown as string)).toBe(false);
      expect(isValidPhone(undefined as unknown as string)).toBe(false);
    });
  });

  describe('formatPhone', () => {
    test('should format 10-digit phone numbers', () => {
      expect(formatPhone('5551234567')).toBe('555 123 45 67');
    });

    test('should remove leading 0', () => {
      expect(formatPhone('05551234567')).toBe('555 123 45 67');
    });

    test('should remove +90 prefix', () => {
      expect(formatPhone('+905551234567')).toBe('555 123 45 67');
    });

    test('should remove 90 prefix', () => {
      expect(formatPhone('905551234567')).toBe('555 123 45 67');
    });

    test('should handle empty string', () => {
      expect(formatPhone('')).toBe('');
    });

    test('should return original if cannot format', () => {
      expect(formatPhone('123')).toBe('123');
    });
  });
});

// ============================================================================
// NAME VALIDATION TESTS
// ============================================================================

describe('Name Validation', () => {
  describe('isValidName', () => {
    test('should return true for valid names', () => {
      expect(isValidName('Ali')).toBe(true);
      expect(isValidName('Mehmet')).toBe(true);
      expect(isValidName('Ali Veli')).toBe(true);
      expect(isValidName('Çağla')).toBe(true);
      expect(isValidName('Ömer')).toBe(true);
      expect(isValidName('Şule')).toBe(true);
      expect(isValidName('İsmail')).toBe(true);
      expect(isValidName('Güneş')).toBe(true);
    });

    test('should return false for invalid names', () => {
      expect(isValidName('')).toBe(false);
      expect(isValidName('A')).toBe(false); // Too short
      expect(isValidName('Ali123')).toBe(false);
      expect(isValidName('Ali@#')).toBe(false);
      expect(isValidName('123')).toBe(false);
    });

    test('should return false for null or undefined', () => {
      expect(isValidName(null as unknown as string)).toBe(false);
      expect(isValidName(undefined as unknown as string)).toBe(false);
    });

    test('should handle whitespace', () => {
      expect(isValidName('  Ali  ')).toBe(true);
      expect(isValidName('   ')).toBe(false);
    });
  });

  describe('getNameError', () => {
    test('should return null for valid name', () => {
      expect(getNameError('Ali')).toBeNull();
      expect(getNameError('Ali', 'Ad')).toBeNull();
    });

    test('should return error for empty name', () => {
      expect(getNameError('', 'Ad')).toBe('Ad gereklidir');
      expect(getNameError('', 'Soyad')).toBe('Soyad gereklidir');
    });

    test('should return error for short name', () => {
      expect(getNameError('A', 'Ad')).toBe('Ad en az 2 karakter olmalıdır');
    });

    test('should return error for invalid characters', () => {
      expect(getNameError('Ali123', 'Ad')).toBe('Ad sadece harf içermelidir');
    });
  });
});

// ============================================================================
// GENERAL VALIDATOR TESTS
// ============================================================================

describe('General Validators', () => {
  describe('isNotEmpty', () => {
    test('should return true for non-empty strings', () => {
      expect(isNotEmpty('hello')).toBe(true);
      expect(isNotEmpty('  hello  ')).toBe(true);
      expect(isNotEmpty('a')).toBe(true);
    });

    test('should return false for empty strings', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
    });

    test('should return false for null or undefined', () => {
      expect(isNotEmpty(null)).toBe(false);
      expect(isNotEmpty(undefined)).toBe(false);
    });
  });

  describe('hasMinLength', () => {
    test('should return true when length meets minimum', () => {
      expect(hasMinLength('hello', 5)).toBe(true);
      expect(hasMinLength('hello', 3)).toBe(true);
      expect(hasMinLength('hello', 0)).toBe(true);
    });

    test('should return false when length is below minimum', () => {
      expect(hasMinLength('hi', 5)).toBe(false);
      expect(hasMinLength('', 1)).toBe(false);
    });

    test('should return false for null or undefined', () => {
      expect(hasMinLength(null as unknown as string, 1)).toBe(false);
      expect(hasMinLength(undefined as unknown as string, 1)).toBe(false);
    });
  });

  describe('hasMaxLength', () => {
    test('should return true when length is within maximum', () => {
      expect(hasMaxLength('hello', 10)).toBe(true);
      expect(hasMaxLength('hello', 5)).toBe(true);
      expect(hasMaxLength('', 5)).toBe(true);
    });

    test('should return false when length exceeds maximum', () => {
      expect(hasMaxLength('hello', 3)).toBe(false);
      expect(hasMaxLength('hello', 4)).toBe(false);
    });

    test('should return true for null or undefined', () => {
      expect(hasMaxLength(null as unknown as string, 10)).toBe(true);
      expect(hasMaxLength(undefined as unknown as string, 10)).toBe(true);
    });
  });
});

// ============================================================================
// FORM VALIDATION TESTS
// ============================================================================

describe('Form Validation', () => {
  describe('validateLoginForm', () => {
    test('should return valid for correct login data', () => {
      const result = validateLoginForm('test@example.com', 'password123');
      
      expect(result.isValid).toBe(true);
      expect(result.email).toBeNull();
      expect(result.password).toBeNull();
    });

    test('should return error for invalid email', () => {
      const result = validateLoginForm('invalid', 'password123');
      
      expect(result.isValid).toBe(false);
      expect(result.email).toBe('Geçerli bir e-posta adresi giriniz');
    });

    test('should return error for short password', () => {
      const result = validateLoginForm('test@example.com', 'short');
      
      expect(result.isValid).toBe(false);
      expect(result.password).toBe('Şifre en az 8 karakter olmalıdır');
    });

    test('should return multiple errors', () => {
      const result = validateLoginForm('invalid', 'short');
      
      expect(result.isValid).toBe(false);
      expect(result.email).not.toBeNull();
      expect(result.password).not.toBeNull();
    });
  });

  describe('validateRegisterForm', () => {
    const validData = {
      name: 'Ali',
      surname: 'Yılmaz',
      email: 'ali@example.com',
      phone: '5551234567',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
    };

    test('should return valid for correct register data', () => {
      const result = validateRegisterForm(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.name).toBeNull();
      expect(result.surname).toBeNull();
      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.password).toBeNull();
      expect(result.confirmPassword).toBeNull();
    });

    test('should return error for invalid name', () => {
      const result = validateRegisterForm({ ...validData, name: '' });
      
      expect(result.isValid).toBe(false);
      expect(result.name).toBe('Ad gereklidir');
    });

    test('should return error for invalid surname', () => {
      const result = validateRegisterForm({ ...validData, surname: 'A' });
      
      expect(result.isValid).toBe(false);
      expect(result.surname).toBe('Soyad en az 2 karakter olmalıdır');
    });

    test('should return error for invalid email', () => {
      const result = validateRegisterForm({ ...validData, email: 'invalid' });
      
      expect(result.isValid).toBe(false);
      expect(result.email).toBe('Geçerli bir e-posta adresi giriniz');
    });

    test('should return error for invalid phone', () => {
      const result = validateRegisterForm({ ...validData, phone: '123' });
      
      expect(result.isValid).toBe(false);
      expect(result.phone).toBe('Geçerli bir telefon numarası giriniz');
    });

    test('should not require phone if empty', () => {
      const result = validateRegisterForm({ ...validData, phone: '' });
      
      expect(result.phone).toBeNull();
    });

    test('should return error for weak password', () => {
      const result = validateRegisterForm({ 
        ...validData, 
        password: 'weak', 
        confirmPassword: 'weak' 
      });
      
      expect(result.isValid).toBe(false);
      expect(result.password).not.toBeNull();
    });

    test('should return error for mismatched passwords', () => {
      const result = validateRegisterForm({ 
        ...validData, 
        confirmPassword: 'DifferentPass123' 
      });
      
      expect(result.isValid).toBe(false);
      expect(result.confirmPassword).toBe('Şifreler eşleşmiyor');
    });

    test('should return all errors at once', () => {
      const result = validateRegisterForm({
        name: '',
        surname: '',
        email: 'invalid',
        phone: '123',
        password: 'weak',
        confirmPassword: 'different',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.name).not.toBeNull();
      expect(result.surname).not.toBeNull();
      expect(result.email).not.toBeNull();
      expect(result.phone).not.toBeNull();
      expect(result.password).not.toBeNull();
      expect(result.confirmPassword).not.toBeNull();
    });
  });
});
