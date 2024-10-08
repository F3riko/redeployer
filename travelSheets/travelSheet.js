const axios = require("axios");
const { ipcRenderer } = require("electron");

async function getTravelSheet(token, prompt, logger) {
  const reservationNumber = await prompt(
    'Please enter the reservation number (or type "exit" to quit): '
  );

  if (reservationNumber.toLowerCase() === "exit") {
    await logger("Exiting the application.");
    return;
  }

  try {
    const findResponse = await axios.get(
      `https://api.us.autofleet.io/api/v1/travel-sheets/find?reservationNumber=${reservationNumber}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const actionIds = findResponse.data.actionIds;

    if (actionIds && actionIds.length > 0) {
      const actionId = actionIds[0];
      await logger("Action ID obtained successfully:", actionId);

      const travelSheetsResponse = await axios.get(
        `https://api.us.autofleet.io/api/v1/travel-sheets?reservationNumber=${reservationNumber}&actionId=${actionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        }
      );

      const onFileSaved = (event, message) => {
        logger(message);
        ipcRenderer.removeListener("file-saved", onFileSaved);
        ipcRenderer.removeListener("save-error", onSaveError);
      };

      const onSaveError = (event, errorMessage) => {
        logger("Failed to save file:", errorMessage);
        ipcRenderer.removeListener("file-saved", onFileSaved);
        ipcRenderer.removeListener("save-error", onSaveError);
      };

      ipcRenderer.once("file-saved", onFileSaved);
      ipcRenderer.once("save-error", onSaveError);

      ipcRenderer.send("save-file", {
        reservationNumber,
        data: travelSheetsResponse.data,
      });
    } else {
      logger(
        `No actionIds found in the response for reservation number: ${reservationNumber}`
      );
    }
  } catch (error) {
    logger(
      `An error occurred while processing reservation number ${reservationNumber}:`,
      error.response ? error.response.data : error.message
    );
  }
}

module.exports = { getTravelSheet };
