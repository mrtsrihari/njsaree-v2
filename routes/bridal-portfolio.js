const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');
const multer = require('multer');
const { insertBridalImage, getAllBridalImages, deleteBridalImage, getBridalImageById } = require('../db/database');

// Config from env
const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

let upload;
if (hasCloudinary) {
    const CloudinaryStorage = require('multer-storage-cloudinary');
    cloudinary.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'nj-bridal-saree',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
        },
    });
    upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
    // Fallback: store in memory (local disk in /tmp)
    const path = require('path');
    const os = require('os');
    const localDiskStorage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, os.tmpdir()),
        filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
    });
    upload = multer({ storage: localDiskStorage, limits: { fileSize: 10 * 1024 * 1024 } });
    console.warn('⚠️  Cloudinary not configured — uploads will be stored temporarily in /tmp');
}

// Token auth middleware (reuses logic from admin route)
function tokenAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    // We import activeTokens from admin module
    const adminModule = require('./admin');
    if (adminModule.isValidToken(authHeader.split(' ')[1])) {
        next();
    } else {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

// GET all bridal images (public - no auth needed)
router.get('/', (req, res) => {
    try {
        const images = getAllBridalImages();
        res.json({ success: true, images });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch images' });
    }
});

// POST upload image (admin only)
router.post('/upload', tokenAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        let imageUrl, publicId;
        if (hasCloudinary) {
            imageUrl = req.file.secure_url || req.file.url || req.file.path;
            publicId = req.file.public_id || req.file.filename;
        } else {
            imageUrl = `/local-tmp/${req.file.filename}`;
            publicId = req.file.filename;
        }

        const caption = req.body.caption || '';
        insertBridalImage(imageUrl, publicId, caption);
        res.json({ success: true, message: 'Image uploaded', url: imageUrl });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

// DELETE image (admin only)
router.delete('/:id', tokenAuth, async (req, res) => {
    try {
        const image = getBridalImageById(req.params.id);
        if (!image) {
            return res.status(404).json({ success: false, error: 'Image not found' });
        }

        // Delete from Cloudinary if configured
        if (hasCloudinary && image.public_id) {
            try {
                await cloudinary.v2.uploader.destroy(image.public_id);
            } catch (e) {
                console.warn('Cloudinary delete warning:', e.message);
            }
        }

        deleteBridalImage(req.params.id);
        res.json({ success: true, message: 'Image deleted' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ success: false, error: 'Delete failed' });
    }
});

module.exports = router;
