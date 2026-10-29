// @ts-check
const { test, expect } = require('@playwright/test');
const { default: AxeBuilder } = require('@axe-core/playwright');

const pages = ['/', '/instagram-no-login/', '/instagram-no-login/privacy/'];
const schemes = /** @type {const} */ (['light', 'dark']);

for (const path of pages) {
    test.describe(path, () => {
        for (const colorScheme of schemes) {
            test(`${colorScheme}: no console errors and no requests to other hosts`, async ({ page }) => {
                await page.emulateMedia({ colorScheme });
                const problems = [];
                page.on('console', msg => { if (msg.type() === 'error') problems.push(msg.text()); });
                page.on('pageerror', err => problems.push(err.message));
                page.on('requestfailed', req => problems.push(`failed: ${req.url()}`));
                page.on('request', req => {
                    if (new URL(req.url()).host !== '127.0.0.1:4173') problems.push(`external: ${req.url()}`);
                });
                await page.goto(path);
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForLoadState('networkidle');
                expect(problems).toEqual([]);
            });

            test(`${colorScheme}: renders with its own palette`, async ({ page }) => {
                await page.emulateMedia({ colorScheme });
                await page.goto(path);
                const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
                expect(bg).toBe(colorScheme === 'light' ? 'rgb(251, 250, 255)' : 'rgb(17, 16, 22)');
                await expect(page.locator('h1')).toBeVisible();
            });

            test(`${colorScheme}: passes axe (WCAG 2.1 A and AA)`, async ({ page }) => {
                await page.emulateMedia({ colorScheme });
                await page.goto(path);
                const results = await new AxeBuilder({ page })
                    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                    .analyze();
                expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([]);
            });
        }

        test('no horizontal scroll at 375 px', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.goto(path);
            const width = await page.evaluate(() => document.documentElement.scrollWidth);
            expect(width).toBeLessThanOrEqual(375);
        });

        test('internal links and anchors work', async ({ page, request }) => {
            await page.goto(path);
            const hrefs = await page.$$eval('a[href]', as => as.map(a => /** @type {HTMLAnchorElement} */ (a).href));
            const internal = [...new Set(hrefs.filter(h => h.startsWith('http://127.0.0.1:4173/')))];
            expect(internal.length).toBeGreaterThan(0);
            for (const href of internal) {
                const url = new URL(href);
                const res = await request.get(url.pathname);
                expect(res.status(), href).toBe(200);
                if (url.hash) {
                    await page.goto(href);
                    await expect(page.locator(url.hash), href).toHaveCount(1);
                }
            }
        });

        test('keyboard focus is visible', async ({ page }) => {
            await page.goto(path);
            await page.keyboard.press('Tab');
            const outline = await page.evaluate(() => getComputedStyle(/** @type {Element} */ (document.activeElement)).outlineStyle);
            expect(outline).toBe('solid');
        });
    });
}

test('download links exist and are not empty', async ({ page, request }) => {
    await page.goto('/instagram-no-login/');
    const links = await page.$$eval('a[href*="download/"]', as => as.map(a => a.getAttribute('href')));
    const unique = [...new Set(links)];
    expect(unique.sort()).toEqual([
        'download/instagram-no-login-chrome.zip',
        'download/instagram-no-login-firefox.zip',
        'download/instagram-no-login.user.js',
    ]);
    for (const href of unique) {
        const res = await request.get(`/instagram-no-login/${href}`);
        expect(res.status(), href).toBe(200);
        expect((await res.body()).length, href).toBeGreaterThan(1000);
    }
});
