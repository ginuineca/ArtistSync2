import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'your_jwt_secret_here');
        if (decoded.type !== 'access') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }

        // Get user
        const user = await User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Attach user to request
        req.user = {
            id: user._id,
            email: user.email,
            userType: user.userType
        };

        next();
    } catch (error) {
        logger.error('Auth middleware error', { error: error.message });
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

export default {
    authMiddleware
};
