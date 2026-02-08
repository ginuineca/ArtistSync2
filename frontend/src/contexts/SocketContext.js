import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const token = localStorage.getItem('accessToken');
        const newSocket = io(API_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket');
            newSocket.emit('user:join_personal');
        });

        newSocket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        // User online/offline events
        newSocket.on('user:online', (userData) => {
            setOnlineUsers(prev => {
                if (!prev.find(u => u.userId === userData.userId)) {
                    return [...prev, userData];
                }
                return prev;
            });
        });

        newSocket.on('user:offline', (userData) => {
            setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
        });

        newSocket.on('online_users:list', (users) => {
            setOnlineUsers(users);
        });

        // Message events
        newSocket.on('message:new', ({ message }) => {
            setNotifications(prev => [{
                type: 'message',
                data: message,
                createdAt: new Date()
            }, ...prev]);
        });

        newSocket.on('user:typing', ({ conversationId, userId }) => {
            // Handle typing indicator
        });

        newSocket.on('user:stop_typing', ({ conversationId, userId }) => {
            // Handle stop typing
        });

        // Notification events
        newSocket.on('notification:new', (notification) => {
            setNotifications(prev => [{
                type: 'notification',
                data: notification,
                createdAt: new Date()
            }, ...prev]);
        });

        newSocket.on('notification:unread_count', ({ unreadCount }) => {
            // Update unread count
        });

        // Event notifications
        newSocket.on('notification:event_invitation', (data) => {
            setNotifications(prev => [{
                type: 'event_invitation',
                data,
                createdAt: new Date()
            }, ...prev]);
        });

        newSocket.on('notification:booking_update', (data) => {
            setNotifications(prev => [{
                type: 'booking_update',
                data,
                createdAt: new Date()
            }, ...prev]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    // Join conversation room
    const joinConversation = (conversationId) => {
        if (socket && conversationId) {
            socket.emit('conversation:join', { conversationId });
        }
    };

    // Leave conversation room
    const leaveConversation = (contactId) => {
        if (socket && contactId) {
            socket.emit('conversation:leave', { conversationId: contactId });
        }
    };

    // Send message via Socket.IO
    const sendMessage = (conversationId, content) => {
        if (socket) {
            socket.emit('message:send', { conversationId, content });
        }
    };

    // Mark messages as read
    const markMessagesAsRead = (conversationId) => {
        if (socket) {
            socket.emit('messages:mark_read', { conversationId });
        }
    };

    // Send typing indicator
    const startTyping = (conversationId) => {
        if (socket) {
            socket.emit('message:typing', { conversationId });
        }
    };

    const stopTyping = (conversationId) => {
        if (socket) {
            socket.emit('message:stop_typing', { conversationId });
        }
    };

    const value = {
        socket,
        connected: socket?.connected || false,
        onlineUsers,
        notifications,
        clearNotifications: () => setNotifications([]),
        joinConversation,
        leaveConversation,
        sendMessage,
        markMessagesAsRead,
        startTyping,
        stopTyping,
        isUserOnline: (userId) => onlineUsers.some(u => u.userId === userId)
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
