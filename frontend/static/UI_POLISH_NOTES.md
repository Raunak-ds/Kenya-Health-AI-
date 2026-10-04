# UI polish (v6) — what changed

Only presentation files changed. `app.js`, `locales/*`, and every API call are untouched.

- `style.css` / `static/style.css`: original design system kept, plus a "Professional UI Polish Layer" appended at the end (search for `PROFESSIONAL UI POLISH LAYER`).
- `index.html` / `static/index.html`: extra meta tags only (color-scheme, iOS standalone, no phone-number auto-linking).
- `sw.js`: cache bumped to `kenya-crop-health-v6` so users get the new CSS instead of a stale cached copy.

## Breakpoints
Phone <640 (bottom nav, bottom-sheet modals, 16px inputs) · Tablet 640-1023 · Laptop 1024-1279 (compact sidebar) · Desktop 1280-1439 · Large 1440+ (wider sidebar/gutters, 1560px content cap at 1800+).

To revert: restore the CSS file from your original zip.
