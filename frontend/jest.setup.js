/**
 * Jest Setup File
 * 
 * Test ortamı için gerekli mock'lar ve global konfigürasyonlar.
 * Bu dosya her test dosyası çalışmadan önce yüklenir.
 */

// Testing Library DOM matchers
import '@testing-library/jest-dom';

// ============================================================================
// NEXT.JS MOCK'LARI
// ============================================================================

/**
 * next/navigation mock
 * useRouter, usePathname, useSearchParams hook'larını mock'la
 */
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

/**
 * next/link mock
 * Link bileşenini basit bir anchor tag'e dönüştür
 */
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

/**
 * next/image mock
 * Image bileşenini basit bir img tag'e dönüştür
 */
jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }) => {
    return <img src={src} alt={alt} {...props} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// ============================================================================
// BROWSER API MOCK'LARI
// ============================================================================

/**
 * LocalStorage mock
 */
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

/**
 * SessionStorage mock
 */
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

/**
 * matchMedia mock
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/**
 * scrollTo mock
 */
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

/**
 * IntersectionObserver mock
 */
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

/**
 * ResizeObserver mock
 */
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// ============================================================================
// CONSOLE SUPPRESSION (Opsiyonel)
// ============================================================================

/**
 * Test sırasında gereksiz console uyarılarını sustur
 * İhtiyaç halinde bu bölümü yorum satırına alabilirsiniz
 */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // React act() uyarılarını sustur
    if (typeof args[0] === 'string' && args[0].includes('act(')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Her testten sonra localStorage ve sessionStorage'ı temizle
 */
beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
  jest.clearAllMocks();
});
