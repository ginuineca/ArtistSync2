import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: [
            'message',
            'event_invitation',
            'booking_request',
            'booking_accepted',
            'booking_declined',
            'new_review',
            'new_follower',
            'event_updated',
            'reminder'
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    actionUrl: {
        type: String
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
    const notification = new this(notificationData);
    await notification.save();
    return notification;
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(recipientId) {
    return await this.updateMany(
        { recipient: recipientId, read: false },
        { read: true, readAt: new Date() }
    );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(recipientId) {
    return await this.countDocuments({ recipient: recipientId, read: false });
};

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
