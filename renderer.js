class TokenError extends Error {
  constructor(message) {
    super(message);
    this.name = "TokenError";
  }
}

class VehicleError extends Error {
  constructor(message) {
    super(message);
    this.name = "VehicleError";
  }
}

class TravelSheetError extends Error {
  constructor(message) {
    super(message);
    this.name = "TravelSheetError";
  }
}

class ExitCommand extends Error {
  constructor(message) {
    super(message);
    this.name = "ExitCommand";
  }
}

function logMessage(message) {
  const log = document.getElementById("log");
  log.innerHTML += `${new Date().toTimeString().slice(0, 8)}: ${message}<br>`;
  log.scrollTop = log.scrollHeight;
}

async function promptWithExit(message) {
  const input = await showPrompt(message);
  const normalizedInput = input ? input.trim().toLowerCase() : "";
  if (normalizedInput === "exit") {
    throw new ExitCommand("User initiated exit.");
  }
  return input;
}

async function confirmWithExit(message) {
  const input = await showConfirm(message);
  const normalizedInput =
    typeof input === "string" ? input.trim().toLowerCase() : "";
  if (normalizedInput === "exit") {
    throw new ExitCommand("User initiated exit.");
  }
  return input;
}

function showPrompt(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("modal");
    const modalMessage = document.getElementById("modalMessage");
    const modalInput = document.getElementById("modalInput");
    const modalOk = document.getElementById("modalOk");
    const modalCancel = document.getElementById("modalCancel");
    const modalClose = document.getElementById("modalClose");

    modalMessage.textContent = message;
    modalInput.value = "";

    modal.style.display = "block";

    modalOk.onclick = function () {
      const value = modalInput.value.trim();
      modal.style.display = "none";
      resolve(value);
    };

    modalCancel.onclick = function () {
      modal.style.display = "none";
      resolve(null);
    };

    modalClose.onclick = function () {
      modal.style.display = "none";
      resolve("exit");
    };
  });
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const confirmModal = document.getElementById("confirmModal");
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");
    const confirmClose = document.getElementById("confirmClose");

    confirmMessage.textContent = message;

    confirmModal.style.display = "block";

    confirmYes.onclick = function () {
      confirmModal.style.display = "none";
      resolve(true);
    };

    confirmNo.onclick = function () {
      confirmModal.style.display = "none";
      resolve(false);
    };

    confirmClose.onclick = function () {
      confirmModal.style.display = "none";
      resolve("exit");
    };
  });
}

async function retrieveRefreshToken() {
  try {
    logMessage("Attempting to retrieve refresh token...");
    const refreshTokenValue = await window.api.refreshToken();
    if (!refreshTokenValue) {
      logMessage("No refresh token found.");
      return null;
    }
    logMessage("Refresh token retrieved successfully.");
    return refreshTokenValue;
  } catch (error) {
    logMessage(`Error retrieving refresh token: ${error.message}`);
    throw error;
  }
}

async function retrieveAccessToken(refreshToken) {
  logMessage("Attempting to retrieve access token...");
  const accessToken = await window.api.getAccessToken(refreshToken);
  if (!accessToken) {
    throw new TokenError("Failed to retrieve access token.");
  }
  logMessage("Access token retrieved successfully.");
  return accessToken;
}

async function addRefreshToken() {
  try {
    let refreshTokenValue = await window.api.refreshToken();
    if (refreshTokenValue) {
      logMessage(`Refresh Token already exists: ${refreshTokenValue}`);
      const overwrite = await confirmWithExit(
        "A refresh token already exists. Do you want to overwrite it? (yes/no)"
      );
      if (!overwrite) {
        logMessage("Operation cancelled by the user.");
        return;
      }
    }
  } catch (error) {
    logMessage("No existing refresh token found.");
  }

  try {
    const newRefreshToken = await promptWithExit(
      "Please enter the new REFRESH_TOKEN:"
    );
    if (!newRefreshToken) {
      logMessage("No refresh token entered. Operation cancelled.");
      return;
    }
    await window.api.saveRefreshToken(newRefreshToken);
    logMessage("REFRESH_TOKEN has been updated and saved.");
  } catch (error) {
    logMessage(`An unexpected error occurred: ${error.message}`);
    throw error;
  }
}

async function travelSheet() {
  try {
    const refreshToken = await retrieveRefreshToken();
    const accessToken = await retrieveAccessToken(refreshToken);

    let continueTravelSheet = true;

    while (continueTravelSheet) {
      try {
        const userInput = await promptWithExit(
          'Please enter the reservation number (or type "exit" to quit):'
        );
        if (!userInput) {
          logMessage("No reservation number entered. Operation cancelled.");
          continue;
        }

        if (userInput.toLowerCase() === "exit") {
          logMessage("Exiting the travel sheet retrieval process.");
          continueTravelSheet = false;
          continue;
        }

        logMessage(`Reservation number entered: ${userInput}`);
        logMessage("Attempting to retrieve travel sheet...");

        await window.api.getTravelSheet(
          accessToken,
          async () => userInput,
          logMessage
        );

        const continueInput = await confirmWithExit(
          "Do you want to retrieve another travel sheet? (yes/no)"
        );
        if (!continueInput) {
          logMessage("Exiting travel sheet retrieval loop.");
          continueTravelSheet = false;
        }
      } catch (error) {
        if (error instanceof ExitCommand) {
          logMessage("User requested exit. Exiting process.");
          continueTravelSheet = false;
        } else {
          logMessage(
            `An error occurred while processing travel sheet retrieval: ${
              error.message || error
            }`
          );
          const retryInput = await confirmWithExit(
            "An error occurred. Do you want to try again? (yes/no)"
          );
          if (!retryInput) {
            logMessage("Exiting travel sheet retrieval loop.");
            continueTravelSheet = false;
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof TokenError) {
      logMessage(`Authentication Error: ${error.message}`);
      logMessage(
        "Please use 'Add New Refresh Token' to provide a valid refresh token."
      );
    } else if (error instanceof ExitCommand) {
      logMessage("User requested exit. Exiting process.");
    } else {
      console.error(`An unexpected error occurred: ${error.stack}`);
      logMessage("An unexpected error occurred. Please try again later.");
    }
  }
}

async function redeployVehicle() {
  try {
    const refreshToken = await retrieveRefreshToken();
    const accessToken = await retrieveAccessToken(refreshToken);

    let continueRedeploy = true;
    while (continueRedeploy) {
      try {
        const vehicleVIN = await getVehicleVIN();
        const vehicleData = await fetchVehicleData(vehicleVIN, accessToken);

        const currentBM =
          window.api.businessModelsReverse[vehicleData.activeBusinessModelId];
        logMessage(`Vehicle ${vehicleVIN} is currently in ${currentBM}.`);

        await validateAndRedeployVehicle(
          vehicleData,
          vehicleVIN,
          currentBM,
          accessToken
        );

        const continueInput = await confirmWithExit(
          "Do you want to continue with another vehicle? (yes/no)"
        );
        if (!continueInput) {
          logMessage("Exiting vehicle redeployment loop.");
          continueRedeploy = false;
        }
      } catch (error) {
        if (error instanceof VehicleError) {
          logMessage(`Vehicle Error: ${error.message}`);
          const retryInput = await confirmWithExit(
            "An error occurred. Do you want to try again? (yes/no)"
          );
          if (!retryInput) {
            logMessage("Exiting vehicle redeployment loop.");
            continueRedeploy = false;
          }
        } else if (error instanceof ExitCommand) {
          logMessage("User requested exit. Exiting process.");
          continueRedeploy = false;
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    if (error instanceof TokenError) {
      logMessage(`Authentication Error: ${error.message}`);
      logMessage(
        "Please use 'Add New Refresh Token' to provide a valid refresh token."
      );
    } else if (error instanceof ExitCommand) {
      logMessage("User requested exit. Exiting process.");
    } else {
      console.error(`An unexpected error occurred: ${error.stack}`);
      logMessage("An unexpected error occurred. Please try again later.");
    }
  }
}

async function getVehicleVIN() {
  const vehicleVIN = await promptWithExit("Enter vehicle's VIN:");
  if (!vehicleVIN) {
    throw new VehicleError("No vehicle VIN provided.");
  }
  logMessage(`Vehicle VIN entered: ${vehicleVIN}`);
  return vehicleVIN;
}

async function fetchVehicleData(vehicleVIN, accessToken) {
  logMessage("Fetching vehicle data from the server...");
  const response = await window.api.getVehicleData(vehicleVIN, accessToken);
  if (!response.rows || response.rows.length === 0) {
    throw new VehicleError("No vehicle data found for the given VIN.");
  }
  logMessage("Vehicle data received successfully.");
  return response.rows[0];
}

async function validateAndRedeployVehicle(
  vehicleData,
  vehicleVIN,
  currentBM,
  accessToken
) {
  const targetBM = await promptWithExit("Enter target Business Model name:");
  if (!targetBM) {
    throw new VehicleError("No target Business Model name was entered.");
  }
  logMessage(`Target Business Model name entered: ${targetBM}`);
  logMessage("Validating vehicle for redeployment...");
  window.api.validateVehicleForRedeployment(vehicleData, targetBM, currentBM);
  logMessage("Vehicle is valid for redeployment.");
  logMessage("Attempting to redeploy vehicle...");

  const redeployResponse = await window.api.redeployVehicle(
    vehicleData.id,
    targetBM,
    accessToken
  );

  if (!redeployResponse) {
    throw new VehicleError("Vehicle redeployment failed.");
  }
  const redeployedBM =
    window.api.businessModelsReverse[redeployResponse.activeBusinessModelId];

  logMessage(
    `Vehicle redeployed successfully: ${vehicleVIN} is now in ${redeployedBM}.`
  );
}

window.addRefreshToken = addRefreshToken;
window.redeployVehicle = redeployVehicle;
window.travelSheet = travelSheet;
