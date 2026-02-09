import express from 'express';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import Profile from '../models/Profile.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendEventInvitationEmail, sendBookingConfirmedEmail } from '../services/email.service.js';

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get all bookings for current user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, type } = req.query;
        const filter = {};

        // Get bookings where user is the booker
        if (type === 'sent' || !type) {
            filter.booker = req.user.id;
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        const bookings = await Booking.find(filter)
            .populate('event', 'title date venue')
            .populate('artist', 'name profileType profilePicture')
            .populate('booker', 'name email')
            .sort({ 'performance.date': -1 });

        res.json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings'
        });
    }
});

// @route   GET /api/bookings/received
// @desc    Get bookings received (for artists)
// @access  Private
router.get('/received', authMiddleware, async (req, res) => {
    try {
        // First find the user's profile
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        const { status } = req.query;
        const filter = { artist: profile._id };

        if (status) {
            filter.status = status;
        }

        const bookings = await Booking.find(filter)
            .populate('event', 'title date venue')
            .populate('booker', 'name email')
            .sort({ 'performance.date': -1 });

        res.json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Get received bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings'
        });
    }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('event')
            .populate('artist')
            .populate('booker', 'name email')
            .populate('messages.sender', 'name profilePicture');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has access to this booking
        const hasAccess =
            booking.booker._id.toString() === req.user.id ||
            booking.artist?.user?.toString() === req.user.id;

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            booking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking'
        });
    }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { eventId, artistId, performance } = req.body;

        // Validate required fields
        if (!eventId || !artistId || !performance?.date) {
            return res.status(400).json({
                success: false,
                message: 'Event, artist, and performance date are required'
            });
        }

        // Verify event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Verify artist profile exists
        const artist = await Profile.findById(artistId);
        if (!artist) {
            return res.status(404).json({
                success: false,
                message: 'Artist profile not found'
            });
        }

        // Check if user owns the event
        if (event.venue.toString() !== req.user.id && event.venue.user?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to book for this event'
            });
        }

        // Check for existing booking
        const existingBooking = await Booking.findOne({
            event: eventId,
            artist: artistId,
            status: { $in: ['pending', 'accepted'] }
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'A booking already exists for this artist and event'
            });
        }

        // Create booking
        const booking = new Booking({
            event: eventId,
            booker: req.user.id,
            artist: artistId,
            performance
        });

        await booking.save();

        // Send invitation email to artist
        const artistUser = await artist.populate('user');
        if (artistUser.user?.email) {
            const eventUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${eventId}`;
            sendEventInvitationEmail(
                artistUser.user.email,
                artist.name,
                event.title,
                eventUrl,
                event.venue?.name || 'Venue'
            ).catch(err => console.log('Failed to send invitation email:', err.message));
        }

        res.status(201).json({
            success: true,
            message: 'Booking request sent',
            booking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating booking'
        });
    }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (accept/decline/cancel)
// @access  Private
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['accepted', 'declined', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const booking = await Booking.findById(req.params.id)
            .populate('artist')
            .populate('event')
            .populate('booker');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check permissions
        const isArtist = booking.artist?.user?.toString() === req.user.id;
        const isBooker = booking.booker._id.toString() === req.user.id;

        // Only artist can accept/decline, only booker can cancel
        if ((status === 'accepted' || status === 'declined') && !isArtist) {
            return res.status(403).json({
                success: false,
                message: 'Only the artist can accept or decline bookings'
            });
        }

        if (status === 'cancelled' && !isBooker) {
            return res.status(403).json({
                success: false,
                message: 'Only the booker can cancel bookings'
            });
        }

        booking.status = status;

        if (status === 'accepted') {
            booking.contract.agreed = true;
            booking.contract.agreedAt = new Date();

            // Send confirmation email
            if (booking.booker?.email) {
                const eventUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${booking.event._id}`;
                sendBookingConfirmedEmail(
                    booking.booker.email,
                    booking.booker.name,
                    booking.event.title,
                    eventUrl
                ).catch(err => console.log('Failed to send confirmation email:', err.message));
            }
        }

        await booking.save();

        res.json({
            success: true,
            message: `Booking ${status}`,
            booking
        });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking'
        });
    }
});

// @route   POST /api/bookings/:id/messages
// @desc    Add message to booking
// @access  Private
router.post('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.messages.push({
            sender: req.user.id,
            message,
            timestamp: new Date()
        });

        await booking.save();

        res.json({
            success: true,
            message: 'Message added',
            booking
        });
    } catch (error) {
        console.error('Add booking message error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding message'
        });
    }
});

export default router;
