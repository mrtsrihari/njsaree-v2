require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
const os = require('os');
app.use('/local-tmp', express.static(os.tmpdir()));

// API Routes
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/portfolio', require('./routes/portfolio'));
// Keep old route working for a while if needed, or point it to the new one
app.use('/api/bridal-portfolio', require('./routes/portfolio'));

// ══════════════════════════════════════
//  MULTI-PAGE ROUTES
// ══════════════════════════════════════

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Portfolio page
app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

// Instagram page
app.get('/instagram', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'instagram.html'));
});

// Reviews page
app.get('/reviews', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reviews.html'));
});

// Contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Admin login page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Admin dashboard page
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Fallback — 404 page
app.get('/{*path}', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Conditionally listen if not on Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`✨ NJ Saree Drapist server running at http://localhost:${PORT}`);
        console.log(`🔧 Admin panel: http://localhost:${PORT}/admin`);
    });
}

// Export the Express API
module.exports = app;

// Vercel serverless configuration: disable default body parser
// to allow Multer to handle multipart/form-data streams (Cloudinary uploads).
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
