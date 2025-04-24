// scripts/app-window.js
const { remote } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.querySelector(".app-loader").classList.add("hidden");
  }, 500);
});
