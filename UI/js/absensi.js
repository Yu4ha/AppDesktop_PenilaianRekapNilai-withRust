/**
 * absensi.js (v4 - Tauri Backend Fixed)
 * ==========================================
 * Logic untuk input dan manajemen kehadiran siswa
 * Kehadiran per siswa, per semester (tidak per mapel)
 * 
 * UPDATE v4:
 * - Sinkronisasi dengan backend Rust baru
 * - Command: get_kehadiran_by_kelas, save_kehadiran, delete_kehadiran
 * - Response struct: KehadiranWithSiswa
 * ==========================================
 */

// Import Tauri API
import { invoke } from '@tauri-apps/api/tauri';

/* ============================
   Helper: Invoke Command
   ============================ */
async function invokeCommand(cmd, args = {}) {
  try {
    const result = await invoke(cmd, args);
    
    // Unwrap ApiResponse if needed
    if (result && typeof result === 'object' && 'success' in result) {
      if (!result.success) {
        throw new Error(result.error || 'Command failed');
      }
      return result.data;
    }
    
    return result;
  } catch (err) {
    console.error(`[Tauri Command Error] ${cmd}:`, err);
    throw err;
  }
}

/* ============================
   State
   ============================ */
let allSiswa = [];
let allKehadiran = [];
let isSaving = false;

// Filter State
let filterKelas = null;
let filterSemester = null;
let filterTahunAjaran = null;
let availableTahunAjaran = [];

/* ============================
   Initialization
   ============================ */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializePage();
    setupEventListeners();
    setupNavigation();
  } catch (err) {
    console.error('Inisialisasi gagal:', err);
    showAlert('Gagal memuat halaman. Cek konsol untuk detail.');
  }
});

/* ============================
   Load Data Functions
   ============================ */
async function initializePage() {
  showLoading(true);
  try {
    await loadInitialData();
    renderFilterSection();
    
    const params = new URLSearchParams(window.location.search);
    const urlKelas = params.get('kelas');
    const urlSemester = params.get('semester');
    const urlTahun = params.get('tahun');

    if (urlKelas && urlSemester && urlTahun) {
      filterKelas = urlKelas;
      filterSemester = parseInt(urlSemester);
      filterTahunAjaran = urlTahun;
      
      document.getElementById('filterKelas').value = filterKelas;
      document.getElementById('filterSemester').value = filterSemester;
      document.getElementById('filterTahunAjaran').value = filterTahunAjaran;
      
      await applyFilters();
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      filterTahunAjaran = currentMonth >= 7 
        ? `${currentYear}/${currentYear + 1}` 
        : `${currentYear - 1}/${currentYear}`;
      filterSemester = currentMonth >= 7 ? 1 : 2;
      
      document.getElementById('filterTahunAjaran').value = filterTahunAjaran;
      document.getElementById('filterSemester').value = filterSemester;
    }
  } catch (err) {
    console.error('Error initializing page:', err);
    showAlert('Gagal memuat data: ' + extractErrorMessage(err));
  } finally {
    showLoading(false);
  }
}

async function loadInitialData() {
  try {
    // ✅ Tauri Commands
    const [siswaData, tahunAjaranData] = await Promise.all([
      invokeCommand('get_all_siswa'),
      invokeCommand('get_daftar_tahun_ajaran')
    ]);

    allSiswa = Array.isArray(siswaData) ? siswaData : [];
    availableTahunAjaran = Array.isArray(tahunAjaranData) ? tahunAjaranData : [];
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentTahunAjaran = currentMonth >= 7 
      ? `${currentYear}/${currentYear + 1}` 
      : `${currentYear - 1}/${currentYear}`;
    
    if (!availableTahunAjaran.includes(currentTahunAjaran)) {
      availableTahunAjaran.unshift(currentTahunAjaran);
    }
  } catch (err) {
    console.error('loadInitialData error:', err);
    throw err;
  }
}

async function loadFilteredKehadiran() {
  try {
    if (!filterKelas || !filterSemester || !filterTahunAjaran) {
      allKehadiran = [];
      return;
    }

    // ✅ NEW: get_kehadiran_by_kelas
    const kehadiranData = await invokeCommand('get_kehadiran_by_kelas', {
      kelas: filterKelas,
      semester: filterSemester,
      tahunAjaran: filterTahunAjaran
    });
    
    allKehadiran = Array.isArray(kehadiranData) ? kehadiranData : [];

    console.log('Loaded kehadiran:', allKehadiran);
  } catch (err) {
    console.error('loadFilteredKehadiran error:', err);
    allKehadiran = [];
  }
}


/* ============================
   CSS Styles
   ============================ */
const style = document.createElement('style');
style.textContent = `
  .filter-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .filter-group label {
    font-weight: 600;
    font-size: 14px;
    color: #333;
  }

  .filter-group select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    min-width: 150px;
    cursor: pointer;
  }

  .btn-filter {
    padding: 8px 20px;
    background: #0d6efd;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 20px;
  }

  .btn-filter:hover {
    background: #0b5ed7;
  }

  .btn-reset {
    padding: 8px 20px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 20px;
  }

  .btn-reset:hover {
    background: #5a6268;
  }

  .kehadiran-input {
    width: 60px;
    padding: 6px;
    text-align: center;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-weight: 600;
    font-size: 14px;
  }

  .kehadiran-input:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
  }

  .kehadiran-input.hadir {
    border-color: #4caf50;
  }

  .kehadiran-input.sakit {
    border-color: #ff9800;
  }

  .kehadiran-input.izin {
    border-color: #2196f3;
  }

  .kehadiran-input.alpa {
    border-color: #f44336;
  }

  .total-display {
    font-weight: 700;
    color: #333;
    background: #f0f0f0;
    padding: 6px 12px;
    border-radius: 4px;
  }

  .nilai-display {
    font-weight: 700;
    font-size: 16px;
    color: #673ab7;
    background: #ede7f6;
    padding: 6px 12px;
    border-radius: 4px;
  }

  .btn-delete-kehadiran {
    background: #f44336;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  }

  .btn-delete-kehadiran:hover {
    background: #d32f2f;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    border-radius: 6px;
    overflow: hidden;
  }

  th, td {
    border: 1px solid #000000ff;
    padding: 8px 10px;
    text-align: center;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background: #fafafa;
  }

  tr:hover {
    background: #e9f5ff;
  }

  input[type=number] {
    -moz-appearance: textfield;
  }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .badge-status {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .badge-hadir { background: #c8e6c9; color: #2e7d32; }
  .badge-sakit { background: #ffe0b2; color: #e65100; }
  .badge-izin { background: #bbdefb; color: #0d47a1; }
  .badge-alpa { background: #ffcdd2; color: #c62828; }
`;
document.head.appendChild(style);

/* ============================
   Render Functions
   ============================ */
function renderFilterSection() {
  const kelasSelect = document.getElementById('filterKelas');
  if (kelasSelect) {
    const uniqueKelas = [...new Set(allSiswa.map(s => s.kelas))].sort();
    kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>' +
      uniqueKelas.map(k => `<option value="${k}">${k}</option>`).join('');
  }

  const taSelect = document.getElementById('filterTahunAjaran');
  if (taSelect) {
    taSelect.innerHTML = '<option value="">-- Pilih Tahun Ajaran --</option>' +
      availableTahunAjaran.map(ta => `<option value="${ta}">${ta}</option>`).join('');
  }
}

async function applyFilters() {
  const kelasSelect = document.getElementById('filterKelas');
  const semesterSelect = document.getElementById('filterSemester');
  const tahunAjaranSelect = document.getElementById('filterTahunAjaran');

  if (!kelasSelect?.value || !semesterSelect?.value || !tahunAjaranSelect?.value) {
    showAlert('⚠️ Silakan pilih Kelas, Semester, dan Tahun Ajaran terlebih dahulu!');
    return;
  }

  filterKelas = kelasSelect.value;
  filterSemester = parseInt(semesterSelect.value);
  filterTahunAjaran = tahunAjaranSelect.value;

  const params = new URLSearchParams();
  params.set('kelas', filterKelas);
  params.set('semester', filterSemester);
  params.set('tahun', filterTahunAjaran);
  window.history.replaceState({}, '', `?${params.toString()}`);

  const infoSection = document.getElementById('infoSection');
  const infoContent = document.getElementById('infoContent');
  if (infoSection && infoContent) {
    infoSection.style.display = 'block';
    infoContent.innerHTML = `
      <strong>Kelas:</strong> ${filterKelas} | 
      <strong>Semester:</strong> ${filterSemester} | 
      <strong>Tahun Ajaran:</strong> ${filterTahunAjaran}
    `;
  }

  showLoading(true);
  try {
    await loadFilteredKehadiran();
    renderKehadiranTable();
    renderRiwayatTable();
  } catch (err) {
    console.error('Error applying filters:', err);
    showAlert('❌ Gagal menerapkan filter: ' + extractErrorMessage(err));
  } finally {
    showLoading(false);
  }
}

function resetFilters() {
  filterKelas = null;
  filterSemester = null;
  filterTahunAjaran = null;

  document.getElementById('filterKelas').value = '';
  document.getElementById('filterSemester').value = '';
  document.getElementById('filterTahunAjaran').value = '';

  const infoSection = document.getElementById('infoSection');
  if (infoSection) infoSection.style.display = 'none';

  window.history.replaceState({}, '', window.location.pathname);

  allKehadiran = [];
  renderKehadiranTable();
  renderRiwayatTable();
}

function renderKehadiranTable() {
  const tbody = document.getElementById('kehadiranTableBody');
  
  if (!tbody) {
    console.error('Element #kehadiranTableBody tidak ditemukan!');
    return;
  }

  tbody.innerHTML = '';
  
  if (typeof studentCache !== 'undefined') {
    studentCache.clear();
  }

  if (!filterKelas || !filterSemester || !filterTahunAjaran) {
    tbody.innerHTML = `<tr><td colspan="10" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;
    return;
  }

  const filteredSiswa = allSiswa.filter(s => s.kelas === filterKelas);

  if (filteredSiswa.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="padding: 40px; text-align: center; color: #999;">
      📭 Tidak ada siswa di kelas <strong>${filterKelas}</strong>
    </td></tr>`;
    return;
  }

  filteredSiswa.forEach((siswa, idx) => {
    // ✅ Check if kehadiran exists for this siswa
    const existingKehadiran = allKehadiran.find(k => k.siswa_id === siswa.id);
    
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${siswa.nis}</td>
      <td>${siswa.nisn || '-'}</td>
      <td style="text-align: center; padding-left: 10px;">${escapeHtml(siswa.nama)}</td>
      <td>
        <input 
          type="number" 
          class="kehadiran-input hadir" 
          value="${existingKehadiran ? existingKehadiran.hadir : ''}" 
          min="0" 
          placeholder="0"
          data-siswa-id="${siswa.id}"
          data-type="hadir"
        />
      </td>
      <td>
        <input 
          type="number" 
          class="kehadiran-input sakit" 
          value="${existingKehadiran ? existingKehadiran.sakit : ''}" 
          min="0" 
          placeholder="0"
          data-siswa-id="${siswa.id}"
          data-type="sakit"
        />
      </td>
      <td>
        <input 
          type="number" 
          class="kehadiran-input izin" 
          value="${existingKehadiran ? existingKehadiran.izin : ''}" 
          min="0" 
          placeholder="0"
          data-siswa-id="${siswa.id}"
          data-type="izin"
        />
      </td>
      <td>
        <input 
          type="number" 
          class="kehadiran-input alpa" 
          value="${existingKehadiran ? existingKehadiran.alpa : ''}" 
          min="0" 
          placeholder="0"
          data-siswa-id="${siswa.id}"
          data-type="alpa"
        />
      </td>
      <td>
        <span class="total-display" data-siswa-id="${siswa.id}">${existingKehadiran ? existingKehadiran.total : '-'}</span>
      </td>
      <td>
        <span class="nilai-display" data-siswa-id="${siswa.id}">${existingKehadiran ? existingKehadiran.nilai : '-'}</span>
      </td>
    `;
    
    tbody.appendChild(tr);
  });

  attachInputListeners();
}

function renderRiwayatTable() {
  const tbody = document.getElementById('riwayatTableBody');
  
  if (!tbody) {
    console.error('Element #riwayatTableBody tidak ditemukan!');
    return;
  }

  tbody.innerHTML = '';

  if (!filterKelas || !filterSemester || !filterTahunAjaran) {
    tbody.innerHTML = `<tr><td colspan="11" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;
    return;
  }

  if (allKehadiran.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="padding: 40px; text-align: center; color: #999;">
      📭 Belum ada data kehadiran tersimpan untuk filter yang dipilih
    </td></tr>`;
    return;
  }

  allKehadiran.forEach((item, idx) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${item.nis}</td>
      <td>${item.nisn || '-'}</td>
      <td style="text-align: center; padding-left: 10px;">${escapeHtml(item.nama_siswa)}</td>

      <td style="background: #4caf50; color: white; text-align: center;">${item.hadir ?? 0}</td>
      <td style="background: #ff9800; color: white; text-align: center;">${item.sakit ?? 0}</td>
      <td style="background: #2196f3; color: white; text-align: center;">${item.izin ?? 0}</td>
      <td style="background: #f44336; color: white; text-align: center;">${item.alpa ?? 0}</td>

      <td style="background: #9e9e9e; color: white; text-align: center;">${item.total ?? 0}</td>
      <td style="background: #673ab7; color: white; text-align: center;">
        <span class="nilai-display">${typeof item.nilai === 'number' ? item.nilai.toFixed(2) : '-'}</span>
      </td>

      <td>
        <button class="btn-delete-kehadiran" 
          data-id="${item.id}" 
          data-nama="${item.nama_siswa}">
          🗑️ Hapus
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  attachDeleteHandlers();
}

/* ============================
   Calculation Functions (OPTIMIZED v2)
   ============================ */
function calculateTotal(breakdown) {
  const hadir = parseInt(breakdown.hadir) || 0;
  const sakit = parseInt(breakdown.sakit) || 0;
  const izin = parseInt(breakdown.izin) || 0;
  const alpa = parseInt(breakdown.alpa) || 0;
  
  return hadir + sakit + izin + alpa;
}

function calculateNilai(breakdown) {
  const total = calculateTotal(breakdown);
  if (total === 0) return '-';
  
  const hadir = parseInt(breakdown.hadir) || 0;
  const nilai = Math.round((hadir / total) * 10000) / 100;
  
  return nilai.toFixed(2);
}

function debounce(func, wait = 200) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const studentCache = new Map();

function getCachedElements(siswaId) {
  if (studentCache.has(siswaId)) {
    return studentCache.get(siswaId);
  }
  
  const elements = {
    inputs: document.querySelectorAll(`.kehadiran-input[data-siswa-id="${siswaId}"]`),
    totalDisplay: document.querySelector(`.total-display[data-siswa-id="${siswaId}"]`),
    nilaiDisplay: document.querySelector(`.nilai-display[data-siswa-id="${siswaId}"]`)
  };
  
  studentCache.set(siswaId, elements);
  return elements;
}

function attachInputListeners() {
  const inputs = document.querySelectorAll('.kehadiran-input');
  
  studentCache.clear();
  
  const debouncedUpdate = debounce((siswaId) => {
    updateCalculations(siswaId);
  }, 200);
  
  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let val = e.target.value;
      
      if (val && !/^\d+$/.test(val)) {
        e.target.value = val.replace(/\D/g, '');
        return;
      }
      
      const numVal = parseInt(val);
      if (numVal < 0) {
        e.target.value = '0';
        return;
      }
      
      const siswaId = e.target.dataset.siswaId;
      debouncedUpdate(siswaId);
    });
    
    input.addEventListener('blur', (e) => {
      const siswaId = e.target.dataset.siswaId;
      updateCalculations(siswaId);
    });
  });
}

function updateCalculations(siswaId) {
  const cached = getCachedElements(siswaId);
  
  if (!cached.inputs || cached.inputs.length === 0) {
    return;
  }
  
  const breakdown = {
    hadir: 0,
    sakit: 0,
    izin: 0,
    alpa: 0
  };
  
  cached.inputs.forEach(input => {
    const type = input.dataset.type;
    const val = parseInt(input.value) || 0;
    breakdown[type] = val;
  });
  
  if (cached.totalDisplay) {
    const total = calculateTotal(breakdown);
    cached.totalDisplay.textContent = total || '-';
  }
  
  if (cached.nilaiDisplay) {
    const nilai = calculateNilai(breakdown);
    cached.nilaiDisplay.textContent = nilai;
  }
}

/* ============================
   Save Function
   ============================ */
async function handleSaveKehadiran(event) {
  event.preventDefault();
  
  if (isSaving) {
    return showAlert('Sedang menyimpan, tunggu hingga proses selesai...');
  }

  if (!filterKelas || !filterSemester || !filterTahunAjaran) {
    return showAlert('⚠️ Silakan pilih Kelas, Semester, dan Tahun Ajaran terlebih dahulu!');
  }

  const form = document.getElementById('kehadiranForm');
  if (!form) {
    console.error('Form #kehadiranForm tidak ditemukan.');
    return;
  }

  const rows = form.querySelectorAll('#kehadiranTableBody tr');
  const payload = [];

  for (const row of rows) {
    const inputs = row.querySelectorAll('.kehadiran-input');
    if (inputs.length === 0) continue;

    const siswaId = parseInt(inputs[0].dataset.siswaId);
    
    const breakdown = {
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpa: 0
    };
    
    inputs.forEach(input => {
      const type = input.dataset.type;
      const val = parseInt(input.value) || 0;
      breakdown[type] = val;
    });

    const total = calculateTotal(breakdown);
    
    if (total === 0) continue;

    payload.push({
      siswaId,
      kelas: filterKelas,
      semester: filterSemester,
      tahunAjaran: filterTahunAjaran,
      hadir: breakdown.hadir,
      sakit: breakdown.sakit,
      izin: breakdown.izin,
      alpa: breakdown.alpa
    });
  }

  if (payload.length === 0) {
    return showAlert('⚠️ Tidak ada data kehadiran yang diisi.');
  }

  if (!confirm(`Simpan ${payload.length} data kehadiran untuk Kelas ${filterKelas} Semester ${filterSemester} Tahun Ajaran ${filterTahunAjaran}?`)) {
    return;
  }

  isSaving = true;
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Menyimpan...';
  }

  try {
    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    // ✅ Loop save_kehadiran individual
    for (const data of payload) {
      try {
        await invokeCommand('save_kehadiran', {
          req: {
            siswa_id: data.siswaId,
            kelas: data.kelas,
            semester: data.semester,
            tahun_ajaran: data.tahunAjaran,
            hadir: data.hadir,
            sakit: data.sakit,
            izin: data.izin,
            alpa: data.alpa
          }
        });
        successCount++;
      } catch (err) {
        failedCount++;
        errors.push({
          siswa_id: data.siswaId,
          error: extractErrorMessage(err)
        });
      }
    }
    
    if (failedCount === 0) {
      showAlert(`✅ Berhasil menyimpan ${successCount} data kehadiran!`);
    } else {
      showAlert(`⚠️ Berhasil: ${successCount}, Gagal: ${failedCount}`);
      console.error('Save errors:', errors);
    }

    await loadFilteredKehadiran();
    renderKehadiranTable();
    renderRiwayatTable();
    
  } catch (err) {
    console.error('handleSaveKehadiran error:', err);
    showAlert('❌ Gagal menyimpan kehadiran: ' + extractErrorMessage(err));
  } finally {
    isSaving = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Simpan Semua Kehadiran';
    }
  }
}

/* ============================
   Delete Handler
   ============================ */
function attachDeleteHandlers() {
  const deleteButtons = document.querySelectorAll('.btn-delete-kehadiran');
  
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', async function() {
      const id = parseInt(this.dataset.id);
      const nama = this.dataset.nama;
      
      if (!confirm(`⚠️ Hapus data kehadiran ${nama}?\n\nTindakan ini tidak dapat dibatalkan.`)) {
        return;
      }

      try {
        // ✅ Tauri Command: delete_kehadiran
        await invokeCommand('delete_kehadiran', { id });
        
        showAlert(`✅ Data kehadiran ${nama} berhasil dihapus.`);
        await loadFilteredKehadiran();
        renderKehadiranTable();
        renderRiwayatTable();
      } catch (err) {
        console.error('Delete error:', err);
        showAlert('❌ Gagal menghapus: ' + extractErrorMessage(err));
      }
    });
  });
}

/* ============================
   Event Listeners Setup
   ============================ */
function setupEventListeners() {
  const form = document.getElementById('kehadiranForm');
  if (form) {
    form.addEventListener('submit', handleSaveKehadiran);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', onLogout);
  }
}

async function onLogout() {
  if (!confirm('📝 Apakah kamu yakin ingin keluar dari aplikasi?')) return;
  window.location.href = 'index.html';
}

/* ============================
   Navigation Helper
   ============================ */
function setupNavigation() {
  const currentPage = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-item");
  
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    
    if (currentPage === href || (currentPage === "" && href === "index-absensi.html")) {
      link.classList.add("active");
    }
    
    link.addEventListener('click', (e) => {
      document.querySelector('.nav-item.active')?.classList.remove('active');
      e.currentTarget.classList.add('active');
    });
  });
}

/* ============================
   Utilities
   ============================ */
function showAlert(message) {
  alert(message);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractErrorMessage(error) {
  if (error && typeof error === 'object' && error.message) {
    return error.message.replace(/^Error:\s*/gi, '').trim();
  }
  if (typeof error === 'string') {
    return error.trim();
  }
  return 'Terjadi kesalahan yang tidak diketahui';
}

function showLoading(show) {
  const tbody = document.getElementById('kehadiranTableBody');
  const riwayatTbody = document.getElementById('riwayatTableBody');
  
  if (show) {
    const loadingHtml = `
      <tr>
        <td colspan="10" style="text-align:center; padding:30px;">
          <div class="d-flex justify-content-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <p class="text-muted mt-3">Memuat data...</p>
        </td>
      </tr>
    `;
    
    if (tbody) tbody.innerHTML = loadingHtml;
    if (riwayatTbody) riwayatTbody.innerHTML = loadingHtml.replace('colspan="10"', 'colspan="11"');
  }
}

// Make functions globally accessible
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
