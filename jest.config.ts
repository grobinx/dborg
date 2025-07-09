module.exports = {
    preset: 'ts-jest', // Użycie ts-jest do obsługi TypeScript
    testEnvironment: 'node', // Środowisko testowe Node.js
    testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'], // Wzorce dla plików testowych
    moduleFileExtensions: ['ts', 'js', 'json'], // Obsługiwane rozszerzenia plików
    rootDir: './', // Główny katalog projektu
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1', // Mapowanie aliasów (jeśli używasz aliasów w TypeScript)
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json', // Ścieżka do pliku tsconfig
        },
    },
    collectCoverage: true, // Włącz zbieranie pokrycia kodu
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}', // Pliki, z których ma być zbierane pokrycie
        '!src/**/*.d.ts', // Wyklucz pliki deklaracji
        '!src/**/index.ts', // Wyklucz pliki index.ts
    ],
    coverageDirectory: 'coverage', // Katalog, w którym będą zapisywane raporty pokrycia
    coverageReporters: ['json', 'lcov', 'text', 'clover'], // Format raportów pokrycia
    testPathIgnorePatterns: ['/node_modules/', '/dist/'], // Ignorowane ścieżki
    transform: {
        '^.+\\.ts$': 'ts-jest', // Transformacja plików TypeScript
    },
};