const fs = require("fs");
const path = require("path");
const { app, remote } = require("electron");

// Get the app object (works in both main and renderer process)
const electronApp = app || (remote && remote.app);

if (!electronApp) {
  console.error("Could not access Electron app object");
}

// Get the user data path
const userDataPath = electronApp.getPath("userData");
const dbPath = path.join(userDataPath, "subscriptions.json");

// Ensure the file exists
function ensureFileExists() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]));
  }
}

// Get all subscriptions
function getSubscriptions() {
  ensureFileExists();
  try {
    const fileContent = fs.readFileSync(dbPath);
    return JSON.parse(fileContent);
  } catch (err) {
    console.error("Error reading subscriptions:", err);
    return [];
  }
}

// Save all subscriptions
function saveSubscriptions(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Error saving subscriptions:", err);
    return false;
  }
}

// Get subscription by ID
function getSubscriptionById(id) {
  const data = getSubscriptions();
  return data.find((sub) => sub.id === id);
}

// Add new subscription
function addSubscription(subscription) {
  const data = getSubscriptions();
  data.push(subscription);
  return saveSubscriptions(data);
}

// Update existing subscription
function updateSubscription(updatedSub) {
  const data = getSubscriptions();
  const index = data.findIndex((sub) => sub.id === updatedSub.id);

  if (index !== -1) {
    data[index] = updatedSub;
    return saveSubscriptions(data);
  }
  return false;
}

// Delete subscription
function deleteSubscription(id) {
  const data = getSubscriptions();
  const filteredData = data.filter((sub) => sub.id !== id);
  return saveSubscriptions(filteredData);
}

// Create backup
function createBackup(backupPath) {
  ensureFileExists();
  try {
    fs.copyFileSync(dbPath, backupPath);
    return true;
  } catch (err) {
    console.error("Error creating backup:", err);
    return false;
  }
}

// Get the path for exports/debugging
function getDbPath() {
  return dbPath;
}

module.exports = {
  getSubscriptions,
  getSubscriptionById,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  createBackup,
  getDbPath,
};
