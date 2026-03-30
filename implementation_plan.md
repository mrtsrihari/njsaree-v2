# NJ Saree Drapist — Luxury Bridal Website

Build a premium single-page bridal portfolio website with a Node.js/Express backend for the review moderation system.

## Proposed Changes

### Project Initialization

#### [NEW] [package.json](file:///d:/Projects/njsareedrapist1/package.json)
- Node.js project with **Express**, **better-sqlite3**, **dotenv**
- Dev dependency: **nodemon** for development
- Scripts: `start`, `dev`

---

### Frontend (Static Assets)

All frontend files served by Express from `public/`.

#### [NEW] [index.html](file:///d:/Projects/njsareedrapist1/public/index.html)
Complete single-page website with all sections:
- **Navigation**: Sticky glassmorphism navbar with smooth-scroll links and hamburger menu toggle
- **Hero**: Full-screen video background with dark gradient overlay, animated headline, CTA button
- **Silk-Wave Divider**: CSS/SVG animated wave separator
- **Services**: 4 glassmorphism cards (Bridal Saree, Lehenga, Pre-Pleating, Event Styling) in responsive grid
- **Portfolio**: Masonry-style gallery with lightbox viewer, category filter tabs
- **Instagram Gallery**: Responsive grid pulling from Instagram via embed approach; clicking opens the Instagram post
- **Reviews**: Display approved reviews + submission form (name, star rating, message)
- **Contact**: Email, Instagram, service areas, optional map embed
- **Footer**: Brand, copyright, social links
- SEO: meta description, OpenGraph tags, JSON-LD structured data for beauty service

#### [NEW] [styles.css](file:///d:/Projects/njsareedrapist1/public/styles.css)
Complete design system:
- CSS custom properties for color palette (`#C9A227`, `#FAF7F2`, `#1A1A1A`, `#F6E6E6`)
- Google Fonts: Playfair Display (headings) + Poppins (body)
- Glassmorphism utilities (backdrop-blur, semi-transparent bg, border)
- Card styles with hover elevation + soft glow
- Responsive breakpoints (mobile-first)
- Animation keyframes (fadeIn, slideUp, silk-wave, glow-pulse)
- Lightbox overlay styling
- Floating action button styling

#### [NEW] [app.js](file:///d:/Projects/njsareedrapist1/public/app.js)
Client-side JavaScript:
- Hamburger menu toggle
- Smooth scroll navigation
- Intersection Observer for scroll-triggered fade-in animations
- Portfolio lightbox (open/close/navigate)
- Star rating interactive picker
- Review form submission via `fetch` POST
- Instagram gallery rendering (fallback static grid with links)
- Navbar background change on scroll

---

### Backend

#### [NEW] [server.js](file:///d:/Projects/njsareedrapist1/server.js)
Express server:
- Serve static files from `public/`
- Mount API routes from `routes/`
- Initialize SQLite database on startup
- Serve admin panel at `/admin`

#### [NEW] [db/database.js](file:///d:/Projects/njsareedrapist1/db/database.js)
SQLite database setup:
- `reviews` table: `id`, `name`, `rating`, `message`, `approved` (0/1), `created_at`
- Helper functions: `insertReview`, `getApprovedReviews`, `getPendingReviews`, `approveReview`, `deleteReview`

#### [NEW] [routes/reviews.js](file:///d:/Projects/njsareedrapist1/routes/reviews.js)
Review API endpoints:
- `POST /api/reviews` — Submit a new review (defaults to `approved=0`)
- `GET /api/reviews` — Get all approved reviews

#### [NEW] [routes/admin.js](file:///d:/Projects/njsareedrapist1/routes/admin.js)
Admin endpoints (basic auth protected):
- `GET /admin` — Serve admin HTML page
- `GET /api/admin/reviews` — Get pending reviews
- `POST /api/admin/reviews/:id/approve` — Approve a review
- `DELETE /api/admin/reviews/:id` — Delete a review

#### [NEW] [public/admin.html](file:///d:/Projects/njsareedrapist1/public/admin.html)
Simple admin panel page for review moderation with approve/delete buttons.

---

### Assets

#### [NEW] Portfolio images
Generate 4–6 bridal-themed placeholder images using `generate_image` for the portfolio gallery section.

#### [NEW] [public/video/hero.mp4](file:///d:/Projects/njsareedrapist1/public/video/)
For the hero video, use a CSS animated gradient/shimmer fallback since generating real video isn't feasible. The HTML will accept a video file that the client can later replace.

---

### Instagram Integration

> [!IMPORTANT]
> Instagram's official API requires app approval and tokens. For a practical, low-maintenance solution, the website will use static Instagram post embeds with direct links. The admin can update the Instagram post URLs in a simple config, or the client can later integrate a third-party Instagram feed service (like Elfsight or Smash Balloon) by pasting their widget script. The gallery section is built to accept either approach.

---

## User Review Required

> [!IMPORTANT]
> **Instagram Auto-Gallery Limitation**: Instagram no longer allows unauthenticated scraping of feeds. The implementation will include a beautiful Instagram gallery layout with direct post links. To make it truly "auto-updating," the client would need to either:
> 1. Set up an Instagram Basic Display API token (instructions will be provided), or
> 2. Use a third-party widget service (Elfsight, SnapWidget, etc.)
> The website structure fully supports both options.

> [!NOTE]
> **Admin Authentication**: The admin review panel will use simple HTTP Basic Auth with credentials stored in a `.env` file. This is sufficient for a small business portfolio site but can be upgraded to a proper auth system if needed.

---

## Verification Plan

### Automated Tests
1. **Server startup**: Run `node server.js` and verify it starts on port 3000 without errors
2. **API test**: Use browser subagent to submit a review via the form and verify it appears in the admin panel

### Browser Verification
1. Open `http://localhost:3000` in the browser and visually verify:
   - Navigation renders with glass effect and all menu items
   - Hero section displays with animations
   - Services cards render in 4-column layout
   - Portfolio gallery renders with lightbox functionality
   - Instagram gallery section renders
   - Review form is functional
   - Contact section displays correctly
   - Floating action buttons are visible
2. Test mobile responsiveness by resizing the browser
3. Navigate to `/admin`, verify pending reviews appear, test approve/delete flow
