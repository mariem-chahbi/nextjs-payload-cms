# Manual test checklist

Tick each box after checking it in a browser. Setup:

```bash
docker compose up -d && pnpm i && pnpm seed && pnpm dev
```

Logins: [README → Seeded logins](README.md#seeded-logins). Use a private window per role.

## 1. Setup
- [ ] `docker compose ps` shows postgres, minio, mailpit and libretranslate as healthy, and `minio-init` exited with code 0.
- [ ] `pnpm seed` ends with `[seed] Done.` and prints the four logins.
- [ ] http://localhost:3000 redirects to `/en`, or to `/ar` if your browser prefers Arabic.

## 2. Roles and the admin language
- [ ] **admin** can log in and sees *Users* and every collection.
- [ ] **editor** can log in, edit and publish pages, and has no access to *Users* beyond their own account.
- [ ] **translator** can log in.
  - [ ] In `en`, pages are read-only.
  - [ ] In `ar`, only translatable fields are editable.
  - [ ] Publish is refused ("Translators can save drafts only").
- [ ] **viewer** gets "Unauthorized" when trying to open `/admin`.
- [ ] Account → Language → **العربية**: the whole admin turns right-to-left.
- [ ] *Forgot password* on the login page sends an email visible in Mailpit (http://localhost:8025).

## 3. Storage on MinIO
- [ ] Media → upload an image and a short video (≤ 200 MB). In the MinIO console (http://localhost:9201), the bucket `payload-playground` shows them under `media/`, with the resized image versions.
- [ ] Use the new image in a block. It appears on the site, cropped around the focal point.
- [ ] Documents → open *Sample private PDF*. While logged in, it opens through a `localhost:9200/...X-Amz-Signature=...` URL.
- [ ] In a private window (logged out), `/api/documents/file/sample-private.pdf?prefix=documents` returns 403.
- [ ] Opening `http://localhost:9200/payload-playground/documents/sample-private.pdf` directly returns 403.

## 4. Editing the page with Live Preview
Open Pages → Home → **Live Preview**, and try the mobile, tablet and desktop sizes.
- [ ] Change a text in the Hero. The preview updates while you type (autosave about every second).
- [ ] Make a word **bold**, *italic*, and colored (toolbar → text state). Change alignment to center, and change its size.
- [ ] Swap the Image block's image and the Video block's video.
- [ ] **Drag** the Gallery block above the Cards block.
- [ ] Columns block: change column 1's width to 4/8/12 (desktop/tablet/mobile). The preview follows at each breakpoint.
- [ ] Free Layout: change the *Headline* item's X/Y for desktop and for mobile.
- [ ] **Publish**. Open `/en` in another tab: the changes are there without a rebuild.

## 5. Theme
- [ ] Theme → change *Primary* to a strong color and publish. Buttons, links, the hero and stats change across the whole site.
- [ ] Theme → change *Headings (Latin)* to Lora. English headings change.
- [ ] Change *Headings (Arabic)* to Amiri. `/ar` headings use Amiri.
- [ ] Theme → *Dark mode: Always dark*. The site switches to the dark palette.

## 6. Languages and regions on the site
- [ ] `/ar` is fully right-to-left.
  - [ ] The header, the logo position and media + text are mirrored.
  - [ ] The Free Layout items are mirrored.
- [ ] `/ar-TN`:
  - [ ] the Hero heading reads *مواقع بالعربي والفرنسي لتونس*
  - [ ] the button reads *يلا نبداو*
  - [ ] the hero image is the orange Tunisia variant
  - [ ] everything else is identical to `/ar`
- [ ] `/ar-TN` and `/en-TN` show the **Tunisia launch offer**. `/en` and `/ar` do not.
- [ ] Footer phone number: `+216 71 000 000` on `/ar-TN` and `/en-TN`, `+1 555 0100` on `/en`.
- [ ] Header switcher: pick *تونس — العربية (تونس)*. The URL becomes `/ar-TN/...` and the choice is remembered on the next visit to `/`.

## 7. Translation view
- [ ] Open Home → **Translate**, then *To: ar*.
  - [ ] English and Arabic appear side by side, with the Arabic column right-to-left.
  - [ ] Edit one text and click *Save draft*. The change appears in the editor in `ar`.
- [ ] *To: ar-TN*: fields not overridden show **inherited from ar**.
- [ ] Header (global) → Translate also works.

## 8. Auto-translate
- [ ] About → Translate → *To: ar* → **✨ Auto-translate en → ar**.
  - [ ] The Arabic fields are filled through LibreTranslate.
  - [ ] Bold, italic, colored words and the list are kept.
  - [ ] Status shows **needs review**.
- [ ] As **translator**, the same works but saves a draft. An editor publishes it.

## 9. "Needs review" after an English change
- [ ] Home in `en`: change a stat label and publish. Sidebar → Translation status: `ar` and `ar-TN` switch from *done* to **needs review**, listing the changed field.
- [ ] The Pages list shows the yellow *needs review* badges.

## 10. Import and export
- [ ] Nav → *Import / export* → `ar`, CSV, Download. Open it in **Excel**: Arabic displays correctly.
- [ ] Edit one `target` cell, save as CSV UTF-8, import with *Publish* checked. The report says 1 text imported, and `/ar` shows the change.
- [ ] Change one `key` cell to garbage and import. The report lists the row number and the problem.
- [ ] XLSX and JSON exports download and re-import.

## 11. Dashboard
- [ ] `/admin` shows **Translation progress** with % for en, ar, ar-TN and en-TN (About pulls `ar` below 100%).
- [ ] The *Needs work* table links to the Translation view for each document.

## 12. New region, no code
- [ ] Regions → Create: code `ma`, name *Morocco* / *المغرب*, languages `ar` + `en`, default `ar`, currency `MAD`, time zone `Africa/Casablanca`, active. Save.
- [ ] Reload the site. The switcher has a *Morocco* group. Picking it keeps you on `/ar` with the Morocco region.

## 13. Drizzle
- [ ] Logged into the admin, open http://localhost:3000/api/playground/stats. It returns counts from one raw SQL query (`"source": "payload.db.drizzle (raw SQL)"`).

## 14. Automated checks
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] Optional: `E2E_CHANNEL=msedge pnpm test:e2e` (with a server on :3000) passes

## Extra
- [ ] UI strings grid: search `nav`, filter *missing only*, edit an `ar-TN` cell, then reload. The value persists and the grey placeholders show inherited values.
- [ ] Scheduled publish: Pages → Home → *Schedule publish* one minute ahead. The jobs queue publishes it (dev runs it every minute).
- [ ] Contact form on `/en#contact`: submit it. The submission is saved (Forms → Submissions) and an email arrives in Mailpit.
- [ ] Versions: Home → *Versions* → restore an older version.
