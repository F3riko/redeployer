const { contextBridge, ipcRenderer } = require("electron");

let getAccessToken;
let getVehicleData;
let validateVehicleForRedeployment;
let redeployVehicle;
let businessModelsReverse;
let getTravelSheet;

try {
  getAccessToken = require("./tokenLogic/getAccessToken").getAccessToken;
  getVehicleData = require("./vehicleRedeployment/getVehicle").getVehicleData;
  validateVehicleForRedeployment =
    require("./vehicleRedeployment/checkVehicle").validateVehicleForRedeployment;
  redeployVehicle =
    require("./vehicleRedeployment/changeVehicleBM").redeployVehicle;
  businessModelsReverse = require("./businessModelsReverses.json");
  getTravelSheet = require("./travelSheets/travelSheet").getTravelSheet;

  contextBridge.exposeInMainWorld("api", {
    saveRefreshToken: (newRefreshToken) =>
      ipcRenderer.invoke("save-refresh-token", newRefreshToken),
    refreshToken: () => ipcRenderer.invoke("get-refresh-token"),
    getAccessToken,
    getVehicleData,
    validateVehicleForRedeployment,
    redeployVehicle,
    businessModelsReverse,
    getTravelSheet,

    saveFile: (reservationNumber, data) => {
      ipcRenderer.send("save-file", { reservationNumber, data });
    },
    onFileSaved: (callback) => {
      ipcRenderer.on("file-saved", (_, message) => callback(message));
    },
    onSaveError: (callback) => {
      ipcRenderer.on("save-error", (_, errorMessage) => callback(errorMessage));
    },
  });
} catch (error) {
  console.error("Error in preload.js:", error);
}
