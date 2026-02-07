import express from 'express';
import Profile from '../models/Profile.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
    try {
        let profile = await Profile.findOne({ user: req.user.id })
            .populate('user', 'username email userType name');

        if (!profile) {
            // Create a default profile
            const user = await User.findById(req.user.id);
            profile = new Profile({
                user: req.user.id,
                profileType: req.user.userType === 'venue' ? 'venue' : 'artist',
                name: user.name || user.username
            });
            await profile.save();
        }

        res.json({
            success: true,
            profile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

// @route   GET /api/profile/:id
// @desc    Get profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id)
            .populate('user', 'username email name userType');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        res.json({
            success: true,
            profile
        });
    } catch (error) {
        console.error('Get profile by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

// @route   PUT /api/profile/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            description,
            profilePicture,
            coverImage,
            location,
            socialLinks,
            visibility
        } = req.body;

        let profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            // Create profile if it doesn't exist
            profile = new Profile({
                user: req.user.id,
                profileType: req.user.userType === 'venue' ? 'venue' : 'artist',
                name: name || req.user.name
            });
        }

        // Update common fields
        if (name !== undefined) profile.name = name;
        if (description !== undefined) profile.description = description;
        if (profilePicture !== undefined) profile.profilePicture = profilePicture;
        if (coverImage !== undefined) profile.coverImage = coverImage;
        if (location) profile.location = { ...profile.location, ...location };
        if (socialLinks) profile.socialLinks = { ...profile.socialLinks, ...socialLinks };
        if (visibility) profile.visibility = { ...profile.visibility, ...visibility };

        await profile.save();
        await profile.populate('user', 'username email name userType');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// @route   PUT /api/profile/me/artist-details
// @desc    Update artist-specific details
// @access  Private (Artists only)
router.put('/me/artist-details', authMiddleware, async (req, res) => {
    try {
        const {
            genres,
            instruments,
            performanceTypes,
            pricing,
            availability
        } = req.body;

        let profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found. Please create a profile first.'
            });
        }

        if (profile.profileType !== 'artist') {
            return res.status(400).json({
                success: false,
                message: 'This endpoint is for artist profiles only'
            });
        }

        // Update artist details
        if (genres) profile.artistDetails.genres = genres;
        if (instruments) profile.artistDetails.instruments = instruments;
        if (performanceTypes) profile.artistDetails.performanceTypes = performanceTypes;
        if (pricing) profile.artistDetails.pricing = { ...profile.artistDetails.pricing, ...pricing };
        if (availability) profile.artistDetails.availability = availability;

        await profile.save();

        res.json({
            success: true,
            message: 'Artist details updated successfully',
            profile
        });
    } catch (error) {
        console.error('Update artist details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating artist details'
        });
    }
});

// @route   PUT /api/profile/me/venue-details
// @desc    Update venue-specific details
// @access  Private (Venues only)
router.put('/me/venue-details', authMiddleware, async (req, res) => {
    try {
        const {
            capacity,
            amenities,
            eventTypes,
            pricing,
            facilities,
            rules
        } = req.body;

        let profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found. Please create a profile first.'
            });
        }

        if (profile.profileType !== 'venue') {
            return res.status(400).json({
                success: false,
                message: 'This endpoint is for venue profiles only'
            });
        }

        // Update venue details
        if (capacity !== undefined) profile.venueDetails.capacity = capacity;
        if (amenities) profile.venueDetails.amenities = amenities;
        if (eventTypes) profile.venueDetails.eventTypes = eventTypes;
        if (pricing) profile.venueDetails.pricing = { ...profile.venueDetails.pricing, ...pricing };
        if (facilities) profile.venueDetails.facilities = facilities;
        if (rules) profile.venueDetails.rules = rules;

        await profile.save();

        res.json({
            success: true,
            message: 'Venue details updated successfully',
            profile
        });
    } catch (error) {
        console.error('Update venue details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating venue details'
        });
    }
});

// @route   POST /api/profile/me/portfolio
// @desc    Add portfolio item (artist only)
// @access  Private
router.post('/me/portfolio', authMiddleware, async (req, res) => {
    try {
        const { type, title, description, url, thumbnailUrl } = req.body;

        if (!type || !url) {
            return res.status(400).json({
                success: false,
                message: 'Type and URL are required'
            });
        }

        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile || profile.profileType !== 'artist') {
            return res.status(400).json({
                success: false,
                message: 'Artist profile required'
            });
        }

        profile.artistDetails.portfolio.push({
            type,
            title,
            description,
            url,
            thumbnailUrl,
            uploadDate: new Date()
        });

        await profile.save();

        res.json({
            success: true,
            message: 'Portfolio item added successfully',
            portfolio: profile.artistDetails.portfolio
        });
    } catch (error) {
        console.error('Add portfolio item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding portfolio item'
        });
    }
});

// @route   DELETE /api/profile/me/portfolio/:itemId
// @desc    Delete portfolio item
// @access  Private
router.delete('/me/portfolio/:itemId', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile || profile.profileType !== 'artist') {
            return res.status(400).json({
                success: false,
                message: 'Artist profile required'
            });
        }

        profile.artistDetails.portfolio.id(req.params.itemId).delete();
        await profile.save();

        res.json({
            success: true,
            message: 'Portfolio item deleted successfully'
        });
    } catch (error) {
        console.error('Delete portfolio item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting portfolio item'
        });
    }
});

// @route   GET /api/profile/search
// @desc    Search profiles
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const {
            profileType,
            genre,
            location,
            query,
            page = 1,
            limit = 20
        } = req.query;

        const filter = { 'visibility.isPublic': true };

        if (profileType) filter.profileType = profileType;
        if (genre) filter['artistDetails.genres'] = genre;

        // Text search
        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }

        // Geospatial search
        if (location) {
            const [lng, lat] = location.split(',').map(Number);
            filter.location = {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: 50000 // 50km
                }
            };
        }

        const profiles = await Profile.find(filter)
            .populate('user', 'username name')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ 'stats.rating': -1 });

        const count = await Profile.countDocuments(filter);

        res.json({
            success: true,
            profiles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Search profiles error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching profiles'
        });
    }
});

// @route   POST /api/profile/:id/follow
// @desc    Follow/unfollow a profile
// @access  Private
router.post('/:id/follow', authMiddleware, async (req, res) => {
    try {
        const profileToFollow = await Profile.findById(req.params.id);

        if (!profileToFollow) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        if (profileToFollow.user.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow your own profile'
            });
        }

        const myProfile = await Profile.findOne({ user: req.user.id });
        const isFollowing = myProfile.following?.includes(profileToFollow._id);

        if (isFollowing) {
            // Unfollow
            myProfile.following = myProfile.following.filter(
                id => id.toString() !== profileToFollow._id.toString()
            );
            profileToFollow.stats.followers = Math.max(0, profileToFollow.stats.followers - 1);
        } else {
            // Follow
            if (!myProfile.following) myProfile.following = [];
            myProfile.following.push(profileToFollow._id);
            profileToFollow.stats.followers += 1;
        }

        await myProfile.save();
        await profileToFollow.save();

        res.json({
            success: true,
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            following: !isFollowing
        });
    } catch (error) {
        console.error('Follow profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing follow request'
        });
    }
});

export default router;
