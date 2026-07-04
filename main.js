// Electron main process. The app's pages reference assets with root-relative
// paths (e.g. "/assets/css/base/style.css"), which only resolve correctly
// when served over http(s) - loading index.html directly via file:// would
// resolve those to the filesystem root and 404. So instead of file://, this
// spins up a tiny local static file server (same idea as the
// `python -m http.server` used during development) and points the window at
// http://127.0.0.1:<port>/, with zero changes needed to the existing app.
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

const ROOT_DIR = __dirname;

function startLocalServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";

      const filePath = path.normalize(path.join(ROOT_DIR, urlPath));
      if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        });
        res.end(data);
      });
    });

    server.on("error", reject);
    // Port 0 = let the OS pick a free local port, so packaged copies never
    // collide with anything already running on the user's machine.
    server.listen(0, "127.0.0.1", () => {
      resolve(server.address().port);
    });
  });
}

let mainWindow;

async function createWindow() {
  const port = await startLocalServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 480,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(ROOT_DIR, "build", "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}/index.html`);

  // The app only ever needs its own local pages; anything that would open a
  // new window (e.g. an external link) opens in the user's real browser
  // instead of a second Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
