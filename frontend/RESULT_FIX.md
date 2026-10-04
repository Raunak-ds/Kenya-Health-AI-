# Scan result flicker fix

The result page was disappearing because two CSS files both defined `@keyframes pf-rise`.
`pulse-leaves.css`, loaded later, replaced the result reveal keyframes with the decorative sprout animation whose final opacity is 0.

Fix:
- result reveal animation renamed to `crop-result-reveal`
- defensive last-loaded visibility rule added to `premium-green.css`
- service-worker cache bumped to v14

No API routes or backend request payloads were changed.
