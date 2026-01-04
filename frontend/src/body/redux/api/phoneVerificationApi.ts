/**
 * Phone Verification API
 * 
 * Telefon numarası doğrulama işlemleri için API fonksiyonları.
 * SMS simülasyonu ile çalışır.
 */

import axiosInstance from './axiosInstance';

// ============================================================================
// TYPES
// ============================================================================

export interface SendCodeRequest {
    phone: string;
}

export interface SendCodeResponse {
    success: boolean;
    message: string;
    code?: string; // Simülasyon için - Production'da kaldırılmalı
    expiresAt?: string;
}

export interface VerifyCodeRequest {
    code: string;
}

export interface VerifyCodeResponse {
    success: boolean;
    message: string;
    phoneVerified?: boolean;
}

export interface PhoneVerificationStatusResponse {
    success: boolean;
    phoneVerified: boolean;
    hasPhone: boolean;
    phone?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Telefon doğrulama kodu gönder
 * @param phone - Telefon numarası (05XXXXXXXXX formatında)
 * @returns Doğrulama kodu bilgisi
 */
export const sendVerificationCodeApi = async (
    phone: string
): Promise<SendCodeResponse> => {
    try {
        const response = await axiosInstance.post<SendCodeResponse>(
            '/PhoneVerification/send-code',
            { phone }
        );
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Doğrulama kodu gönderilemedi',
        };
    }
};

/**
 * Telefon doğrulama kodunu kontrol et
 * @param code - 6 haneli doğrulama kodu
 * @param phone - Doğrulanacak telefon numarası
 * @returns Doğrulama sonucu
 */
export const verifyPhoneCodeApi = async (
    code: string,
    phone: string
): Promise<VerifyCodeResponse> => {
    try {
        const response = await axiosInstance.post<VerifyCodeResponse>(
            '/PhoneVerification/verify-code',
            { code, phone }
        );
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Doğrulama başarısız oldu',
        };
    }
};

/**
 * Telefon doğrulama durumunu kontrol et
 * @returns Doğrulama durumu
 */
export const getPhoneVerificationStatusApi = async (): Promise<PhoneVerificationStatusResponse> => {
    try {
        const response = await axiosInstance.get<PhoneVerificationStatusResponse>(
            '/PhoneVerification/status'
        );
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            phoneVerified: false,
            hasPhone: false,
            phone: undefined,
        };
    }
};
