import express from 'express';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { limit = 20, skip = 0, unreadOnly = false } = req.query;

        const filter = { recipient: req.user.id };
        if (unreadOnly === 'true') {
            filter.read = false;
        }

        const notifications = await Notification.find(filter)
            .populate('sender', 'username name profilePicture')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Notification.countDocuments({ recipient: req.user.id });
        const unreadCount = await Notification.getUnreadCount(req.user.id);

        res.json({
            success: true,
            notifications,
            unreadCount,
            total,
            hasMore: (parseInt(skip) + notifications.length) < total
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications'
        });
    }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.user.id);

        res.json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread count'
        });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read'
        });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.markAsRead(req.user.id);

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notifications as read'
        });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await Notification.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification'
        });
    }
});

// @route   POST /api/notifications
// @desc    Create a notification (for internal use)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { recipient, type, title, message, data, actionUrl, priority } = req.body;

        // Only allow admins or system to create notifications for others
        if (recipient !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        const notification = await Notification.createNotification({
            recipient,
            sender: req.user.id,
            type,
            title,
            message,
            data,
            actionUrl,
            priority: priority || 'normal'
        });

        await notification.populate('sender', 'username name profilePicture');

        res.status(201).json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating notification'
        });
    }
});

export default router;
