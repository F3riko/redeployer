const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// We need to use dynamic import to load the ES module `electron-store`
let Store; // Declare the store variable
(async () => {
  const module = await import("electron-store");
  Store = module.default; // Access the default export of the module
})();

// const Store = require("electron-store");
// const store = new Store({
//   cwd: app.getPath("userData"),
// });

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", function () {
    mainWindow.destroy(); // Properly clean up window resources before quitting
    app.quit();
  });

  // IPC listener to handle file saving
  ipcMain.on("save-file", (event, { reservationNumber, data }) => {
    const downloadsPath = path.join(os.homedir(), "Downloads");
    const filePath = path.join(
      downloadsPath,
      `travel_sheet_${reservationNumber}.pdf`
    );

    try {
      // Ensure the Downloads directory exists
      if (!fs.existsSync(downloadsPath)) {
        fs.mkdirSync(downloadsPath, { recursive: true });
      }

      // Convert the data to Buffer in case it's not already
      const fileBuffer = Buffer.from(data);

      // Write the file
      fs.writeFileSync(filePath, fileBuffer);
      event.sender.send("file-saved", `File saved successfully to ${filePath}`);
    } catch (error) {
      // Detailed error handling
      console.error("Error saving file:", error); // Output more details to the console for debugging
      event.sender.send(
        "save-error",
        `Failed to save file: ${error.message || error}`
      );
    }
  });
}

// Handle refresh token saving using electron-store
ipcMain.handle("save-refresh-token", async (event, newRefreshToken) => {
  if (!Store) {
    const module = await import("electron-store");
    Store = module.default;
  }
  const store = new Store();
  store.set("refreshToken", newRefreshToken); // Save refresh token using electron-store
  console.log("REFRESH_TOKEN has been updated and saved to store");
  return "Refresh token saved successfully.";
});

// Handle retrieving refresh token using electron-store
ipcMain.handle("get-refresh-token", async () => {
  if (!Store) {
    const module = await import("electron-store");
    Store = module.default;
  }
  const store = new Store();
  const refreshToken = store.get("refreshToken"); // Retrieve refresh token from electron-store
  if (refreshToken) {
    return refreshToken;
  } else {
    throw new Error("Refresh token not found");
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
