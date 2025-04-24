const fs = require("fs");
const path = require("path");

const tableBody = document.getElementById("subscriptionsTable");
const nameFilter = document.getElementById("nameFilter");
const statusFilter = document.getElementById("statusFilter");
const phoneFilter = document.getElementById("phoneFilter");

const { ipcRenderer } = require("electron");

let filePath;

let currentId = null;

function getSubscriptionStatus(startDate, days) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + days);

  const totalDuration = end - start;
  const remaining = end - now;

  if (remaining <= 0) return "expired";
  if (remaining < totalDuration / 2) return "near-expiry";
  return "valid";
}

function getStatusText(statusKey) {
  switch (statusKey) {
    case "expired":
      return "انتهى";
    case "near-expiry":
      return "اقترب من الانتهاء";
    case "valid":
      return "صالح";
    default:
      return "";
  }
}

function renderTable(data) {
  const nameVal = nameFilter.value.toLowerCase();
  const statusVal = statusFilter.value;
  const phoneVal = phoneFilter.value.toLowerCase();
  console.log("📊 Rendering table with data:", data);

  tableBody.innerHTML = "";

  data.forEach((sub) => {
    const status = getSubscriptionStatus(sub.startDate, sub.days);
    const nameMatch = sub.name.toLowerCase().includes(nameVal);
    const statusMatch = !statusVal || status === statusVal;
    const phoneMatch = sub.phone.toLowerCase().includes(phoneVal);
    const statusText = getStatusText(status);

    if (nameMatch && phoneMatch && statusMatch) {
      const row = document.createElement("tr");
      row.innerHTML = `
  <td>${sub.name}</td>
  <td>${sub.phone}</td>
  <td><span class="status ${status}">${statusText}</span></td>
  <td>
    <button onclick="showDetails('${sub.id}')">التفاصيل</button>
    <button class="delete" onclick="deleteSub('${sub.id}')">حذف</button>
  </td>
`;
      tableBody.appendChild(row);
    }
  });
}

function loadData() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  console.log("📂 Raw file content:", fileContent); // 👈 Add this

  const data = JSON.parse(fileContent);
  console.log("📦 Parsed data:", data); // 👈 Add this
  console.log("📂 Raw file content:", fileContent.toString());
  console.log("📦 Parsed data:", data);

  renderTable(data);
  checkExpiringSoon(data);
}

ipcRenderer.invoke("get-db-path").then((pathFromMain) => {
  filePath = pathFromMain;
  console.log("✅ File path received:", filePath); // 👈 Add this

  loadData(); // move loadData call here after path is ready
});

function deleteSub(id) {
  let data = JSON.parse(fs.readFileSync(filePath));
  data = data.filter((sub) => sub.id !== id);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  loadData();
}

function showDetails(id) {
  const data = JSON.parse(fs.readFileSync(filePath));
  const user = data.find((sub) => sub.id === id);
  if (!user) return;

  currentId = user.id;
  const status = getSubscriptionStatus(user.startDate, user.days);

  const start = new Date(user.startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + user.days);

  const now = new Date();
  const remainingDays = Math.max(
    0,
    Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  );

  document.getElementById("detailName").textContent = user.name;
  document.getElementById("detailPhone").textContent = user.phone;
  document.getElementById("detailStart").textContent = user.startDate;
  document.getElementById("detailDays").textContent = user.days;
  document.getElementById("detailEnd").textContent = end
    .toISOString()
    .split("T")[0];
  document.getElementById("detailRemaining").textContent = remainingDays;

  const statusSpan = document.getElementById("detailStatus");
  statusSpan.textContent = getStatusText(status);
  statusSpan.className = `status ${status}`;

  document.getElementById("detailsModal").style.display = "flex";
}

function confirmDelete() {
  deleteSub(currentId);
  closeModal();
}

function closeModal() {
  document.getElementById("detailsModal").style.display = "none";
}

function checkExpiringSoon(data) {
  const expiring = data.filter(
    (sub) => getSubscriptionStatus(sub.startDate, sub.days) === "near-expiry"
  );
}

function backupData() {
  ipcRenderer.invoke("get-db-path").then((mainPath) => {
    const dir = path.dirname(mainPath);
    const backupPath = path.join(dir, "subscriptions_backup.json");

    try {
      fs.copyFileSync(mainPath, backupPath);
      alert("✅ Backup created successfully.");
    } catch (err) {
      console.error("❌ Backup failed:", err);
      alert("❌ Failed to create backup.");
    }
  });
}

function editSubscription(id) {
  window.location.href = `edit.html?id=${id}`;
}

window.editSubscription = editSubscription;
window.showDetails = showDetails;
window.deleteSub = deleteSub;

window.addEventListener("DOMContentLoaded", () => {
  nameFilter.addEventListener("input", loadData);
  statusFilter.addEventListener("change", loadData);
  phoneFilter.addEventListener("input", loadData);

  document
    .querySelector(".modal .delete")
    .addEventListener("click", confirmDelete);
  document.querySelector(".close-btn").addEventListener("click", closeModal);
  document.querySelector(".backup").addEventListener("click", backupData);
  document
    .querySelector(".modal-actions .edit-btn")
    .addEventListener("click", function () {
      editSubscription(currentId);
      closeModal();
    });
});
