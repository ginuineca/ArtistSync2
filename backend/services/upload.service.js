import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directories exist
const ensureUploadDirs = () => {
    const dirs = [
        path.join(UPLOAD_DIR, 'avatars'),
        path.join(UPLOAD_DIR, 'events'),
        path.join(UPLOAD_DIR, 'portfolio'),
        path.join(UPLOAD_DIR, 'temp')
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

ensureUploadDirs();

// Generate unique filename
const generateFilename = (originalName, prefix = '') => {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    return `${prefix}${hash}${ext}`;
};

// Save uploaded file
export const saveUploadedFile = (file, type = 'temp') => {
    try {
        if (!file) return null;

        const filename = generateFilename(file.name, type + '_');
        const uploadPath = path.join(UPLOAD_DIR, type, filename);

        // Move file to target directory
        file.mv(uploadPath);

        return {
            filename,
            path: uploadPath,
            url: `/uploads/${type}/${filename}`,
            size: file.size,
            mimetype: file.mimetype
        };
    } catch (error) {
        console.error('Error saving file:', error);
        throw new Error('Failed to save file');
    }
};

// Delete file
export const deleteFile = (filePath) => {
    try {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

// Validate image file
export const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit.');
    }

    return true;
};

// Get file stats
export const getFileStats = (filePath) => {
    try {
        const fullPath = path.join(process.cwd(), filePath);
        const stats = fs.statSync(fullPath);
        return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
        };
    } catch (error) {
        return null;
    }
};

export default {
    saveUploadedFile,
    deleteFile,
    validateImageFile,
    getFileStats,
    ensureUploadDirs
};
