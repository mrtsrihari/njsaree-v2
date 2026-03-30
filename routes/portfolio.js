const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');
const multer = require('multer');
// No longer import SQLite for portfolio images since we use Cloudinary natively

// Config from env
const cName = process.env.CLOUDINARY_CLOUD_NAME;
const cKey = process.env.CLOUDINARY_API_KEY;
const cSecret = process.env.CLOUDINARY_API_SECRET;

const hasCloudinary = cName && cKey && cSecret && 
                      !cName.includes('your_') && 
                      !cKey.includes('your_') && 
                      !cSecret.includes('your_');

let upload;
if (hasCloudinary) {
    const CloudinaryStorage = require('multer-storage-cloudinary');
    cloudinary.v2.config({
        cloud_name: cName,
        api_key: cKey,
        api_secret: cSecret,
    });
    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'nj-bridal-portfolio',
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

// GET portfolio images (public - no auth needed)
// Option ?category=bridal-saree
router.get('/', async (req, res) => {
    try {
        if (!hasCloudinary) {
            return res.json({ success: true, images: [] }); // Fallback empty if no Cloudinary
        }

        const categoryFilter = req.query.category;

        // Fetch all images in the portfolio folder directly from Cloudinary
        const result = await cloudinary.v2.api.resources({
            type: 'upload',
            prefix: 'nj-bridal-portfolio/',
            context: true,
            max_results: 100,
            sort_by: 'created_at',
            direction: 'desc'
        });

        let images = result.resources.map(img => {
            const context = img.context && img.context.custom ? img.context.custom : {};
            return {
                id: encodeURIComponent(img.public_id), // URL encode to handle slashes in folder names
                url: img.secure_url,
                public_id: img.public_id,
                caption: context.caption || '',
                category: context.category || 'bridal-saree',
                created_at: img.created_at
            };
        });

        if (categoryFilter) {
            images = images.filter(img => img.category === categoryFilter);
        }

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
        const category = req.body.category || 'bridal-saree';

        // Add metadata to Cloudinary context so we can retrieve it without SQLite
        if (hasCloudinary && publicId) {
            try {
                await cloudinary.v2.uploader.add_context(`caption=${caption}|category=${category}`, [publicId]);
            } catch (ctxErr) {
                console.warn('Failed to add context to Cloudinary:', ctxErr.message);
            }
        }
        
        // Removed SQLite insertPortfolioImage
        res.json({ success: true, message: 'Image uploaded', url: imageUrl });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, error: 'Upload failed' });
    }
});

// DELETE image (admin only)
router.delete('/:id', tokenAuth, async (req, res) => {
    try {
        // The ID passed IS the Cloudinary public_id
        const publicId = req.params.id;
        
        if (!publicId) {
            return res.status(404).json({ success: false, error: 'Image not found' });
        }

        // Delete purely from Cloudinary
        if (hasCloudinary) {
            try {
                await cloudinary.v2.uploader.destroy(publicId);
            } catch (e) {
                console.warn('Cloudinary delete warning:', e.message);
            }
        }

        // Removed SQLite deletePortfolioImage
        res.json({ success: true, message: 'Image deleted from Cloudinary' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ success: false, error: 'Delete failed' });
    }
});

module.exports = router;
