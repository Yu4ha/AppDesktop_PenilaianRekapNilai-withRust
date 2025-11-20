// ==========================
// STATE & FILTER
// ==========================
let currentFilter = {
  kelas: null,        // null = semua kelas
  semester: 1,        // default semester 1
  tahun_ajaran: null  // null = tahun ajaran aktif
};

// Helper: Extract tingkat dari kelas TEXT (4A -> 4, 5B -> 5)
function getTingkatFromKelas(kelas) {
  if (!kelas) return null;
  return parseInt(String(kelas).charAt(0));
}

// ==========================
// INIT & LOAD DATA
// ==========================
function initDashboard() {
  if (!window.electronAPI) {
    console.error('❌ electronAPI belum tersedia, retry in 100ms...');
    setTimeout(initDashboard, 100);
    return;
  }

  console.log('✅ electronAPI ready, initializing dashboard...');
  
  // Init modal listeners dulu
  initModalListeners();
  
  (async () => {
    try {
      await initFilterControls();
      await loadDashboardData();
      showPanduanPenggunaNotification();
      setTimeout(() => {showEditNamaGuruNotification();}, 3000);
      initIPCListeners();
    } catch (err) {
      console.error('Gagal inisialisasi dashboard:', err);
      showNotification('error', `Gagal inisialisasi: ${err.message}`);
    }
  })();
}

// Start initialization when bridge is ready
if (window.electronAPI) {
  initDashboard();
} else {
  window.addEventListener('electronAPIReady', initDashboard);
  // Fallback jika event tidak fire
  setTimeout(() => {
    if (!window.electronAPI) {
      console.error('❌ electronAPI timeout, forcing init...');
      initDashboard();
    }
  }, 2000);
}

/* ============================
   🆕 Nama Guru Edit Notification
   ============================ */

/**
 * Tampilkan notifikasi untuk edit nama guru
 * Muncul setiap kali halaman di-load, maksimal 2x per hari
 */
function showEditNamaGuruNotification() {
  // Ambil data dari localStorage
  const data = localStorage.getItem('editNamaGuruNotificationData');
  const today = new Date().toDateString();
  
  let notificationData = {
    date: today,
    count: 0
  };

  // Parse data yang ada
  if (data) {
    try {
      notificationData = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing notification data:', e);
    }
  }

  // Reset counter jika hari berbeda
  if (notificationData.date !== today) {
    notificationData = {
      date: today,
      count: 0
    };
  }

  // Cek apakah sudah melebihi batas harian (2x per hari)
  if (notificationData.count >= 2) {
    return; // Sudah muncul 2x hari ini
  }

  // Buat notification element
  const notification = document.createElement('div');
  notification.className = 'guru-edit-notification';
  notification.innerHTML = `
    <div class="guru-notification-arrow"></div>
    <div class="guru-notification-content">
      <div class="guru-notification-header">
        <h4 class="guru-notification-title">
          ✏️ Edit Nama Guru
        </h4>
        <button class="guru-notification-close" id="closeGuruNotif">✕</button>
      </div>
      <div class="guru-notification-body">
        <strong>Klik pada header di atas</strong> untuk mengubah nama guru yang ditampilkan di dashboard.
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Increment counter dan simpan
  notificationData.count++;
  localStorage.setItem('editNamaGuruNotificationData', JSON.stringify(notificationData));

  // Event listener untuk tombol close
  document.getElementById('closeGuruNotif').addEventListener('click', () => {
    closeNotification();
  });

  // Auto close setelah 12 detik
  setTimeout(() => {
    if (document.body.contains(notification)) {
      closeNotification();
    }
  }, 12000);

  // Fungsi untuk menutup notifikasi
  function closeNotification() {
    notification.style.animation = 'fadeOutUp 0.4s ease-out';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 400);
  }
}

/* ============================
   🆕 Nama Guru Edit Modal
   ============================ */

   /* ============================
   🆕 Nama Guru Edit Modal Functions
   ============================ */

function openGuruModal() {
  const modal = document.getElementById('modal');
  const guruInput = document.getElementById('guruInput');
  
  if (modal && guruInput) {
    // Ambil nama saat ini
    const currentName = localStorage.getItem('namaGuru') || 'Guru';
    guruInput.value = currentName;
    
    // Show modal
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Focus input
    setTimeout(() => guruInput.focus(), 100);
  }
}

function closeGuruModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
}

function showAlert(message) {
  showNotification('info', message);
}

// Event listeners untuk modal - WRAP DENGAN SAFETY CHECK
function initModalListeners() {
  const guruHeader = document.getElementById('guruHeader');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  const guruInput = document.getElementById('guruInput');
  const modal = document.getElementById('modal');
  
  if (guruHeader) {
    guruHeader.addEventListener('click', openGuruModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeGuruModal);
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const namaGuru = guruInput?.value.trim();
      
      if (!namaGuru) {
        alert('⚠️ Nama guru tidak boleh kosong!');
        guruInput?.focus();
        return;
      }
      
      try {
        localStorage.setItem('namaGuru', namaGuru);
        
        if (guruHeader) {
          guruHeader.textContent = `Selamat datang, ${namaGuru} 👋`;
        }
        
        closeGuruModal();
        showAlert(`✅ Nama guru berhasil diubah menjadi: ${namaGuru}`);
        
      } catch (error) {
        console.error('Error saving nama guru:', error);
        showAlert('❌ Gagal menyimpan nama guru');
      }
    });
  }

  // Close modal saat klik di luar
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'modal') {
        closeGuruModal();
      }
    });
  }

  // Support Enter key
  if (guruInput) {
    guruInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveBtn?.click();
      }
    });
  }
}

// Close modal dengan ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal');
    if (modal?.classList.contains('show')) {
      closeGuruModal();
    }
  }
});

// Load nama guru saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  const savedNamaGuru = localStorage.getItem('namaGuru');
  const guruHeader = document.getElementById('guruHeader');
  if (savedNamaGuru && guruHeader) {
    guruHeader.textContent = `Selamat datang, ${savedNamaGuru} 👋`;
  }
  
  initModalListeners();
});

/* ============================
   🆕 Panduan Pengguna Notification
   ============================ */

/**
 * Tampilkan notifikasi panduan pengguna
 * Muncul setiap kali halaman di-load, maksimal 3x per hari
 */
function showPanduanPenggunaNotification() {
  // Ambil data dari localStorage
  const data = localStorage.getItem('panduanNotificationData');
  const today = new Date().toDateString();
  
  let notificationData = {
    date: today,
    count: 0
  };

  // Parse data yang ada
  if (data) {
    try {
      notificationData = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing notification data:', e);
    }
  }

  // Reset counter jika hari berbeda
  if (notificationData.date !== today) {
    notificationData = {
      date: today,
      count: 0
    };
  }

  // Cek apakah sudah melebihi batas harian (3x per hari)
  if (notificationData.count >= 2) {
    return; // Sudah muncul 3x hari ini, jangan tampilkan lagi
  }

  // Buat notification element
  const notification = document.createElement('div');
  notification.className = 'panduan-notification';
  notification.innerHTML = `
    <div class="panduan-notification-header">
      <h4 class="panduan-notification-title">
        💡 Tips
      </h4>
      <button class="panduan-notification-close" id="closePanduanNotif">✕</button>
    </div>
    <div class="panduan-notification-body">
      Klik pada <strong>logo Sekolah di sidebar</strong> untuk mengakses halaman 
      <strong>Panduan Penggunaan</strong> yang berisi tutorial lengkap cara menggunakan aplikasi ini.
    </div>
    <button class="panduan-notification-btn" id="gotoPanduan">
      📖 Buka Panduan Sekarang
    </button>
  `;

  document.body.appendChild(notification);

  // Increment counter dan simpan
  notificationData.count++;
  localStorage.setItem('panduanNotificationData', JSON.stringify(notificationData));

  // Event listener untuk tombol close
  document.getElementById('closePanduanNotif').addEventListener('click', () => {
    closeNotification();
  });

  // Event listener untuk tombol buka panduan
  document.getElementById('gotoPanduan').addEventListener('click', () => {
    window.location.href = 'pengguna.html';
  });

  // Auto close setelah 15 detik
  setTimeout(() => {
    if (document.body.contains(notification)) {
      closeNotification();
    }
  }, 15000);

  // Fungsi untuk menutup notifikasi
  function closeNotification() {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }

  // Tambahkan animasi slide out
  if (!document.querySelector('#slideOutRightKeyframes')) {
    const style = document.createElement('style');
    style.id = 'slideOutRightKeyframes';
    style.textContent = `
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// ==========================
// INIT FILTER CONTROLS
// ==========================
async function initFilterControls() {
  try {
    // Get tahun ajaran aktif & daftar kelas dari database
    const [tahunAjaranAktif, daftarTahunAjaran, allSiswa] = await Promise.all([
      window.electronAPI.getTahunAjaranAktif(),
      window.electronAPI.getDaftarTahunAjaran(),
      window.electronAPI.getAllSiswa()
    ]);
    
    currentFilter.tahun_ajaran = tahunAjaranAktif;

    // Ekstrak unique kelas dari siswa (sorted)
    const uniqueKelas = [...new Set(allSiswa.map(s => s.kelas))]
      .filter(k => k) // remove null/undefined
      .sort((a, b) => {
        // Sort by tingkat (4, 5, 6) then by suffix (A, B, C)
        const tingkatA = parseInt(String(a).charAt(0));
        const tingkatB = parseInt(String(b).charAt(0));
        if (tingkatA !== tingkatB) return tingkatA - tingkatB;
        return String(a).localeCompare(String(b));
      });

    // Group kelas by tingkat untuk dropdown yang lebih terstruktur
    const kelasByTingkat = {
      4: uniqueKelas.filter(k => String(k).startsWith('4')),
      5: uniqueKelas.filter(k => String(k).startsWith('5')),
      6: uniqueKelas.filter(k => String(k).startsWith('6'))
    };

    // Build kelas dropdown options
    let kelasOptions = '<option value="">Semua Kelas</option>';
    
    // Tambah opsi per kelas spesifik
    [4, 5, 6].forEach(tingkat => {
      const kelasInTingkat = kelasByTingkat[tingkat];
      if (kelasInTingkat.length > 0) {
        kelasInTingkat.forEach(kelas => {
          kelasOptions += `<option value="${kelas}">Kelas ${kelas}</option>`;
        });
      }
    });

    // Create filter UI
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container mb-4';
    filterContainer.innerHTML = `
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label fw-semibold">
          🏫 Kelas:
          </label>
          <select id="filterKelas" class="form-select">
            ${kelasOptions}
          </select>
        </div>
        
        <div class="col-md-3">
          <label class="form-label fw-semibold">
            🗓️ Semester:
          </label>
          <select id="filterSemester" class="form-select">
            <option value="1" selected>Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
        
        <div class="col-md-3">
          <label class="form-label fw-semibold">
            📆 Tahun Ajaran:
          </label>
          <select id="filterTahunAjaran" class="form-select">
            ${daftarTahunAjaran && daftarTahunAjaran.length > 0
              ? daftarTahunAjaran.map(ta => 
                  `<option value="${ta}" ${ta === tahunAjaranAktif ? 'selected' : ''}>${ta}</option>`
                ).join('')
              : `<option value="${tahunAjaranAktif}" selected>${tahunAjaranAktif}</option>`
            }
          </select>
        </div>
        
        <div class="col-md-3">
          <button id="btnApplyFilter" class="btn btn-primary w-100">
            <i class="bi bi-arrow-repeat"></i> Terapkan Filter
          </button>
        </div>
      </div>
    `;

    // Insert filter sebelum stats container
    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
      statsContainer.parentNode.insertBefore(filterContainer, statsContainer);
    }

    // Event listeners
    document.getElementById('btnApplyFilter').addEventListener('click', applyFilter);
    
    // Apply on Enter key
    ['filterKelas', 'filterSemester', 'filterTahunAjaran'].forEach(id => {
      document.getElementById(id)?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyFilter();
      });
    });

  } catch (err) {
    console.error('Gagal init filter controls:', err);
  }
}

// ==========================
// APPLY FILTER
// ==========================
async function applyFilter() {
  try {
    const filterKelas = document.getElementById('filterKelas');
    const filterSemester = document.getElementById('filterSemester');
    const filterTahunAjaran = document.getElementById('filterTahunAjaran');

    // Update current filter
    currentFilter.kelas = filterKelas.value || null;
    currentFilter.semester = parseInt(filterSemester.value);
    currentFilter.tahun_ajaran = filterTahunAjaran.value;

    // Show loading
    const btnApply = document.getElementById('btnApplyFilter');
    const originalText = btnApply.innerHTML;
    btnApply.innerHTML = '<i class="spinner-border spinner-border-sm"></i> Memuat...';
    btnApply.disabled = true;

    // Reload data
    await loadDashboardData();

    // Restore button
    btnApply.innerHTML = originalText;
    btnApply.disabled = false;

    // Show notification
    showNotification('success', 'Filter berhasil diterapkan');

  } catch (err) {
    console.error('Gagal apply filter:', err);
    showNotification('error', 'Gagal menerapkan filter');
  }
}

// ==========================
// LOAD DASHBOARD DATA
// ==========================
async function loadDashboardData() {
  try {
    // Buat filter options sesuai signature penilaianLogic
    const filterOptions = {
      kelas: currentFilter.kelas,
      semester: currentFilter.semester,
      tahun_ajaran: currentFilter.tahun_ajaran
    };

    console.log('Loading dashboard dengan filter:', filterOptions);

    // Ambil data DARI penilaianLogic (bukan data mentah)
    const [
      totalSiswa,      // Total semua siswa (tidak terpengaruh filter)
      allMapel,        // Semua mapel
      allNilai,        // Total nilai (untuk debug)
      topSiswa,        // Top siswa menggunakan getTopSiswa() dari penilaianLogic
      statsGlobal      // Statistik menggunakan hitungStatistik() dari penilaianLogic
    ] = await Promise.all([
      window.electronAPI.getTotalSiswa(),
      window.electronAPI.getAllMapel(),
      window.electronAPI.getAllNilai(),
      window.electronAPI.getTopSiswa({ 
        limit: 10, 
        ...filterOptions 
      }),
      window.electronAPI.getStatistikGlobal(filterOptions)
    ]);

    console.log('Data loaded:', {
      totalSiswa,
      totalMapel: allMapel?.length,
      totalNilai: allNilai?.length,
      topSiswa,
      statsGlobal
    });

    // Cek jika ada error dari API
    if (topSiswa?.error) {
      console.error('Error dari getTopSiswa:', topSiswa.error);
      // Jangan throw, biarkan render empty state
    }
    
    if (statsGlobal?.error) {
      console.error('Error dari getStatistikGlobal:', statsGlobal.error);
      // Jangan throw, biarkan render dengan data default
    }

    const statsBox = document.querySelector('.stats-container');
    const tableBody = document.querySelector('.table tbody');

    // Update box statistik
    if (statsBox) {
      // Total siswa (semua kelas)
      statsBox.querySelector('.stat-box:nth-child(1) .value').textContent = totalSiswa ?? 0;
      
      // Total mapel
      statsBox.querySelector('.stat-box:nth-child(2) .value').textContent = allMapel?.length ?? 0;
      
      // Siswa dengan nilai (dari statsGlobal.siswa.dengan_nilai)
      const siswaWithNilai = statsGlobal?.siswa?.dengan_nilai ?? 0;
      statsBox.querySelector('.stat-box:nth-child(3) .value').textContent = siswaWithNilai;
      
      // Rata-rata kelas (dari statsGlobal.nilai.rata_rata_kelas)
      const rataKelas = statsGlobal?.nilai?.rata_rata_kelas ?? 0;
      statsBox.querySelector('.stat-box:nth-child(4) .value').textContent = rataKelas.toFixed(2);
    }

    // Update info filter yang aktif
    updateFilterInfo(statsGlobal);

    // Render ranking table - pastikan topSiswa adalah array
    const topSiswaArray = Array.isArray(topSiswa) ? topSiswa : [];
    renderRankingTable(topSiswaArray, tableBody, allNilai?.length || 0);

  } catch (err) {
    console.error('Gagal load dashboard:', err);
    showNotification('error', 'Gagal memuat data dashboard');
    
    const tableBody = document.querySelector('.table tbody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-danger">
            <i class="bi bi-exclamation-triangle"></i> Gagal memuat data
            <br><small class="text-muted">${err.message}</small>
          </td>
        </tr>
      `;
    }
  }
}

// ==========================
// RENDER RANKING TABLE (✅ WITH RANKING COLUMN)
// ==========================
function renderRankingTable(topSiswa, tableBody) {
  if (!tableBody) return;

  if (!topSiswa || topSiswa.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          <i class="bi bi-inbox" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0">Belum ada data penilaian untuk filter ini</p>
          <small class="text-muted">
            Filter: ${currentFilter.kelas ? `Kelas ${currentFilter.kelas}` : 'Semua Kelas'} | 
            Semester ${currentFilter.semester} | 
            ${currentFilter.tahun_ajaran}
          </small>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = topSiswa.map((s, i) => {
    // ✅ Ranking badge class (Top 3 special styling)
    const getRankingBadgeClass = (rank) => {
      if (rank === 1) return 'ranking-gold';
      if (rank === 2) return 'ranking-silver';
      if (rank === 3) return 'ranking-bronze';
      return 'ranking-default';
    };
    
    // Tentukan badge nilai
    let nilaiBadgeClass = 'nilai-rendah';
    if (s.rata_rata >= 90) nilaiBadgeClass = 'nilai-tinggi';
    else if (s.rata_rata >= 75) nilaiBadgeClass = 'nilai-sedang';

    // Tentukan status (gunakan status_naik_kelas dari penilaianLogic)
    let statusBadge = '';
    if (s.status_naik_kelas) {
      const statusMap = {
        'Naik Kelas': { class: 'bg-success', icon: '✓', text: 'Naik Kelas' },
        'Tidak Naik Kelas': { class: 'bg-danger', icon: '✗', text: 'Tidak Naik' },
        'Belum Lengkap': { class: 'bg-warning text-dark', icon: '⚠', text: 'Belum Lengkap' }
      };
      
      const status = statusMap[s.status_naik_kelas] || { 
        class: 'bg-secondary', 
        icon: '-', 
        text: s.status_naik_kelas 
      };
      
      statusBadge = `
        <span class="badge ${status.class}">
          ${status.icon} ${status.text}
        </span>
      `;
    } else {
      statusBadge = '<span class="badge bg-secondary">-</span>';
    }

    // Info statistik tambahan
    const statsInfo = s.statistik ? `
      <small class="d-block text-muted mt-1">
        Tuntas: ${s.statistik.mapel_tuntas}/${s.statistik.total_mapel} 
        (${s.statistik.persen_tuntas}%)
      </small>
    ` : '';

    // ✅ Ranking number (use from backend or fallback to index)
    const rankingNumber = s.ranking || (i + 1);
    const rankingClass = getRankingBadgeClass(rankingNumber);
    const rankingEmoji = rankingNumber === 1 ? '🥇' : rankingNumber === 2 ? '🥈' : rankingNumber === 3 ? '🥉' : '';

    return `
      <tr>
        <td class="text-center">
          <span class="ranking-badge ${rankingClass}">
            ${rankingEmoji} #${rankingNumber}
          </span>
        </td>
        <td>${s.nis || '-'}</td>
        <td>${s.nisn || '-'}</td>
        <td class="fw-semibold">${s.nama || '-'}</td>
        <td>
          <span class="badge bg-info text-dark">Kelas ${s.kelas}</span>
        </td>
        <td>
          <span class="nilai-badge ${nilaiBadgeClass}">
            ${s.rata_rata ? s.rata_rata.toFixed(2) : '0'}
          </span>
          <small class="d-block text-muted mt-1">Predikat: ${s.predikat || '-'}</small>
        </td>
        <td>
          ${statusBadge}
          ${statsInfo}
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================
// UPDATE FILTER INFO
// ==========================
function updateFilterInfo(statsGlobal) {
  // Cari atau buat element info filter
  let filterInfo = document.querySelector('.filter-info');
  
  if (!filterInfo) {
    filterInfo = document.createElement('div');
    filterInfo.className = 'filter-info alert alert-info mb-3';
    
    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
      statsContainer.parentNode.insertBefore(filterInfo, statsContainer.nextSibling);
    }
  }

  const kelasText = currentFilter.kelas ? `Kelas ${currentFilter.kelas}` : 'Semua Kelas';
  const semesterText = `Semester ${currentFilter.semester}`;
  const tahunAjaranText = currentFilter.tahun_ajaran || '-';

  // Data dari statsGlobal (hasil hitungStatistik)
  const totalSiswa = statsGlobal?.siswa?.total ?? 0;
  const siswaDenganNilai = statsGlobal?.siswa?.dengan_nilai ?? 0;
  const rataKelas = statsGlobal?.nilai?.rata_rata_kelas ?? 0;
  const naikKelas = statsGlobal?.kenaikan?.naik_kelas ?? 0;
  const persenNaik = statsGlobal?.kenaikan?.persen_naik ?? 0;

  filterInfo.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <div class="d-flex align-items-center">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Filter Aktif:</strong>
          <span class="badge bg-primary ms-2">${kelasText}</span>
          <span class="badge bg-primary ms-1">${semesterText}</span>
          <span class="badge bg-primary ms-1">${tahunAjaranText}</span>
        </div>
      </div>
      <div class="col-md-6 text-end">
        <small class="text-muted">
          <strong>${siswaDenganNilai}</strong> dari <strong>${totalSiswa}</strong> siswa dengan nilai | 
          Rata-rata: <strong>${rataKelas.toFixed(2)}</strong> | 
          Naik kelas: <strong>${naikKelas}</strong> (${persenNaik}%)
        </small>
      </div>
    </div>
  `;
}

// ==========================
// NOTIFICATION HELPER
// ==========================
function showNotification(type, message) {
  const toastContainer = document.getElementById('toastContainer');
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'info' ? 'info' : 'danger'} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-${type === 'success' ? 'check-circle-fill' : type === 'info' ? 'info-circle-fill' : 'exclamation-triangle-fill'}"></i>
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  // Append to container
  if (toastContainer) {
    toastContainer.appendChild(toast);
  } else {
    // Fallback: append to body
    if (!document.getElementById('fallbackToastContainer')) {
      const fallbackContainer = document.createElement('div');
      fallbackContainer.id = 'fallbackToastContainer';
      fallbackContainer.style.position = 'fixed';
      fallbackContainer.style.top = '20px';
      fallbackContainer.style.right = '20px';
      fallbackContainer.style.zIndex = '10000';
      document.body.appendChild(fallbackContainer);
    }
    document.getElementById('fallbackToastContainer').appendChild(toast);
  }
  
  // Show toast
  if (typeof bootstrap !== 'undefined') {
    const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 3000
    });
    bsToast.show();
    
    // Remove after hide
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  } else {
    // Fallback tanpa Bootstrap
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// ==========================
// REFRESH BUTTON
// ==========================
const btnRefresh = document.getElementById('btnRefresh');
if (btnRefresh) {
  btnRefresh.addEventListener('click', async () => {
    try {
      const icon = btnRefresh.querySelector('i');
      icon.classList.add('spinner-border', 'spinner-border-sm');
      icon.classList.remove('bi-arrow-clockwise');
      btnRefresh.disabled = true;

      await loadDashboardData();
      showNotification('success', 'Data berhasil di-refresh');

      icon.classList.remove('spinner-border', 'spinner-border-sm');
      icon.classList.add('bi-arrow-clockwise');
      btnRefresh.disabled = false;
    } catch (err) {
      console.error('Gagal refresh:', err);
      showNotification('error', 'Gagal refresh data');
      
      const icon = btnRefresh.querySelector('i');
      icon.classList.remove('spinner-border', 'spinner-border-sm');
      icon.classList.add('bi-arrow-clockwise');
      btnRefresh.disabled = false;
    }
  });
}

// ==========================
// ✅ IPC EVENT LISTENERS (CROSS-WINDOW)
// ==========================

/**
 * Init IPC Listeners untuk komunikasi antar window
 */
function initIPCListeners() {
  // ✅ Listen reload request dari halaman lain (via IPC)
  if (window.electronAPI.onDashboardReloadRequested) {
    window.electronAPI.onDashboardReloadRequested(async (data) => {
      console.log('🔄 Dashboard reload requested via IPC:', data);
      
      try {
        const { kelas, semester, tahun_ajaran, success, timestamp } = data;
        
        // Cek apakah filter saat ini match dengan data yang diupdate
        const isFilterMatch = (
          (!currentFilter.kelas || currentFilter.kelas === kelas) &&
          currentFilter.semester === semester &&
          currentFilter.tahun_ajaran === tahun_ajaran
        );
        
        if (isFilterMatch) {
          console.log('✅ Filter match, reloading dashboard...');
          await loadDashboardData();
          showNotification('success', `Nilai berhasil diperbarui (${success} siswa)`);
        } else {
          console.log('ℹ️ Filter tidak match, showing notification only');
          showNotification('info', `Kehadiran disimpan untuk Kelas ${kelas} Semester ${semester}`);
        }
        
      } catch (err) {
        console.error('❌ Gagal reload dashboard:', err);
        showNotification('error', 'Gagal refresh data setelah update kehadiran');
      }
    });
    
    console.log('✅ IPC listener "dashboard-reload-requested" registered');
  } else {
    console.warn('⚠️ IPC onDashboardReloadRequested tidak tersedia');
    console.warn('⚠️ Pastikan preload.js sudah di-update dengan API IPC');
  }
}

// ==========================
// FALLBACK: Window Event Listeners (jika dalam 1 halaman)
// ==========================

// Listen untuk update dari halaman kehadiran (fallback jika same-window)
window.addEventListener('kehadiran-updated', async (e) => {
  console.log('🔄 Kehadiran updated (window event):', e.detail);
  
  try {
    const { kelas, semester, tahun_ajaran, success } = e.detail;
    
    const isFilterMatch = (
      (!currentFilter.kelas || currentFilter.kelas === kelas) &&
      currentFilter.semester === semester &&
      currentFilter.tahun_ajaran === tahun_ajaran
    );
    
    if (isFilterMatch) {
      console.log('✅ Filter match, reload dashboard...');
      await loadDashboardData();
      showNotification('success', `Data kehadiran berhasil diperbarui (${success} siswa)`);
    } else {
      console.log('ℹ️ Filter tidak match, skip reload');
      showNotification('info', 'Kehadiran berhasil disimpan (filter berbeda)');
    }
    
  } catch (err) {
    console.error('❌ Gagal reload dashboard:', err);
    showNotification('error', 'Gagal refresh data setelah update kehadiran');
  }
});

// Listen untuk update dari halaman nilai (fallback)
window.addEventListener('nilai-updated', async (e) => {
  console.log('🔄 Nilai updated (window event):', e.detail);
  
  try {
    await loadDashboardData();
    showNotification('success', 'Dashboard berhasil di-refresh');
  } catch (err) {
    console.error('❌ Gagal reload dashboard:', err);
  }
});

console.log('✅ Event listeners registered (window events as fallback)');

// ==========================
// EXPORT (if needed)
// ==========================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadDashboardData,
    applyFilter,
    currentFilter
  };
}
