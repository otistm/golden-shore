// Shared by the test tools: the game page's address and a headless browser to open it in.
import { chromium } from 'playwright';
// A file:// address built this way works on Windows too (no doubled drive letter).
export const gameUrl = new URL('../play/index.html', import.meta.url).href;
// CHROMIUM_PATH wins if set. Otherwise Playwright's own Chromium, and if that was never downloaded, the Chrome or Edge already installed.
export async function launch() {
  if (process.env.CHROMIUM_PATH) return chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  let first;
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch(opts); } catch (e) { first = first || e; }
  }
  throw first;
}
