module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/e2e/'],
    moduleFileExtensions: ['ts', 'html', 'js', 'json'],
    transform: {
        '^.+\\.ts$': 'ts-jest', // Only transform .ts files
    },
    transformIgnorePatterns: [
        '/node_modules/(?!flat)/', // Exclude modules except 'flat' from transformation
    ],
};