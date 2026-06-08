const { app, BrowserWindow, Menu, shell } = require("electron");

const APP_URL = "https://almond-week-planner.vercel.app/app";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 390,
    minHeight: 680,
    backgroundColor: "#fff8ef",
    title: "杏花周计划",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} AlmondWeekPlannerWindows/0.1.0`);
  win.loadURL(APP_URL);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("https://almond-week-planner.vercel.app/")) {
      return;
    }
    event.preventDefault();
    shell.openExternal(url);
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
