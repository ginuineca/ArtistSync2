import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// Store online users
const onlineUsers = new Map();

export const setupSocketIO = (io) => {
    // Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'default_secret'
            );

            if (decoded.type !== 'access') {
                return next(new Error('Invalid token type'));
            }

            const user = await User.findById(decoded.id).select('-password');
            if (!user || !user.isActive) {
                return next(new Error('User not found or inactive'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // Add to online users
        onlineUsers.set(socket.userId, {
            socketId: socket.id,
            userId: socket.userId,
            user: socket.user,
            connectedAt: new Date()
        });

        // Broadcast online status to all users
        io.emit('user:online', {
            userId: socket.userId,
            user: {
                id: socket.user._id,
                username: socket.user.username,
                name: socket.user.name,
                profilePicture: socket.user.profilePicture
            }
        });

        // Get list of online users
        socket.on('get:online_users', () => {
            const onlineUsersList = Array.from(onlineUsers.values()).map(u => ({
                userId: u.userId,
                user: {
                    id: u.user._id,
                    username: u.user.username,
                    name: u.user.name,
                    profilePicture: u.user.profilePicture
                }
            }));
            socket.emit('online_users:list', onlineUsersList);
        });

        // Join conversation room
        socket.on('conversation:join', async ({ conversationId }) => {
            try {
                const conversation = await Conversation.findById(conversationId);
                if (!conversation || !conversation.isParticipant(socket.userId)) {
                    return socket.emit('error', { message: 'Conversation not found' });
                }

                socket.join(`conversation:${conversationId}`);
                socket.currentConversation = conversationId;

                // Notify others in conversation
                socket.to(`conversation:${conversationId}`).emit('user:joined_conversation', {
                    conversationId,
                    userId: socket.userId,
                    user: {
                        id: socket.user._id,
                        username: socket.user.username,
                        name: socket.user.name,
                        profilePicture: socket.user.profilePicture
                    }
                });

                // Emit typing status
                socket.on('message:typing', ({ conversationId: convId }) => {
                    socket.to(`conversation:${convId}`).emit('user:typing', {
                        conversationId: convId,
                        userId: socket.userId
                    });
                });

                socket.on('message:stop_typing', ({ conversationId: convId }) => {
                    socket.to(`conversation:${convId}`).emit('user:stop_typing', {
                        conversationId: convId,
                        userId: socket.userId
                    });
                });

                // Get active users in conversation
                const room = io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
                const activeUsers = [];
                if (room) {
                    for (const socketId of room) {
                        const connectedSocket = io.sockets.sockets.get(socketId);
                        if (connectedSocket && connectedSocket.userId) {
                            activeUsers.push(connectedSocket.userId);
                        }
                    }
                }

                socket.emit('conversation:active_users', {
                    conversationId,
                    activeUsers
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Leave conversation room
        socket.on('conversation:leave', ({ conversationId }) => {
            socket.leave(`conversation:${conversationId}`);
            socket.to(`conversation:${conversationId}`).emit('user:left_conversation', {
                conversationId,
                userId: socket.userId
            });
        });

        // Send message real-time
        socket.on('message:send', async ({ conversationId, content }) => {
            try {
                const message = new Message({
                    conversation: conversationId,
                    sender: socket.userId,
                    content,
                    readBy: [{ user: socket.userId, readAt: new Date() }]
                });

                await message.save();
                await message.populate('sender', 'username name profilePicture');

                // Update conversation
                const conversation = await Conversation.findById(conversationId);
                conversation.lastMessage = message._id;
                conversation.updatedAt = new Date();

                // Update unread count for other participants
                for (const participant of conversation.participants) {
                    if (participant.user.toString() !== socket.userId) {
                        await conversation.updateUnreadCount(participant.user, true);
                    }
                }
                await conversation.save();

                // Emit to conversation room
                io.to(`conversation:${conversationId}`).emit('message:new', {
                    message,
                    conversationId
                });

                // Emit unread count update
                for (const participant of conversation.participants) {
                    const unreadCount = conversation.metadata.unreadCount.get(participant.user.toString()) || 0;
                    io.to(`user:${participant.user.toString()}`).emit('notification:unread_count', {
                        conversationId,
                        unreadCount
                    });
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Mark messages as read
        socket.on('messages:mark_read', async ({ conversationId }) => {
            try {
                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;

                await Message.updateMany(
                    {
                        conversation: conversationId,
                        sender: { $ne: socket.userId },
                        'readBy.user': { $ne: socket.userId }
                    },
                    {
                        $push: {
                            readBy: { user: socket.userId, readAt: new Date() }
                        }
                    }
                );

                await conversation.updateUnreadCount(socket.userId, false);

                socket.emit('messages:read', { conversationId });

                // Notify sender that messages were read
                const message = await Message.findOne({
                    conversation: conversationId,
                    sender: { $ne: socket.userId }
                }).sort({ createdAt: -1 });

                if (message) {
                    io.to(`user:${message.sender.toString()}`).emit('messages:read_by_other', {
                        conversationId,
                        userId: socket.userId
                    });
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Event invitation notification
        socket.on('event:invitation', async ({ eventId, artistId, eventData }) => {
            io.to(`user:${artistId}`).emit('notification:event_invitation', {
                eventId,
                eventData,
                from: {
                    id: socket.user._id,
                    username: socket.user.username,
                    name: socket.user.name
                }
            });
        });

        // Booking status update
        socket.on('booking:status_update', async ({ bookingId, status, artistId }) => {
            io.to(`user:${artistId}`).emit('notification:booking_update', {
                bookingId,
                status,
                message: `Booking request ${status}`
            });
        });

        // New review notification
        socket.on('review:new', async ({ profileId, reviewData }) => {
            io.to(`user:${profileId}`).emit('notification:new_review', {
                reviewData,
                message: `You received a new review`
            });
        });

        // Join personal room for direct notifications
        socket.on('user:join_personal', () => {
            socket.join(`user:${socket.userId}`);
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);

            // Remove from online users
            onlineUsers.delete(socket.userId);

            // Broadcast offline status
            io.emit('user:offline', {
                userId: socket.userId
            });

            // Leave current conversation
            if (socket.currentConversation) {
                socket.to(`conversation:${socket.currentConversation}`).emit('user:left_conversation', {
                    conversationId: socket.currentConversation,
                    userId: socket.userId
                });
            }
        });
    });

    return io;
};

// Helper function to send notification to specific user
export const sendNotificationToUser = (userId, notification) => {
    const io = global.io || require('../server.js').io;
    if (!io) return;

    io.to(`user:${userId}`).emit('notification:new', notification);
};

// Helper function to get online users
export const getOnlineUsers = () => {
    return Array.from(onlineUsers.values());
};

// Helper function to check if user is online
export const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
};
