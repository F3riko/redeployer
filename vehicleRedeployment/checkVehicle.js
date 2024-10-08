const businessModels = require("../businessModels.json");

/**
 * @param {Object} vehicle
 * @param {string} targetBMId
 * @param {string} currentBM
 * @returns {boolean}
 * @throws {Error}
 */
function validateVehicleForRedeployment(vehicle, targetBM, currentBM) {
  if (!vehicle || typeof vehicle !== "object") {
    throw new Error("Invalid vehicle object provided.");
  }

  if (!businessModels[targetBM]) {
    throw new Error("Target Business Model is incorrect");
  }

  if (vehicle.state === "offline") {
    throw new Error("Vehicle state is offline. Cannot redeploy.");
  }

  if (targetBM === currentBM) {
    throw new Error("Vehicle is already in the target Business Model.");
  }

  return true;
}

module.exports = {
  validateVehicleForRedeployment,
};
