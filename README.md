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

## A new tool

1. Make a folder with the tool's name and an `index.html`, copying the header
   and footer of `instagram-no-login/index.html` (paths to `../style.css` and
   `../img/`).
2. Add one `<a class="card tool">` to the list in `index.html`.

## A new Instagram No Login release

Run `npm run package` and `node tools/screenshots.mjs` in the extension, then
`./update-downloads.sh` here, change the version on
`instagram-no-login/index.html`, commit and push. When a store listing is live,
replace its `<span class="btn" aria-disabled="true">` under "Install" with
`<a class="btn" href="…">`.

## Preview

`python3 -m http.server 8000`, then open http://localhost:8000.
