/**
 * penilaian.js (v10 - Tauri + Clean Table Layout)
 * ================================================
 * ✅ Tauri migration (window.__TAURI__.invoke)
 * ✅ Table layout sesuai v7 (2 header rows + aksi)
 * ✅ Multi-tugas popup feature
 * ✅ Batch save & delete
 */
import { invokeCommand } from './tauriAPIhelper';

/* ============================
   State
   ============================ */
let allNilai = [];
let allSiswa = [];
let allMapel = [];
let allJenisNilai = [];
let isSaving = false;

let filterKelas = null;
let filterSemester = null;
let filterTahunAjaran = null;
let availableTahunAjaran = [];

let currentPopupData = {
  siswa_id: null,
  mapel_id: null,
  tugasList: []
};

const MAX_INPUT_LENGTH = 7;
const VALID_NILAI_MIN = 0;
const VALID_NILAI_MAX = 100;

/* ============================
   DOM Lifecycle
   ============================ */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializePage();
    setupEventListeners();
    setupNavigation();
    createPopupModal();
  } catch (err) {
    console.error('Inisialisasi gagal:', err);
    showAlert('Gagal memuat halaman. Cek konsol untuk detail.');
  }
});

// CSS javascript (sama seperti sebelumnya)
const style = document.createElement('style');
style.textContent = `
  /* === Filter Section === */
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

  .filter-group select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
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
    background: #5568d3;
  }

  .btn-filter:active {
    transform: translateY(1px);
  }

  .btn-reset {
    padding: 8px 20px;
    background: #95a5a6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 20px;
  }

  .btn-reset:hover {
    background: #7f8c8d;
  }

  /* === Styling tabel nilai === */
  table {
    border-collapse: collapse;
    width: 100%;
    border: 1px solid #000000ff;
  }

  th, td {
    border: 1px solid #000000ff;
    padding: 4px 6px;
    text-align: center;
  }

  th {
    background-color: #f7f7f7;
    font-weight: 600;
  }

  /* === Styling input nilai === */
  input[type="number"] {
    text-align: center;
    font-weight: bold;
    width: 60px;
    border: none;
    outline: none;
    -webkit-appearance: none !important;
    -moz-appearance: textfield !important;
    appearance: none !important;
  }

  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none !important;
    margin: 0 !important;
  }

  input[type="number"]:focus {
    border-bottom: 2px solid #0078d7;
  }

  /* === Tugas Cell dengan Icon === */
  .tugas-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .tugas-value {
    font-weight: 600;
    color: #2c3e50;
    min-width: 40px;
  }

  .tugas-detail-btn {
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 2px 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .tugas-detail-btn:hover {
    background: #2980b9;
    transform: scale(1.1);
  }

  /* === Popup Modal === */
  .popup-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9998;
    align-items: center;
    justify-content: center;
  }

  .popup-overlay.active {
    display: flex;
  }

  .popup-modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: popupSlideIn 0.3s ease-out;
  }

  @keyframes popupSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .popup-header {
    padding: 20px;
    border-bottom: 2px solid #ecf0f1;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .popup-title {
    font-size: 18px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0;
  }

  .popup-close-btn {
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .popup-close-btn:hover {
    background: #c0392b;
    transform: rotate(90deg);
  }

  .popup-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .tugas-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .tugas-item:hover {
    background: #e9ecef;
  }

  .tugas-label {
    font-weight: 600;
    color: #34495e;
    min-width: 80px;
  }

  .tugas-input {
    flex: 1;
    padding: 8px 12px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    transition: all 0.2s;
  }

  .tugas-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  .tugas-delete-btn {
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .tugas-delete-btn:hover {
    background: #c0392b;
    transform: scale(1.05);
  }

  .add-tugas-btn {
    width: 100%;
    padding: 12px;
    background: #27ae60;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    margin-top: 10px;
    transition: all 0.2s;
  }

  .add-tugas-btn:hover {
    background: #229954;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  }

  .popup-footer {
    padding: 20px;
    border-top: 2px solid #ecf0f1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .popup-rata {
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    color: #2c3e50;
    padding: 12px;
    background: #e8f5e9;
    border-radius: 8px;
  }

  .popup-rata-value {
    color: #27ae60;
    font-size: 24px;
  }

  .popup-save-btn {
    width: 100%;
    padding: 14px;
    background: #0d6efd;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 16px;
    transition: all 0.2s;
  }

  .popup-save-btn:hover {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 43, 237, 0.3);
  }

  /* === Badges === */
  .jenis-badge { 
    padding: 4px 12px; 
    border-radius: 20px; 
    font-size: 12px; 
    font-weight: 600; 
    display: inline-block; 
  }

  /* === Nilai Display === */
  .nilai-display {
    color: #000000ff;
    font-weight: 600;
  }

  /* === Empty State === */
  .tugas-empty {
    color: #95a5a6;
    font-style: italic;
  }
`;
document.head.appendChild(style);


/* ============================
   Popup Modal
   ============================ */
function createPopupModal() {
  const popupHTML = `
    <div id="tugasPopupOverlay" class="popup-overlay">
      <div class="popup-modal">
        <div class="popup-header">
          <h3 class="popup-title" id="popupTitle">Detail Tugas</h3>
          <button class="popup-close-btn" id="popupCloseBtn">✕</button>
        </div>
        <div class="popup-body" id="popupBody"></div>
        <div class="popup-footer">
          <div class="popup-rata">
            Rata-rata: <span class="popup-rata-value" id="popupRataValue">-</span>
          </div>
          <button class="popup-save-btn" id="popupSaveBtn">💾 Simpan & Tutup</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', popupHTML);
  document.getElementById('popupCloseBtn').addEventListener('click', closePopup);
  document.getElementById('popupSaveBtn').addEventListener('click', savePopupTugas);
  
  document.getElementById('tugasPopupOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'tugasPopupOverlay') closePopup();
  });
}

function openTugasPopup(siswa_id, mapel_id, siswa_nama, mapel_nama) {
  currentPopupData.siswa_id = siswa_id;
  currentPopupData.mapel_id = mapel_id;

  const existingTugas = allNilai.filter(n => 
    n.siswa_id === siswa_id && 
    n.mapel_id === mapel_id && 
    n.jenis === 'Tugas' &&
    n.kelas === filterKelas &&
    n.semester === filterSemester &&
    n.tahun_ajaran === filterTahunAjaran
  );

  currentPopupData.tugasList = existingTugas.map(t => ({
    id: t.id,
    nilai: t.nilai
  }));

  if (currentPopupData.tugasList.length === 0) {
    currentPopupData.tugasList.push({ id: null, nilai: '' });
  }

  document.getElementById('popupTitle').textContent = 
    `Detail Tugas: ${siswa_nama} - ${mapel_nama}`;

  renderPopupTugasItems();
  updatePopupRataRata();
  document.getElementById('tugasPopupOverlay').classList.add('active');
}

function closePopup() {
  document.getElementById('tugasPopupOverlay').classList.remove('active');
  currentPopupData = { siswa_id: null, mapel_id: null, tugasList: [] };
}

function renderPopupTugasItems() {
  const popupBody = document.getElementById('popupBody');
  popupBody.innerHTML = '';

  currentPopupData.tugasList.forEach((tugas, index) => {
    const tugasItem = document.createElement('div');
    tugasItem.className = 'tugas-item';
    tugasItem.innerHTML = `
      <span class="tugas-label">Tugas ${index + 1}:</span>
      <input 
        type="number" 
        class="tugas-input" 
        value="${tugas.nilai}" 
        min="0" 
        max="100" 
        placeholder="0-100"
        data-index="${index}"
      />
      ${currentPopupData.tugasList.length > 1 ? 
        `<button class="tugas-delete-btn" data-index="${index}">🗑️</button>` : 
        ''}
    `;
    popupBody.appendChild(tugasItem);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'add-tugas-btn';
  addBtn.textContent = '+ Tambah Tugas Baru';
  addBtn.addEventListener('click', addNewTugas);
  popupBody.appendChild(addBtn);

  attachPopupEventListeners();
}

function attachPopupEventListeners() {
  document.querySelectorAll('.tugas-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const index = parseInt(e.target.dataset.index);
      let val = parseFloat(e.target.value);
      
      if (isNaN(val)) {
        currentPopupData.tugasList[index].nilai = '';
      } else {
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        e.target.value = val;
        currentPopupData.tugasList[index].nilai = val;
      }

      updatePopupRataRata();
    });
  });

  document.querySelectorAll('.tugas-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      currentPopupData.tugasList.splice(index, 1);
      renderPopupTugasItems();
      updatePopupRataRata();
    });
  });
}

function addNewTugas() {
  currentPopupData.tugasList.push({ id: null, nilai: '' });
  renderPopupTugasItems();
}

function updatePopupRataRata() {
  const validNilai = currentPopupData.tugasList
    .map(t => parseFloat(t.nilai))
    .filter(n => !isNaN(n) && n >= 0 && n <= 100);

  let rataRata = '-';
  if (validNilai.length > 0) {
    const sum = validNilai.reduce((acc, n) => acc + n, 0);
    rataRata = (sum / validNilai.length).toFixed(2);
  }

  document.getElementById('popupRataValue').textContent = rataRata;
}

async function savePopupTugas() {
  try {
    const { siswa_id, mapel_id, tugasList } = currentPopupData;

    if (!siswa_id || !mapel_id) {
      showAlert('⚠️ Data tidak valid');
      return;
    }

    const validTugas = tugasList.filter(t => {
      const nilai = parseFloat(t.nilai);
      return !isNaN(nilai) && nilai >= 0 && nilai <= 100;
    });

    if (validTugas.length === 0) {
      showAlert('⚠️ Minimal 1 tugas harus diisi dengan nilai valid (0-100)');
      return;
    }

    // ✅ REMOVED CONFIRM - Langsung proses
    const existingTugas = allNilai.filter(n => 
      n.siswa_id === siswa_id && 
      n.mapel_id === mapel_id && 
      n.jenis === 'Tugas' &&
      n.kelas === filterKelas &&
      n.semester === filterSemester &&
      n.tahun_ajaran === filterTahunAjaran
    );

    for (const tugas of existingTugas) {
      try {
        await invokeCommand('delete_nilai', { id: tugas.id });
      } catch (err) {
        console.error('Error deleting tugas:', err);
      }
    }

    for (const tugas of validTugas) {
      const req = {
        siswa_id,
        mapel_id,
        kelas: filterKelas,
        semester: filterSemester,
        tahun_ajaran: filterTahunAjaran,
        jenis: 'Tugas',
        nilai: parseFloat(tugas.nilai),
        tanggal_input: null
      };

      await invokeCommand('add_nilai', { req });
    }

    await loadFilteredData();
    renderTabelInputNilai();
    renderRiwayatNilai();
    closePopup();

    showAlert(`✅ Berhasil menyimpan ${validTugas.length} tugas!`);

  } catch (err) {
    console.error('Error saving popup tugas:', err);
    showAlert('❌ Gagal menyimpan tugas: ' + extractUserFriendlyMessage(err));
  }
}

/* ============================
   Utilities
   ============================ */
function extractUserFriendlyMessage(error) {
  let message = '';
  
  if (error && typeof error === 'object' && error.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    return 'Terjadi kesalahan yang tidak diketahui';
  }

  const technicalPrefixes = [
    /^Error:\s*/gi,
    /^Error invoking remote method '[^']+?':\s*/gi,
    /^Error:\s*Error:\s*/gi,
  ];

  for (const pattern of technicalPrefixes) {
    message = message.replace(pattern, '');
  }

  message = message.trim();
  return message || 'Terjadi kesalahan yang tidak diketahui';
}

function showAlert(message, originalError = null) {
  if (originalError) console.error('Error Detail:', originalError);
  alert(message);
}

function getRataRataTugas(siswa_id, mapel_id) {
  const tugasList = allNilai.filter(n => 
    n.siswa_id === siswa_id && 
    n.mapel_id === mapel_id && 
    n.jenis === 'Tugas' &&
    n.kelas === filterKelas &&
    n.semester === filterSemester &&
    n.tahun_ajaran === filterTahunAjaran
  );

  if (tugasList.length === 0) return null;

  const sum = tugasList.reduce((acc, t) => acc + t.nilai, 0);
  const avg = sum / tugasList.length;
  return Math.round(avg * 100) / 100;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function debounce(fn, wait) {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function showLoading(show) {
  const tbody = document.getElementById('nilaiInputTableBody');
  const tbodyRiwayat = document.getElementById('nilaiTableBody');
  
  if (show) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center; padding:30px;">
            <div class="d-flex justify-content-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <p class="text-muted mt-3">Pastikan anda sudah atur filter Kelas dan Semester lebih dulu...</p>
          </td>
        </tr>
      `;
    }

    if (tbodyRiwayat) {
      tbodyRiwayat.innerHTML = `
        <tr>
          <td colspan="11" style="text-align:center; padding:30px;">
            <div class="d-flex justify-content-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <p class="text-muted mt-3">Pastikan anda sudah atur filter Kelas dan Semester lebih dulu...</p>
          </td>
        </tr>
      `;
    }
  }
}

/* ============================
   Initialization
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
      
      const kelasEl = document.getElementById('filterKelas');
      const semEl = document.getElementById('filterSemester');
      const taEl = document.getElementById('filterTahunAjaran');
      
      if (kelasEl) kelasEl.value = filterKelas;
      if (semEl) semEl.value = filterSemester;
      if (taEl) taEl.value = filterTahunAjaran;
    } else {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      filterTahunAjaran = currentMonth >= 7 
        ? `${currentYear}/${currentYear + 1}` 
        : `${currentYear - 1}/${currentYear}`;
      filterSemester = currentMonth >= 7 ? 1 : 2;
      
      const taEl = document.getElementById('filterTahunAjaran');
      const semEl = document.getElementById('filterSemester');
      if (taEl) taEl.value = filterTahunAjaran;
      if (semEl) semEl.value = filterSemester;
    }
    
    await applyFilters();
  } catch (err) {
    console.error('Error initializing page:', err);
    throw err;
  } finally {
    showLoading(false);
  }
}

async function loadInitialData() {
  try {
    const [siswaData, mapelData, tahunAjaranData] = await Promise.all([
      invokeCommand('get_all_siswa'),
      invokeCommand('get_all_mapel'),
      invokeCommand('get_daftar_tahun_ajaran')
    ]);

    allSiswa = Array.isArray(siswaData) ? siswaData : [];
    allMapel = Array.isArray(mapelData) ? mapelData : [];
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

async function loadFilteredData() {
  try {
    if (filterKelas && filterSemester) {
      const jenisData = await invokeCommand('get_jenis_nilai_input', {
        kelas: filterKelas,
        semester: filterSemester
      });
      
      if (Array.isArray(jenisData)) {
        if (jenisData.length > 0 && typeof jenisData[0] === 'object') {
          allJenisNilai = jenisData.map(j => String(j.nama_jenis || j.nama || j)).filter(Boolean);
        } else {
          allJenisNilai = jenisData.map(String);
        }
      } else {
        allJenisNilai = ['Tugas', 'UTS', 'UAS'];
      }
    } else {
      allJenisNilai = ['Tugas', 'UTS', 'UAS'];
    }

    const nilaiData = await invokeCommand('get_all_nilai');
    allNilai = Array.isArray(nilaiData) ? nilaiData : [];

    if (filterKelas || filterSemester || filterTahunAjaran) {
      allNilai = allNilai.filter(n => {
        let match = true;
        if (filterKelas) match = match && n.kelas === filterKelas;
        if (filterSemester) match = match && n.semester === filterSemester;
        if (filterTahunAjaran) match = match && n.tahun_ajaran === filterTahunAjaran;
        return match;
      });
    }
  } catch (err) {
    console.error('loadFilteredData error:', err);
    throw err;
  }
}

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
    return;
  }

  filterKelas = kelasSelect.value || null;
  filterSemester = semesterSelect.value ? parseInt(semesterSelect.value) : null;
  filterTahunAjaran = tahunAjaranSelect.value || null;

  const params = new URLSearchParams();
  params.set('kelas', filterKelas);
  params.set('semester', filterSemester);
  params.set('tahun', filterTahunAjaran);
  window.history.replaceState({}, '', `?${params.toString()}`);

  showLoading(true);
  try {
    await loadFilteredData();
    renderTabelInputNilai();
    renderRiwayatNilai();
  } catch (err) {
    console.error('Error applying filters:', err);
    showAlert('❌ Gagal menerapkan filter: ' + extractUserFriendlyMessage(err));
  } finally {
    showLoading(false);
  }
}

async function resetFilters() {
  filterKelas = null;
  filterSemester = null;
  filterTahunAjaran = null;

  document.getElementById('filterKelas').value = '';
  document.getElementById('filterSemester').value = '';
  document.getElementById('filterTahunAjaran').value = '';

  window.history.replaceState({}, '', window.location.pathname);

  allNilai = [];
  allJenisNilai = [];

  renderTabelInputNilai();
  renderRiwayatNilai();
}

/* ============================
   Render Tabel Input Nilai (Layout v7)
   ============================ */
function renderTabelInputNilai() {
  const thead = document.getElementById('nilaiInputTableHead');
  const tbody = document.getElementById('nilaiInputTableBody');

  if (!thead || !tbody) {
    console.error('Element tidak ditemukan!');
    return;
  }

  thead.innerHTML = '';
  tbody.innerHTML = '';

  if (!filterKelas || !filterSemester || !filterTahunAjaran) {
    tbody.innerHTML = `<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;
    return;
  }

  if (!allSiswa.length || !allMapel.length || !allJenisNilai.length) {
    tbody.innerHTML = `<tr><td colspan="999">⚠️ Data belum tersedia.</td></tr>`;
    return;
  }

  const filteredSiswa = allSiswa.filter(s => s.kelas === filterKelas);

  if (filteredSiswa.length === 0) {
    tbody.innerHTML = `<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📭 Tidak ada siswa di kelas <strong>${filterKelas}</strong>
    </td></tr>`;
    return;
  }

  // HEADER ROW 1: Nama Mapel (colspan = jumlah jenis nilai)
  const row1 = document.createElement('tr');
  row1.innerHTML = `
    <th rowspan="2">No</th>
    <th rowspan="2">NIS</th>
    <th rowspan="2">NISN</th>
    <th rowspan="2">Nama Siswa</th>
  `;
  
  allMapel.forEach(mapel => {
    const th = document.createElement('th');
    th.colSpan = allJenisNilai.length;
    th.innerHTML = `${mapel.nama_mapel}<br><small>KKM: ${mapel.kkm}</small>`;
    row1.appendChild(th);
  });
  
  thead.appendChild(row1);

  // HEADER ROW 2: Jenis Nilai (Tugas, UTS, UAS, dll)
  const row2 = document.createElement('tr');
  allMapel.forEach(() => {
    allJenisNilai.forEach(jenis => {
      const th = document.createElement('th');
      th.textContent = jenis;
      row2.appendChild(th);
    });
  });
  thead.appendChild(row2);

  // BODY: Siswa Rows dengan Input/Display
  const nilaiMap = {};
  allNilai.forEach(n => {
    if (n.jenis !== 'Tugas') {
      const key = `${n.siswa_id}_${n.mapel_id}_${n.jenis}`;
      nilaiMap[key] = { id: n.id, nilai: n.nilai };
    }
  });
  
  filteredSiswa.forEach((siswa, idx) => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${siswa.nis}</td>
      <td>${siswa.nisn}</td>
      <td>${siswa.nama}</td>
    `;
    
    let hasAnyValue = false;

    allMapel.forEach(mapel => {
      allJenisNilai.forEach(jenis => {
        const td = document.createElement('td');
        
        if (jenis === 'Tugas') {
          const rataRata = getRataRataTugas(siswa.id, mapel.id);
          
          const cellDiv = document.createElement('div');
          cellDiv.className = 'tugas-cell';
          
          const valueSpan = document.createElement('span');
          valueSpan.className = 'tugas-value';
          valueSpan.textContent = rataRata !== null ? rataRata : '-';
          if (rataRata === null) {
            valueSpan.classList.add('tugas-empty');
          }
          
          const detailBtn = document.createElement('button');
          detailBtn.className = 'tugas-detail-btn';
          detailBtn.textContent = '📋';
          detailBtn.title = 'Detail Tugas';
          detailBtn.addEventListener('click', () => {
            openTugasPopup(siswa.id, mapel.id, siswa.nama, mapel.nama_mapel);
          });
          
          cellDiv.appendChild(valueSpan);
          cellDiv.appendChild(detailBtn);
          td.appendChild(cellDiv);
          
          if (rataRata !== null) hasAnyValue = true;
        } else {
          const key = `${siswa.id}_${mapel.id}_${jenis}`;
          const existing = nilaiMap[key];
          
          const input = document.createElement('input');
          input.type = 'number';
          input.min = '0';
          input.max = '100';
          input.placeholder = '0';
          input.dataset.siswaId = siswa.id;
          input.dataset.mapelId = mapel.id;
          input.dataset.jenis = jenis;
          input.dataset.kelas = filterKelas;
          input.dataset.semester = filterSemester;
          input.dataset.tahunAjaran = filterTahunAjaran;
          input.name = key;

          if (existing) {
            input.value = existing.nilai;
            input.dataset.nilaiId = existing.id;
            hasAnyValue = true;
          }
          
          input.addEventListener('input', function() {
            let v = parseFloat(this.value);
            if (isNaN(v)) this.value = '';
            else if (v < 0) this.value = '0';
            else if (v > 100) this.value = '100';
          });
          
          td.appendChild(input);
        }
        
        tr.appendChild(td);
      });
    });
    
    tbody.appendChild(tr);
  });

}

/* ============================
   Render Riwayat Nilai (Layout v7 - Matching Input Nilai)
   ============================ */
function renderRiwayatNilai() {
  const tbody = document.getElementById('nilaiTableBody');

  if (!tbody) {
    console.error('Element #nilaiTableBody tidak ditemukan!');
    return;
  }

  const table = tbody.closest('table');
  const thead = table ? table.querySelector('thead') : null;

  if (!thead) {
    console.warn('Element thead tidak ditemukan');
    renderRiwayatNilaiSimple();
    return;
  }

  thead.innerHTML = '';
  tbody.innerHTML = '';

  if (!filterKelas || !filterSemester || !filterTahunAjaran) {
    tbody.innerHTML = `<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;
    return;
  }

  if (!allSiswa.length || !allMapel.length || !allJenisNilai.length) {
    tbody.innerHTML = `<tr><td colspan="999">⚠️ Data belum tersedia.</td></tr>`;
    return;
  }

  const filteredSiswa = allSiswa.filter(s => s.kelas === filterKelas);

  if (filteredSiswa.length === 0) {
    tbody.innerHTML = `<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📭 Tidak ada siswa di kelas <strong>${filterKelas}</strong>
    </td></tr>`;
    return;
  }

  // HEADER ROW 1: Nama Mapel (colspan = jumlah jenis nilai)
  const row1 = document.createElement('tr');
  row1.innerHTML = `
    <th rowspan="2">No</th>
    <th rowspan="2">NIS</th>
    <th rowspan="2">NISN</th>
    <th rowspan="2">Nama Siswa</th>
  `;
  
  allMapel.forEach(mapel => {
    const th = document.createElement('th');
    th.colSpan = allJenisNilai.length;
    th.innerHTML = `${mapel.nama_mapel}<br><small>KKM: ${mapel.kkm}</small>`;
    row1.appendChild(th);
  });

  const thAksi = document.createElement('th');
  thAksi.rowSpan = 2;
  thAksi.textContent = 'Aksi';
  row1.appendChild(thAksi);
  
  thead.appendChild(row1);

  // HEADER ROW 2: Jenis Nilai (Tugas, UTS, UAS, dll)
  const row2 = document.createElement('tr');
  allMapel.forEach(() => {
    allJenisNilai.forEach(jenis => {
      const th = document.createElement('th');
      th.textContent = jenis;
      row2.appendChild(th);
    });
  });
  thead.appendChild(row2);

  // BODY: Siswa Rows dengan Nilai (Display Only)
  const filteredNilai = allNilai.filter(n => 
    n.kelas === filterKelas && 
    String(n.semester) === String(filterSemester) && 
    n.tahun_ajaran === filterTahunAjaran
  );

  const nilaiMap = {};
  filteredNilai.forEach(n => {
    if (n.jenis !== 'Tugas') {
      const key = `${n.siswa_id}_${n.mapel_id}_${n.jenis}`;
      nilaiMap[key] = { id: n.id, nilai: n.nilai };
    }
  });
  
  filteredSiswa.forEach((siswa, idx) => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${siswa.nis}</td>
      <td>${siswa.nisn}</td>
      <td>${escapeHtml(siswa.nama)}</td>
    `;
    
    let hasAnyValue = false;

    allMapel.forEach(mapel => {
      allJenisNilai.forEach(jenis => {
        const td = document.createElement('td');
        
        if (jenis === 'Tugas') {
          const rataRata = getRataRataTugas(siswa.id, mapel.id);
          
          if (rataRata !== null) {
            hasAnyValue = true;
            td.innerHTML = `<span class="nilai-display">${rataRata}</span>`;
          } else {
            td.innerHTML = `<span style="color: #999;">-</span>`;
          }
        } else {
          const key = `${siswa.id}_${mapel.id}_${jenis}`;
          const existing = nilaiMap[key];
          
          if (existing) {
            hasAnyValue = true;
            td.innerHTML = `
              <span class="nilai-display" title="ID: ${existing.id}">
                ${existing.nilai}
              </span>
            `;
            td.dataset.nilaiId = existing.id;
          } else {
            td.innerHTML = `<span style="color: #999;">-</span>`;
          }
        }
        
        tr.appendChild(td);
      });
    });

    // Kolom Aksi
    const tdAksi = document.createElement('td');
    if (hasAnyValue) {
      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-action btn-delete';
      btnDelete.textContent = '🗑️ Hapus Semua';
      btnDelete.type = 'button'; 
      btnDelete.dataset.siswaId = siswa.id;
      btnDelete.dataset.kelas = filterKelas;
      btnDelete.dataset.semester = filterSemester;
      btnDelete.dataset.tahunAjaran = filterTahunAjaran;
      tdAksi.appendChild(btnDelete);
    } else {
      tdAksi.innerHTML = `<span style="color: #ccc;">-</span>`;
    }
    
    tr.appendChild(tdAksi);
    tbody.appendChild(tr);
  });

  attachDeleteHandlersBulk();
}

function renderRiwayatNilaiSimple() {
  const tbody = document.getElementById('nilaiTableBody');
  
  tbody.innerHTML = '';

  if (!filterKelas || !filterSemester || !filterTahunAjaran) {
    tbody.innerHTML = `<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;
    return;
  }

  const filteredNilai = allNilai.filter(n => 
    n.kelas === filterKelas && 
    String(n.semester) === String(filterSemester) && 
    n.tahun_ajaran === filterTahunAjaran
  );

  if (filteredNilai.length === 0) {
    tbody.innerHTML = `<tr>
      <td colspan="8" style="text-align:center; padding:30px; color:#999;">
        📭 Belum ada data nilai tersimpan untuk filter yang dipilih.
      </td>
    </tr>`;
    return;
  }

  const frag = document.createDocumentFragment();

  filteredNilai.forEach(item => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${escapeHtml(item.nama_siswa || '-')}</td>
      <td>${escapeHtml(item.kelas || '-')}</td>
      <td>${escapeHtml(String(item.semester || '-'))}</td>
      <td>${escapeHtml(item.tahun_ajaran || '-')}</td>
      <td>${escapeHtml(item.nama_mapel || '-')}</td>
      <td><span class="jenis-badge">${escapeHtml(item.jenis || '-')}</span></td>
      <td><span class="nilai-display">${escapeHtml(String(item.nilai || '-'))}</span></td>
      <td>
        <button class="btn-action btn-delete" data-id="${item.id}">🗑️</button>
      </td>
    `;
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
  attachDeleteHandlers();
}

/* ============================
   Save All Values (Batch)
   ============================ */
async function handleSaveAll(event) {
  event.preventDefault();
  
  if (isSaving) {
    return showAlert('⏳ Sedang menyimpan, tunggu hingga proses selesai...');
  }

  if (!filterKelas || !filterSemester || !filterTahunAjaran) {
    return showAlert('⚠️ Silakan pilih Kelas, Semester, dan Tahun Ajaran terlebih dahulu!');
  }

  const form = document.getElementById('nilaiTableForm');
  if (!form) {
    console.error('Form #nilaiTableForm tidak ditemukan.');
    return;
  }

  const inputs = Array.from(form.querySelectorAll('input[type="number"]'));
  const payload = [];

  for (const input of inputs) {
    if (input.closest('tr')?.style.display === 'none') continue;

    const siswaId = parseInt(input.dataset.siswaId, 10);
    const mapelId = parseInt(input.dataset.mapelId, 10);
    const jenis = input.dataset.jenis;
    const kelas = input.dataset.kelas;
    const semester = parseInt(input.dataset.semester, 10);
    const tahunAjaran = input.dataset.tahunAjaran;
    const nilaiRaw = input.value.trim();

    if (nilaiRaw === '') continue;

    const nilaiNum = Number(nilaiRaw);
    if (!Number.isFinite(nilaiNum) || nilaiNum < VALID_NILAI_MIN || nilaiNum > VALID_NILAI_MAX) {
      showAlert(`⚠️ Nilai tidak valid. Pastikan 0–100.`);
      input.focus();
      return;
    }

    payload.push({
      siswa_id: siswaId,
      mapel_id: mapelId,
      kelas,
      semester,
      tahun_ajaran: tahunAjaran,
      jenis,
      nilai: nilaiNum,
      tanggal_input: null
    });
  }

  if (payload.length === 0) {
    return showAlert('⚠️ Tidak ada nilai yang diisi.');
  }

  // ✅ REMOVED CONFIRM - Langsung proses
  isSaving = true;
  const submitBtn = document.querySelector('#nilaiTableForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Menyimpan...';
  }

  try {
    let successCount = 0;
    let failCount = 0;

    for (const data of payload) {
      try {
        await invokeCommand('add_nilai', { req: data });
        successCount++;
      } catch (err) {
        console.error('Error saving nilai:', err);
        failCount++;
      }
    }

    if (failCount === 0) {
      showAlert(`✅ Berhasil menyimpan ${successCount} nilai!`);
    } else {
      showAlert(`⚠️ Berhasil: ${successCount}, Gagal: ${failCount}`);
    }

    await loadFilteredData();
    renderTabelInputNilai();
    renderRiwayatNilai();
  } catch (err) {
    console.error('handleSaveAll error:', err);
    showAlert('❌ Gagal menyimpan nilai: ' + extractUserFriendlyMessage(err));
  } finally {
    isSaving = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Simpan Semua Nilai';
    }
  }
}

/* ============================
   Delete Handler
   ============================ */
function attachDeleteHandlers() {
  const deletes = document.querySelectorAll('.btn-delete');
  deletes.forEach(btn => {
    btn.removeEventListener('click', onDeleteClick);
    btn.addEventListener('click', onDeleteClick);
  });

  async function onDeleteClick(e) {
    const id = parseInt(e.currentTarget.dataset.id, 10);
    if (!Number.isFinite(id)) return showAlert('⚠️ ID tidak valid untuk penghapusan.');

    // ✅ TETAP PAKAI CONFIRM untuk delete
    if (!confirm('⚠️ Yakin ingin menghapus data nilai ini?')) return;

    try {
      await invokeCommand('delete_nilai', { id });
      showAlert('✅ Nilai berhasil dihapus.');
      await loadFilteredData();
      renderRiwayatNilai();
      renderTabelInputNilai();
    } catch (err) {
      console.error('Delete error:', err);
      showAlert('❌ Gagal menghapus nilai: ' + extractUserFriendlyMessage(err));
    }
  }
}

function attachDeleteHandlersBulk() {
  const deleteBtns = document.querySelectorAll('#nilaiTableBody .btn-delete');
  deleteBtns.forEach(btn => {
    btn.removeEventListener('click', onBulkDeleteClick);
    btn.addEventListener('click', onBulkDeleteClick);
  });

  async function onBulkDeleteClick(e) {
    e.preventDefault();
    
    const siswaId = parseInt(e.currentTarget.dataset.siswaId, 10);
    const kelas = e.currentTarget.dataset.kelas;
    const semester = parseInt(e.currentTarget.dataset.semester, 10);
    const tahunAjaran = e.currentTarget.dataset.tahunAjaran;

    if (!Number.isFinite(siswaId)) {
      return showAlert('⚠️ ID siswa tidak valid.');
    }

    // ✅ TETAP PAKAI CONFIRM untuk bulk delete
    if (!confirm('⚠️ Yakin ingin menghapus SEMUA nilai siswa ini?')) return;

    try {
      const nilaiToDelete = allNilai.filter(n =>
        n.siswa_id === siswaId &&
        n.kelas === kelas &&
        n.semester === semester &&
        n.tahun_ajaran === tahunAjaran
      );

      if (nilaiToDelete.length === 0) {
        return showAlert('⚠️ Tidak ada nilai untuk dihapus.');
      }

      for (const nilai of nilaiToDelete) {
        await invokeCommand('delete_nilai', { id: nilai.id });
      }

      showAlert(`✅ Berhasil menghapus ${nilaiToDelete.length} nilai siswa.`);
      await loadFilteredData();
      renderRiwayatNilai();
      renderTabelInputNilai();
    } catch (err) {
      console.error('Bulk delete error:', err);
      showAlert('❌ Gagal menghapus nilai: ' + extractUserFriendlyMessage(err));
    }
  }
}

/* ============================
   Event Listeners
   ============================ */
function setupEventListeners() {
  const form = document.getElementById('nilaiTableForm');
  if (form) {
    form.removeEventListener('submit', handleSaveAll);
    form.addEventListener('submit', handleSaveAll);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.removeEventListener('click', onLogout);
    logoutBtn.addEventListener('click', onLogout);
  }
}

async function onLogout() {
  if (!confirm('📝 Apakah kamu yakin ingin keluar dari aplikasi?')) return;
  
  try {
    window.location.href = 'login.html';
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = 'login.html';
  }
}

/* ============================
   Navigation
   ============================ */
function setupNavigation() {
  const currentPage = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-item");
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (currentPage === href || (currentPage === "" && href === "index-penilaian.html")) {
      link.classList.add("active");
    }
    link.addEventListener('click', (e) => {
      document.querySelector('.nav-item.active')?.classList.remove('active');
      e.currentTarget.classList.add('active');
    });
  });
}

/* ============================
   Global Exports
   ============================ */
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.openTugasPopup = openTugasPopup;
window.closePopup = closePopup;