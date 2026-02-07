/** @type {import('jest').Config} */
export default {
    testEnvironment: 'node',
    transform: {},
    moduleNameMapper: {
        '^(\.{1,2}/.*)\\.js$': '$1',
        '^src/(.*)$': '<rootDir>/backend/$1',
        '^app$': '<rootDir>/backend/app.js',
        '^backend/(.*)$': '<rootDir>/backend/$1',
        '^utils/(.*)$': '<rootDir>/backend/utils/$1',
    },
    testTimeout: 60000,
    setupFilesAfterEnv: ['./test-setup.js'],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/frontend/'
    ],
    verbose: true,
    detectOpenHandles: true,
    forceExit: true,
    moduleDirectories: ['node_modules'],
    roots: ['<rootDir>'],
    transformIgnorePatterns: [],
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ]
};
