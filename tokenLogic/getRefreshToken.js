const Store = require("electron-store");
const store = new Store();

/**
 * @returns {Promise<string>}
 */
async function refreshToken() {
  const tokenFromStore = store.get("refreshToken");

  if (tokenFromStore) {
    return tokenFromStore;
  } else {
    throw new Error("Refresh token not found in the store.");
  }
}

/**
 * @param {string} newRefreshToken
 */
function saveRefreshToken(newRefreshToken) {
  store.set("refreshToken", newRefreshToken);
  console.log("Refresh token has been updated and saved.");
}

module.exports = {
  refreshToken,
  saveRefreshToken,
};
