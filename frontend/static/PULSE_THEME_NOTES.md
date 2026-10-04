# Pulse Flow redesign: what changed

Presentation only. `app.js`, `locales/*` and every `/api/v1` call are byte-identical to the original.

## Files changed
- `static/pulse-theme.css` (new, also copied to `pulse-theme.css`): the whole redesign. Loaded after `style.css`.
- `static/index.html` (and root copy): fonts (Space Grotesk + Syncopate), theme link, dark theme-color, brand mark stroke.
- `sw.js`: cache bumped to `kenya-crop-health-v8-pulse` and caches the new CSS, so users never see stale styles.
- `icon-192.svg`, `icon-512.svg`, `manifest.json`: Pulse brand colours.

## Install
Copy the `frontend/` folder over your existing one. Your FastAPI app should keep serving it exactly as before (`/static/...`).
Hard-refresh once (Ctrl/Cmd+Shift+R) so the service worker picks up v8.

## Tweak
Palette tokens are at the top of `pulse-theme.css` (`--pulse-accent`, `--pulse-deep`, `--pulse-dark`).
To revert, delete the `pulse-theme.css` <link> line in `index.html`.

## Not touched
`index_1.html`, `analyze.html`, `app_1.js`, `style_1.css`, `icons.svg` look like a separate public page and are not part of the SPA, so they were left as they were.

## Premium pass (v9)
- `pulse-premium.css`: scan/upload viewfinder, live stepper, analysis laser sweep, animated confidence ring, Grad-CAM side-by-side with heat legend, two-column recommendations (action steps first), mobile sticky Analyze button.
- `pulse-enhance.js`: tiny presentation helper (confidence count-up + stepper progress). Reads the screen only; no API calls, no data changes.
- `index.html` links both files; `sw.js` cache is now `kenya-crop-health-v9-premium`.
- To revert this pass: remove the `pulse-premium.css` link and the `pulse-enhance.js` script tag from `index.html`.

## Dark premium blue (v10)
`pulse-blue.css` (loaded last) + palette recolor: navy #070B1A base, ice-blue #5CB8FF accent, glass cards, rounded edges, gradient buttons, green for healthy results.
Revert this look: remove the `pulse-blue.css` link from `index.html` (the colours in the other files stay blue).

## Leaf & disease animation (v11)
- `pulse-leaves.css` + extra code in `pulse-enhance.js` (decorative DOM injected, aria-hidden, no API/data access).
- Landing phone mockup: 12s loop of AI scan sweep > disease spots detected with confidence tags > leaf regenerates to healthy with sprouts rising.
- Drifting dark-blue leaves behind the landing hero, sign-in/register panel, result hero and page headers.
- Honors prefers-reduced-motion (drift hidden, leaf shown static).
- Switch off: remove the `pulse-leaves.css` link from `index.html`.
