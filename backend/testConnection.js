import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI_TEST, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Successfully connected to test database!');
        
        // Get database information
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach(collection => console.log(`- ${collection.name}`));
        
        // Get database stats
        const stats = await db.stats();
        console.log('\nDatabase stats:');
        console.log(`- Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- Number of collections: ${stats.collections}`);
        console.log(`- Number of documents: ${stats.objects}`);
        
        // Additional database information
        console.log(`- Collections count: ${collections.length}`);
        
        return db;
    } catch (error) {
        console.error('Failed to connect to test database:', error);
        throw error;
    } finally {
        // Optionally close the connection after testing
        await mongoose.connection.close();
    }
}

// Only run if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testConnection();
}
