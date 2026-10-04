# PROGRESS

Overall progress: approximately 25% (Phases 1–3 of 12 complete)

Completed:
- Phase 1 — Project audit + UI foundation (see PROJECT_STATUS.md)
- Phase 2 — Professional landing page (`/`)
- Phase 3 — Farmer-friendly analysis experience (`/analyze`)

In progress:
- Nothing.

Remaining:
- Phase 4 — Premium AI results page
- Phase 5 — Grad-CAM section
- Phase 6 — Recommendations layout (and real Kiswahili recommendations)
- Phase 7 — History + crop guide
- Phase 8 — Mobile pass
- Phase 9 — Polish
- Phase 10 — Transparency page
- Phase 11 — Final testing (including backend `/api/analyze` tests)
- Phase 12 — Final docs / ZIP

Files modified:
- `frontend/index.html` (now the landing page)
- `frontend/style.css` (design system v2: shared by both pages)
- `frontend/app.js` (now the Analyze page logic only)
- `backend/main.py` (added `GET /analyze` serving `frontend/analyze.html`; nothing else changed)
- `PROGRESS.md`, `PROJECT_STATUS.md`

Files created:
- `frontend/analyze.html`
- `frontend/icons.svg` (inline SVG sprite, no external requests)

ML pipeline, API contract, recommendations and knowledge base: untouched.

Tests completed (Playwright + Chromium, 85/85 passed):
- Landing: no horizontal scroll and no console errors at 375/390/430/768/1280/1536 px; all nav links, hero buttons, crop cards (preselect crop via `?crop=`), CTA band, footer links, brand link.
- Analyze: no horizontal scroll at 375/390/430/820/1280 px (empty and with preview); camera button only on touch devices; preview, replace, remove; drag and drop; client-side rejection of non-images, files over 10 MB and unreadable images; crop and language sent in the multipart request; loading state (button disabled, inputs locked); every response state: ok, invalid_image, uncertain, model_missing, 400, 413, 415, 500, 503, malformed JSON, unknown status, ok with missing fields, network failure, Try again; server-offline and model-not-trained banners; no stack traces shown.
- IMPORTANT: these UI tests used a static server and mocked `/api/analyze` responses shaped like the real contract. They verify UI states only, not predictions.

Known issues:
- The real FastAPI + PyTorch stack could NOT be run in this sandbox (PyPI blocked), so the end-to-end path (real upload -> real model -> result) was not tested in Phase 2/3. Run `python run.py` locally and try `/analyze`.
- No trained model is included; until `python scripts/train.py` runs, valid photos return `model_missing`.
- Language selector is sent to the API but recommendations are English only (`get_recommendations` ignores `lang`; `i18n.json` unused). The UI says support is partial. (Phase 6)
- The result card is still the Phase 1 layout; it is restyled in Phase 4.
- HEIC photos are rejected with guidance (the backend accepts only JPEG/PNG/WebP).
- The photo-tips panel sits above the upload control, so phones scroll a little before the dropzone. Consider collapsing it in the Phase 8 mobile pass.
- Only 8 backend tests; none cover `/api/analyze`. (Phase 11)

Next phase:
- Phase 4 — Premium AI Results Page

How to run:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py            # http://localhost:8000  (landing)  /analyze (tool)
pytest -q
```
