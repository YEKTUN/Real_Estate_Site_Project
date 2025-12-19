/**
 * Auth DTOs (Data Transfer Objects)
 * 
 * Backend API ile iletişimde kullanılan tip tanımlamaları.
 * Login, Register, Refresh Token ve Auth Response için interface'ler.
 */

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * Login Request DTO
 * Kullanıcı giriş isteği için
 */
export interface LoginRequestDto {
  emailOrUsername: string;
  password: string;
}

/**
 * Register Request DTO
 * Kullanıcı kayıt isteği için
 * Özellikler: name, surname, phone, email, password
 */
export interface RegisterRequestDto {
  name: string;
  surname: string;
  phone?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Refresh Token Request DTO
 * Token yenileme isteği için
 */
export interface RefreshTokenRequestDto {
  refreshToken: string;
}

/**
 * Google Login Request DTO
 * Google OAuth ile giriş isteği için
 */
export interface GoogleLoginRequestDto {
  idToken: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * User DTO
 * Kullanıcı bilgileri
 */
export interface UserDto {
  id: string;
  name: string;
  surname: string;
  phone?: string;
  email: string;
  profilePictureUrl?: string;
}

/**
 * Auth Response DTO
 * Login/Register/Refresh işlemlerinin yanıtı
 */
export interface AuthResponseDto {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: UserDto;
}

// ============================================================================
// STATE INTERFACES
// ============================================================================

/**
 * Auth State
 * Redux store'daki auth state'i
 */
export interface AuthState {
  user: UserDto | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Token Payload
 * JWT token içeriği
 */
export interface TokenPayload {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  jti: string;
  exp: number;
  iss: string;
  aud: string;
  // Backend'deki custom profil fotoğrafı claim'i
  picture?: string;
}
