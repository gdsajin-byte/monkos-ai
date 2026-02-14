export default {
    testEnvironment: 'node',
    transform: {},
    moduleFileExtensions: ['js', 'mjs'],
    testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
    verbose: true,
    collectCoverageFrom: ['*.js', '!jest.config.js'],
    coverageDirectory: 'coverage'
};
