/**
 * Test Utilities
 * 
 * Test için özel render fonksiyonu ve yardımcı araçlar.
 * Redux Provider ile sarılmış bileşenleri test etmek için kullanılır.
 */

import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/body/redux/slices/auth/AuthSlice';
import type { RootState } from '@/body/redux/store';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Preloaded State tipi - RootState'in partial versiyonu
 */
type PreloadedStateType = Partial<RootState>;

// ============================================================================
// STORE SETUP
// ============================================================================

/**
 * Test için özel Redux store oluşturur
 * @param preloadedState - Başlangıç state'i (opsiyonel)
 * @returns Konfigüre edilmiş store
 */
export function setupStore(preloadedState?: PreloadedStateType) {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: preloadedState as RootState | undefined,
  });
}

// Store tipi
export type AppStore = ReturnType<typeof setupStore>;

// ============================================================================
// CUSTOM RENDER
// ============================================================================

/**
 * Extended render options
 * Standart render options'a ek olarak Redux state'i ve store'u kabul eder
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedStateType;
  store?: AppStore;
}

/**
 * Redux Provider ile sarılmış custom render fonksiyonu
 * 
 * Kullanım:
 * const { store } = render(<MyComponent />, { preloadedState: { auth: {...} } });
 * 
 * @param ui - Render edilecek React bileşeni
 * @param options - Render options (preloadedState, store, vb.)
 * @returns Render sonucu ve store
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  /**
   * Wrapper Component
   * Test edilen bileşeni Redux Provider ile sarar
   */
  function Wrapper({ children }: PropsWithChildren<object>): React.JSX.Element {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Mock User oluşturur
 * @param overrides - Üzerine yazılacak özellikler
 * @returns Mock UserDto
 */
export function createMockUser(overrides = {}) {
  return {
    id: '1',
    name: 'Test',
    surname: 'User',
    email: 'test@example.com',
    phone: '5551234567',
    ...overrides,
  };
}

/**
 * Mock AuthState oluşturur
 * @param overrides - Üzerine yazılacak özellikler
 * @returns Mock AuthState
 */
export function createMockAuthState(overrides = {}) {
  return {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    ...overrides,
  };
}

/**
 * Authenticated AuthState oluşturur
 * @param overrides - Üzerine yazılacak özellikler
 * @returns Authenticated mock state
 */
export function createAuthenticatedState(overrides = {}) {
  const user = createMockUser();
  return {
    user,
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    ...overrides,
  };
}

/**
 * Mock AuthResponseDto oluşturur
 * @param success - İşlem başarılı mı?
 * @param overrides - Üzerine yazılacak özellikler
 * @returns Mock AuthResponseDto
 */
export function createMockAuthResponse(success = true, overrides = {}) {
  if (success) {
    return {
      success: true,
      message: 'İşlem başarılı',
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: createMockUser(),
      ...overrides,
    };
  }
  
  return {
    success: false,
    message: 'İşlem başarısız',
    ...overrides,
  };
}

// ============================================================================
// ASYNC HELPERS
// ============================================================================

/**
 * Belirli bir süre bekler
 * @param ms - Beklenecek süre (milisaniye)
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Bir sonraki tick'e kadar bekler
 */
export const waitForNextTick = () => new Promise((resolve) => process.nextTick(resolve));

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Testing library utilities'i re-export et
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Custom render'ı varsayılan olarak export et
export { renderWithProviders as render };
