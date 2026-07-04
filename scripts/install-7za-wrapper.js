// Builds and installs the 7za.exe wrapper described in README.md's
// "Windows note". Run this once after a fresh `npm install` on Windows,
// before `npm run dist:win`, if node_modules/7zip-bin/win/x64/7za.exe is
// ever the stock binary (fresh installs, or after 7zip-bin gets updated).
// Requires Go (https://go.dev) to build the wrapper.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BIN_DIR = path.join(__dirname, "..", "node_modules", "7zip-bin", "win", "x64");
const REAL = path.join(BIN_DIR, "7za-real.exe");
const WRAPPER = path.join(BIN_DIR, "7za.exe");
const SOURCE = path.join(__dirname, "7za-wrapper", "main.go");

if (!fs.existsSync(BIN_DIR)) {
  console.error("7zip-bin not found - run npm install first.");
  process.exit(1);
}

if (!fs.existsSync(REAL)) {
  fs.copyFileSync(WRAPPER, REAL);
  console.log("Backed up real 7za.exe to 7za-real.exe");
}

const built = path.join(BIN_DIR, "7za-wrapper-build.exe");
execFileSync("go", ["build", "-o", built, SOURCE], { stdio: "inherit" });
fs.copyFileSync(built, WRAPPER);
fs.unlinkSync(built);
console.log("Installed 7za.exe wrapper (excludes darwin/ during extraction).");
