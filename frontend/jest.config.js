/**
 * Jest Configuration
 * 
 * Next.js uygulaması için Jest test konfigürasyonu.
 * React Testing Library ile entegre çalışır.
 */

const nextJest = require('next/jest');

// Next.js konfigürasyonunu yükle
const createJestConfig = nextJest({
  // Next.js uygulamasının kök dizini
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // Test ortamı - DOM simülasyonu için jsdom kullan
  testEnvironment: 'jest-environment-jsdom',

  // Test öncesi çalışacak setup dosyası
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test dosyalarının konumu
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/__tests__/**/*.spec.[jt]s?(x)',
  ],

  // Module path aliases (tsconfig.json ile uyumlu)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test'ten hariç tutulacak klasörler
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],

  // Transform ayarları
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Coverage ayarları
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/page.tsx',
  ],

  // Coverage raporu formatları
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage çıktı dizini
  coverageDirectory: 'coverage',

  // Verbose output
  verbose: true,
};

module.exports = createJestConfig(customJestConfig);
