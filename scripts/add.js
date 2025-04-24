// --- add.js ---

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { ipcRenderer } = require("electron");

const form = document.getElementById("subscriptionForm");

let filePath;
ipcRenderer.invoke("get-db-path").then((resolvedPath) => {
  filePath = resolvedPath;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const startDate = document.getElementById("startDate").value;
  const days = parseInt(document.getElementById("days").value);

  if (!name || !phone || !startDate || !days) {
    ipcRenderer.send("show-error", "يرجى ملء جميع الحقول");
    return;
  }

  const subscription = {
    id: uuidv4(),
    name,
    phone,
    startDate,
    days,
  };

  try {
    let data = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath);
      data = JSON.parse(fileContent);
    }

    data.push(subscription);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    ipcRenderer.send("show-success", "تمت إضافة الاشتراك بنجاح!");
    form.reset();

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (err) {
    console.error("Error writing file:", err);
    ipcRenderer.send("show-error", "فشل في حفظ الاشتراك");
  }
});

document.querySelector(".back-btn").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "index.html";
});
