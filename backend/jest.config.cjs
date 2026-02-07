/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.js$': [
            'babel-jest',
            { configFile: './babel.config.cjs' }
        ]
    },
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./tests/setup/jest.setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(mongodb-memory-server|redis-memory-server)/)'
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
        '/coverage/'
    ],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
