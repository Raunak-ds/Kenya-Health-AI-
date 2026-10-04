# Frontend ↔ FastAPI integration check

This frontend keeps the existing `/api/v1` backend contracts and now includes authenticated loading for protected scan images, Grad-CAM images, and PDF reports.

## Quick browser check

1. Run the backend with `python run.py`.
2. Open `http://127.0.0.1:8000` and sign in.
3. Open DevTools → Console and run:

```js
await runApiIntegrationCheck()
```

It prints a PASS/FAIL table for safe GET endpoints available to the current role.

## Important fixes in this build

- Correct hash routing for `#/scans/:id` and `#/farms/:id`.
- Protected `/scans/{id}/image` and `/gradcam` resources are fetched with the Bearer token instead of raw `<img src>` requests.
- Protected PDF reports are downloaded with the Bearer token.
- Scan file input no longer uses hidden native `required` validation that caused `invalid form control ... is not focusable`.
- Scan result uses backend `top3` and `quality_info` fields.
- Uncertainty is based on `is_accepted === false` as well as the status/label.
- Farm edit/delete, plot edit/delete, profile edit, password change, follow-up creation, expert queue endpoints, admin scan/follow-up endpoints, and notification count are wired to existing backend routes.
- Service worker cache version bumped so updated JS/CSS replaces stale cached assets.
