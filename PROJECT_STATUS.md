# PROJECT STATUS

Status after Phase 3. Source of truth for what exists today.

## Routes
- `GET /` landing page (`frontend/index.html`)
- `GET /analyze` analysis page (`frontend/analyze.html`); `?crop=maize|potato|tomato` preselects the crop
- `GET /health` -> `{status, model_ready}`
- `POST /api/analyze` multipart: `file`, `crop` (optional), `lang` (`en`/`sw`)
- Static assets under `/static/` (`style.css`, `app.js`, `icons.svg`)

## Phase 1 (previous)
Design tokens, re-skin onto the existing single page, HTML escaping of server strings, live model-status pill, per-status rendering. ML pipeline untouched.

## Phase 2 — landing page
Hero ("Know Your Crop. Act Earlier.", buttons "Analyze a Crop" and "How It Works"), How it works, Supported crops (the real 11 classes: maize 4, potato 3, tomato 4), AI technology (the real pipeline stages and the three real backbones), Why this system, Trust and transparency, footer. No accuracy figures or extra diseases are claimed. Palette: forest green, emerald, warm sand; serif display headings with system fonts; one subtle scan-line animation.

## Phase 3 — analysis experience
Flow: Choose/Capture -> Preview -> Analyze (stepper). Gallery picker, camera capture (touch devices only, separate input so gallery is never blocked), drag and drop, preview, replace, remove, crop and language radio groups, photo guidance (do and avoid), loading state with locked inputs and 60 s timeout, and friendly states for unsupported/too-large/invalid/poor-quality image, backend unavailable, network/offline error, uncertain result and unexpected responses. Results render only fields returned by the backend. Quality failures give specific retake tips from the backend's reason string.

## Bugs fixed during this phase
- Phase 1's `capture="environment"` on the only file input could block gallery selection on phones: split into camera and gallery inputs.
- `[hidden]` was overridden by button display styles (camera button showed on desktop): global `[hidden]{display:none!important}`.
- Phase 1 rendered `sources` as links without checking the scheme; non-http values are now shown as text.

## Language
English and Kiswahili selector preserved and sent to the API. Only the API receives the choice; recommendations remain English. The UI states this.

## Not changed
`ml/`, `scripts/`, `knowledge_base/`, tests, `backend/recommendations.py`, API contract.
