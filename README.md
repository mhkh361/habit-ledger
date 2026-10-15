# The Ledger — your habit tracker

A tiny, private habit tracker. No account, no subscription, no ads.
Each phone keeps its own data on that device only (nothing is synced
between your phone and your parents' phones — think of it as everyone
getting their own paper notebook, not a shared spreadsheet).

## What's in this folder
- `index.html` — the page structure
- `style.css` — the "ledger" look (paper, ink, stamped checkmarks)
- `app.js` — all the logic: saving habits, counting streaks, the daily reset
- `manifest.json` + `sw.js` — what makes it installable and work offline
- `icon-192.png` / `icon-512.png` — the app icon

Every line in `app.js` has a comment explaining what it does and why —
read it whenever you're ready to actually learn the code, not just use it.

## Step 1 — Put it online (free, ~10 minutes, one time)
A PWA needs to be served over HTTPS to install properly on iPhones.
GitHub Pages is free and does this for you:

1. Make a free account at github.com if you don't have one.
2. Create a new repository (e.g. `habit-ledger`). Public is fine.
3. Upload every file in this folder to that repository (drag-and-drop
   works on github.com — "Add file" → "Upload files").
4. Go to the repo's **Settings → Pages**. Under "Source" pick the
   `main` branch and `/ (root)`, then save.
5. GitHub gives you your app's live link:
   `https://mhkh361.github.io/-habit-ledger-/`
   (Note: The address matches your exact repo name, including dashes).
   That's your app's permanent free address.

## Step 2 — Install it on each phone
Open that link in the phone's browser, then:

**iPhone (Safari — must be Safari, not Chrome):**
Tap the Share icon → "Add to Home Screen" → Add.

**Android (Chrome):**
Tap the ⋮ menu → "Install app" (or "Add to Home screen") → Install.

Do this on your phone, and then on your mother's and father's phones
too — each install is independent and keeps its own habits.

## Notes
- Tap "Whose phone is this?" at the bottom to label each device
  (e.g. "Baba", "Amma") — it's just a label, doesn't sync or share data.
- If you ever want to change colors or add features, `style.css` has
  all the colors defined once at the top under `:root` — change them
  there and the whole app updates.
- To test changes fast before re-uploading: open `index.html` directly
  in a browser to see your edits (installing/offline mode needs the
  HTTPS link, but the app itself runs fine straight from the file too).
