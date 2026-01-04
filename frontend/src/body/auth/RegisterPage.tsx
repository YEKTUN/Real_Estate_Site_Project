'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import {
  register,
  clearError,
  selectIsLoading,
  selectError,
  selectIsAuthenticated
} from '@/body/redux/slices/auth/AuthSlice';
import { RegisterRequestDto } from '@/body/redux/slices/auth/DTOs/AuthDTOs';
import { sanitizePhoneInput, getPhoneError } from './utils/validation';
import GoogleLoginButton from './components/GoogleLoginButton';

/**
 * Register Component
 * 
 * Kullanıcı kayıt formu bileşeni.
 * Redux ile entegre auth işlemleri.
 * Özellikler: Name, Surname, Phone, Email, Password
 */

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Redux state'leri
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Form state
  const [formData, setFormData] = useState<RegisterRequestDto>({
    name: '',
    surname: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  /**
   * Başarılı kayıt sonrası panel sayfasına yönlendirme
   */
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Register: Kullanıcı authenticated, panel sayfasına yönlendiriliyor...');
      router.push('/panel');
    }
  }, [isAuthenticated, router]);

  /**
   * Component unmount olduğunda error'u temizle
   */
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  /**
   * Real-time Validation
   */
  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'name':
        if (value.length < 2) error = 'Ad en az 2 karakter olmalıdır';
        break;
      case 'surname':
        if (value.length < 2) error = 'Soyad en az 2 karakter olmalıdır';
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Geçerli bir e-posta adresi giriniz';
        break;
      case 'password':
        if (value.length < 8) error = 'Şifre en az 8 karakter olmalıdır';
        else if (!/[A-Z]/.test(value)) error = 'En az bir büyük harf içermelidir';
        else if (!/[0-9]/.test(value)) error = 'En az bir rakam içermelidir';
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = 'Şifreler eşleşmiyor';
        break;
      case 'phone':
        const phoneError = getPhoneError(value);
        if (phoneError) error = phoneError;
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  /**
   * Form submit handler
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fieldsToValidate = ['name', 'surname', 'email', 'password', 'confirmPassword'];
    let isValid = true;
    fieldsToValidate.forEach(field => {
      if (!validateField(field, (formData as any)[field])) isValid = false;
    });

    if (!acceptTerms) {
      setErrors(prev => ({ ...prev, terms: 'Kullanım koşullarını kabul etmelisiniz' }));
      isValid = false;
    }

    if (!isValid) return;

    await dispatch(register(formData));
  };

  /**
   * Input change handler
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Telefon alanı için sadece rakam kabul et
    const sanitizedValue = name === 'phone' ? sanitizePhoneInput(value) : value;

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    validateField(name, sanitizedValue);
  };

  /**
   * Hata mesajını 3 saniye sonra temizle (Kullanıcı isteği)
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">Hesap Oluştur</h2>
        <p className="text-slate-400 text-[11px]">
          Aramıza katılmak için formu doldurun
        </p>
      </div>

      {/* Global Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2 rounded-xl flex items-center gap-2 animate-shake">
          <span className="text-xs font-medium">{error}</span>
          <button onClick={() => dispatch(clearError())} className="ml-auto text-xs">✕</button>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Name */}
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-widest ${isFocused === 'name' ? 'text-blue-400' : 'text-slate-500'}`}>Ad</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => setIsFocused('name')}
              onBlur={() => setIsFocused(null)}
              placeholder="Ahmet"
              className={`w-full bg-white/5 border px-3 py-2 rounded-xl text-sm text-white outline-none transition-all ${errors.name ? 'border-red-500/50' : 'border-white/5 focus:border-blue-500/30'}`}
            />
            {errors.name && <p className="text-red-400 text-[9px] font-medium mt-0.5">{errors.name}</p>}
          </div>

          {/* Surname */}
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-widest ${isFocused === 'surname' ? 'text-blue-400' : 'text-slate-500'}`}>Soyad</label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              onFocus={() => setIsFocused('surname')}
              onBlur={() => setIsFocused(null)}
              placeholder="Yılmaz"
              className={`w-full bg-white/5 border px-3 py-2 rounded-xl text-sm text-white outline-none transition-all ${errors.surname ? 'border-red-500/50' : 'border-white/5 focus:border-blue-500/30'}`}
            />
            {errors.surname && <p className="text-red-400 text-[9px] font-medium mt-0.5">{errors.surname}</p>}
          </div>
        </div>

        {/* Email & Phone in one row to save space */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-widest ${isFocused === 'email' ? 'text-blue-400' : 'text-slate-500'}`}>E-posta</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setIsFocused('email')}
              onBlur={() => setIsFocused(null)}
              placeholder="adiniz@ornek.com"
              className={`w-full bg-white/5 border px-3 py-2 rounded-xl text-sm text-white outline-none transition-all ${errors.email ? 'border-red-500/50' : 'border-white/5 focus:border-blue-500/30'}`}
            />
            {errors.email && <p className="text-red-400 text-[9px] font-medium mt-0.5">{errors.email}</p>}
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-widest ${isFocused === 'phone' ? 'text-blue-400' : 'text-slate-500'}`}>Telefon</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onFocus={() => setIsFocused('phone')}
              onBlur={() => setIsFocused(null)}
              placeholder="05342503741"
              className={`w-full bg-white/5 border px-3 py-2 rounded-xl text-sm text-white outline-none transition-all ${errors.phone ? 'border-red-500/50' : 'border-white/5 focus:border-blue-500/30'}`}
            />
            {errors.phone && <p className="text-red-400 text-[9px] font-medium mt-0.5">{errors.phone}</p>}
          </div>
        </div>

        {/* Password */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-widest ${isFocused === 'password' ? 'text-blue-400' : 'text-slate-500'}`}>Şifre</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setIsFocused('password')}
              onBlur={() => setIsFocused(null)}
              placeholder="••••••••"
              className={`w-full bg-white/5 border px-3 py-2 rounded-xl text-sm text-white outline-none transition-all ${errors.password ? 'border-red-500/50' : 'border-white/5 focus:border-blue-500/30'}`}
            />
          </div>
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-widest ${isFocused === 'confirmPassword' ? 'text-blue-400' : 'text-slate-500'}`}>Tekrar</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => setIsFocused('confirmPassword')}
              onBlur={() => setIsFocused(null)}
              placeholder="••••••••"
              className={`w-full bg-white/5 border px-3 py-2 rounded-xl text-sm text-white outline-none transition-all ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/5 focus:border-blue-500/30'}`}
            />
          </div>
        </div>
        {(errors.password || errors.confirmPassword) && (
          <p className="text-red-400 text-[9px] font-medium">{errors.password || errors.confirmPassword}</p>
        )}

        {/* Terms */}
        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => {
              setAcceptTerms(e.target.checked);
              setErrors(prev => ({ ...prev, terms: '' }));
            }}
            className="w-4 h-4 rounded bg-white/5 border-white/10 text-blue-600 focus:ring-0"
          />
          <span className="text-[10px] text-slate-400 leading-tight">
            <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors font-bold">Kullanım Koşullarını</Link> ve <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors font-bold">Gizlilik Politikasını</Link> kabul ediyorum.
          </span>
        </div>
        {errors.terms && <p className="text-red-400 text-[9px] font-medium">{errors.terms}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full relative overflow-hidden py-3 bg-blue-600 text-white rounded-xl font-bold tracking-wider text-sm transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 mt-1"
        >
          {isLoading ? 'İşleniyor...' : 'Kayıt Ol'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="mx-3 text-slate-500 text-[9px] font-bold tracking-widest uppercase">VEYA</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      {/* Google Button */}
      <GoogleLoginButton text="signup_with" />

      {/* Login Link */}
      <div className="text-center pt-1">
        <p className="text-slate-500 text-xs">
          Hesabınız var mı?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold border-b border-blue-400/20 hover:border-blue-300">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
