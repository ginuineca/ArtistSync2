import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { saveUploadedFile, validateImageFile, deleteFile } from '../services/upload.service.js';
import Profile from '../models/Profile.js';
import Event from '../models/Event.js';

const router = express.Router();

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', authMiddleware, async (req, res) => {
    try {
        if (!req.files || !req.files.avatar) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const avatar = req.files.avatar;
        validateImageFile(avatar);

        const savedFile = saveUploadedFile(avatar, 'avatars');

        // Update user profile with new avatar
        const profile = await Profile.findOne({ user: req.user.id });
        if (profile) {
            // Delete old avatar if exists
            if (profile.profilePicture && profile.profilePicture.startsWith('/uploads/')) {
                deleteFile(profile.profilePicture);
            }
            profile.profilePicture = savedFile.url;
            await profile.save();
        }

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            file: savedFile
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading avatar'
        });
    }
});

// @route   POST /api/upload/event-cover
// @desc    Upload event cover image
// @access  Private
router.post('/event-cover', authMiddleware, async (req, res) => {
    try {
        if (!req.files || !req.files.cover) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const cover = req.files.cover;
        validateImageFile(cover);

        const savedFile = saveUploadedFile(cover, 'events');

        res.json({
            success: true,
            message: 'Event cover uploaded successfully',
            file: savedFile
        });
    } catch (error) {
        console.error('Event cover upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading event cover'
        });
    }
});

// @route   POST /api/upload/portfolio
// @desc    Upload portfolio item (image/audio/video)
// @access  Private
router.post('/portfolio', authMiddleware, async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = req.files.file;
        const { type, title, description } = req.body;

        // Validate file type based on portfolio item type
        const allowedTypes = {
            image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            video: ['video/mp4', 'video/webm', 'video/quicktime'],
            audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']
        };

        const fileTypes = allowedTypes[type] || allowedTypes.image;
        const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for others

        if (!fileTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: `Invalid file type for ${type}`
            });
        }

        if (file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
            });
        }

        const savedFile = saveUploadedFile(file, 'portfolio');

        // Add to profile portfolio
        const profile = await Profile.findOne({ user: req.user.id });
        if (profile && profile.profileType === 'artist') {
            profile.artistDetails.portfolio.push({
                type,
                title: title || file.name,
                description,
                url: savedFile.url,
                thumbnailUrl: type === 'image' ? savedFile.url : undefined,
                uploadDate: new Date()
            });
            await profile.save();
        }

        res.json({
            success: true,
            message: 'Portfolio item uploaded successfully',
            file: savedFile
        });
    } catch (error) {
        console.error('Portfolio upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading portfolio item'
        });
    }
});

// @route   DELETE /api/upload/file
// @desc    Delete uploaded file
// @access  Private
router.delete('/file', authMiddleware, async (req, res) => {
    try {
        const { filePath } = req.body;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: 'File path is required'
            });
        }

        // Check if file belongs to user
        const profile = await Profile.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(403).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Check if file is used in profile
        const isProfilePicture = profile.profilePicture === filePath;
        const isInPortfolio = profile.artistDetails?.portfolio?.some(item => item.url === filePath);

        if (!isProfilePicture && !isInPortfolio) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own files'
            });
        }

        deleteFile(filePath);

        // Remove from profile if needed
        if (isProfilePicture) {
            profile.profilePicture = '';
        } else if (isInPortfolio) {
            profile.artistDetails.portfolio = profile.artistDetails.portfolio.filter(
                item => item.url !== filePath
            );
        }
        await profile.save();

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('File delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file'
        });
    }
});

// @route   GET /api/upload/files
// @desc    Get user's uploaded files
// @access  Private
router.get('/files', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        const files = [];

        // Add profile picture
        if (profile.profilePicture) {
            files.push({
                type: 'avatar',
                url: profile.profilePicture,
                name: 'Profile Picture'
            });
        }

        // Add portfolio items
        if (profile.artistDetails?.portfolio) {
            profile.artistDetails.portfolio.forEach(item => {
                files.push({
                    type: 'portfolio',
                    url: item.url,
                    name: item.title || 'Portfolio Item',
                    itemType: item.type
                });
            });
        }

        res.json({
            success: true,
            files
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching files'
        });
    }
});

export default router;
