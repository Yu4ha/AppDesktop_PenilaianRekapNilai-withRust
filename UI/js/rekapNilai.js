/**
 * rekapNilai.js - With Ranking Feature
 * ==========================================
 * Halaman rekap nilai lengkap dengan detail per mapel
 * Termasuk breakdown kehadiran, ranking, dan export Excel/PDF
 * 
 * New Feature:
 * - ✅ Ranking berdasarkan rata-rata nilai
 * - ✅ Display ranking di kolom predikat
 * - ✅ Ranking included di export Excel
 * ==========================================
 */

// ==========================
// STATE MANAGEMENT
// ==========================
let allData = [];
let allMapel = [];
let allSiswa = [];
let filteredData = [];
let currentFilter = {
  kelas: null,
  semester: 1,
  tahun_ajaran: null
};

// ==========================
// INITIALIZATION
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log('🚀 Memulai inisialisasi aplikasi...');
    await initializePage();
    setupEventListeners();
    console.log('✅ Aplikasi berhasil diinisialisasi');
  } catch (err) {
    console.error('❌ Gagal inisialisasi halaman:', err);
    showNotification('error', 'Gagal memuat halaman rekap nilai');
  }
});

// ==========================
// INIT PAGE
// ==========================
async function initializePage() {
  showLoading(true);
  
  try {
    // Load data awal dengan parallel processing
    const [tahunAjaranAktif, daftarTahunAjaran, mapelList, siswaList] = await Promise.all([
      window.electronAPI.getTahunAjaranAktif(),
      window.electronAPI.getDaftarTahunAjaran(),
      window.electronAPI.getAllMapel(),
      window.electronAPI.getAllSiswa()
    ]);

    // Set initial state
    currentFilter.tahun_ajaran = tahunAjaranAktif;
    allMapel = mapelList || [];
    allSiswa = siswaList || [];

    console.log('📊 Data loaded:', {
      tahunAjaran: tahunAjaranAktif,
      totalMapel: allMapel.length,
      totalSiswa: allSiswa.length
    });

    // Render UI components
    renderFilterSection(daftarTahunAjaran, tahunAjaranAktif);
    updateTableHeader();
    
  } catch (err) {
    console.error('❌ Error inisialisasi:', err);
    throw err;
  } finally {
    showLoading(false);
  }
}

// ==========================
// RENDER FILTER SECTION
// ==========================
function renderFilterSection(daftarTahunAjaran, tahunAjaranAktif) {
  const filterContainer = document.querySelector('.filter-section');
  
  if (!filterContainer) {
    console.error('❌ Filter container tidak ditemukan');
    return;
  }

  // Extract dan sort unique kelas
  const uniqueKelas = [...new Set(allSiswa.map(s => s.kelas))]
    .filter(k => k)
    .sort((a, b) => {
      const tingkatA = parseInt(String(a).charAt(0));
      const tingkatB = parseInt(String(b).charAt(0));
      if (tingkatA !== tingkatB) return tingkatA - tingkatB;
      return String(a).localeCompare(String(b));
    });

  filterContainer.innerHTML = `
    <div class="filter-wrapper" style="
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 20px;
      width: 100%;
      box-sizing: border-box;
    ">
      <!-- Kiri: Filter Controls -->
      <div class="filter-left" style="display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end; flex: 1; min-width: 0;">
        <div class="filter-group" style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px; max-width: 250px;">
          <label for="filterKelas" style="font-weight: 600; font-size: 16px; color: #333;">🏫 Kelas:</label>
          <select id="filterKelas" style="padding: 10px 14px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; width: 100%; cursor: pointer; box-sizing: border-box;">
            <option value="">Semua Kelas</option>
            ${uniqueKelas.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group" style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px; max-width: 250px;">
          <label for="filterSemester" style="font-weight: 600; font-size: 16px; color: #333;">🗓️ Semester:</label>
          <select id="filterSemester" style="padding: 10px 14px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; width: 100%; cursor: pointer; box-sizing: border-box;">
            <option value="1" selected>Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>

        <div class="filter-group" style="display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 200px; max-width: 280px;">
          <label for="filterTahunAjaran" style="font-weight: 600; font-size: 16px; color: #333;">📆 Tahun Ajaran:</label>
          <select id="filterTahunAjaran" style="padding: 10px 14px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; width: 100%; cursor: pointer; box-sizing: border-box;">
            ${daftarTahunAjaran && daftarTahunAjaran.length > 0
              ? daftarTahunAjaran.map(ta => 
                  `<option value="${ta}" ${ta === tahunAjaranAktif ? 'selected' : ''}>${ta}</option>`
                ).join('')
              : `<option value="${tahunAjaranAktif}" selected>${tahunAjaranAktif}</option>`
            }
          </select>
        </div>
      </div>

      <!-- Kanan: Action Buttons -->
      <div class="filter-buttons" style="display: flex; gap: 12px; flex-wrap: nowrap; align-items: flex-end;">
        <button type="button" id="btnApplyFilter" class="btn-filter" style="padding: 10px 24px; background:#0d6efd; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px; white-space: nowrap; transition: background 0.3s;">
          🔍 Terapkan
        </button>

        <button type="button" id="btnExport" class="btn-export" style="padding: 10px 24px; background: #198754; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px; white-space: nowrap; transition: background 0.3s;">
          📊 Export Excel
        </button>
      </div>
    </div>
  `;
  
  console.log('✅ Filter section rendered');
}

// ==========================
// UPDATE TABLE HEADER
// ==========================
function updateTableHeader() {
  const tableHeader = document.querySelector('.table thead tr');
  
  if (!tableHeader) {
    console.warn('⚠️ Table header tidak ditemukan');
    return;
  }

  // Clear existing header
  tableHeader.innerHTML = `
    <th>No</th>
    <th>NIS</th>
    <th>NISN</th>
    <th>Nama</th>
    <th>Kelas</th>
  `;

  // Add mapel columns dynamically
  allMapel.forEach(mapel => {
    const th = document.createElement('th');
    th.className = 'mapel-header';
    th.textContent = mapel.nama_mapel;
    th.title = mapel.nama_mapel; // Tooltip
    tableHeader.appendChild(th);
  });

  // Add kehadiran breakdown columns
  const kehadiranHeaders = ['Hadir', 'Sakit', 'Izin', 'Alpa', 'Total', 'Nilai Kehadiran'];
  kehadiranHeaders.forEach(label => {
    const th = document.createElement('th');
    th.className = 'kehadiran-header';
    th.textContent = label;
    tableHeader.appendChild(th);
  });

  // Add summary columns (dengan Ranking)
  const summaryHeaders = ['Rata-rata', 'Ranking', 'Predikat', 'Status'];
  summaryHeaders.forEach(label => {
    const th = document.createElement('th');
    th.className = 'summary-header';
    th.textContent = label;
    tableHeader.appendChild(th);
  });
  
  console.log('✅ Table header updated dengan', allMapel.length, 'mapel + Ranking column');
}

// ==========================
// APPLY FILTERS
// ==========================
async function applyFilters() {
  const filterKelas = document.getElementById('filterKelas');
  const filterSemester = document.getElementById('filterSemester');
  const filterTahunAjaran = document.getElementById('filterTahunAjaran');

  // Validasi input
  if (!filterSemester?.value || !filterTahunAjaran?.value) {
    showNotification('warning', 'Silakan pilih Semester dan Tahun Ajaran');
    return;
  }

  // Update current filter
  currentFilter.kelas = filterKelas.value || null;
  currentFilter.semester = parseInt(filterSemester.value);
  currentFilter.tahun_ajaran = filterTahunAjaran.value;

  console.log('🔍 Menerapkan filter:', currentFilter);

  showLoading(true);

  try {
    await loadRekapData();
    showNotification('success', 'Filter berhasil diterapkan');
  } catch (err) {
    console.error('❌ Error apply filter:', err);
    showNotification('error', 'Gagal menerapkan filter: ' + err.message);
  } finally {
    showLoading(false);
  }
}

// ==========================
// LOAD REKAP DATA
// ==========================
async function loadRekapData() {
  try {
    console.log('🔄 Loading rekap dengan filter:', currentFilter);

    // Filter siswa berdasarkan kelas
    let siswaList = currentFilter.kelas 
      ? allSiswa.filter(s => s.kelas === currentFilter.kelas)
      : allSiswa;

    console.log('📊 Memproses', siswaList.length, 'siswa');

    // Get data untuk setiap siswa dengan error handling per siswa
    const detailedData = await Promise.all(
      siswaList.map(async (siswa) => {
        try {
          const context = {
            kelas: siswa.kelas,
            semester: currentFilter.semester,
            tahun_ajaran: currentFilter.tahun_ajaran
          };

          // 1. Get rekap nilai lengkap
          const rekapData = await window.electronAPI.getRekapNilai(siswa.id, context);

          // Check for backend errors
          if (rekapData.error) {
            console.error('❌ Backend error untuk', siswa.nama, ':', rekapData.error);
            throw new Error(rekapData.error);
          }

          // 2. Get kehadiran breakdown
          const kehadiranData = await window.electronAPI.getKehadiran(
            siswa.id,
            siswa.kelas,
            currentFilter.semester,
            currentFilter.tahun_ajaran
          );

          // 3. Map kehadiran data
          const kehadiran = {
            hadir: kehadiranData?.breakdown?.hadir || 0,
            sakit: kehadiranData?.breakdown?.sakit || 0,
            izin: kehadiranData?.breakdown?.izin || 0,
            alpa: kehadiranData?.breakdown?.alpa || 0,
            total: kehadiranData?.breakdown?.total || 0,
            nilai: kehadiranData?.nilai || 0
          };

          // 4. Map detail per mapel
          const detailPerMapel = (rekapData.detail_per_mapel || []).map(detail => ({
            mapel_id: detail.mapel_id,
            nama_mapel: detail.nama_mapel,
            nilai_akhir: detail.nilai_akhir || 0,
            komponen: detail.komponen || {},
            predikat: detail.predikat || '-',
            status: detail.status || '-',
            kkm: detail.kkm || 70
          }));

          // 5. Return complete student data
          return {
            id: siswa.id,
            nis: siswa.nis,
            nisn: siswa.nisn,
            nama: siswa.nama,
            kelas: siswa.kelas,
            detail_per_mapel: detailPerMapel,
            rata_rata: rekapData.nilai?.rata_rata || 0,
            predikat: rekapData.nilai?.predikat || '-',
            status_naik_kelas: rekapData.status?.naik_kelas || '-',
            kehadiran: kehadiran
          };

        } catch (err) {
          console.warn(`⚠️ Gagal ambil detail siswa ${siswa.nama}:`, err.message);
          
          // Return fallback object untuk siswa dengan error
          return {
            id: siswa.id,
            nis: siswa.nis,
            nisn: siswa.nisn,
            nama: siswa.nama,
            kelas: siswa.kelas,
            detail_per_mapel: [],
            rata_rata: 0,
            predikat: '-',
            status_naik_kelas: '-',
            kehadiran: {
              hadir: 0,
              sakit: 0,
              izin: 0,
              alpa: 0,
              total: 0,
              nilai: 0
            }
          };
        }
      })
    );

    // ✅ SORT BY RATA-RATA (descending) dan ASSIGN RANKING
    detailedData.sort((a, b) => b.rata_rata - a.rata_rata);
    
    // Assign ranking dengan handling nilai sama
    let currentRank = 1;
    detailedData.forEach((siswa, index) => {
      if (index > 0 && siswa.rata_rata === detailedData[index - 1].rata_rata) {
        // Nilai sama dengan siswa sebelumnya, pakai ranking yang sama
        siswa.ranking = detailedData[index - 1].ranking;
      } else {
        // Nilai berbeda, gunakan ranking baru
        siswa.ranking = currentRank;
      }
      currentRank++;
    });

    // Update state
    allData = detailedData;
    filteredData = [...allData];

    console.log('✅ Data berhasil dimuat:', detailedData.length, 'siswa dengan ranking');

    // Render UI
    renderTable(filteredData);
    updateSummary(filteredData);

  } catch (err) {
    console.error('❌ Error load rekap data:', err);
    throw err;
  }
}

// ==========================
// RENDER TABLE
// ==========================
function renderTable(data) {
  const tbody = document.getElementById('rekapTableBody');
  
  if (!tbody) {
    console.error('❌ Element #rekapTableBody tidak ditemukan');
    return;
  }

  tbody.innerHTML = '';

  // Handle empty data
  if (!data || data.length === 0) {
    const totalCols = 10 + allMapel.length + 6; // +1 untuk kolom ranking
    tbody.innerHTML = `
      <tr>
        <td colspan="${totalCols}" class="text-center text-muted py-4">
          <i class="bi bi-inbox" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0">Belum ada data untuk filter yang dipilih</p>
        </td>
      </tr>
    `;
    return;
  }

  // Render each row
  data.forEach((siswa, index) => {
    const row = document.createElement('tr');
    
    // Badge classes helper
    const getNilaiBadgeClass = (nilai) => {
      if (nilai >= 90) return 'nilai-tinggi';
      if (nilai >= 75) return 'nilai-sedang';
      if (nilai > 0) return 'nilai-rendah';
      return 'bg-secondary';
    };
    
    // ✅ Ranking badge class (Top 3 special styling)
    const getRankingBadgeClass = (rank) => {
      if (rank === 1) return 'ranking-gold';
      if (rank === 2) return 'ranking-silver';
      if (rank === 3) return 'ranking-bronze';
      return 'ranking-default';
    };
    
    const statusBadgeClass =
      siswa.status_naik_kelas === 'Naik Kelas' ? 'bg-success' :
      siswa.status_naik_kelas === 'Tidak Naik Kelas' ? 'bg-danger' : 
      'bg-warning text-dark';

    // Fixed columns
    let html = `
      <td class="text-center">${index + 1}</td>
      <td class="text-center">${siswa.nis}</td>
      <td class="text-center">${siswa.nisn || '-'}</td>
      <td style="text-align: left; padding-left: 10px;">${escapeHtml(siswa.nama)}</td>
      <td class="text-center"><span class="badge bg-info text-dark">Kelas ${siswa.kelas}</span></td>
    `;

    // Nilai per mapel
    allMapel.forEach(mapel => {
      const nilaiMapel = siswa.detail_per_mapel?.find(d => d.mapel_id === mapel.id);
      const nilaiAkhir = nilaiMapel?.nilai_akhir || 0;
      const badgeClass = getNilaiBadgeClass(nilaiAkhir);
      
      html += `<td class="text-center">
        ${nilaiAkhir > 0 
          ? `<span class="nilai-badge ${badgeClass}">${nilaiAkhir.toFixed(1)}</span>`
          : '<span class="text-muted">-</span>'
        }
      </td>`;
    });

    // Kehadiran breakdown
    const k = siswa.kehadiran;
    html += `
      <td class="text-center kehadiran-hadir">${k.hadir}</td>
      <td class="text-center kehadiran-sakit">${k.sakit}</td>
      <td class="text-center kehadiran-izin">${k.izin}</td>
      <td class="text-center kehadiran-alpa">${k.alpa}</td>
      <td class="text-center kehadiran-total">${k.total}</td>
      <td class="text-center">
        <span class="nilai-badge ${getNilaiBadgeClass(k.nilai)}">${k.nilai.toFixed(2)}</span>
      </td>
    `;

    // Summary columns dengan Ranking
    html += `
      <td class="text-center">
        ${siswa.rata_rata > 0 
          ? `<span class="nilai-badge ${getNilaiBadgeClass(siswa.rata_rata)}">${siswa.rata_rata.toFixed(2)}</span>`
          : '<span class="text-muted">-</span>'
        }
      </td>
      <td class="text-center">
        ${siswa.ranking 
          ? `<span class="ranking-badge ${getRankingBadgeClass(siswa.ranking)}">${siswa.ranking === 1 ? '🥇' : siswa.ranking === 2 ? '🥈' : siswa.ranking === 3 ? '🥉' : ''} #${siswa.ranking}</span>`
          : '<span class="text-muted">-</span>'
        }
      </td>
      <td class="text-center"><strong>${siswa.predikat}</strong></td>
      <td class="text-center">
        <span class="badge ${statusBadgeClass}">${siswa.status_naik_kelas}</span>
      </td>
    `;

    row.innerHTML = html;
    tbody.appendChild(row);
  });
  
  console.log('✅ Table rendered:', data.length, 'rows dengan ranking');
}

// ==========================
// UPDATE SUMMARY
// ==========================
function updateSummary(data) {
  const total = data.length;
  const naikKelas = data.filter(d => d.status_naik_kelas === 'Naik Kelas').length;
  const tidakNaik = data.filter(d => d.status_naik_kelas === 'Tidak Naik Kelas').length;
  const belumLengkap = data.filter(d => d.status_naik_kelas === 'Belum Lengkap').length;

  const summaryEl = document.querySelector('.summary-cards');
  
  if (!summaryEl) {
    console.warn('⚠️ Summary cards container tidak ditemukan');
    return;
  }

  summaryEl.innerHTML = `
    <div class="col-md-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h6 class="text-muted mb-2">📊 Total Siswa</h6>
          <h3 class="mb-0">${total}</h3>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h6 class="text-success mb-2">✅ Naik Kelas</h6>
          <h3 class="mb-0 text-success">${naikKelas}</h3>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h6 class="text-danger mb-2">❌ Tidak Naik</h6>
          <h3 class="mb-0 text-danger">${tidakNaik}</h3>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <h6 class="text-warning mb-2">⚠️ Belum Lengkap</h6>
          <h3 class="mb-0 text-warning">${belumLengkap}</h3>
        </div>
      </div>
    </div>
  `;
  
  console.log('✅ Summary updated:', { total, naikKelas, tidakNaik, belumLengkap });
}

// ==========================
// EXPORT EXCEL
// ==========================
async function handleExport() {
  try {
    console.log('🚀 Memulai export Excel...');
    
    // Validasi data
    if (!filteredData || filteredData.length === 0) {
      showNotification('warning', 'Tidak ada data untuk di-export. Silakan terapkan filter terlebih dahulu.');
      return;
    }

    // Validasi library XLSX
    if (typeof XLSX === 'undefined') {
      throw new Error('Library SheetJS (XLSX) tidak ditemukan. Pastikan library sudah dimuat.');
    }
    
    // Ambil nilai filter untuk info
    const kelas = document.getElementById('filterKelas')?.value || 'Semua';
    const semester = document.getElementById('filterSemester')?.value || '-';
    const tahunAjaran = document.getElementById('filterTahunAjaran')?.value || '-';
    
    // Buat workbook baru
    const wb = XLSX.utils.book_new();
    
    // ============================================
    // SHEET 1: DATA REKAP NILAI
    // ============================================
    
    // Header informasi
    const infoRows = [
      ['REKAP NILAI SISWA'],
      ['Kelas', kelas],
      ['Semester', semester],
      ['Tahun Ajaran', tahunAjaran],
      ['Total Siswa', filteredData.length],
      ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
      [], // Row kosong
    ];
    
    // Header tabel (dengan Ranking)
    const headers = ['No', 'NIS', 'NISN', 'Nama', 'Kelas'];
    
    // Tambah header mapel
    allMapel.forEach(mapel => {
      headers.push(mapel.nama_mapel);
    });
    
    // Tambah header kehadiran
    headers.push('Hadir', 'Sakit', 'Izin', 'Alpa', 'Total Hadir', 'Nilai Kehadiran');
    
    // Tambah header summary dengan Ranking
    headers.push('Rata-rata', 'Ranking', 'Predikat', 'Status Kenaikan');
    
    infoRows.push(headers);
    
    // Data rows (sudah tersort by ranking)
    const dataRows = filteredData.map((siswa, index) => {
      const row = [
        index + 1,
        siswa.nis || '-',
        siswa.nisn || '-',
        siswa.nama || '-',
        siswa.kelas || '-'
      ];
      
      // Tambah nilai per mapel
      allMapel.forEach(mapel => {
        const nilaiMapel = siswa.detail_per_mapel?.find(d => d.mapel_id === mapel.id);
        row.push(nilaiMapel?.nilai_akhir || 0);
      });
      
      // Tambah kehadiran
      const k = siswa.kehadiran;
      row.push(k.hadir, k.sakit, k.izin, k.alpa, k.total, parseFloat(k.nilai.toFixed(2)));
      
      // Tambah summary dengan ranking
      row.push(
        siswa.rata_rata > 0 ? parseFloat(siswa.rata_rata.toFixed(2)) : 0,
        siswa.ranking || '-', // ✅ RANKING COLUMN
        siswa.predikat || '-',
        siswa.status_naik_kelas || '-'
      );
      
      return row;
    });
    
    // Gabungkan semua data
    const allData = [...infoRows, ...dataRows];
    
    // Buat worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Styling dan format
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Merge cells untuk title
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } } // Merge title
    ];
    
    // Set column widths
    const colWidths = [
      { wch: 5 },  // No
      { wch: 12 }, // NIS
      { wch: 12 }, // NISN
      { wch: 25 }, // Nama
      { wch: 8 },  // Kelas
    ];
    
    // Width untuk mapel columns
    allMapel.forEach(() => {
      colWidths.push({ wch: 12 });
    });
    
    // Width untuk kehadiran
    colWidths.push({ wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 15 });
    
    // Width untuk summary + ranking
    colWidths.push({ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 });
    
    ws['!cols'] = colWidths;
    
    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');
    
    // ============================================
    // SHEET 2: STATISTIK
    // ============================================
    
    const naikKelas = filteredData.filter(d => d.status_naik_kelas === 'Naik Kelas').length;
    const tidakNaik = filteredData.filter(d => d.status_naik_kelas === 'Tidak Naik Kelas').length;
    const belumLengkap = filteredData.filter(d => d.status_naik_kelas === 'Belum Lengkap').length;
    
    // Hitung rata-rata per mapel
    const statsPerMapel = allMapel.map(mapel => {
      const nilaiList = filteredData
        .map(siswa => {
          const detail = siswa.detail_per_mapel?.find(d => d.mapel_id === mapel.id);
          return detail?.nilai_akhir || 0;
        })
        .filter(n => n > 0);
      
      const avg = nilaiList.length > 0 
        ? (nilaiList.reduce((sum, n) => sum + n, 0) / nilaiList.length).toFixed(2)
        : 0;
      
      const max = nilaiList.length > 0 ? Math.max(...nilaiList).toFixed(2) : 0;
      const min = nilaiList.length > 0 ? Math.min(...nilaiList).toFixed(2) : 0;
      
      return [mapel.nama_mapel, parseFloat(avg), parseFloat(max), parseFloat(min)];
    });
    
    // ✅ TOP 10 RANKING
    const top10 = filteredData.slice(0, 10).map(siswa => [
      siswa.ranking,
      siswa.nama,
      siswa.kelas,
      parseFloat(siswa.rata_rata.toFixed(2)),
      siswa.predikat
    ]);
    
    const statsData = [
      ['STATISTIK REKAP NILAI'],
      ['Kelas', kelas],
      ['Semester', semester],
      ['Tahun Ajaran', tahunAjaran],
      [],
      ['RINGKASAN KENAIKAN KELAS'],
      ['Status', 'Jumlah', 'Persentase'],
      ['Naik Kelas', naikKelas, `${((naikKelas / filteredData.length) * 100).toFixed(1)}%`],
      ['Tidak Naik', tidakNaik, `${((tidakNaik / filteredData.length) * 100).toFixed(1)}%`],
      ['Belum Lengkap', belumLengkap, `${((belumLengkap / filteredData.length) * 100).toFixed(1)}%`],
      ['Total', filteredData.length, '100%'],
      [],
      ['TOP 10 RANKING SISWA'],
      ['Ranking', 'Nama Siswa', 'Kelas', 'Rata-rata', 'Predikat'],
      ...top10,
      [],
      ['STATISTIK PER MATA PELAJARAN'],
      ['Mata Pelajaran', 'Rata-rata', 'Nilai Tertinggi', 'Nilai Terendah'],
      ...statsPerMapel,
      [],
      ['STATISTIK KEHADIRAN'],
      ['Total Hadir', filteredData.reduce((sum, s) => sum + s.kehadiran.hadir, 0)],
      ['Total Sakit', filteredData.reduce((sum, s) => sum + s.kehadiran.sakit, 0)],
      ['Total Izin', filteredData.reduce((sum, s) => sum + s.kehadiran.izin, 0)],
      ['Total Alpa', filteredData.reduce((sum, s) => sum + s.kehadiran.alpa, 0)],
    ];
    
    const wsStats = XLSX.utils.aoa_to_sheet(statsData);
    
    // Set column widths untuk stats
    wsStats['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];
    
    // Merge cells untuk title
    wsStats['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }
    ];
    
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistik');
    
    // ============================================
    // GENERATE & DOWNLOAD FILE
    // ============================================
    
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `Rekap_Nilai_${kelas}_Sem${semester}_${timestamp}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, fileName);
    
    console.log('✅ Export Excel berhasil:', fileName);
    showNotification('success', `Export Excel berhasil!\n\nFile: ${fileName}\n\nBerisi 2 sheet:\n- Rekap Nilai (Data lengkap dengan Ranking)\n- Statistik (Ringkasan + Top 10)`);
    
  } catch (error) {
    console.error('❌ Error export Excel:', error);
    showNotification('error', `Gagal export Excel: ${error.message}`);
  }
}

// ==========================
// EVENT LISTENERS
// ==========================
function setupEventListeners() {
  // Tombol apply filter
  const btnApplyFilter = document.getElementById('btnApplyFilter');
  if (btnApplyFilter) {
    btnApplyFilter.addEventListener('click', applyFilters);
    console.log('✅ Event listener btnApplyFilter terpasang');
  }

  // Tombol export
  const btnExport = document.getElementById('btnExport');
  if (btnExport) {
    btnExport.addEventListener('click', handleExport);
    console.log('✅ Event listener btnExport terpasang');
  }

  // Apply filter on Enter key
  ['filterKelas', 'filterSemester', 'filterTahunAjaran'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyFilters();
        }
      });
    }
  });
  
  // Hover effects untuk tombol
  if (btnApplyFilter) {
    btnApplyFilter.addEventListener('mouseenter', function() {
      this.style.background = '#0b5ed7';
    });
    btnApplyFilter.addEventListener('mouseleave', function() {
      this.style.background = '#0d6efd';
    });
  }
  
  if (btnExport) {
    btnExport.addEventListener('mouseenter', function() {
      this.style.background = '#157347';
    });
    btnExport.addEventListener('mouseleave', function() {
      this.style.background = '#198754';
    });
  }
}

// ==========================
// UTILITIES
// ==========================
function showLoading(show) {
  const tbody = document.getElementById('rekapTableBody');
  if (!tbody) return;

  if (show) {
    const totalCols = 10 + allMapel.length + 6; // +1 untuk ranking
    tbody.innerHTML = `
      <tr>
        <td colspan="${totalCols}" class="text-center py-5">
          <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mb-0">Klik "Terapkan" untuk menampilkan keseluruhan data...</p>
        </td>
      </tr>
    `;
  }
}

function showNotification(type, message) {
  // Implementasi notifikasi sederhana dengan alert
  // Bisa diganti dengan toast notification library
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const icon = icons[type] || 'ℹ️';
  alert(`${icon} ${message}`);
  
  // Log ke console
  console.log(`[${type.toUpperCase()}]`, message);
}

function escapeHtml(str) {
  if (!str) return '';
  
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================
// CSS STYLES - LARGER SIZE FOR BETTER READABILITY
// ==========================
const style = document.createElement('style');
style.textContent = `
  /* Filter Section Styles */
  .filter-wrapper {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  
  .filter-group select:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
  }
  
  .btn-filter:hover,
  .btn-export:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  .btn-filter:active,
  .btn-export:active {
    transform: translateY(0);
  }

  /* Table Header Styles - LARGER */
  .mapel-header, 
  .kehadiran-header,
  .summary-header {
    background: #f8f9fa !important;
    font-weight: 600;
    font-size: 14px;         
    min-width: 100px;      
    padding: 14px 10px !important;  
    text-align: center;
    border: 1px solid #dee2e6;
  }
  
  .mapel-header {
    background: linear-gradient(to bottom, #e3f2fd, #f8f9fa) !important;
  }
  
  .kehadiran-header {
    background: linear-gradient(to bottom, #fff3e0, #f8f9fa) !important;
  }

  /* Nilai Badge Styles - LARGER */
  .nilai-badge {
    display: inline-block;
    padding: 8px 14px;        
    border-radius: 6px;
    font-weight: 700;
    font-size: 15px;          
    min-width: 55px;         
    text-align: center;
  }

  .nilai-tinggi {
    background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
    color: #1b5e20;
    border: 1px solid #81c784;
  }

  .nilai-sedang {
    background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%);
    color: #f57f17;
    border: 1px solid #fdd835;
  }

  .nilai-rendah {
    background: linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%);
    color: #b71c1c;
    border: 1px solid #e57373;
  }

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

  /* Kehadiran Cell Styles - LARGER */
  .kehadiran-hadir {
    background: #e8f5e9 !important;
    font-weight: 600;
    font-size: 14px;         
    color: #2e7d32;
  }

  .kehadiran-sakit {
    background: #fff3e0 !important;
    font-weight: 600;
    font-size: 14px;          
    color: #e65100;
  }

  .kehadiran-izin {
    background: #e3f2fd !important;
    font-weight: 600;
    font-size: 14px;          
    color: #1565c0;
  }

  .kehadiran-alpa {
    background: #ffebee !important;
    font-weight: 600;
    font-size: 14px;          
    color: #c62828;
  }

  .kehadiran-total {
    background: #f5f5f5 !important;
    font-weight: 700;
    font-size: 15px;          
    color: #424242;
    border-left: 2px solid #9e9e9e !important;
  }

  /* Table Styles - LARGER */
  table {
    font-size: 15px;        
    white-space: nowrap;
    border-collapse: collapse;
    width: 100%;
  }

  th, td {
    padding: 12px 10px;       
    border: 1px solid #dee2e6;
    text-align: center;
  }

  /* Cell text size override untuk kolom tertentu */
  tbody td {
    font-size: 15px;           
  }

  tbody td.fw-semibold {
    font-size: 15px;         
    font-weight: 600;
  }

  tbody tr {
    transition: background-color 0.2s ease;
  }

  tbody tr:hover {
    background: #f8f9fa !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  tbody tr:nth-child(even) {
    background: #fafafa;
  }

  /* Summary Cards */
  .summary-cards {
    margin-bottom: 20px;
  }

  .summary-cards .card {
    transition: all 0.3s ease;
    border-radius: 8px;
  }

  .summary-cards .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
  
  .summary-cards .card-body {
    padding: 20px;
  }
  
  .summary-cards h3 {
    font-size: 2rem;
    font-weight: 700;
  }
  
  .summary-cards h6 {
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Badge Styles - LARGER */
  .badge {
    padding: 7px 13px;       
    font-size: 14px;         
    font-weight: 600;
    border-radius: 4px;
  }

  /* Small text dalam tabel */
  small.text-muted {
    font-size: 13px !important;  
  }

  small.d-block {
    font-size: 13px !important;  
  }

  /* Responsive - Adjusted untuk ukuran baru */
  @media (max-width: 768px) {
    .filter-wrapper {
      flex-direction: column;
      align-items: stretch !important;
    }
    
    .filter-left,
    .filter-buttons {
      width: 100%;
      justify-content: stretch;
    }
    
    .filter-group {
      max-width: 100% !important;
    }
    
    .btn-filter,
    .btn-export {
      width: 100%;
    }
    
    /* Mobile: tetap readable tapi lebih kecil */
    table {
      font-size: 13px;         
    }
    
    th, td {
      padding: 8px 6px;       
    }
    
    .nilai-badge,
    .ranking-badge {
      padding: 6px 10px;       
      font-size: 13px;       
    }
    
    .mapel-header, 
    .kehadiran-header,
    .summary-header {
      font-size: 12px;       
      min-width: 80px;
    }
    
    small.text-muted,
    small.d-block {
      font-size: 11px !important; 
    }
  }

  /* Tablet breakpoint (768px - 1024px) */
  @media (min-width: 769px) and (max-width: 1024px) {
    table {
      font-size: 14px;        
    }
    
    .nilai-badge {
      font-size: 14px;
      padding: 7px 12px;
    }
    
    .ranking-badge {
      font-size: 15px;
      padding: 9px 14px;
    }
  }

  /* Scrollbar Styling */
  .table-responsive::-webkit-scrollbar {
    height: 10px;             
  }

  .table-responsive::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 5px;
  }

  .table-responsive::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 5px;
  }

  .table-responsive::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Print Styles */
  @media print {
    .filter-wrapper,
    .summary-cards,
    .btn-filter,
    .btn-export {
      display: none !important;
    }
    
    table {
      font-size: 11px;        
    }
    
    th, td {
      padding: 8px 6px;
    }
    
    tbody tr:hover {
      background: transparent !important;
    }
    
    .ranking-badge {
      animation: none !important;
    }
  }
`;

document.head.appendChild(style);

console.log('✅ CSS styles applied with LARGER sizes for better readability');

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
});

// ==========================
// EXPORTS (jika diperlukan)
// ==========================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializePage,
    applyFilters,
    handleExport,
    renderTable,
    updateSummary
  };
}

console.log('✅ rekapNilai.js loaded successfully with RANKING feature');
