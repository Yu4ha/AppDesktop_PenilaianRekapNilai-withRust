/**
 * kelulusan.js - Fixed for Tauri (Auto-load + Client-side Filter)
 * ============================================
 * Frontend Logic untuk Halaman Laporan Kelulusan
 * 
 * Fitur:
 * - Auto-load semua data kelulusan saat halaman dibuka
 * - Filter client-side (Kelas 6 + Tahun Ajaran)
 * - Tampilkan data kelulusan (akumulasi 6 semester + Ujian Sekolah)
 * - Ranking siswa berdasarkan nilai akhir kelulusan
 * - Statistik kelulusan (lulus/tidak lulus)
 * ============================================
 */

// ==========================
// TAURI HELPER
// ==========================
const { invoke } = window.__TAURI__.tauri;

/**
 * Helper untuk invoke Tauri command dengan auto-unwrap ApiResponse
 */
async function invokeCommand(cmd, args = {}) {
  try {
    console.log(`🔄 Invoking: ${cmd}`, args);
    
    // Timeout 30 detik
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout: ${cmd} took too long (>30s)`)), 30000)
    );
    
    const invokePromise = invoke(cmd, args);
    
    const response = await Promise.race([invokePromise, timeoutPromise]);
    
    console.log(`✅ Response from ${cmd}:`, response);
    
    if (!response.success) {
      throw new Error(response.error || 'Command failed');
    }
    return response.data;
  } catch (error) {
    console.error(`❌ Error invoking ${cmd}:`, error);
    throw error;
  }
}

// ==========================
// STATE & FILTER
// ==========================
let currentFilter = {
  kelas: null,
  tahun_ajaran: null
};

let allLaporanKelulusan = []; // Data mentah dari backend
let isLoading = false;

// ==========================
// INIT & LOAD DATA
// ==========================
(async () => {
  try {
    await initFilterControls();
    
    // ⭐ AUTO-LOAD semua data saat halaman dibuka
    console.log('🚀 Auto-loading semua data kelulusan...');
    await loadLaporanKelulusan();
    
    initRefreshButton();
    console.log('✅ Init complete with auto-loaded data');
  } catch (err) {
    console.error('Gagal inisialisasi halaman kelulusan:', err);
    showNotification('error', 'Gagal memuat halaman kelulusan');
  }
})();

// ==========================
// CSS STYLES
// ==========================
const style = document.createElement('style');
style.textContent = `

  /* ✅ RANKING BADGE STYLES - LARGER */
  .ranking-badge {
    display: inline-block;
    padding: 10px 16px;       
    border-radius: 8px;
    font-weight: 800;
    font-size: 16px;         
    min-width: 70px;          
    text-align: center;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .ranking-gold {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #b8860b;
    border: 2px solid #ffc107;
    font-size: 17px;         
    animation: pulse-gold 0.5s infinite;
  }

  .ranking-silver {
    background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
    color: #555;
    border: 2px solid #9e9e9e;
    font-size: 17px;         
  }

  .ranking-bronze {
    background: linear-gradient(135deg, #cd7f32 0%, #e6a85c 100%);
    color: #654321;
    border: 2px solid #b8732d;
    font-size: 17px;          
  }

  .ranking-default {
    background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%);
    color: #424242;
    border: 1px solid #bdbdbd;
  }

  @keyframes pulse-gold {
    0%, 100% {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    50% {
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
      transform: scale(1.07);
    }
  }
 `;

document.head.appendChild(style);

// ==========================
// INIT FILTER CONTROLS
// ==========================
async function initFilterControls() {
  try {
    // Get tahun ajaran aktif & daftar tahun ajaran
    const tahunAjaranAktif = await invokeCommand('get_tahun_ajaran_aktif');
    const daftarTahunAjaran = await invokeCommand('get_daftar_tahun_ajaran');
    const allSiswa = await invokeCommand('get_all_siswa');

    currentFilter.tahun_ajaran = tahunAjaranAktif;

    // Filter hanya siswa kelas 6
    const siswaKelas6 = allSiswa.filter(s => {
      const tingkat = parseInt(String(s.kelas).charAt(0));
      return tingkat === 6;
    });

    // Ekstrak unique kelas 6 (6A, 6B, 6C, dst)
    const uniqueKelas6 = [...new Set(siswaKelas6.map(s => s.kelas))]
      .filter(k => k)
      .sort((a, b) => String(a).localeCompare(String(b)));

    // Build kelas dropdown options
    let kelasOptions = '<option value="">Semua Kelas 6</option>';
    uniqueKelas6.forEach(kelas => {
      kelasOptions += `<option value="${kelas}">Kelas ${kelas}</option>`;
    });

    // Build tahun ajaran options
    let tahunAjaranOptions = '';
    if (daftarTahunAjaran && daftarTahunAjaran.length > 0) {
      tahunAjaranOptions = daftarTahunAjaran.map(ta => 
        `<option value="${ta}" ${ta === tahunAjaranAktif ? 'selected' : ''}>${ta}</option>`
      ).join('');
    } else {
      tahunAjaranOptions = `<option value="${tahunAjaranAktif}" selected>${tahunAjaranAktif}</option>`;
    }

    // Create filter UI
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container mb-4';
    filterContainer.innerHTML = `
      <div class="row g-3 align-items-end">
        <div class="col-md-4">
          <label class="form-label fw-semibold">
            🏫 Kelas:
          </label>
          <select id="filterKelas" class="form-select">
            ${kelasOptions}
          </select>
        </div>
        
        <div class="col-md-4">
          <label class="form-label fw-semibold">
            📆 Tahun Ajaran:
          </label>
          <select id="filterTahunAjaran" class="form-select">
            ${tahunAjaranOptions}
          </select>
        </div>
        
        <div class="col-md-4">
          <button id="btnApplyFilter" class="btn btn-primary w-100">
            <i class="bi bi-funnel"></i> Terapkan Filter
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
    document.getElementById('btnApplyFilter').addEventListener('click', applyClientSideFilter);
    
    // Apply on change (real-time filter)
    document.getElementById('filterKelas')?.addEventListener('change', applyClientSideFilter);
    document.getElementById('filterTahunAjaran')?.addEventListener('change', applyClientSideFilter);

    console.log('✅ Filter controls initialized');

  } catch (err) {
    console.error('Gagal init filter controls:', err);
    showNotification('error', 'Gagal inisialisasi filter: ' + err.message);
  }
}

// ==========================
// APPLY CLIENT-SIDE FILTER
// ==========================
function applyClientSideFilter() {
  try {
    const filterKelas = document.getElementById('filterKelas');
    const filterTahunAjaran = document.getElementById('filterTahunAjaran');

    currentFilter.kelas = filterKelas.value || null;
    currentFilter.tahun_ajaran = filterTahunAjaran.value;

    console.log('Applying client-side filter:', currentFilter);

    // Filter data yang sudah ada di memory
    let filteredData = [...allLaporanKelulusan];

    // Filter by kelas
    if (currentFilter.kelas) {
      filteredData = filteredData.filter(s => s.kelas === currentFilter.kelas);
    }

    // Filter by tahun ajaran (jika diperlukan di masa depan)
    // if (currentFilter.tahun_ajaran) {
    //   filteredData = filteredData.filter(s => s.tahun_ajaran === currentFilter.tahun_ajaran);
    // }

    // Sort by nilai akhir tertinggi
    filteredData.sort((a, b) => {
      const nilaiA = getNilaiAkhirRataRata(a);
      const nilaiB = getNilaiAkhirRataRata(b);
      return nilaiB - nilaiA;
    });

    // Add ranking
    filteredData.forEach((siswa, index) => {
      siswa.ranking = index + 1;
    });

    // Update UI
    updateStatsBoxes(filteredData);
    updateFilterInfo(filteredData);
    renderTabelKelulusan(filteredData);

    showNotification('success', 'Filter berhasil diterapkan');

  } catch (err) {
    console.error('Gagal apply filter:', err);
    showNotification('error', 'Gagal menerapkan filter: ' + err.message);
  }
}

// ==========================
// LOAD LAPORAN KELULUSAN (BACKEND)
// ==========================
async function loadLaporanKelulusan() {
  if (isLoading) {
    console.warn('⚠️ Already loading, skipping duplicate call');
    return;
  }

  isLoading = true;

  try {
    console.log('📡 Loading laporan kelulusan from backend...');
    console.time('Load Duration');

    // Show loading indicator
    const tableBody = document.querySelector('.table tbody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 mb-0 text-muted">Memuat data kelulusan...</p>
          </td>
        </tr>
      `;
    }

    // Call backend dengan Tauri API
    const data = await invokeCommand('hitung_statistik_kelulusan');
    console.log('✅ JSON.stringify data:', JSON.stringify(data, null, 2));
    console.log('✅ Raw data:', data);
    console.log('✅ Data type:', typeof data);
    console.log('✅ Data.detail:', data?.detail);
    console.log('✅ Data keys:', Object.keys(data || {}));

    console.timeEnd('Load Duration');

    console.log('✅ Statistik kelulusan loaded:', data);

    if (!data) {
      throw new Error('Gagal memuat data kelulusan dari backend');
    }

    // Simpan data mentah
    allLaporanKelulusan = data.detail || [];

    // Apply filter client-side
    applyClientSideFilter();

    console.log('✅ Laporan kelulusan loaded successfully');

  } catch (err) {
    console.error('❌ Gagal load laporan kelulusan:', err);
    showNotification('error', 'Gagal memuat data kelulusan: ' + err.message);
    
    const tableBody = document.querySelector('.table tbody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
            <p class="mt-2 mb-0">Gagal memuat data</p>
            <small class="text-muted">${err.message}</small>
          </td>
        </tr>
      `;
    }
  } finally {
    isLoading = false;
  }
}

// ==========================
// HELPER: GET NILAI AKHIR RATA-RATA
// ==========================
function getNilaiAkhirRataRata(siswa) {
  if (!siswa.hasil_per_mapel || siswa.hasil_per_mapel.length === 0) {
    return 0;
  }

  const totalNilai = siswa.hasil_per_mapel.reduce((sum, mapel) => {
    return sum + (mapel.nilai_akhir || 0);
  }, 0);

  return totalNilai / siswa.hasil_per_mapel.length;
}

// ==========================
// UPDATE STATS BOXES
// ==========================
function updateStatsBoxes(filteredData) {
  const statsBox = document.querySelector('.stats-container');
  if (!statsBox) return;

  const totalSiswa = filteredData.length;
  const siswaLulus = filteredData.filter(s => s.status_kelulusan === 'LULUS').length;
  const siswaTidakLulus = totalSiswa - siswaLulus;
  const persenLulus = totalSiswa > 0 ? ((siswaLulus / totalSiswa) * 100).toFixed(2) : 0;

  const statBoxes = statsBox.querySelectorAll('.stat-box');
  
  if (statBoxes[0]) statBoxes[0].querySelector('.value').textContent = totalSiswa;
  if (statBoxes[1]) statBoxes[1].querySelector('.value').textContent = siswaLulus;
  if (statBoxes[2]) statBoxes[2].querySelector('.value').textContent = siswaTidakLulus;
  if (statBoxes[3]) statBoxes[3].querySelector('.value').textContent = persenLulus + '%';
}

// ==========================
// UPDATE FILTER INFO
// ==========================
function updateFilterInfo(filteredData) {
  let filterInfo = document.querySelector('.filter-info');
  
  if (!filterInfo) {
    filterInfo = document.createElement('div');
    filterInfo.className = 'filter-info alert alert-info mb-3';
    
    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
      statsContainer.parentNode.insertBefore(filterInfo, statsContainer.nextSibling);
    }
  }

  const kelasText = currentFilter.kelas ? `Kelas ${currentFilter.kelas}` : 'Semua Kelas 6';
  const tahunAjaranText = currentFilter.tahun_ajaran || '-';
  const totalSiswa = filteredData.length;
  const siswaLulus = filteredData.filter(s => s.status_kelulusan === 'LULUS').length;
  const persenLulus = totalSiswa > 0 ? ((siswaLulus / totalSiswa) * 100).toFixed(2) : 0;

  filterInfo.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <div class="d-flex align-items-center">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Filter Aktif:</strong>
          <span class="badge bg-primary ms-2">${kelasText}</span>
          <span class="badge bg-primary ms-1">${tahunAjaranText}</span>
        </div>
      </div>
      <div class="col-md-6 text-end">
        <small class="text-muted">
          <strong>${totalSiswa}</strong> siswa | 
          Lulus: <strong>${siswaLulus}</strong> (${persenLulus}%)
        </small>
      </div>
    </div>
  `;
}

// ==========================
// RENDER TABEL KELULUSAN 
// ==========================
function renderTabelKelulusan(data) {
  const tableBody = document.querySelector('.table tbody');
  if (!tableBody) return;

  if (!data || data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted py-4">
          <i class="bi bi-inbox" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0">Belum ada data kelulusan untuk filter ini</p>
          <small class="text-muted">
            Filter: ${currentFilter.kelas ? `Kelas ${currentFilter.kelas}` : 'Semua Kelas 6'} | 
            ${currentFilter.tahun_ajaran}
          </small>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = data.map((siswa, index) => {
    const nilaiAkhir = getNilaiAkhirRataRata(siswa);
    
    let predikat = 'E';
    if (nilaiAkhir >= 90) predikat = 'A';
    else if (nilaiAkhir >= 76) predikat = 'B';
    else if (nilaiAkhir >= 70) predikat = 'C';
    else if (nilaiAkhir >= 50) predikat = 'D';

    const rankingNumber = siswa.ranking || (index + 1);
    const getRankingBadgeClass = (rank) => {
      if (rank === 1) return 'ranking-gold';
      if (rank === 2) return 'ranking-silver';
      if (rank === 3) return 'ranking-bronze';
      return 'ranking-default';
    };
    const rankingClass = getRankingBadgeClass(rankingNumber);
    const rankingEmoji = rankingNumber === 1 ? '🥇' : rankingNumber === 2 ? '🥈' : rankingNumber === 3 ? '🥉' : '';

    let nilaiBadgeClass = 'nilai-rendah';
    if (nilaiAkhir >= 90) nilaiBadgeClass = 'nilai-tinggi';
    else if (nilaiAkhir >= 75) nilaiBadgeClass = 'nilai-sedang';

    const statusMap = {
      'LULUS': { class: 'bg-success', icon: '✓', text: 'LULUS' },
      'TIDAK LULUS': { class: 'bg-danger', icon: '✗', text: 'TIDAK LULUS' }
    };
    
    const status = statusMap[siswa.status_kelulusan] || { 
      class: 'bg-secondary', 
      icon: '-', 
      text: siswa.status_kelulusan || 'Belum Ada Data' 
    };

    return `
      <tr>
        <td>
          <span class="ranking-badge ${rankingClass}">
            ${rankingEmoji} #${rankingNumber}
          </span>
        </td>
        <td>${siswa.nis || '-'}</td>
        <td>${siswa.nisn || '-'}</td>
        <td class="fw-semibold">${siswa.nama || '-'}</td>
        <td>
          <span class="badge bg-info text-dark">Kelas ${siswa.kelas || '-'}</span>
        </td>
        <td>
          <span class="nilai-badge ${nilaiBadgeClass}">
            ${nilaiAkhir.toFixed(2)}
          </span>
          <small class="d-block text-muted mt-1">Predikat: ${predikat}</small>
        </td>
        <td>
          <span class="badge ${status.class}">
            ${status.icon} ${status.text}
          </span>
          <small class="d-block text-muted mt-1">
            ${siswa.statistik?.mapel_lulus || 0}/${siswa.statistik?.total_mapel || 0} mapel
          </small>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary" 
                  onclick="showDetailKelulusan(${siswa.siswa_id})"
                  title="Lihat Detail">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================
// SHOW DETAIL KELULUSAN (Modal/Alert)
// ==========================
window.showDetailKelulusan = async function(siswa_id) {
  try {
    // Call backend dengan Tauri API
    const detail = await invokeCommand('get_rekap_kelulusan', { siswaId: siswa_id });
    
    if (!detail) {
      showNotification('error', 'Gagal memuat detail kelulusan');
      return;
    }

    const siswa = detail.siswa || allLaporanKelulusan.find(s => s.siswa_id === siswa_id);
    
    if (!siswa) {
      showNotification('error', 'Data siswa tidak ditemukan');
      return;
    }

    // Override dengan data detail dari backend
    if (detail.detail_per_mapel) {
      siswa.hasil_per_mapel = detail.detail_per_mapel;
    }
    if (detail.status) {
      siswa.statistik = detail.status.statistik;
      siswa.status_kelulusan = detail.status.kelulusan;
    }

    let detailHTML = `
      <div class="modal fade" id="detailModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detail Kelulusan: ${siswa.nama}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row mb-3">
                <div class="col-md-6">
                  <strong>NIS:</strong> ${siswa.nis}<br>
                  <strong>NISN:</strong> ${siswa.nisn}<br>
                  <strong>Kelas:</strong> ${siswa.kelas}
                </div>
                <div class="col-md-6 text-end">
                  <span class="badge ${siswa.status_kelulusan === 'LULUS' ? 'bg-success' : 'bg-danger'} fs-6">
                    ${siswa.status_kelulusan}
                  </span>
                </div>
              </div>
              
              <h6 class="mt-4 mb-3">📊 Nilai Per Mata Pelajaran:</h6>
              <table class="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Mata Pelajaran</th>
                    <th>KKM</th>
                    <th>Nilai Akhir</th>
                    <th>Predikat</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${siswa.hasil_per_mapel?.map(m => `
                    <tr>
                      <td>${m.nama_mapel}</td>
                      <td>${m.kkm || 70}</td>
                      <td><strong>${m.nilai_akhir?.toFixed(2) || '-'}</strong></td>
                      <td><span class="badge bg-secondary">${m.predikat || '-'}</span></td>
                      <td>
                        <span class="badge ${m.status === 'LULUS' ? 'bg-success' : 'bg-danger'}">
                          ${m.status || '-'}
                        </span>
                      </td>
                    </tr>
                  `).join('') || '<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>'}
                </tbody>
              </table>
              
              <div class="alert alert-info mt-3">
                <strong>Statistik:</strong><br>
                Total Mapel: ${siswa.statistik?.total_mapel || 0}<br>
                Mapel Lulus: ${siswa.statistik?.mapel_lulus || 0}<br>
                Persentase: ${siswa.statistik?.persen_lulus || 0}%
              </div>
            </div>
              <div class="modal-footer" style="display: flex; padding: 16px; gap: 12px;">
                <button 
                  type="button" 
                  class="btn btn-secondary" 
                  style="flex: 1;"
                  data-bs-dismiss="modal">
                  Tutup
                </button>

                <button 
                  type="button" 
                  class="btn btn-primary"
                  style="flex: 1;"
                  onclick="printDetailKelulusan(${siswa_id})">
                  <i class="bi bi-printer"></i> Cetak
                </button>
              </div>
          </div>
        </div>
      </div>
    `;

    const existingModal = document.getElementById('detailModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', detailHTML);

    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();

  } catch (err) {
    console.error('Gagal show detail kelulusan:', err);
    showNotification('error', 'Gagal menampilkan detail: ' + err.message);
  }
};

// ==========================
// PRINT DETAIL KELULUSAN
// ==========================
window.printDetailKelulusan = async function(siswa_id) {
  try {
    const printBtn = document.querySelector(`button[onclick="printDetailKelulusan(${siswa_id})"]`);
    if (printBtn) {
      const originalHTML = printBtn.innerHTML;
      printBtn.innerHTML = '<i class="spinner-border spinner-border-sm"></i> Memproses...';
      printBtn.disabled = true;
    }

    // Call backend dengan Tauri API
    const detail = await invokeCommand('get_rekap_kelulusan', { siswaId: siswa_id });
    
    if (!detail) {
      throw new Error('Gagal memuat data kelulusan');
    }

    const siswa = detail.siswa || allLaporanKelulusan.find(s => s.siswa_id === siswa_id);
    
    if (!siswa) {
      throw new Error('Data siswa tidak ditemukan');
    }

    if (detail.detail_per_mapel) {
      siswa.hasil_per_mapel = detail.detail_per_mapel;
    }
    if (detail.status) {
      siswa.statistik = detail.status.statistik;
      siswa.status_kelulusan = detail.status.kelulusan;
    }

    // Sekolah info
    const sekolahInfo = {
      nama: 'SD Swasta Plus Insan Mulia',
      alamat: 'Jl. Pasir Randu, Kp. Ceper, Ds. Sukasari, Kec. Serang Baru, Kab. Bekasi',
      email: 'sdplusinsanmulia14@gmail.com'
    };

    const nilaiAkhirRataRata = getNilaiAkhirRataRata(siswa);

    let predikatKeseluruhan = 'E';
    if (nilaiAkhirRataRata >= 90) predikatKeseluruhan = 'A';
    else if (nilaiAkhirRataRata >= 76) predikatKeseluruhan = 'B';
    else if (nilaiAkhirRataRata >= 70) predikatKeseluruhan = 'C';
    else if (nilaiAkhirRataRata >= 50) predikatKeseluruhan = 'D';

    const tanggalCetak = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const printHTML = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Laporan Kelulusan - ${siswa.nama}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            padding: 2cm;
          }

          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }

          .header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
          }

          .header .subtitle {
            font-size: 11pt;
            margin-bottom: 3px;
          }

          .header .contact {
            font-size: 10pt;
            color: #555;
          }

          .document-title {
            text-align: center;
            margin: 25px 0;
          }

          .document-title h2 {
            font-size: 16pt;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 5px;
          }

          .document-title .subtitle {
            font-size: 11pt;
            font-style: italic;
          }

          .info-section {
            margin: 25px 0;
          }

          .info-row {
            display: flex;
            margin-bottom: 8px;
          }

          .info-label {
            width: 180px;
            font-weight: bold;
          }

          .info-value {
            flex: 1;
          }

          .status-box {
            background: ${siswa.status_kelulusan === 'LULUS' ? '#d4edda' : '#f8d7da'};
            border: 2px solid ${siswa.status_kelulusan === 'LULUS' ? '#28a745' : '#dc3545'};
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            border-radius: 5px;
          }

          .status-box h3 {
            font-size: 18pt;
            font-weight: bold;
            color: ${siswa.status_kelulusan === 'LULUS' ? '#155724' : '#721c24'};
            margin-bottom: 5px;
          }

          .status-box .status-text {
            font-size: 24pt;
            font-weight: bold;
            color: ${siswa.status_kelulusan === 'LULUS' ? '#28a745' : '#dc3545'};
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }

          table th,
          table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }

          table th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }

          table td {
            vertical-align: middle;
          }

          table td.center {
            text-align: center;
          }

          table td.right {
            text-align: right;
          }

          .summary-section {
            margin: 25px 0;
            background: #f9f9f9;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }

          .summary-section h4 {
            font-size: 13pt;
            margin-bottom: 10px;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 10px;
          }

          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }

          .summary-label {
            font-weight: bold;
          }

          .summary-value {
            text-align: right;
          }

          .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }

          .signature-box {
            width: 45%;
            text-align: center;
          }

          .signature-box .title {
            margin-bottom: 60px;
            font-weight: bold;
          }

          .signature-box .name {
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            display: inline-block;
            min-width: 200px;
          }

          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10pt;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }

          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 10pt;
            font-weight: bold;
          }

          .badge-success {
            background: #28a745;
            color: white;
          }

          .badge-danger {
            background: #dc3545;
            color: white;
          }

          @media print {
            body {
              padding: 1cm;
            }

            @page {
              margin: 1cm;
              size: A4 portrait;
            }
          }
        </style>
      </head>
      <body>
        <!-- Header Sekolah -->
        <div class="header">
          <h1>${sekolahInfo.nama}</h1>
          <div class="subtitle">${sekolahInfo.alamat}</div>
          <div class="contact">Email: ${sekolahInfo.email}</div>
        </div>

        <!-- Judul Dokumen -->
        <div class="document-title">
          <h2>LAPORAN KELULUSAN SISWA</h2>
          <div class="subtitle">Tahun Ajaran ${currentFilter.tahun_ajaran || '-'}</div>
        </div>

        <!-- Informasi Siswa -->
        <div class="info-section">
          <div class="info-row">
            <div class="info-label">Nama Siswa</div>
            <div class="info-value">: <strong>${siswa.nama || '-'}</strong></div>
          </div>
          <div class="info-row">
            <div class="info-label">NIS / NISN</div>
            <div class="info-value">: ${siswa.nis || '-'} / ${siswa.nisn || '-'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Kelas</div>
            <div class="info-value">: ${siswa.kelas || '-'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Tanggal Cetak</div>
            <div class="info-value">: ${tanggalCetak}</div>
          </div>
        </div>

        <!-- Status Kelulusan -->
        <div class="status-box">
          <h3>Status Kelulusan</h3>
          <div class="status-text">${siswa.status_kelulusan || 'BELUM TERSEDIA'}</div>
        </div>

        <!-- Tabel Nilai Per Mata Pelajaran -->
        <h4 style="margin-top: 30px; margin-bottom: 10px;">Rincian Nilai Per Mata Pelajaran</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th>Mata Pelajaran</th>
              <th style="width: 80px;">KKM</th>
              <th style="width: 100px;">Nilai Akhir</th>
              <th style="width: 80px;">Predikat</th>
              <th style="width: 120px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${siswa.hasil_per_mapel?.map((mapel, index) => {
              const statusClass = mapel.status === 'LULUS' ? 'badge-success' : 'badge-danger';
              return `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td><strong>${mapel.nama_mapel}</strong></td>
                  <td class="center">${mapel.kkm || 70}</td>
                  <td class="center"><strong>${mapel.nilai_akhir?.toFixed(2) || '-'}</strong></td>
                  <td class="center">${mapel.predikat || '-'}</td>
                  <td class="center">
                    <span class="badge ${statusClass}">${mapel.status || '-'}</span>
                  </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="6" class="center">Tidak ada data nilai</td></tr>'}
          </tbody>
        </table>

        <!-- Ringkasan Statistik -->
        <div class="summary-section">
          <h4>Ringkasan Statistik Kelulusan</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Total Mata Pelajaran:</span>
              <span class="summary-value">${siswa.statistik?.total_mapel || 0}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Mata Pelajaran Lulus:</span>
              <span class="summary-value">${siswa.statistik?.mapel_lulus || 0}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Mata Pelajaran Tidak Lulus:</span>
              <span class="summary-value">${siswa.statistik?.mapel_tidak_lulus || 0}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Persentase Kelulusan:</span>
              <span class="summary-value"><strong>${siswa.statistik?.persen_lulus || 0}%</strong></span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Nilai Akhir Rata-rata:</span>
              <span class="summary-value"><strong>${nilaiAkhirRataRata.toFixed(2)}</strong></span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Predikat Keseluruhan:</span>
              <span class="summary-value"><strong>${predikatKeseluruhan}</strong></span>
            </div>
          </div>
        </div>

        <!-- Tanda Tangan -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="title">Wali Kelas</div>
            <div class="name">( ............................. )</div>
          </div>
          <div class="signature-box">
            <div class="title">Kepala Sekolah</div>
            <div class="name">( ............................. )</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Dokumen ini dicetak secara otomatis oleh Sistem Informasi Sekolah</p>
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Pop-up diblokir. Harap izinkan pop-up untuk mencetak.');
    }

    printWindow.document.write(printHTML);
    printWindow.document.close();

    printWindow.onload = function() {
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      }, 250);
    };

    if (printBtn) {
      setTimeout(() => {
        printBtn.innerHTML = '<i class="bi bi-printer"></i> Cetak';
        printBtn.disabled = false;
      }, 1000);
    }

    showNotification('success', 'Jendela cetak telah dibuka');

  } catch (err) {
    console.error('Gagal mencetak laporan kelulusan:', err);
    showNotification('error', 'Gagal mencetak: ' + err.message);
    
    const printBtn = document.querySelector(`button[onclick="printDetailKelulusan(${siswa_id})"]`);
    if (printBtn) {
      printBtn.innerHTML = '<i class="bi bi-printer"></i> Cetak';
      printBtn.disabled = false;
    }
  }
};

// ==========================
// INIT REFRESH BUTTON
// ==========================
function initRefreshButton() {
  const btnRefresh = document.getElementById('btnRefresh');
  if (!btnRefresh) return;

  btnRefresh.addEventListener('click', async () => {
    try {
      const icon = btnRefresh.querySelector('i');
      icon.classList.add('spinner-border', 'spinner-border-sm');
      icon.classList.remove('bi-arrow-clockwise');
      btnRefresh.disabled = true;

      // Reload from backend
      await loadLaporanKelulusan();
      showNotification('success', 'Data berhasil di-refresh');

      icon.classList.remove('spinner-border', 'spinner-border-sm');
      icon.classList.add('bi-arrow-clockwise');
      btnRefresh.disabled = false;
    } catch (err) {
      console.error('Gagal refresh:', err);
      showNotification('error', 'Gagal refresh data: ' + err.message);
      
      const icon = btnRefresh.querySelector('i');
      icon.classList.remove('spinner-border', 'spinner-border-sm');
      icon.classList.add('bi-arrow-clockwise');
      btnRefresh.disabled = false;
    }
  });
}

// ==========================
// NOTIFICATION HELPER
// ==========================
function showNotification(type, message) {
  let toastContainer = document.getElementById('toastContainer');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '10000';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'info' ? 'info' : 'danger'} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-${type === 'success' ? 'check-circle-fill' : type === 'info' ? 'info-circle-fill' : 'exclamation-triangle-fill'}"></i>
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  toastContainer.appendChild(toast);

  if (typeof bootstrap !== 'undefined') {
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
  } else {
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// ==========================
// EXPORT (if needed)
// ==========================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadLaporanKelulusan,
    applyClientSideFilter,
    currentFilter
  };
}

console.log('✅ kelulusan.js loaded successfully (Auto-load + Client-side Filter)');
