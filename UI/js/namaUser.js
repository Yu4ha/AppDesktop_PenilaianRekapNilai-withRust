window.addEventListener("DOMContentLoaded", async () => {
  const guruHeader = document.getElementById("guruHeader");
  const modal = document.getElementById("modal");
  const guruInput = document.getElementById("guruInput");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");

  // Kalau elemen utama (guruHeader) tidak ada, hentikan script
  if (!guruHeader) return;

  // Ambil nama guru
  const name = await window.electronAPI.getUserName();
  guruHeader.textContent = `Selamat datang, ${name} 👋`;

  // Klik nama guru
  guruHeader.addEventListener("click", () => {
    // hanya jalankan kalau modal dan input tersedia
    if (modal && guruInput) {
      guruInput.value = guruHeader.textContent.replace("Selamat datang, ", "").replace(" 👋", "");
      modal.style.display = "flex";
    }
  });

  // Tombol batal
  if (cancelBtn && modal) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  // Tombol simpan
  if (saveBtn && guruInput && modal) {
    saveBtn.addEventListener("click", async () => {
      const newName = guruInput.value.trim();
      if (newName) {
        await window.electronAPI.setUserName(newName);
        guruHeader.textContent = `Selamat datang, ${newName} 👋`;
        modal.style.display = "none";
      }
    });
  }
});
