import express from 'express';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Event from '../models/Event.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { Review } from '../models/Review.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for current user
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const stats = {
            user: {},
            profile: null,
            events: {},
            messages: {},
            reviews: {}
        };

        // User stats
        const user = await User.findById(req.user.id);
        stats.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            name: user.name,
            userType: user.userType,
            role: user.role,
            isVerified: user.isVerified,
            memberSince: user.createdAt
        };

        // Profile stats
        const profile = await Profile.findOne({ user: req.user.id });
        if (profile) {
            stats.profile = {
                id: profile._id,
                name: profile.name,
                type: profile.profileType,
                profilePicture: profile.profilePicture,
                isPublic: profile.visibility.isPublic,
                stats: profile.stats,
                followers: profile.stats.followers || 0
            };

            // Event stats for venue
            if (profile.profileType === 'venue') {
                const events = await Event.find({ venue: profile._id });
                const upcomingEvents = events.filter(
                    e => e.status === 'published' && new Date(e.date.start) > new Date()
                );
                const pastEvents = events.filter(
                    e => new Date(e.date.end) < new Date()
                );

                stats.events = {
                    total: events.length,
                    upcoming: upcomingEvents.length,
                    past: pastEvents.length,
                    draft: events.filter(e => e.status === 'draft').length,
                    published: events.filter(e => e.status === 'published').length
                };
            }

            // Event stats for artist (invitations)
            if (profile.profileType === 'artist') {
                const invitations = await Event.find({
                    'artists.artist': profile._id
                });

                stats.events = {
                    pendingInvitations: invitations.filter(
                        e => e.artists.find(a => a.artist.toString() === profile._id.toString())?.status === 'invited'
                    ).length,
                    confirmed: invitations.filter(
                        e => e.artists.find(a => a.artist.toString() === profile._id.toString())?.status === 'confirmed'
                    ).length,
                    total: invitations.length
                };
            }
        }

        // Message stats
        const conversations = await Conversation.find({
            'participants.user': req.user.id
        });

        let unreadCount = 0;
        conversations.forEach(conv => {
            unreadCount += conv.metadata.unreadCount.get(req.user.id.toString()) || 0;
        });

        stats.messages = {
            totalConversations: conversations.length,
            unreadCount
        };

        // Review stats (for artists)
        if (profile && profile.profileType === 'artist') {
            const reviews = await Review.find({ artistId: profile._id });
            stats.reviews = {
                total: reviews.length,
                averageRating: profile.stats.rating || 0,
                recentReviews: reviews.length
            };
        }

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats'
        });
    }
});

// @route   GET /api/dashboard/overview
// @desc    Get overview data for dashboard
// @access  Private
router.get('/overview', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const overview = {
            recentActivity: [],
            upcomingEvents: [],
            unreadMessages: 0
        };

        if (profile) {
            // Recent events (for venues)
            if (profile.profileType === 'venue') {
                const recentEvents = await Event.find({ venue: profile._id })
                    .populate('artists.artist', 'name profilePicture')
                    .sort({ createdAt: -1 })
                    .limit(5);

                overview.upcomingEvents = await Event.find({
                    venue: profile._id,
                    status: 'published',
                    'date.start': { $gte: new Date() }
                })
                    .populate('artists.artist', 'name profilePicture')
                    .sort({ 'date.start': 1 })
                    .limit(3);

                overview.recentActivity = recentEvents.map(e => ({
                    type: 'event',
                    message: `Event "${e.title}" ${e.status === 'draft' ? 'created as draft' : 'published'}`,
                    date: e.createdAt,
                    id: e._id
                }));
            }

            // Recent invitations (for artists)
            if (profile.profileType === 'artist') {
                const invitations = await Event.find({
                    'artists.artist': profile._id,
                    'artists.status': 'invited'
                })
                    .populate('venue', 'name location')
                    .sort({ 'date.start': 1 })
                    .limit(5);

                overview.recentActivity = invitations.map(e => ({
                    type: 'invitation',
                    message: `Invited to perform at ${e.venue.name}`,
                    date: e.createdAt,
                    id: e._id
                }));

                overview.upcomingEvents = await Event.find({
                    'artists.artist': profile._id,
                    'artists.status': 'confirmed',
                    'date.start': { $gte: new Date() }
                })
                    .populate('venue', 'name location')
                    .sort({ 'date.start': 1 })
                    .limit(3);
            }

            // Unread messages
            const conversations = await Conversation.find({
                'participants.user': req.user.id
            }).populate('lastMessage');

            conversations.forEach(conv => {
                const unread = conv.metadata.unreadCount.get(req.user.id.toString()) || 0;
                if (unread > 0) {
                    overview.unreadMessages += unread;
                }
            });
        }

        res.json({
            success: true,
            overview
        });
    } catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard overview'
        });
    }
});

// @route   GET /api/dashboard/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const notifications = [];
        const profile = await Profile.findOne({ user: req.user.id });

        // Event invitations (for artists)
        if (profile && profile.profileType === 'artist') {
            const invitations = await Event.find({
                'artists.artist': profile._id,
                'artists.status': 'invited'
            })
                .populate('venue', 'name location')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            invitations.forEach(event => {
                notifications.push({
                    type: 'invitation',
                    title: 'New Event Invitation',
                    message: `You've been invited to perform at ${event.venue.name}`,
                    eventId: event._id,
                    date: event.createdAt,
                    read: false
                });
            });
        }

        // New messages
        const conversations = await Conversation.find({
            'participants.user': req.user.id
        }).sort({ updatedAt: -1 }).limit(parseInt(limit));

        for (const conv of conversations) {
            const unreadCount = conv.metadata.unreadCount.get(req.user.id.toString()) || 0;
            if (unreadCount > 0) {
                const otherParticipants = conv.participants.filter(
                    p => p.user.toString() !== req.user.id
                );

                if (otherParticipants.length > 0) {
                    const otherUser = await User.findById(otherParticipants[0].user);
                    notifications.push({
                        type: 'message',
                        title: 'New Message',
                        message: `${unreadCount} new message(s) from ${otherUser?.name || otherUser?.username}`,
                        conversationId: conv._id,
                        date: conv.updatedAt,
                        read: false
                    });
                }
            }
        }

        // New reviews
        if (profile) {
            const recentReviews = await Review.find({
                artistId: profile._id
            })
                .populate('userId', 'name')
                .sort({ createdAt: -1 })
                .limit(5);

            recentReviews.forEach(review => {
                notifications.push({
                    type: 'review',
                    title: 'New Review',
                    message: `${review.userId.name} left you a ${review.rating}-star review`,
                    reviewId: review._id,
                    date: review.createdAt,
                    read: false
                });
            });
        }

        // Sort by date
        notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            notifications: notifications.slice(0, parseInt(limit)),
            unreadCount: notifications.filter(n => !n.read).length
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications'
        });
    }
});

// @route   GET /api/dashboard/analytics
// @desc    Get analytics data for the current user
// @access  Private
router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));

        const analytics = {
            profileViews: 0,
            eventViews: 0,
            newFollowers: 0,
            bookingRequests: 0
        };

        const profile = await Profile.findOne({ user: req.user.id });

        if (profile) {
            // Event analytics for venues
            if (profile.profileType === 'venue') {
                const events = await Event.find({
                    venue: profile._id,
                    createdAt: { $gte: daysAgo }
                });

                analytics.eventViews = events.reduce((sum, e) => sum + (e.meta?.views || 0), 0);
                analytics.bookingRequests = await Event.countDocuments({
                    venue: profile._id,
                    createdAt: { $gte: daysAgo }
                });
            }

            // Analytics for artists
            if (profile.profileType === 'artist') {
                analytics.newFollowers = profile.stats.followers || 0;
                analytics.bookingRequests = await Event.countDocuments({
                    'artists.artist': profile._id,
                    'artists.status': { $in: ['invited', 'confirmed'] },
                    createdAt: { $gte: daysAgo }
                });
            }
        }

        res.json({
            success: true,
            analytics,
            period: `Last ${period} days`
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics'
        });
    }
});

export default router;
