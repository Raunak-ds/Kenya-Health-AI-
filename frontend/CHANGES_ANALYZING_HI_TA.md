# Changes in this build

## 1. Scan > Detect > Heal animation on the Analyzing step
- On the scan page, pressing "Analyze Leaf with AI" now swaps the form for an animated leaf
  (blue scan sweep -> disease spots detected -> leaf turns green and heals) with captions in the
  farmer's language and a Scan / Detect / Heal progress indicator.
- If the request fails, the panel disappears and the form comes back with the error toast.
- On success the app navigates to the result page as before.
- The spots carry no percentage labels, so the animation can't be mistaken for a real result.
- Respects "reduce motion": the animation is static and only the title and a progress bar show.
- Code: `showAnalyzing()` / `hideAnalyzing()` in `app.js`; styles at the end of `pulse-leaves.css`.

## 2. Hindi (हिन्दी) and Tamil (தமிழ்)
- Language switcher now has EN / SW / हि / த (desktop top bar and mobile header). Sidebar/profile
  buttons cycle through all four. Register and Edit-profile language pickers list all four.
- `tr(english, swahili)` replaces the old Swahili/English ternaries; Hindi and Tamil strings are in
  `EXTRA_TR` (keyed by the English text). Missing keys fall back to English.
- New `static/locales/hi.json` and `ta.json` (nav, headers, feedback, disclaimer).
- Noto Sans Devanagari / Noto Sans Tamil fonts added for correct rendering.
- Service worker cache bumped to v12 and now caches the new locale files.

## Backend untouched
- No API paths, methods, or request shapes changed. The `api` object in `app.js` is identical
  except one logout toast string.
- The backend only knows `en` and `sw`, so `apiLang()` sends `en` for Hindi/Tamil in the scan
  `lang` field and in `preferred_language` (register/profile). Recommendation text from the
  backend therefore arrives in English for hi/ta users. When the backend supports them, change
  `apiLang()` in `app.js` to return the code as-is.

## Not translated yet
- Backend-generated text (recommendations, disease names) and some admin/expert screens and
  modal dialogs are still English (Swahili where it was before).
