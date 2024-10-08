const axios = require("axios");

/**
 * @param {string} vin - The vehicle's VIN (license number).
 * @param {string} token - The authorization token (access token).
 * @returns {Promise<Object>} - Resolves with the vehicle data or rejects with an error.
 */
async function getVehicleData(vin, token) {
  try {
    const data = JSON.stringify({
      page: 1,
      perPage: 1,
      include: [],
      order: [],
      query: {
        licenseNumber: vin,
      },
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.us.autofleet.io/api/v1/vehicles/query",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: data,
    };

    const response = await axios.request(config);

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
  getVehicleData,
};
