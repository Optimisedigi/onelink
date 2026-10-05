# Project notes

OneLink is a Nuxt 4 link-in-bio app. The saved public profile lives on `/`, with its owner editor and preview on `/admin`. `/official` redirects to `/`. Legacy profiles remain encoded into the `data` query parameter of `/1`.

## Commands

- `npm run dev` starts the local server.
- `npm run build` builds the production app.
- Use npm with `package-lock.json`. There is currently no test or type-check script.

## Where to work

- `pages/index.vue`: loads and renders the saved public profile.
- `pages/admin.vue`: owner editor state, image attachments, import/export, and Save action.
- `components/AppForm/Links.vue`: editable link fields; optional section names are stored as `g` on each link.
- `components/AppForm/Preview.vue`: scrollable phone preview.
- `pages/1.vue`: decodes a published profile, then renders `components/Templates/Simple.vue`.
- `components/ExternalLink.vue`: destination, image or legacy icon, and expandable description for each link.
- `server/utils/analytics.js`, `server/api/track.post.js`, `server/api/admin/stats.get.js`: visit/click counts in Upstash Redis, shown in the admin "Visits and clicks" panel. `utils/profileLinks.js` is shared by the public page and the server so click addresses match.
- `utils/safeLinks.js`: validates outbound URLs; keep the validation when changing link or image rendering.

Preserve existing published profile URLs: fields may be absent and links without a section still render. Descriptions and link images are optional. Social links and link icons must remain usable at narrow widths and by keyboard.
