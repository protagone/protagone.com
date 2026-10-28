#!/bin/sh
# Copies a new release of the extension into instagram-no-login/download/
# and instagram-no-login/img/, from a
# checkout of instagram-no-login next to this one (after `npm run package`
# and `node tools/screenshots.mjs` there). Then update the version on
# instagram-no-login/index.html, commit and push.
set -eu
cd "$(dirname "$0")"
src="${1:-../instagram-no-login}"
dest=instagram-no-login
version=$(sed -n 's/.*"version": "\(.*\)".*/\1/p' "$src/package.json")
cp "$src/dist/instagram-no-login-$version-chrome.zip" "$dest/download/instagram-no-login-chrome.zip"
cp "$src/dist/instagram-no-login-$version-firefox.zip" "$dest/download/instagram-no-login-firefox.zip"
cp "$src/instagram-no-login.user.js" "$dest/download/instagram-no-login.user.js"
cp "$src/store/screenshots/"*.png "$dest/img/"
cp "$src/extension/icons/icon-32.png" "$src/extension/icons/icon-128.png" "$dest/img/"
echo "Copied version $version. $dest/index.html says: $(grep -o 'v[0-9][0-9.]*' "$dest/index.html" | head -1)"
