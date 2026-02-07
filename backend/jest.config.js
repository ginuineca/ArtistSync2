module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.jsx?$': ['babel-jest', { configFile: './babel.config.js' }]
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    setupFilesAfterEnv: [
        '<rootDir>/tests/jest.setup.js'
    ],
    testTimeout: 30000,
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
    transformIgnorePatterns: [
        'node_modules/(?!(socket\\.io.*)/)'
    ],
    moduleDirectories: ['node_modules', 'src'],
    roots: ['<rootDir>'],
    testPathIgnorePatterns: ['/node_modules/'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/'
    ]
};
