# Clutch Auto Buyers — Project Reference

## Instructions for Claude
READ THIS FIRST before doing anything else.

This file is your entire memory for this project. Every session starts here.

Rules you must follow every single session:
1. Read this entire file before touching any code
2. Every time you make ANY change — update the Changelog section with today's date, what you changed, and why
3. Commit CLAUDE.md to GitHub every time you update it
4. Keep all sections current — if something changes, update it here too
5. Never let this file get out of date

---

## Project Overview
A landing page + quote form website for **Clutch Auto Buyers**, a wholesale car-buying business based in the Inland Empire, Southern California. The site's single job: get visitors to submit their vehicle info so the owner (Moe) can call them with a cash offer.

When a visitor submits the form, the server sends an email to `clutchautobuyers@gmail.com` with all the car and contact details via the Resend API. No database — purely stateless form → email flow.

Live URL: **https://www.clutchautobuyers.com**
GitHub: https://github.com/clutchautobuyers-tech/ClutchMotors
Deployed on: **Railway** (auto-deploys on every push to `main`)

---

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | Plain HTML, CSS, vanilla JavaScript — no framework |
| Backend | Node.js + Express |
| Email | Resend (HTTPS API — required because Railway blocks SMTP ports 465/587) |
| Rate limiting | express-rate-limit (5 submissions per IP per 15 min) |
| Environment | dotenv |
| Font | Inter via Google Fonts |
| Hosting | Railway |
| Domain | GoDaddy — `www.clutchautobuyers.com` CNAME → Railway; root domain forwards 301 → www |

**Note:** `nodemailer` and `twilio` are still in `package.json` as leftover dependencies from earlier iterations but are not used. Safe to remove eventually.

---

## File Structure
```
ClutchMotors/
├── server.js              # Express server — serves static files + POST /submit-quote
├── package.json           # Node dependencies and npm start/dev scripts
├── .env                   # Secrets (never commit) — RESEND_API_KEY, ALERT_EMAIL, PORT
├── CLAUDE.md              # This file — project reference for AI sessions
└── public/
    ├── index.html            # Entire single-page website (all sections in one file)
    ├── ClutchAutoBuyers.png      # Original full logo PNG (1799×874) — source of truth, never overwrite
    ├── logo-header.png           # Cropped logo for header (1799×347) — tight crop, content-centered, no trust bar
    ├── favicon-icon.png          # C+car icon cropped from logo — used as browser tab favicon
    ├── preview.jpg               # 1200×630 OG image for iMessage/social link previews
    ├── robots.txt                # Allows all crawlers, points to sitemap
    ├── sitemap.xml               # Single URL sitemap for Google Search Console
    ├── googleaa17a259d963115d.html  # Google Search Console verification file
    ├── css/
    │   └── styles.css            # All styles — light theme, mobile-first, CSS variables
    └── js/
        └── main.js               # Form validation, VIN decoder, photo upload, fetch POST
```

---

## What's Working
- **Landing page** — full single-page site: header, trust bar, hero, how it works, why us, quote form, testimonials, FAQ, footer
- **Quote form** — collects VIN (optional), year/make/model, mileage, condition, ownership (with conditional bank field for financed/leased), optional photos (up to 5, max 5MB each), name, phone, email
- **VIN decoder** — calls NHTSA public API to auto-fill year/make/model when a 17-char VIN is entered
- **Photo uploads** — base64 encoded, sent as email attachments via Resend (up to 5 photos)
- **Email notifications** — Resend sends structured email to `clutchautobuyers@gmail.com` on every submission
- **Rate limiting** — 5 requests per IP per 15 minutes, proxy-aware (`trust proxy: 1` for Railway)
- **Form UX** — loading spinner, success state (hides form, shows confirmation), inline field validation errors, error banner with phone fallback
- **Mobile responsive** — tested on iPhone, header fits on one line at all sizes
- **Header logo sizes** — 54px desktop, 32px mobile; header height 68px; logo-header.png cropped tight (1799×347) so centering aligns with buttons
- **Header CTA buttons** — "Call Us Now" (outlined) and "Text Us Now" (solid blue, `sms:` link) side by side
- **Link previews** — Open Graph + Twitter card meta tags; `preview.jpg` is the thumbnail image shown when link is shared in iMessage/social
- **Favicon** — C+car icon PNG (`favicon-icon.png`) cropped from logo
- **Custom domain** — `www.clutchautobuyers.com` live with HTTPS via Railway
- **Root domain redirect** — `clutchautobuyers.com` → `www.clutchautobuyers.com` via GoDaddy 301 forward
- **SEO/social title** — "Clutch Auto Buyers — Sell Your Car Now"

---

## In Progress / Known Issues
- `nodemailer` and `twilio` are unused dependencies in `package.json` — can be removed with `npm uninstall nodemailer twilio`
- Resend `from` address is still `onboarding@resend.dev` (the default sandbox sender). To use a custom from-address like `noreply@clutchautobuyers.com`, the domain needs to be verified in the Resend dashboard

---

## Design Decisions
| Decision | Reason |
|---|---|
| Resend instead of Nodemailer/Gmail | Railway blocks outbound SMTP ports (465/587). Resend uses HTTPS so it always works. |
| `app.set('trust proxy', 1)` | Required for express-rate-limit to correctly read client IPs behind Railway's reverse proxy. Without it: `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` crash. |
| No framework (plain HTML/CSS/JS) | Easier to maintain, no build step, no dependencies to update. |
| Light/white theme | Requested redesign — more professional and clean vs. original dark theme. |
| No emojis — SVG icons + HTML entities | Requested — emojis look playful; SVGs are crisp and professional on all screens. |
| CSS custom properties for all colors | Easy to retheme without hunting through the file. |
| `sms:` link for Text Us Now | Opens native Messages app on iPhone pre-addressed to owner's number. |
| OG preview image generated via Swift/AppKit | Needed a 1200×630 JPG for iMessage link previews; white background + centered logo-header.png. Use Swift CGContext to composite — sips is unreliable for non-center crops. |
| logo-header.png cropped to 347px (y=164–511) | Content starts at row 179, ends at row 496. Crop gives ~15px equal padding each side so `align-items: center` visually aligns with header buttons. CGImage uses top-left origin — not bottom-left like NSImage. |
| GoDaddy Forward Domain (301) for root | CNAME on `@` is not allowed by DNS spec. GoDaddy's "Forward Domain" does the redirect at the registrar level. |

---

## How to Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Make sure .env exists with:
#    RESEND_API_KEY=re_...
#    ALERT_EMAIL=clutchautobuyers@gmail.com
#    PORT=3000

# 3. Start server
npm start
# or for auto-restart on changes:
npm run dev

# 4. Open http://localhost:3000
```

---

## Environment Variables
| Variable | Value | Purpose |
|---|---|---|
| `RESEND_API_KEY` | `re_cjF5pb7P_...` | Resend API key for sending emails |
| `ALERT_EMAIL` | `clutchautobuyers@gmail.com` | Where quote notification emails go |
| `PORT` | `3000` locally, auto-set on Railway | Server port |

---

## Deployment
Push to GitHub → Railway auto-deploys in ~1 minute.
```bash
git add -A && git commit -m "your message" && git push
```
Railway environment variables are set in the Railway dashboard under the project's Variables tab.

This repo uses SSH for GitHub — no passwords or tokens needed. SSH key: `~/.ssh/id_clutchautobuyers`, remote set to `git@github-clutch:clutchautobuyers-tech/ClutchMotors.git`.

---

## Git / SSH Setup (one-time per machine)
SSH is configured so `git push` works without passwords. Each GitHub account gets its own key.

**How it works:**
- `~/.ssh/config` maps aliases (e.g. `github-clutch`) to the right key for each account
- Each repo's remote URL uses the alias instead of plain `github.com`

**For a new GitHub account on the same Mac:**
```bash
# 1. Generate a new key (replace name and email)
ssh-keygen -t ed25519 -C "email@gmail.com" -f ~/.ssh/id_newproject

# 2. Add public key to the new GitHub account
cat ~/.ssh/id_newproject.pub
# Copy output → GitHub → Settings → SSH keys → New SSH key

# 3. Add a new block to ~/.ssh/config:
#   Host github-newproject
#     HostName github.com
#     User git
#     IdentityFile ~/.ssh/id_newproject

# 4. Add key to agent
ssh-add ~/.ssh/id_newproject

# 5. Test
ssh -T git@github-newproject

# 6. Set the repo remote to use the alias
git remote set-url origin git@github-newproject:username/reponame.git
```

---

## Testimonials (current)
| Name | Vehicle | Initial |
|---|---|---|
| Ahmad | 2019 Toyota Camry | A |
| Jason | 2023 Honda Accord | J |
| Tahreer | 2023 Kia Soul | T |
| Mohammed | 2025 Tesla Model Y | M |
| David | 2023 Kia Forte | D |
| Oscar | 2019 Kia Sorento | O |

---

## Changelog

### 2026-05-10
- Set up SSH authentication for GitHub — no more tokens. Key: `~/.ssh/id_clutchautobuyers`, SSH config alias: `github-clutch`, remote updated to SSH URL.
- Added Git/SSH Setup section to CLAUDE.md with instructions for adding new accounts
- Removed "Starting a New Project" section — user copied it to their other project; this file is Clutch-only going forward

### 2026-04-24 (continued)
- Fixed logo vertical alignment in header: original PNG had 179px of whitespace at top, causing logo to appear lower than buttons despite `align-items: center`. Fixed by recropping `logo-header.png` to y=164–511 (347px tall) — equal ~15px padding on each side of the content.
- Final logo sizes: 54px desktop, 32px mobile. Header height: 68px.
- `logo-header.png` is now 1799×347 (tight crop, content-centered)

### 2026-04-24
- Added logo image to header: replaced CLUTCH / AUTO BUYERS text spans with `<img src="logo-header.png" class="logo-img">` inside `<a href="#" class="logo">`
- Source logo: `ClutchAutoBuyers.png` (1799×874 PNG, white background, provided by user)
- Created `logo-header.png` by cropping top 535px of source logo — captures full C+car icon + CLUTCH AUTO BUYERS wordmark, stops before the trust bar row (which starts at ~row 550)
- Created `favicon-icon.png` — C+car icon cropped from logo; user cropped final version themselves
- Updated favicon link from `favicon.svg` to `favicon-icon.png`
- Footer logo remains as text (PNG has white background — would clash with dark `#0f1923` footer)
- Regenerated `preview.jpg` (1200×630 OG image): white background, `logo-header.png` centered at 310px height, "clutchautobuyers.com" in gray below — generated via Swift/AppKit CGContext
- Bumped `og:image` URL to `?v=7` to force iMessage cache refresh; user manually cropped and replaced `preview.jpg` for final centered version

### 2026-04-20
- SEO pass: updated title tag and meta description with Inland Empire/local keywords, added canonical link, added Schema.org AutoDealer JSON-LD structured data with areaServed cities (Riverside, San Bernardino, Ontario, Fontana, Moreno Valley, Rancho Cucamonga), added location text to hero sub and footer, created robots.txt and sitemap.xml
- Added Google Search Console verification (HTML file method) — site verified and sitemap submitted
- Logo made slightly bigger (1.45rem desktop, 0.95rem mobile) and wrapped in `<a href="#">` to scroll back to top on tap

### 2026-04-15
- Corrected David testimonial: name was "Dave" → "David", vehicle was "2017 Kia Forte" → "2023 Kia Forte", rewrote text to remove "had some miles on it" which didn't fit a 2023

### 2026-04-13
- Fixed browser scroll restoration — page was reopening at the last scroll position instead of the top. Added `history.scrollRestoration = 'manual'` + `window.scrollTo(0,0)` at the top of main.js.
- Updated Mohammed's vehicle from "2025 Tesla" → "2025 Tesla Model Y"
- Added Dave testimonial (2017 Kia Forte) and Oscar testimonial (2019 Kia Sorento)
- Converted testimonials from a wrapping grid to a horizontal scroll carousel — saves vertical space, works on all screen sizes
- Rewrote Tahreer, Mohammed, and Dave testimonials to sound more natural/authentic — kept Ahmad, Jason, and Oscar unchanged
- Auto-scroll to success confirmation after form submit — page was staying in place, forcing user to scroll up to see it. Added `scrollIntoView({ behavior: 'smooth', block: 'center' })` after showing `#formSuccess`.

### 2026-04-09
- Created `CLAUDE.md` — full project reference for future sessions
- Added `## Instructions for Claude` section at the top — rules every session must follow before touching code

### 2026-04-08
- Added "Text Us Now" button to header (`sms:+19513941979`) alongside "Call Us Now"
- Fixed mobile header: logo was stacking ("CLUTCH" / "AUTO BUYERS" on two lines) — set `white-space: nowrap` and reduced font size to `0.85rem` at `max-width: 600px`
- Fixed "Text Us Now" wrapping to two lines on mobile — added `white-space: nowrap` to `.header-sms`
- Added Open Graph + Twitter Card meta tags for proper iMessage/social link previews
- Generated `public/preview.jpg` (1200×630) as the OG thumbnail image
- Pushed all changes to GitHub; Railway auto-deployed

### Earlier (previous session)
- Migrated from Nodemailer/Gmail to Resend to fix Railway SMTP port block
- Added `app.set('trust proxy', 1)` to fix `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` rate-limit crash
- Full visual redesign: dark theme → light/white theme
- Removed all emojis; replaced with SVG icons (why-us cards), CSS dots (trust bar), HTML entities (stars, checkmark)
- Changed browser tab title to "Clutch Auto Buyers — Sell Your Car Now"
- Replaced steering wheel favicon with blue "C" monogram SVG
- Added Mohammed testimonial (2025 Tesla, same-day cash)
- Set up custom domain `www.clutchautobuyers.com` on Railway + GoDaddy 301 redirect for root domain
