import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: './backend/config/test.env' });
} else {
    dotenv.config();
}

const MONGODB_URI = process.env.NODE_ENV === 'test' 
    ? 'mongodb://127.0.0.1:27017/artistsync_test'
    : process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/artistsync';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
