/**
 * closeWindow.js
 * ============================================
 * Handle logout & close aplikasi dengan Tauri
 * ============================================
 */

// ✅ Import Tauri API di awal (bukan dynamic import)
import { appWindow } from '@tauri-apps/api/window';

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

// ==========================
// LOGOUT HANDLER
// ==========================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  if (confirm("📝 Apakah kamu yakin ingin keluar dari aplikasi?")) {
    try {
      // ✅ Langsung pakai appWindow yang sudah di-import
      await appWindow.close();

    } catch (err) {
      console.error('Error saat close aplikasi:', err);
      alert('Gagal menutup aplikasi. Silakan close manual.');
    }
  }
});
