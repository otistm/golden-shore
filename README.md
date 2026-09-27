# Ink Crossing

Chart the sea. Reach the far shore.

- `index.html` is the front page. The game is in `play/`.
- Settings (the version and online keys) are in `play/js/config.js`.
- Database setup files are in `supabase/`, numbered in the order to run them.
- `CLAUDE.md` explains the project to Claude Code, and `CHANGELOG.md` lists what changed in each version.

To run it on your computer, open a terminal in this folder, run `python3 -m http.server`, then visit http://localhost:8000

Tests (optional): `npm install`, `npx playwright install chromium`, then `npm run check`, `npm run voyage` and `npm run sim`.
