// electron-builder afterSign hook.
//
// We don't have an Apple Developer ID, so electron-builder skips signing
// entirely. On Apple Silicon, the kernel refuses to run *any* unsigned code,
// and Chromium's helper processes need JIT entitlements to work at all - so
// without this hook, the packaged app launches and is silently killed by the
// OS within about a second. This adhoc-signs everything (executable, no real
// identity required) with the entitlements Electron needs, bottom-up so
// nested dylibs aren't left with a stale/invalid signature by a shallower
// `codesign --deep` pass.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function sign(targetPath, entitlementsPath) {
  const args = ["--force", "--sign", "-", "--entitlements", entitlementsPath, targetPath];
  execFileSync("codesign", args, { stdio: "inherit" });
}

function isMachO(filePath) {
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(4);
    if (fs.readSync(fd, buf, 0, 4, 0) < 4) return false;
    const magic = buf.readUInt32BE(0);
    // MH_MAGIC, MH_MAGIC_64, MH_CIGAM, MH_CIGAM_64, FAT_MAGIC, FAT_CIGAM
    return [0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcafebabe, 0xbebafeca].includes(magic);
  } catch {
    return false;
  } finally {
    fs.closeSync(fd);
  }
}

// Post-order (deepest files first) so nested dylibs/executables get a fresh,
// complete signature before the bundle/framework that embeds them is sealed.
// E.g. "Electron Framework.framework/Versions/A/Electron Framework" is itself
// a bundle-adjacent binary that codesign seals against its sibling
// "Helpers/chrome_crashpad_handler" - so the helper must be signed first.
function findNestedBinaries(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const ownFiles = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      findNestedBinaries(full, results);
    } else if (isMachO(full)) {
      ownFiles.push(full);
    }
  }
  results.push(...ownFiles);
  return results;
}

module.exports = async function afterSign(context) {
  if (context.electronPlatformName !== "darwin") return;

  const entitlementsPath = path.join(__dirname, "entitlements.mac.plist");
  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);
  const frameworksDir = path.join(appPath, "Contents", "Frameworks");

  for (const dylib of findNestedBinaries(frameworksDir)) {
    sign(dylib, entitlementsPath);
  }

  if (fs.existsSync(frameworksDir)) {
    for (const entry of fs.readdirSync(frameworksDir)) {
      if (entry.endsWith(".framework") || entry.endsWith(".app")) {
        sign(path.join(frameworksDir, entry), entitlementsPath);
      }
    }
  }

  sign(appPath, entitlementsPath);
};
