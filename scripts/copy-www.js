// Assembles the www/ folder Capacitor bundles into the native mobile apps.
// The app itself is a static site (index.html + assets/ + views/ + dist/)
// with no bundler-driven output directory, so this just mirrors the same
// file set electron-builder's "files" list already ships for desktop.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WWW = path.join(ROOT, "www");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

copyRecursive(path.join(ROOT, "index.html"), path.join(WWW, "index.html"));
copyRecursive(path.join(ROOT, "assets"), path.join(WWW, "assets"));
copyRecursive(path.join(ROOT, "views"), path.join(WWW, "views"));
copyRecursive(path.join(ROOT, "dist"), path.join(WWW, "dist"));

console.log("Copied web assets into www/");
