const form = document.getElementById("editForm");
const subscriptionIdField = document.getElementById("subscriptionId");
const nameField = document.getElementById("name");
const phoneField = document.getElementById("phone");
const startDateField = document.getElementById("startDate");
const daysField = document.getElementById("days");
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

let filePath;
ipcRenderer.invoke("get-db-path").then((resolvedPath) => {
  filePath = resolvedPath;
  loadSubscriptionData();
});

// Get subscription ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const subscriptionId = urlParams.get("id");

if (!subscriptionId) {
  window.location.href = "index.html";
}

// Load subscription data
function loadSubscriptionData() {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath);
      const data = JSON.parse(fileContent);

      const subscription = data.find((sub) => sub.id === subscriptionId);

      if (subscription) {
        subscriptionIdField.value = subscription.id;
        nameField.value = subscription.name;
        phoneField.value = subscription.phone;
        startDateField.value = subscription.startDate;
        daysField.value = subscription.days;
      } else {
        ipcRenderer.send("show-error", "الاشتراك غير موجود");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      }
    }
  } catch (err) {
    console.error("Error reading file:", err);
    ipcRenderer.send("show-error", "فشل في قراءة بيانات الاشتراك");
  }
}

// Update subscription data
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const updatedSubscription = {
    id: subscriptionIdField.value,
    name: nameField.value,
    phone: phoneField.value,
    startDate: startDateField.value,
    days: parseInt(daysField.value),
  };

  if (
    !updatedSubscription.name ||
    !updatedSubscription.phone ||
    !updatedSubscription.startDate ||
    !updatedSubscription.days
  ) {
    ipcRenderer.send("show-error", "يرجى ملء جميع الحقول");
    return;
  }

  try {
    let data = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath);
      data = JSON.parse(fileContent);

      const index = data.findIndex((sub) => sub.id === updatedSubscription.id);
      if (index !== -1) {
        data[index] = updatedSubscription;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        ipcRenderer.send("show-success", "تم تحديث الاشتراك بنجاح!");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      } else {
        ipcRenderer.send("show-error", "الاشتراك غير موجود");
      }
    }
  } catch (err) {
    console.error("Error updating subscription:", err);
    ipcRenderer.send("show-error", "فشل في تحديث الاشتراك");
  }
});

document.querySelector(".back-btn").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "index.html";
});

// Load subscription data when the page loads
window.addEventListener("DOMContentLoaded", loadSubscriptionData);

// Make edit function global
function editSubscription(id) {
  window.location.href = `edit.html?id=${id}`;
}

window.editSubscription = editSubscription;

document.addEventListener("DOMContentLoaded", function () {
  const editButton = document.querySelector(".modal-actions .edit-btn");
  if (editButton) {
    editButton.addEventListener("click", function () {
      editSubscription(currentId);
      closeModal();
    });
  }
});
