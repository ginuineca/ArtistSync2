import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set longer timeout for all tests
jest.setTimeout(60000);

let mongoServer;

// Connect to the in-memory database before running tests
beforeAll(async () => {
    try {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to in-memory MongoDB database');
    } catch (error) {
        console.error('Error connecting to the test database:', error);
        process.exit(1);
    }
});

// Clear all collections before each test
beforeEach(async () => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB is not connected');
    }

    try {
        const collections = mongoose.connection.collections;
        await Promise.all(
            Object.values(collections).map(collection => collection.deleteMany({}))
        );
        console.log('Cleared all test collections');
    } catch (error) {
        console.error('Error clearing collections:', error);
        throw error;
    }
});

// Clean up and close the connection after tests
afterAll(async () => {
    try {
        await mongoose.disconnect();
        await mongoServer.stop();
        console.log('Closed MongoDB connection and stopped server');
    } catch (error) {
        console.error('Error cleaning up test database:', error);
    }
});
