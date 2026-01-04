'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import {
  logoutAsync,
  initializeAuth,
  selectIsAuthenticated,
  selectToken,
  selectIsLoading
} from '@/body/redux/slices/auth/AuthSlice';
import { fetchMyFavorites } from '@/body/redux/slices/favorite/FavoriteSlice';
import { isTokenValid } from '@/body/redux/api/axiosInstance';

/**
 * AuthGuard Component
 * 
 * Tüm uygulamada token kontrolü yapar:
 * - Sayfa değişikliğinde token geçerliliğini kontrol eder
 * - Token süresi dolduysa otomatik çıkış yapar
 * - Periyodik olarak (30 saniyede bir) token kontrolü yapar
 * - Uygulama başladığında auth state'i initialize eder
 */

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const token = useAppSelector(selectToken);
  const isLoading = useAppSelector(selectIsLoading);

  /**
   * Token kontrolü yap ve gerekirse çıkış yap
   */
  const checkAndHandleTokenExpiration = useCallback(() => {
    // Token varsa ve geçersizse çıkış yap
    if (token && !isTokenValid()) {
      console.log('AuthGuard: Token süresi dolmuş, çıkış yapılıyor...');
      dispatch(logoutAsync());
      router.push('/login');
      return false;
    }
    return true;
  }, [token, dispatch, router]);

  /**
   * Uygulama başladığında auth state'i initialize et
   */
  useEffect(() => {
    console.log('AuthGuard: Auth state initialize ediliyor...');
    dispatch(initializeAuth());
  }, [dispatch]);

  /**
   * Her sayfa değişikliğinde token kontrolü yap
   */
  useEffect(() => {
    console.log('AuthGuard: Sayfa değişti -', pathname);
    checkAndHandleTokenExpiration();
  }, [pathname, checkAndHandleTokenExpiration]);

  /**
   * Periyodik token kontrolü (30 saniyede bir)
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isAuthenticated && token) {
        console.log('AuthGuard: Periyodik token kontrolü...');
        checkAndHandleTokenExpiration();
      }
    }, 30000); // 30 saniye

    return () => clearInterval(intervalId);
  }, [isAuthenticated, token, checkAndHandleTokenExpiration]);

  /**
   * Tarayıcı sekmesi aktif olduğunda token kontrolü yap
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && token) {
        console.log('AuthGuard: Sekme aktif oldu, token kontrol ediliyor...');
        checkAndHandleTokenExpiration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, token, checkAndHandleTokenExpiration]);

  /**
   * Storage değişikliğini dinle (başka sekmede logout yapılırsa)
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue === null && isAuthenticated) {
        console.log('AuthGuard: Token başka sekmede silindi, çıkış yapılıyor...');
        dispatch(logoutAsync());
        router.push('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated, dispatch, router]);

  /**
   * Giriş yapıldığında favorileri çek
   */
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('AuthGuard: Favoriler çekiliyor...');
      dispatch(fetchMyFavorites({ page: 1, pageSize: 1000 }));
    }
  }, [isAuthenticated, token, dispatch]);

  return <>{children}</>;
}
