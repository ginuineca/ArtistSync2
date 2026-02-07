import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const conversations = await Conversation.find({
            'participants.user': req.user.id
        })
            .populate('participants.user', 'username name profilePicture')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Conversation.countDocuments({
            'participants.user': req.user.id
        });

        // Add unread count for each conversation
        const conversationsWithUnread = conversations.map(conv => ({
            ...conv.toObject(),
            unreadCount: conv.metadata.unreadCount.get(req.user.id.toString()) || 0
        }));

        res.json({
            success: true,
            conversations: conversationsWithUnread,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversations'
        });
    }
});

// @route   GET /api/messages/conversations/:id
// @desc    Get conversation by ID
// @access  Private
router.get('/conversations/:id', authMiddleware, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id)
            .populate('participants.user', 'username name profilePicture')
            .populate('lastMessage');

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Check if user is participant
        if (!conversation.isParticipant(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        // Mark messages as read
        await conversation.updateUnreadCount(req.user.id, false);

        res.json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversation'
        });
    }
});

// @route   POST /api/messages/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/conversations', authMiddleware, async (req, res) => {
    try {
        const { participantId, type = 'direct' } = req.body;

        if (!participantId) {
            return res.status(400).json({
                success: false,
                message: 'Participant ID is required'
            });
        }

        if (participantId === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot start a conversation with yourself'
            });
        }

        // Check if participant exists
        const participant = await User.findById(participantId);
        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if conversation already exists (for direct messages)
        if (type === 'direct') {
            const existingConversation = await Conversation.findOne({
                type: 'direct',
                'participants.user': { $all: [req.user.id, participantId] },
                'participants.2': { $exists: false } // Only 2 participants
            })
                .populate('participants.user', 'username name profilePicture')
                .populate('lastMessage');

            if (existingConversation) {
                return res.json({
                    success: true,
                    message: 'Conversation already exists',
                    conversation: existingConversation
                });
            }
        }

        // Create new conversation
        const conversation = new Conversation({
            type,
            participants: [
                { user: req.user.id, role: 'admin' },
                { user: participantId, role: 'member' }
            ],
            metadata: {
                unreadCount: new Map([
                    [participantId.toString(), 0]
                ])
            }
        });

        await conversation.save();
        await conversation.populate('participants.user', 'username name profilePicture');

        res.status(201).json({
            success: true,
            message: 'Conversation created successfully',
            conversation
        });
    } catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating conversation'
        });
    }
});

// @route   DELETE /api/messages/conversations/:id
// @desc    Leave/Delete a conversation
// @access  Private
router.delete('/conversations/:id', authMiddleware, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Check if user is participant
        if (!conversation.isParticipant(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        // For direct messages, remove the conversation
        if (conversation.type === 'direct') {
            await Conversation.findByIdAndDelete(req.params.id);
            // Also delete all messages
            await Message.deleteMany({ conversation: req.params.id });
        } else {
            // For group chats, just remove the participant
            await conversation.removeParticipant(req.user.id);
        }

        res.json({
            success: true,
            message: 'Conversation left successfully'
        });
    } catch (error) {
        console.error('Leave conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error leaving conversation'
        });
    }
});

// @route   GET /api/messages/conversations/:id/messages
// @desc    Get messages for a conversation
// @access  Private
router.get('/conversations/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Check if user is participant
        if (!conversation.isParticipant(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        const messages = await Message.find({ conversation: req.params.id })
            .populate('sender', 'username name profilePicture')
            .populate('readBy.user', 'username name')
            .populate('replyTo')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Message.countDocuments({ conversation: req.params.id });

        // Mark messages as read
        await Message.updateMany(
            {
                conversation: req.params.id,
                sender: { $ne: req.user.id },
                'readBy.user': { $ne: req.user.id }
            },
            {
                $push: {
                    readBy: { user: req.user.id, readAt: new Date() }
                }
            }
        );

        // Reset unread count
        await conversation.updateUnreadCount(req.user.id, false);

        res.json({
            success: true,
            messages: messages.reverse(), // Return in chronological order
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching messages'
        });
    }
});

// @route   POST /api/messages/conversations/:id/messages
// @desc    Send a message
// @access  Private
router.post('/conversations/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { content, replyTo } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Check if user is participant
        if (!conversation.isParticipant(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        // Create message
        const message = new Message({
            conversation: req.params.id,
            sender: req.user.id,
            content: content.trim(),
            replyTo,
            readBy: [{ user: req.user.id, readAt: new Date() }]
        });

        await message.save();
        await message.populate('sender', 'username name profilePicture');

        // Update conversation's last message
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();

        // Update unread count for other participants
        for (const participant of conversation.participants) {
            if (participant.user.toString() !== req.user.id) {
                await conversation.updateUnreadCount(participant.user, true);
            }
        }

        await conversation.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message'
        });
    }
});

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if user is the sender
        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own messages'
            });
        }

        // Check if message is too old (15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (message.createdAt < fifteenMinutesAgo) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit messages older than 15 minutes'
            });
        }

        message.content = content.trim();
        message.metadata.edited = true;
        message.metadata.editedAt = new Date();

        await message.save();
        await message.populate('sender', 'username name profilePicture');

        res.json({
            success: true,
            message: 'Message updated successfully',
            data: message
        });
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({
            success: false,
            message: 'Error editing message'
        });
    }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if user is the sender
        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own messages'
            });
        }

        await Message.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting message'
        });
    }
});

// @route   POST /api/messages/:id/read
// @desc    Mark messages as read
// @access  Private
router.post('/:id/read', authMiddleware, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if user is participant
        const conversation = await Conversation.findById(message.conversation);
        if (!conversation || !conversation.isParticipant(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        // Mark as read
        const alreadyRead = message.readBy.some(
            r => r.user.toString() === req.user.id
        );

        if (!alreadyRead) {
            message.readBy.push({ user: req.user.id, readAt: new Date() });
            await message.save();
        }

        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking message as read'
        });
    }
});

// @route   POST /api/messages/conversations/:id/read-all
// @desc    Mark all messages in conversation as read
// @access  Private
router.post('/conversations/:id/read-all', authMiddleware, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Check if user is participant
        if (!conversation.isParticipant(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        // Mark all unread messages as read
        await Message.updateMany(
            {
                conversation: req.params.id,
                sender: { $ne: req.user.id },
                'readBy.user': { $ne: req.user.id }
            },
            {
                $push: {
                    readBy: { user: req.user.id, readAt: new Date() }
                }
            }
        );

        // Reset unread count
        await conversation.updateUnreadCount(req.user.id, false);

        res.json({
            success: true,
            message: 'All messages marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking messages as read'
        });
    }
});

export default router;
