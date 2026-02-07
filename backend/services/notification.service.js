import Notification from '../models/Notification.js';
import { sendNotificationToUser, isUserOnline } from './socket.service.js';

// Create and send notification
export const createNotification = async (notificationData) => {
    try {
        const notification = await Notification.createNotification(notificationData);
        await notification.populate('sender', 'username name profilePicture');

        // Send real-time notification via Socket.IO if user is online
        if (isUserOnline(notificationData.recipient.toString())) {
            sendNotificationToUser(notificationData.recipient.toString(), {
                type: 'notification',
                data: notification
            });
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Notification templates
export const notificationTemplates = {
    // Message notification
    newMessage: (senderId, recipientId, conversationId, messagePreview) => ({
        recipient: recipientId,
        sender: senderId,
        type: 'message',
        title: 'New Message',
        message: messagePreview || 'You have a new message',
        data: { conversationId },
        actionUrl: `/messages/${conversationId}`
    }),

    // Event invitation
    eventInvitation: (senderId, recipientId, eventId, eventName) => ({
        recipient: recipientId,
        sender: senderId,
        type: 'event_invitation',
        title: 'Event Invitation',
        message: `You've been invited to perform at ${eventName}`,
        data: { eventId },
        actionUrl: `/events/${eventId}`
    }),

    // Booking request
    bookingRequest: (senderId, recipientId, eventId, eventName) => ({
        recipient: recipientId,
        sender: senderId,
        type: 'booking_request',
        title: 'Booking Request',
        message: `New booking request for ${eventName}`,
        data: { eventId },
        actionUrl: `/events/${eventId}`
    }),

    // Booking accepted
    bookingAccepted: (recipientId, eventId, eventName) => ({
        recipient: recipientId,
        type: 'booking_accepted',
        title: 'Booking Accepted!',
        message: `Your booking for ${eventName} has been accepted`,
        data: { eventId },
        actionUrl: `/events/${eventId}`
    }),

    // Booking declined
    bookingDeclined: (recipientId, eventId, eventName) => ({
        recipient: recipientId,
        type: 'booking_declined',
        title: 'Booking Declined',
        message: `Your booking for ${eventName} has been declined`,
        data: { eventId },
        actionUrl: `/events/${eventId}`
    }),

    // New review
    newReview: (senderId, recipientId, reviewId, rating) => ({
        recipient: recipientId,
        sender: senderId,
        type: 'new_review',
        title: 'New Review',
        message: `You received a ${rating}-star review`,
        data: { reviewId },
        actionUrl: `/profile`
    }),

    // New follower
    newFollower: (senderId, recipientId) => ({
        recipient: recipientId,
        sender: senderId,
        type: 'new_follower',
        title: 'New Follower',
        message: 'Someone started following you',
        actionUrl: `/profile`
    }),

    // Event updated
    eventUpdated: (recipientId, eventId, eventName, changes) => ({
        recipient: recipientId,
        type: 'event_updated',
        title: 'Event Updated',
        message: `${eventName} has been updated`,
        data: { eventId, changes },
        actionUrl: `/events/${eventId}`
    }),

    // Reminder
    eventReminder: (recipientId, eventId, eventName, eventDate) => ({
        recipient: recipientId,
        type: 'reminder',
        title: 'Event Reminder',
        message: `${eventName} is starting on ${new Date(eventDate).toLocaleDateString()}`,
        data: { eventId, eventDate },
        actionUrl: `/events/${eventId}`,
        priority: 'high'
    })
};

// Send notification using template
export const sendNotification = async (template, ...args) => {
    const templateFn = notificationTemplates[template];
    if (!templateFn) {
        throw new Error(`Notification template "${template}" not found`);
    }

    const notificationData = templateFn(...args);
    return await createNotification(notificationData);
};

// Batch notifications
export const sendBatchNotifications = async (notifications) => {
    const results = await Promise.allSettled(
        notifications.map(data => createNotification(data))
    );

    return {
        successful: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
    };
};

export default {
    createNotification,
    sendNotification,
    sendBatchNotifications,
    notificationTemplates
};
