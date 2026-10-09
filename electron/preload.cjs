// Bridge for the desktop app: the page subscribes to logs opened from the system
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("inavDesktop", {
  onOpenFile(callback) {
    ipcRenderer.on("open-file", (_event, name, bytes) => callback(name, bytes));
    ipcRenderer.send("viewer-ready");
  },
});
