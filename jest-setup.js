import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = 5001;
process.env.JWT_SECRET = 'test-secret';

export default async function globalSetup() {
    if (!global.__MONGOD__) {
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        // Configure Mongoose
        mongoose.set('strictQuery', false);
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 60000
        });

        // Add it to global so it can be used in all test files
        global.__MONGOD__ = mongoServer;
        global.__MONGO_URI__ = mongoUri;
    }
}

export async function globalTeardown() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (global.__MONGOD__) {
        await global.__MONGOD__.stop();
        delete global.__MONGOD__;
        delete global.__MONGO_URI__;
    }
}
