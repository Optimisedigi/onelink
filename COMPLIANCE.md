# Compliance Register

Snapshot: 2026-09-30 · Base commit: b985525 plus local image-attachment changes · Engineering guidance, not legal advice.

## Scope

This entry covers only owner-uploaded link images, not a full review of the public site. The editor requires the existing owner session; anonymous visitors cannot upload. Images are stored publicly with the existing Vercel Blob provider. No accounts or payments are introduced. First-party visit and click counting was added later (see ANL controls).

## Controls

| ID | Trigger | Evidence | Status |
|---|---|---|---|
| IMG-01 | Public image publication | CODE: upload control explains that images are public and retained after removal from a link | Implemented; documentation tells the owner to publish only permitted, non-confidential images |
| IMG-02 | Upload access and resource limits | RUNTIME: local HTTP checks reject anonymous/forged sessions, cross-origin requests, SVG, mismatched image headers and oversized files | Implemented; PNG/JPEG/WebP limited to 2 MB |
| IMG-03 | Retention and storage costs | CODE: upload uses unique Blob paths, with no deletion or automatic cleanup | Disclosed in the editor and PROFILE_SETUP.md; unused uploads still consume storage |
| ANL-01 | Visit and click counting | CODE: `server/api/track.post.js` stores only a UTC day and a hashed link address in Upstash Redis; no IP, cookie, user agent or identifier is stored | Implemented; no consent banner added because no device identifier or personal data is stored (re-review if unique-visitor counting is ever added) |
| ANL-02 | New processor | Upstash Redis via Vercel Marketplace, free plan | Disclosed in PROFILE_SETUP.md; counting fails closed (204, nothing stored) when not configured |

## Limits

No live upload, image deletion, provider restore, jurisdiction-specific legal assessment or full-site accessibility review was performed. Browser checks covered the attachment controls at desktop and phone widths, visible keyboard focus, size/type errors, pending state, removal and URL assignment. The successful upload response was simulated; real Blob storage requires a deployment and live verification.
