import express from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import Profile from '../models/Profile.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get all reviews (with filters)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const {
            profileId,
            userId,
            rating,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};

        if (profileId) filter.artistId = profileId;
        if (userId) filter.userId = userId;
        if (rating) filter.rating = rating;

        const reviews = await Review.find(filter)
            .populate('userId', 'username name profilePicture')
            .populate('artistId', 'name profilePicture')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Review.countDocuments(filter);

        // Calculate average rating for the profile
        let avgRating = 0;
        if (profileId) {
            const stats = await Review.aggregate([
                { $match: { artistId: mongoose.Types.ObjectId(profileId) } },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 }
                    }
                }
            ]);
            if (stats.length > 0) {
                avgRating = stats[0].avgRating;
            }
        }

        res.json({
            success: true,
            reviews,
            avgRating,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews'
        });
    }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('userId', 'username name profilePicture')
            .populate('artistId', 'name profilePicture artistDetails');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            review
        });
    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching review'
        });
    }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { artistId, rating, content } = req.body;

        // Validate required fields
        if (!artistId || !rating || !content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide artist ID, rating, and content'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if profile exists
        const profile = await Profile.findById(artistId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Check if user already reviewed this profile
        const existingReview = await Review.findOne({
            userId: req.user.id,
            artistId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this profile'
            });
        }

        const review = new Review({
            userId: req.user.id,
            artistId,
            rating,
            content
        });

        await review.save();
        await review.populate('userId', 'username name');

        // Update profile stats
        const allReviews = await Review.find({ artistId });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        profile.stats.rating = Math.round(avgRating * 10) / 10;
        profile.stats.reviewCount = allReviews.length;
        await profile.save();

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            review
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating review'
        });
    }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (Review owner only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { rating, content } = req.body;

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership
        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this review'
            });
        }

        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }
            review.rating = rating;
        }

        if (content !== undefined) {
            review.content = content;
        }

        await review.save();

        // Update profile stats
        const profile = await Profile.findById(review.artistId);
        if (profile) {
            const allReviews = await Review.find({ artistId: profile._id });
            const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            profile.stats.rating = Math.round(avgRating * 10) / 10;
            await profile.save();
        }

        res.json({
            success: true,
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating review'
        });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (Review owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership
        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this review'
            });
        }

        const profileId = review.artistId;
        await Review.findByIdAndDelete(req.params.id);

        // Update profile stats
        const profile = await Profile.findById(profileId);
        if (profile) {
            const allReviews = await Review.find({ artistId: profileId });
            const avgRating = allReviews.length > 0
                ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
                : 0;
            profile.stats.rating = Math.round(avgRating * 10) / 10;
            profile.stats.reviewCount = allReviews.length;
            await profile.save();
        }

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting review'
        });
    }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        const alreadyVoted = review.helpfulVotes.includes(req.user.id);

        if (alreadyVoted) {
            // Remove vote
            review.helpfulVotes = review.helpfulVotes.filter(
                id => id.toString() !== req.user.id
            );
        } else {
            // Add vote
            review.helpfulVotes.push(req.user.id);
        }

        await review.save();

        res.json({
            success: true,
            helpful: !alreadyVoted,
            helpfulCount: review.helpfulVotes.length
        });
    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing vote'
        });
    }
});

// @route   GET /api/reviews/profile/:profileId
// @desc    Get all reviews for a specific profile
// @access  Public
router.get('/profile/:profileId', async (req, res) => {
    try {
        const { profileId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const profile = await Profile.findById(profileId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        const reviews = await Review.find({ artistId: profileId })
            .populate('userId', 'username name profilePicture')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ helpfulVotes: -1, createdAt: -1 });

        const count = await Review.countDocuments({ artistId: profileId });

        // Calculate rating distribution
        const distribution = await Review.aggregate([
            { $match: { artistId: profileId } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            }
        ]);

        const ratingDistribution = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };

        distribution.forEach(d => {
            ratingDistribution[d._id] = d.count;
        });

        res.json({
            success: true,
            reviews,
            avgRating: profile.stats.rating,
            reviewCount: profile.stats.reviewCount,
            ratingDistribution,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get profile reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews'
        });
    }
});

// @route   GET /api/reviews/user/my
// @desc    Get current user's reviews
// @access  Private
router.get('/user/my', authMiddleware, async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.user.id })
            .populate('artistId', 'name profilePicture')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews'
        });
    }
});

export default router;
