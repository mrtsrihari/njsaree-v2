const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');
const multer = require('multer');
// Removed db/database.js require for bridging image context

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

// GET bridal images (public)
router.get('/', async (req, res) => {
    try {
        if (!hasCloudinary) {
            return res.json({ success: true, images: [] });
        }

        // Fetch specifically bridal-saree tagged resources or raw folder assets
        const result = await cloudinary.v2.api.resources({
            type: 'upload',
            prefix: 'nj-bridal-portfolio/',
            context: true,
            max_results: 100,
            sort_by: 'created_at',
            direction: 'desc'
        });

        // Filter for this legacy route (if clients expect only bridal images)
        let images = result.resources.filter(img => {
            const context = img.context && img.context.custom ? img.context.custom : {};
            return !context.category || context.category === 'bridal-saree';
        }).map(img => {
            const context = img.context && img.context.custom ? img.context.custom : {};
            return {
                id: encodeURIComponent(img.public_id),
                url: img.secure_url,
                public_id: img.public_id,
                caption: context.caption || '',
                created_at: img.created_at
            };
        });

        res.json({ success: true, images });
    } catch (err) {
        console.error('Cloudinary fetch error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch images from Cloudinary' });
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
        
        // Add metadata to Cloudinary context so we can retrieve it natively
        if (hasCloudinary && publicId) {
            try {
                await cloudinary.v2.uploader.add_context(`caption=${caption}|category=bridal-saree`, [publicId]);
            } catch (ctxErr) {
                console.warn('Failed to add context to Cloudinary:', ctxErr.message);
            }
        }

        // Removed SQLite insertBridalImage
        res.json({ success: true, message: 'Image uploaded', url: imageUrl });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

// DELETE bridal image (admin only)
router.delete('/:id', tokenAuth, async (req, res) => {
    try {
        const publicId = req.params.id;
        
        if (!publicId) {
            return res.status(404).json({ success: false, error: 'Image not found' });
        }

        if (hasCloudinary) {
            try {
                await cloudinary.v2.uploader.destroy(publicId);
            } catch (e) {
                console.warn('Cloudinary delete warning:', e.message);
            }
        }

        // Removed SQLite deleteBridalImage
        res.json({ success: true, message: 'Image deleted from Cloudinary' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ success: false, error: 'Delete failed' });
    }
});

module.exports = router;
