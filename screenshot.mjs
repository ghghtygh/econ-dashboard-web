import { chromium } from 'playwright';

const BASE = 'http://localhost:4174';
const pages = [
  { name: 'dashboard', path: '/' },
  { name: 'explore', path: '/explore' },
  { name: 'news', path: '/news' },
];

const viewports = [
  { name: 'pc', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.name === 'mobile' ? 2 : 1,
      colorScheme: 'dark',
    });
    const page = await context.newPage();

    for (const pg of pages) {
      await page.goto(`${BASE}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: `/tmp/ui-review/${vp.name}-${pg.name}.png`,
        fullPage: true,
      });
      console.log(`Captured: ${vp.name}-${pg.name}`);
    }

    // Dashboard scrolled view
    if (vp.name === 'pc') {
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `/tmp/ui-review/pc-dashboard-scrolled.png`,
        fullPage: false,
      });
      console.log('Captured: pc-dashboard-scrolled');
    }

    await context.close();
  }

  await browser.close();
  console.log('Done!');
})();
