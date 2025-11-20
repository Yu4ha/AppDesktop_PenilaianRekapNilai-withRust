// UI/js/namaUser.js (Frontend Murni - Tanpa Rust API)

window.addEventListener("DOMContentLoaded", async () => {
  const guruHeader = document.getElementById("guruHeader");
  const modal = document.getElementById("modal");
  const guruInput = document.getElementById("guruInput");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");

  if (!guruHeader) return;

  // --- Menggunakan localStorage untuk menyimpan nama sementara ---
  // Default nama jika belum ada
  let userName = localStorage.getItem('app_guru_name') || 'User'; 
  guruHeader.textContent = `Selamat datang, ${userName} 👋`;
  // -----------------------------------------------------------------

  guruHeader.addEventListener("click", () => {
    if (modal && guruInput) {
      guruInput.value = guruHeader.textContent.replace("Selamat datang, ", "").replace(" 👋", "");
      modal.style.display = "flex";
    }
  });

  if (cancelBtn && modal) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (saveBtn && guruInput && modal) {
    saveBtn.addEventListener("click", async () => {
      const newName = guruInput.value.trim();
      if (newName) {
        // --- Simpan nama baru ke localStorage ---
        localStorage.setItem('app_guru_name', newName);
        userName = newName;
        guruHeader.textContent = `Selamat datang, ${userName} 👋`;
        modal.style.display = "none";
        // ------------------------------------------
      }
    });
  }
});
