const axios = require("axios");

/**
 * @param {string} refreshToken
 * @returns {Promise<string>}
 */
async function getAccessToken(refreshToken) {
  try {
    const refreshResponse = await axios.post(
      "https://api.us.autofleet.io/api/v1/login/refresh",
      { refreshToken: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );

    if (refreshResponse.data && refreshResponse.data.token) {
      const accessToken = refreshResponse.data.token;
      console.log("Access Token obtained successfully.");
      return accessToken;
    } else {
      throw new Error("Unexpected response format: access token not found");
    }
  } catch (error) {
    if (error.response) {
      console.error(`Error: Received status code ${error.response.status}`);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("Error: No response received from server");
      console.error("Request details:", error.request);
    } else {
      console.error("Error: ", error.message);
    }
    throw error;
  }
}

module.exports = { getAccessToken };
