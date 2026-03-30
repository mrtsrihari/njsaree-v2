# Multi-page Website Conversion — Walkthrough

## What Was Done

Converted the NJ Saree Drapist luxury bridal website from a single-page scrolling layout to a fully independent multi-page structure with proper routing, Cloudinary-based admin image uploads, and a dedicated reviews system.

---

## Pages Created

| Route | HTML File | Description |
|---|---|---|
| `/` | [home.html](file:///d:/Projects/njsaree-fin/public/home.html) | Hero + brand intro + services preview + Instagram preview |
| `/services` | [services.html](file:///d:/Projects/njsaree-fin/public/services.html) | Detailed service cards (Bridal, Lehenga, Pre-Pleating, Event) |
| `/services/bridal-saree-draping` | [bridal-saree-draping.html](file:///d:/Projects/njsaree-fin/public/bridal-saree-draping.html) | Cloudinary dynamic gallery |
| `/portfolio` | [portfolio.html](file:///d:/Projects/njsaree-fin/public/portfolio.html) | Filterable portfolio grid with lightbox |
| `/instagram` | [instagram.html](file:///d:/Projects/njsaree-fin/public/instagram.html) | Auto-shimmer grid linking to @njsareedrapist |
| `/reviews` | [reviews.html](file:///d:/Projects/njsaree-fin/public/reviews.html) | Site reviews + Google Review button + submit form |
| `/contact` | [contact.html](file:///d:/Projects/njsaree-fin/public/contact.html) | Email, Instagram, WhatsApp, service areas + Google map |
| `/admin` | [admin.html](file:///d:/Projects/njsaree-fin/public/admin.html) | Custom login form (no browser popup) |
| `/admin-dashboard` | [admin-dashboard.html](file:///d:/Projects/njsaree-fin/public/admin-dashboard.html) | Tabbed: Review management + Bridal image upload/delete |

---

## Backend Changes

- **[server.js](file:///d:/Projects/njsaree-fin/server.js)** — Replaced catch-all route with dedicated per-page routes
- **[routes/bridal-portfolio.js](file:///d:/Projects/njsaree-fin/routes/bridal-portfolio.js)** — New API route for `/api/bridal-portfolio`:
  - `GET /` — Public image listing
  - `POST /upload` — Admin-authenticated Cloudinary upload (with local fallback if credentials missing)
  - `DELETE /:id` — Admin-authenticated image delete (removes from Cloudinary + SQLite)
- **[db/database.js](file:///d:/Projects/njsaree-fin/db/database.js)** — Added `bridal_images` SQLite table + CRUD functions
- **[routes/admin.js](file:///d:/Projects/njsaree-fin/routes/admin.js)** — Exported [isValidToken()](file:///d:/Projects/njsaree-fin/routes/admin.js#106-110) for reuse by bridal-portfolio route

## Cloudinary Setup

To enable image uploads on Cloudinary, add to [.env](file:///d:/Projects/njsaree-fin/.env):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Without these, uploads store temporarily in `/tmp` (local fallback).

## Google Review Link

In `reviews.html`, update:
```html
href="https://g.page/r/YOUR_GOOGLE_MAPS_PLACE_ID/review"
```
Replace `YOUR_GOOGLE_MAPS_PLACE_ID` with your business's actual Google Maps Place ID.

---

## Verified Working

![Home Page Hero](file:///C:/Users/mrtsr/.gemini/antigravity/brain/5ce86a69-603d-484e-bb31-b5d5669619ab/.system_generated/click_feedback/click_feedback_1773975915725.png)
*Home page with cinematic hero, proper page-based navigation links, and floating action buttons (WhatsApp, Instagram, Email)*

- ✅ Home page loads with hero, brand intro, services preview, floating buttons
- ✅ Navigation triggers full page loads (not scrolling) to `/services`, `/portfolio`, `/instagram`, `/reviews`, `/contact`
- ✅ Admin login at `/admin` shows custom styled form (no browser popup)
- ✅ Admin dashboard at `/admin-dashboard` requires auth (redirects to `/admin` if not logged in)
- ✅ Bridal gallery at `/services/bridal-saree-draping` dynamically loads from `/api/bridal-portfolio`
- ✅ All pages mobile-responsive with consistent luxury design
- ✅ All pages have unique `<title>` and `<meta description>` for SEO

---

## Notes

- **Instagram Gallery**: Since Instagram's public API requires OAuth, the gallery shows animated shimmer tiles that link to `@njsareedrapist`. This is the best approach without a third-party widget or Meta App approval.
- **Google Reviews**: Live Google Reviews require a Google Places API key (paid). The current implementation provides a prominent "Write a Google Review" link button as a practical free alternative.
