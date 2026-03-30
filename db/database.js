const path = require('path');
const Database = require('better-sqlite3');
const os = require('os');

const fs = require('fs');

// In Vercel, the only writable path is /tmp
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || process.env.VERCEL;
const dbDir = isVercel ? os.tmpdir() : path.join(__dirname, '..');
const dbPath = path.join(dbDir, 'reviews.db');

if (isVercel) {
    const sourceDb = path.join(__dirname, '..', 'reviews.db');
    if (fs.existsSync(sourceDb) && !fs.existsSync(dbPath)) {
        fs.copyFileSync(sourceDb, dbPath);
    }
}

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create reviews table
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    message TEXT NOT NULL,
    approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create portfolio images table (supports all 4 categories)
db.exec(`
  CREATE TABLE IF NOT EXISTS portfolio_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    public_id TEXT NOT NULL,
    caption TEXT DEFAULT '',
    category TEXT DEFAULT 'bridal-saree',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migrate old bridal_images table if it exists
try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bridal_images'").get();
    if (tableCheck) {
        // Copy old data into portfolio_images (if portfolio_images is empty)
        const existing = db.prepare('SELECT COUNT(*) as cnt FROM portfolio_images').get();
        if (existing.cnt === 0) {
            db.exec(`INSERT INTO portfolio_images (url, public_id, caption, category, created_at)
                     SELECT url, public_id, caption, 'bridal-saree', created_at FROM bridal_images`);
        }
        // Drop old table
        db.exec('DROP TABLE IF EXISTS bridal_images');
    }
} catch (e) {
    // Migration not needed or failed silently
}

// ── Review functions ──
function insertReview(name, rating, message) {
    const stmt = db.prepare('INSERT INTO reviews (name, rating, message) VALUES (?, ?, ?)');
    return stmt.run(name, rating, message);
}

function getApprovedReviews() {
    return db.prepare('SELECT id, name, rating, message, created_at FROM reviews WHERE approved = 1 ORDER BY created_at DESC').all();
}

function getPendingReviews() {
    return db.prepare('SELECT * FROM reviews WHERE approved = 0 ORDER BY created_at DESC').all();
}

function getAllReviews() {
    return db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
}

function approveReview(id) {
    return db.prepare('UPDATE reviews SET approved = 1 WHERE id = ?').run(id);
}

function deleteReview(id) {
    return db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
}

// ── Portfolio image functions ──
const VALID_CATEGORIES = ['bridal-saree', 'lehenga', 'pre-pleated', 'event'];

function insertPortfolioImage(url, public_id, caption = '', category = 'bridal-saree') {
    if (!VALID_CATEGORIES.includes(category)) category = 'bridal-saree';
    const stmt = db.prepare('INSERT INTO portfolio_images (url, public_id, caption, category) VALUES (?, ?, ?, ?)');
    return stmt.run(url, public_id, caption, category);
}

function getAllPortfolioImages(category) {
    if (category && VALID_CATEGORIES.includes(category)) {
        return db.prepare('SELECT * FROM portfolio_images WHERE category = ? ORDER BY created_at DESC').all(category);
    }
    return db.prepare('SELECT * FROM portfolio_images ORDER BY created_at DESC').all();
}

function deletePortfolioImage(id) {
    return db.prepare('DELETE FROM portfolio_images WHERE id = ?').run(id);
}

function getPortfolioImageById(id) {
    return db.prepare('SELECT * FROM portfolio_images WHERE id = ?').get(id);
}

// Keep old aliases for backward compat (used in old bridal-portfolio route)
const insertBridalImage = (url, public_id, caption) => insertPortfolioImage(url, public_id, caption, 'bridal-saree');
const getAllBridalImages = () => getAllPortfolioImages('bridal-saree');
const deleteBridalImage = deletePortfolioImage;
const getBridalImageById = getPortfolioImageById;

module.exports = {
    db,
    insertReview,
    getApprovedReviews,
    getPendingReviews,
    getAllReviews,
    approveReview,
    deleteReview,
    // New generalized functions
    insertPortfolioImage,
    getAllPortfolioImages,
    deletePortfolioImage,
    getPortfolioImageById,
    // Legacy aliases
    insertBridalImage,
    getAllBridalImages,
    deleteBridalImage,
    getBridalImageById
};
