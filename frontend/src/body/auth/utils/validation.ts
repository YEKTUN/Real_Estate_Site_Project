/**
 * Validation Utilities
 * 
 * Form validasyon fonksiyonları.
 * Email, password, phone ve diğer alanlar için validasyon kuralları.
 */

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Email adresinin geçerli olup olmadığını kontrol eder
 * @param email - Kontrol edilecek email adresi
 * @returns Email geçerli ise true, değilse false
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0) {
    return false;
  }
  
  // RFC 5322 uyumlu email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmedEmail);
};

/**
 * Email validasyon hatası mesajı döner
 * @param email - Kontrol edilecek email adresi
 * @returns Hata mesajı veya null
 */
export const getEmailError = (email: string): string | null => {
  if (!email || email.trim().length === 0) {
    return 'E-posta adresi gereklidir';
  }
  
  if (!isValidEmail(email)) {
    return 'Geçerli bir e-posta adresi giriniz';
  }
  
  return null;
};

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Password validasyon kuralları
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Şifrenin geçerli olup olmadığını kontrol eder (basit versiyon)
 * @param password - Kontrol edilecek şifre
 * @returns Şifre geçerli ise true, değilse false
 */
export const isValidPassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  return password.length >= 8;
};

/**
 * Şifrenin detaylı validasyonunu yapar
 * @param password - Kontrol edilecek şifre
 * @returns Validasyon sonucu
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let strengthScore = 0;
  
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Şifre gereklidir'],
      strength: 'weak',
    };
  }
  
  // Minimum uzunluk kontrolü
  if (password.length < 8) {
    errors.push('Şifre en az 8 karakter olmalıdır');
  } else {
    strengthScore += 1;
  }
  
  // Büyük harf kontrolü
  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir');
  } else {
    strengthScore += 1;
  }
  
  // Küçük harf kontrolü
  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir');
  } else {
    strengthScore += 1;
  }
  
  // Sayı kontrolü
  if (!/[0-9]/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir');
  } else {
    strengthScore += 1;
  }
  
  // Özel karakter kontrolü (opsiyonel, güçlülük için)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strengthScore += 1;
  }
  
  // Güçlülük hesaplama
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (strengthScore >= 4) {
    strength = 'strong';
  } else if (strengthScore >= 2) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Şifre eşleşme kontrolü
 * @param password - Şifre
 * @param confirmPassword - Şifre tekrarı
 * @returns Şifreler eşleşiyor ise true, değilse false
 */
export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

// ============================================================================
// PHONE VALIDATION
// ============================================================================

/**
 * Türkiye telefon numarası formatını kontrol eder
 * @param phone - Kontrol edilecek telefon numarası
 * @returns Telefon numarası geçerli ise true, değilse false
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Boşlukları ve tireleri temizle
  const cleanedPhone = phone.replace(/[\s\-()]/g, '');
  
  // Türkiye telefon numarası formatları:
  // 5551234567 (10 haneli)
  // 05551234567 (11 haneli, 0 ile başlar)
  // +905551234567 (12 haneli, +90 ile başlar)
  // 905551234567 (12 haneli, 90 ile başlar)
  const phoneRegex = /^(\+?90|0)?[5][0-9]{9}$/;
  
  return phoneRegex.test(cleanedPhone);
};

/**
 * Telefon numarasını formatlar
 * @param phone - Formatlanacak telefon numarası
 * @returns Formatlanmış telefon numarası
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Sadece rakamları al
  const digits = phone.replace(/\D/g, '');
  
  // +90 ile başlıyorsa kaldır
  let cleaned = digits;
  if (cleaned.startsWith('90') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Format: 555 123 45 67
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }
  
  return phone;
};

// ============================================================================
// NAME VALIDATION
// ============================================================================

/**
 * İsim validasyonu
 * @param name - Kontrol edilecek isim
 * @returns İsim geçerli ise true, değilse false
 */
export const isValidName = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmedName = name.trim();
  
  // En az 2 karakter, sadece harf ve boşluk
  if (trimmedName.length < 2) {
    return false;
  }
  
  // Türkçe karakterleri de kabul et
  const nameRegex = /^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/;
  return nameRegex.test(trimmedName);
};

/**
 * İsim validasyon hatası mesajı döner
 * @param name - Kontrol edilecek isim
 * @param fieldName - Alan adı (örn: "Ad", "Soyad")
 * @returns Hata mesajı veya null
 */
export const getNameError = (name: string, fieldName: string = 'İsim'): string | null => {
  if (!name || name.trim().length === 0) {
    return `${fieldName} gereklidir`;
  }
  
  if (name.trim().length < 2) {
    return `${fieldName} en az 2 karakter olmalıdır`;
  }
  
  if (!isValidName(name)) {
    return `${fieldName} sadece harf içermelidir`;
  }
  
  return null;
};

// ============================================================================
// GENERAL VALIDATORS
// ============================================================================

/**
 * Değerin boş olup olmadığını kontrol eder
 * @param value - Kontrol edilecek değer
 * @returns Değer boş değilse true, boşsa false
 */
export const isNotEmpty = (value: string | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  return value.trim().length > 0;
};

/**
 * Minimum uzunluk kontrolü
 * @param value - Kontrol edilecek değer
 * @param minLength - Minimum uzunluk
 * @returns Uzunluk yeterli ise true, değilse false
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  return value.length >= minLength;
};

/**
 * Maximum uzunluk kontrolü
 * @param value - Kontrol edilecek değer
 * @param maxLength - Maximum uzunluk
 * @returns Uzunluk uygun ise true, değilse false
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  if (!value || typeof value !== 'string') {
    return true; // Boş değer max length'i aşmaz
  }
  
  return value.length <= maxLength;
};

// ============================================================================
// FORM VALIDATION
// ============================================================================

/**
 * Login form validasyonu
 * @param email - Email adresi
 * @param password - Şifre
 * @returns Validasyon hataları objesi
 */
export const validateLoginForm = (
  email: string,
  password: string
): { email: string | null; password: string | null; isValid: boolean } => {
  const emailError = getEmailError(email);
  const passwordError = !isValidPassword(password) ? 'Şifre en az 8 karakter olmalıdır' : null;
  
  return {
    email: emailError,
    password: passwordError,
    isValid: !emailError && !passwordError,
  };
};

/**
 * Register form validasyonu
 * @param data - Form verileri
 * @returns Validasyon hataları objesi
 */
export const validateRegisterForm = (data: {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}): {
  name: string | null;
  surname: string | null;
  email: string | null;
  phone: string | null;
  password: string | null;
  confirmPassword: string | null;
  isValid: boolean;
} => {
  const nameError = getNameError(data.name, 'Ad');
  const surnameError = getNameError(data.surname, 'Soyad');
  const emailError = getEmailError(data.email);
  
  const phoneError = data.phone && data.phone.trim().length > 0 && !isValidPhone(data.phone)
    ? 'Geçerli bir telefon numarası giriniz'
    : null;
  
  const passwordValidation = validatePassword(data.password);
  const passwordError = passwordValidation.errors.length > 0 ? passwordValidation.errors[0] : null;
  
  const confirmPasswordError = !doPasswordsMatch(data.password, data.confirmPassword)
    ? 'Şifreler eşleşmiyor'
    : null;
  
  return {
    name: nameError,
    surname: surnameError,
    email: emailError,
    phone: phoneError,
    password: passwordError,
    confirmPassword: confirmPasswordError,
    isValid: !nameError && !surnameError && !emailError && !phoneError && !passwordError && !confirmPasswordError,
  };
};
