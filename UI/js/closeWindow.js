// UI/js/index.js

// Import Tauri API untuk menutup aplikasi
import { exit } from '@tauri-apps/api/process';

// Import helper jika Anda menggunakannya di bagian lain index.js
// import { invokeCommand } from './tauriApiHelper.js'; 

const currentPage = window.location.pathname.split("/").pop();
const navLinks = document.querySelectorAll(".nav-item");

navLinks.forEach((link) => {
  const href = link.getAttribute("href");

  if (currentPage === href || (currentPage === "" && href === "index.html")) {
    link.classList.add("active");
  }

  link.addEventListener("click", (e) => {
    document.querySelector(".nav-item.active")?.classList.remove("active");
    e.currentTarget.classList.add("active");
  });
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  if (confirm("📝 Apakah kamu yakin ingin keluar dari aplikasi?")) {
    // --- PERUBAHAN UTAMA DI SINI ---
    // Menggunakan Tauri API untuk keluar dari aplikasi secara paksa (exit(0))
    await exit(0); 
    // ----------------------------------
  }
});
