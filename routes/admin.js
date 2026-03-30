const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getPendingReviews, getAllReviews, approveReview, deleteReview } = require('../db/database');

// In-memory token store (tokens are invalidated on server restart)
const activeTokens = new Set();

// Generate a secure random token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Token-based auth middleware (no WWW-Authenticate header — no browser popup)
function tokenAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    if (activeTokens.has(token)) {
        next();
    } else {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

// POST login — validate credentials, return token
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = generateToken();
        activeTokens.add(token);
        return res.json({ success: true, token });
    } else {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// POST logout — invalidate token
router.post('/logout', tokenAuth, (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    activeTokens.delete(token);
    res.json({ success: true, message: 'Logged out' });
});

// Protect all routes below with token auth
router.use(tokenAuth);

// GET all reviews (pending + approved)
router.get('/reviews', (req, res) => {
    try {
        const reviews = getAllReviews();
        res.json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
});

// GET pending reviews
router.get('/reviews/pending', (req, res) => {
    try {
        const reviews = getPendingReviews();
        res.json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching pending reviews:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
});

// POST approve review
router.post('/reviews/:id/approve', (req, res) => {
    try {
        const { id } = req.params;
        const result = approveReview(id);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.json({ success: true, message: 'Review approved' });
    } catch (error) {
        console.error('Error approving review:', error);
        res.status(500).json({ success: false, error: 'Failed to approve review' });
    }
});

// DELETE review
router.delete('/reviews/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = deleteReview(id);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, error: 'Failed to delete review' });
    }
});

// Expose token validator for use by other routes
function isValidToken(token) {
    return activeTokens.has(token);
}

module.exports = router;
module.exports.isValidToken = isValidToken;
