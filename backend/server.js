import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fileUpload from 'express-fileupload';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import profileRoutes from './routes/profile.js';
import eventRoutes from './routes/eventRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import messageRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';
import notificationRoutes from './routes/notifications.js';
import { closeRedisConnections } from './services/cache.service.js';
import { setupSocketIO } from './services/socket.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Setup Socket.IO
const corsOrigin = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
const io = new Server(httpServer, {
    cors: {
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// Make io accessible globally
app.set('io', io);

// Middleware
app.use(cors({
    origin: corsOrigin,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    abortOnLimit: true
}));

// Connect to MongoDB
connectDB();

// Clear any existing model to prevent OverwriteModelError
if (mongoose.models.User) {
    delete mongoose.models.User;
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');
    io.close();
    await closeRedisConnections();
    httpServer.close();
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Setup Socket.IO handlers
setupSocketIO(io);

// Start server if not being imported
const isMainModule = process.argv[1] && process.argv[1].endsWith('server.js');
if (isMainModule) {
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`API: http://localhost:${PORT}`);
        console.log(`Health: http://localhost:${PORT}/health`);
        console.log(`WebSocket: ws://localhost:${PORT}`);
    });
}

export { app, io };
export default app;
