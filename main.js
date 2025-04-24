const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  shell,
  Tray,
} = require("electron");
const path = require("path");
const fs = require("fs");

app.disableHardwareAcceleration();

const appConfig = {
  name: "إدارة اشتراكات الجيم",
  width: 1000,
  height: 700,
  minWidth: 800,
  minHeight: 600,
  backgroundColor: "#edf1f7",
  icon: path.join(__dirname, "assets/icons/barbell.png"),
};

let tray = null;
let mainWindow;

const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "subscriptions.json");

ipcMain.handle("get-db-path", () => {
  return dbPath;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: appConfig.width,
    height: appConfig.height,
    minWidth: appConfig.minWidth,
    minHeight: appConfig.minHeight,
    backgroundColor: appConfig.backgroundColor,
    title: appConfig.name,
    icon: appConfig.icon,
    show: false,
    webPreferences: {
      nodeIntegration: true, // safer & faster
      contextIsolation: false,
      backgroundThrottling: false,
      devTools: false,
    },

    autoHideMenuBar: true, // hide menu bar
  });

  tray = new Tray(appConfig.icon);
  tray.setToolTip("shawky gym");

  Menu.setApplicationMenu(null);

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      (input.key.toLowerCase() === "i" && input.control && input.shift) ||
      input.key === "F12"
    ) {
      event.preventDefault();
    }
  });
}

function createBackup() {
  if (!fs.existsSync(dbPath)) {
    dialog.showMessageBox(mainWindow, {
      type: "error",
      title: "خطأ",
      message: "لا توجد بيانات للنسخ الاحتياطي",
      buttons: ["موافق"],
    });
    return;
  }

  dialog
    .showSaveDialog(mainWindow, {
      title: "حفظ النسخة الاحتياطية",
      defaultPath: path.join(
        app.getPath("documents"),
        "gym_subscriptions_backup.json"
      ),
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    })
    .then((result) => {
      if (!result.canceled && result.filePath) {
        fs.copyFile(dbPath, result.filePath, (err) => {
          if (err) {
            dialog.showMessageBox(mainWindow, {
              type: "error",
              title: "خطأ",
              message: "فشل إنشاء النسخة الاحتياطية",
              detail: err.message,
              buttons: ["موافق"],
            });
          } else {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "تم",
              message: "تم إنشاء النسخة الاحتياطية بنجاح",
              buttons: ["موافق"],
            });
          }
        });
      }
    });
}

function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    title: "حول التطبيق",
    message: appConfig.name,
    detail:
      "الإصدار 1.0.0\nتطبيق لإدارة اشتراكات الجيم\n© 2025 جميع الحقوق محفوظة",
    buttons: ["موافق"],
    icon: appConfig.icon,
  });
}

ipcMain.on("show-error", (event, message) => {
  dialog.showMessageBox(mainWindow, {
    type: "error",
    title: "خطأ",
    message: message,
    buttons: ["موافق"],
  });
});

ipcMain.on("show-success", (event, message) => {
  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "تم",
    message: message,
    buttons: ["موافق"],
  });
});

app.whenReady().then(() => {
  createWindow();

  const dbDir = path.join(userDataPath, "db");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
  }

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
