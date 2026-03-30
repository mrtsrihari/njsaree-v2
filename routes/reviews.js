const express = require('express');
const router = express.Router();
const { insertReview, getApprovedReviews } = require('../db/database');

// GET approved reviews
router.get('/', (req, res) => {
    try {
        const reviews = getApprovedReviews();
        res.json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
});

// POST new review
router.post('/', (req, res) => {
    try {
        const { name, rating, message } = req.body;

        // Validation
        if (!name || !rating || !message) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
        }

        if (name.length > 100) {
            return res.status(400).json({ success: false, error: 'Name is too long' });
        }

        if (message.length > 1000) {
            return res.status(400).json({ success: false, error: 'Message is too long' });
        }

        insertReview(name.trim(), rating, message.trim());
        res.json({ success: true, message: 'Review submitted successfully! It will appear after admin approval.' });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ success: false, error: 'Failed to submit review' });
    }
});

module.exports = router;
