const axios = require("axios");
const businessModels = require("../businessModels.json");

/**
 * @param {string} vehicleId
 * @param {string} targetBmId
 * @param {string} accessToken
 * @returns {Promise<Object>}
 */
async function redeployVehicle(vehicleId, targetBM, accessToken) {
  try {
    const targetBMId = businessModels[targetBM];
    const data = JSON.stringify({
      activeBusinessModelId: targetBMId,
    });

    const config = {
      method: "patch",
      maxBodyLength: Infinity,
      url: `https://api.us.autofleet.io/api/v1/vehicles/${vehicleId}`,
      headers: {
        include: "route[]",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: data,
    };

    const response = await axios.request(config);

    console.log("Vehicle redeployed successfully.");
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`Error: Received status code ${error.response.status}`);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("Error: No response received from server");
      console.error("Request details:", error.request);
    } else {
      console.error("Error:", error.message);
    }
    throw error;
  }
}

module.exports = {
  redeployVehicle,
};
