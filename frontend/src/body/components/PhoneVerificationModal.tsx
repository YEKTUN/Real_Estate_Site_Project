'use client';

import { useState, useEffect } from 'react';
import { Phone, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { sendVerificationCodeApi, verifyPhoneCodeApi } from '@/body/redux/api/phoneVerificationApi';
import { sanitizePhoneInput, formatPhone, getPhoneError } from '@/body/auth/utils/validation';

/**
 * Phone Verification Modal
 * 
 * Telefon numarası doğrulama modal bileşeni.
 * İki adımlı doğrulama: 1) Telefon girişi, 2) Kod doğrulama
 */

interface PhoneVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialPhone?: string;
}

export default function PhoneVerificationModal({
    isOpen,
    onClose,
    onSuccess,
    initialPhone = '',
}: PhoneVerificationModalProps) {
    const [step, setStep] = useState<'phone' | 'code'>('phone');
    const [phone, setPhone] = useState(initialPhone);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState<string | null>(null); // Simülasyon için
    const [countdown, setCountdown] = useState(0);

    // Geri sayım timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Modal açıldığında state'i sıfırla
    useEffect(() => {
        if (isOpen) {
            setStep('phone');
            setPhone(initialPhone);
            setCode('');
            setError(null);
            setSuccess(null);
            setVerificationCode(null);
            setCountdown(0);
        }
    }, [isOpen, initialPhone]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizePhoneInput(e.target.value);
        setPhone(sanitized);
        setError(null);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setCode(value);
        setError(null);
    };

    const handleSendCode = async () => {
        setError(null);
        setSuccess(null);

        // Validasyon
        const phoneError = getPhoneError(phone);
        if (phoneError) {
            setError(phoneError);
            return;
        }

        setIsLoading(true);

        try {
            const result = await sendVerificationCodeApi(phone);

            if (result.success) {
                setSuccess('Doğrulama kodu gönderildi!');
                setVerificationCode(result.code || null); // Simülasyon için kodu sakla
                setStep('code');
                setCountdown(300); // 5 dakika
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setError(null);
        setSuccess(null);

        if (code.length !== 6) {
            setError('Lütfen 6 haneli doğrulama kodunu girin');
            return;
        }

        setIsLoading(true);

        try {
            const result = await verifyPhoneCodeApi(code, phone);

            if (result.success) {
                setSuccess('Telefon numaranız başarıyla doğrulandı!');
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = () => {
        setCode('');
        setError(null);
        setSuccess(null);
        handleSendCode();
    };

    if (!isOpen) return null;

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight">Telefon Doğrulama</h2>
                            <p className="text-[10px] text-white/80 font-medium">
                                {step === 'phone' ? 'Telefon numaranızı girin' : 'Doğrulama kodunu girin'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Messages */}
                    {error && (
                        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-700 animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="text-xs font-bold">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-100 rounded-xl text-green-700 animate-in slide-in-from-top-2 duration-300">
                            <Check className="w-4 h-4 shrink-0" />
                            <p className="text-xs font-bold">{success}</p>
                        </div>
                    )}

                    {/* Simülasyon Uyarısı */}
                    {step === 'code' && (
                        <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                            <p className="text-[10px] font-black text-yellow-800 uppercase tracking-widest mb-1.5">
                                📱 SİMÜLASYON MODU
                            </p>
                            <p className="text-[10px] text-yellow-700 font-medium mb-2">
                                Gerçek SMS gönderilmedi. Test için kod her zaman:
                            </p>
                            <div className="bg-white p-2 rounded-lg border-2 border-yellow-300">
                                <p className="text-xl font-black text-center text-yellow-800 tracking-widest">
                                    111111
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Phone Input */}
                    {step === 'phone' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Telefon Numarası
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    placeholder="05342503741"
                                    className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-100 focus:border-blue-500 rounded-xl text-sm font-bold outline-none transition-all"
                                    maxLength={11}
                                />
                                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                                    Format: 05XXXXXXXXX (11 hane)
                                </p>
                            </div>

                            <button
                                onClick={handleSendCode}
                                disabled={isLoading || phone.length !== 11}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    'Doğrulama Kodu Gönder'
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Code Verification */}
                    {step === 'code' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                    Doğrulama Kodu
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={handleCodeChange}
                                    placeholder="6 haneli kod"
                                    className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-100 focus:border-blue-500 rounded-xl text-xl font-black text-center outline-none transition-all tracking-widest"
                                    maxLength={6}
                                    autoFocus
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        {formatPhone(phone)} numarasına gönderildi
                                    </p>
                                    {countdown > 0 && (
                                        <p className="text-[10px] text-blue-600 font-black">
                                            {formatCountdown(countdown)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleVerifyCode}
                                disabled={isLoading || code.length !== 6}
                                className="w-full py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Doğrulanıyor...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Doğrula
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleResendCode}
                                disabled={isLoading || countdown > 0}
                                className="w-full py-2 bg-gray-100 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {countdown > 0 ? `Yeniden Gönder (${formatCountdown(countdown)})` : 'Yeniden Gönder'}
                            </button>

                            <button
                                onClick={() => {
                                    setStep('phone');
                                    setCode('');
                                    setError(null);
                                    setVerificationCode(null);
                                }}
                                className="w-full py-2 text-gray-500 text-[9px] font-black uppercase tracking-widest hover:text-gray-700 transition-all"
                            >
                                ← Telefon Numarasını Değiştir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
