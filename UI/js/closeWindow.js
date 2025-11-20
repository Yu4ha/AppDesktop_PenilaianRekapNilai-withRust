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

    document.getElementById("logoutBtn").addEventListener("click", () => {
      if (confirm("📝 Apakah kamu yakin ingin keluar dari aplikasi?")) {
        window.electronAPI.logout(); 
      }
    });
  