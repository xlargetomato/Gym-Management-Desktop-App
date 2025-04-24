const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getDbPath: () => ipcRenderer.invoke("get-db-path"),
  readSubscriptions: () => ipcRenderer.invoke("read-subscriptions"),
  saveSubscriptions: (data) => ipcRenderer.invoke("save-subscriptions", data),
  showError: (message) => ipcRenderer.send("show-error", message),
  showSuccess: (message) => ipcRenderer.send("show-success", message),
});
