import express from 'express';
import Event from '../models/Event.js';
import Profile from '../models/Profile.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events (with filters)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const {
            status,
            category,
            genre,
            venue,
            startDate,
            endDate,
            page = 1,
            limit = 20,
            search
        } = req.query;

        const filter = { visibility: 'public' };

        if (status) filter.status = status;
        if (category) filter.categories = category;
        if (genre) filter.genres = genre;
        if (venue) filter.venue = venue;

        // Date range filter
        if (startDate || endDate) {
            filter['date.start'] = {};
            if (startDate) filter['date.start'].$gte = new Date(startDate);
            if (endDate) filter['date.start'].$lte = new Date(endDate);
        }

        // Text search
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const events = await Event.find(filter)
            .populate('venue', 'name location profilePicture')
            .populate('artists.artist', 'name profilePicture artistDetails')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ 'date.start': 1 });

        const count = await Event.countDocuments(filter);

        res.json({
            success: true,
            events,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching events'
        });
    }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('venue', 'name description location profilePicture coverImage amenities')
            .populate('artists.artist', 'name description profilePicture artistDetails socialLinks');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Increment views
        event.meta.views += 1;
        await event.save();

        res.json({
            success: true,
            event
        });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching event'
        });
    }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Venues only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Check if user has a venue profile
        const venueProfile = await Profile.findOne({
            user: req.user.id,
            profileType: 'venue'
        });

        if (!venueProfile) {
            return res.status(403).json({
                success: false,
                message: 'Only venues can create events'
            });
        }

        const {
            title,
            description,
            date,
            capacity,
            categories,
            genres,
            ageRestriction,
            ticketing,
            media
        } = req.body;

        // Validate required fields
        if (!title || !description || !date?.start || !date?.end || !capacity) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const event = new Event({
            title,
            description,
            venue: venueProfile._id,
            date,
            capacity,
            categories: categories || ['concert'],
            genres: genres || [],
            ageRestriction: ageRestriction || 'all_ages',
            ticketing: ticketing || { enabled: true, tiers: [] },
            media: media || {},
            status: 'draft'
        });

        await event.save();
        await event.populate('venue', 'name location profilePicture');

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating event'
        });
    }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Event owner only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user owns this event (through their venue profile)
        const venueProfile = await Profile.findOne({
            user: req.user.id,
            _id: event.venue
        });

        if (!venueProfile) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this event'
            });
        }

        // Update fields
        const allowedUpdates = [
            'title', 'description', 'date', 'capacity',
            'categories', 'genres', 'ageRestriction', 'ticketing',
            'media', 'status', 'visibility', 'settings'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                event[field] = req.body[field];
            }
        });

        await event.save();
        await event.populate('venue', 'name location profilePicture');

        res.json({
            success: true,
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating event'
        });
    }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (Event owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check ownership
        const venueProfile = await Profile.findOne({
            user: req.user.id,
            _id: event.venue
        });

        if (!venueProfile) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this event'
            });
        }

        await Event.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting event'
        });
    }
});

// @route   POST /api/events/:id/artists
// @desc    Invite an artist to an event
// @access  Private (Event owner only)
router.post('/:id/artists', authMiddleware, async (req, res) => {
    try {
        const { artistId, setTime, payment } = req.body;

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check ownership
        const venueProfile = await Profile.findOne({
            user: req.user.id,
            _id: event.venue
        });

        if (!venueProfile) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this event'
            });
        }

        // Check if artist exists
        const artistProfile = await Profile.findOne({
            _id: artistId,
            profileType: 'artist'
        });

        if (!artistProfile) {
            return res.status(404).json({
                success: false,
                message: 'Artist profile not found'
            });
        }

        // Check if artist is already invited
        const existingArtist = event.artists.find(
            a => a.artist.toString() === artistId
        );

        if (existingArtist) {
            return res.status(400).json({
                success: false,
                message: 'Artist is already invited to this event'
            });
        }

        // Add artist
        event.artists.push({
            artist: artistId,
            setTime: setTime || {},
            payment: payment || { amount: 0, currency: 'USD', status: 'pending' },
            status: 'invited'
        });

        await event.save();
        await event.populate('artists.artist', 'name profilePicture');

        res.json({
            success: true,
            message: 'Artist invited successfully',
            artists: event.artists
        });
    } catch (error) {
        console.error('Invite artist error:', error);
        res.status(500).json({
            success: false,
            message: 'Error inviting artist'
        });
    }
});

// @route   PUT /api/events/:id/artists/:artistId
// @desc    Update artist invitation status (accept/decline)
// @access  Private (Invited artist only)
router.put('/:id/artists/:artistId', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['confirmed', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be confirmed or declined'
            });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Find the artist invitation
        const artistIndex = event.artists.findIndex(
            a => a.artist.toString() === req.params.artistId
        );

        if (artistIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Artist invitation not found'
            });
        }

        // Check if the requesting user is the invited artist
        const artistProfile = await Profile.findOne({
            user: req.user.id,
            _id: req.params.artistId
        });

        if (!artistProfile) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to respond to this invitation'
            });
        }

        event.artists[artistIndex].status = status;
        await event.save();

        res.json({
            success: true,
            message: `Invitation ${status} successfully`,
            artist: event.artists[artistIndex]
        });
    } catch (error) {
        console.error('Update invitation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating invitation'
        });
    }
});

// @route   DELETE /api/events/:id/artists/:artistId
// @desc    Remove an artist from an event
// @access  Private (Event owner only)
router.delete('/:id/artists/:artistId', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check ownership
        const venueProfile = await Profile.findOne({
            user: req.user.id,
            _id: event.venue
        });

        if (!venueProfile) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this event'
            });
        }

        event.artists = event.artists.filter(
            a => a.artist.toString() !== req.params.artistId
        );

        await event.save();

        res.json({
            success: true,
            message: 'Artist removed from event successfully'
        });
    } catch (error) {
        console.error('Remove artist error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing artist'
        });
    }
});

// @route   GET /api/events/my/events
// @desc    Get events for the current user's venue
// @access  Private
router.get('/my/events', authMiddleware, async (req, res) => {
    try {
        const venueProfile = await Profile.findOne({
            user: req.user.id,
            profileType: 'venue'
        });

        if (!venueProfile) {
            return res.status(404).json({
                success: false,
                message: 'Venue profile not found'
            });
        }

        const events = await Event.find({ venue: venueProfile._id })
            .populate('artists.artist', 'name profilePicture')
            .sort({ 'date.start': -1 });

        res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error('Get my events error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching events'
        });
    }
});

// @route   GET /api/events/my/invitations
// @desc    Get event invitations for the current user's artist profile
// @access  Private
router.get('/my/invitations', authMiddleware, async (req, res) => {
    try {
        const artistProfile = await Profile.findOne({
            user: req.user.id,
            profileType: 'artist'
        });

        if (!artistProfile) {
            return res.status(404).json({
                success: false,
                message: 'Artist profile not found'
            });
        }

        const events = await Event.find({
            'artists.artist': artistProfile._id,
            'artists.status': 'invited'
        })
            .populate('venue', 'name location profilePicture')
            .sort({ 'date.start': 1 });

        res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching invitations'
        });
    }
});

// @route   POST /api/events/:id/like
// @desc    Like/unlike an event
// @access  Private
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user already liked this event
        const hasLiked = event.likedBy?.some(
            userId => userId.toString() === req.user.id
        );

        if (hasLiked) {
            // Unlike
            event.likedBy = event.likedBy.filter(
                userId => userId.toString() !== req.user.id
            );
            event.meta.likes = Math.max(0, event.meta.likes - 1);
        } else {
            // Like
            if (!event.likedBy) event.likedBy = [];
            event.likedBy.push(req.user.id);
            event.meta.likes += 1;
        }

        await event.save();

        res.json({
            success: true,
            liked: !hasLiked,
            likes: event.meta.likes
        });
    } catch (error) {
        console.error('Like event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing like'
        });
    }
});

// @route   GET /api/events/favorites
// @desc    Get user's favorite events
// @access  Private
router.get('/favorites', authMiddleware, async (req, res) => {
    try {
        const events = await Event.find({
            likedBy: req.user.id,
            status: 'published',
            visibility: 'public'
        })
            .populate('venue', 'name location profilePicture')
            .sort({ 'date.start': 1 });

        res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching favorites'
        });
    }
});

export default router;
