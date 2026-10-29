# protagone.com

The website of protagone: a short intro with a list of tools on the home page,
and a page per tool. Static files on GitHub Pages, without a build step,
cookies, analytics or external requests.

| Path | What it is |
|---|---|
| `index.html` | the home page: intro and the list of tools |
| `style.css` | the styles for every page, with a dark mode |
| `img/` | the protagone mark |
| `instagram-no-login/` | the Instagram No Login page, its `privacy/` page (the URL the stores link to), `download/` and `img/` |
| `update-downloads.sh` | copies a new Instagram No Login release into its folder |
| `CNAME` | the custom domain for GitHub Pages |
| `tests/`, `playwright.config.js`, `package.json` | Playwright tests for every page (not needed to serve the site) |

## A new tool

1. Make a folder with the tool's name and an `index.html`, copying the header
   and footer of `instagram-no-login/index.html` (paths to `../style.css` and
   `../img/`).
2. Add one `<article class="pcard">` to the cards in `index.html`: an image,
   a `status`, an `h3` with the link, one line of text and a `more` link.
3. Add its pages to `pages` in `tests/site.spec.js` and run the tests.

## A new Instagram No Login release

Run `npm run package` and `node tools/screenshots.mjs` in the extension, then
`./update-downloads.sh` here, change the version on
`instagram-no-login/index.html`, commit and push. When a store listing is live,
put its link in that browser's card under "Install": the `badge` becomes the
store name and the button links to the listing.

## Preview

`python3 -m http.server 8000`, then open http://localhost:8000.

## Tests

```sh
npm install
npx playwright install chromium   # once
npm test
```

Every page is checked in light and dark mode, in a new browser context
without a profile or cookies: no console errors, no requests to other hosts,
working internal links and anchors, no horizontal scroll at 375 px, a visible
keyboard focus, the download files, and an axe check against WCAG 2.1 AA.
