/**
 * dataSiswa.js (Tauri Version - v2.1 Full Refactored)
 * Frontend logic untuk CRUD Siswa
 * - Full Tauri Global API (tanpa ES6 import)
 * - Sinkron 100% dengan commands/siswa.rs
 * - Support NISN, Data Orang Tua & Wali (20 kolom)
 * - User-friendly error messages
 * - Optimized modal performance
 */

/* ====== Tauri API Helper ====== */

/**
 * Wrapper untuk invoke dengan error handling
 * @param {string} command - Nama Tauri command
 * @param {object} params - Parameters untuk command
 * @returns {Promise<any>} - Data dari response
 * @throws {Error} - Jika terjadi error
 */
async function invokeCommand(command, params = {}) {
  try {
    const response = await window.__TAURI__.invoke(command, params);
    
    // Handle ApiResponse format dari Rust
    if (response && typeof response === 'object') {
      if (response.success === false) {
        throw new Error(response.error || 'Unknown error');
      }
      // Return data field dari ApiResponse
      return response.data !== undefined ? response.data : response;
    }
    
    return response;
  } catch (error) {
    console.error(`Error invoking ${command}:`, error);
    throw error;
  }
}

/* ====== Elemen DOM ====== */
const siswaTableBody = document.getElementById("siswaTableBody");
const modalEl = document.getElementById('modalSiswa');
const modalSiswa = new bootstrap.Modal(modalEl);
const formSiswa = document.getElementById('formSiswa');
const modalTitle = document.getElementById('modalTitle');
const btnTambahSiswa = document.getElementById("btnTambahSiswa");
const btnSaveSiswa = document.getElementById("btnSaveSiswa");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logoutBtn");

// Tambahkan CSS global untuk tabel
const style = document.createElement('style');
style.textContent = `
  table {
    border-collapse: collapse;
    width: 100%;
  }

  th, td {
    border: 1px solid #000000ff; 
    text-align: center;    
    padding: 1px 2px;
    font-size: 18px; 
    line-height: 1.2;    
  }

  th {
    background-color: #f8f8f8; 
    font-weight: 600;
  }

  td:nth-child(10), th:nth-child(10) {
    min-width: 450px;
    max-width: 1350px;
    white-space: normal;
    word-wrap: break-word;
  }

  td:nth-child(16), th:nth-child(16) {
    min-width: 450px;
    max-width: 1350px;
    white-space: normal;
    word-wrap: break-word;
  }

  td:nth-child(4), th:nth-child(4) {
    min-width: 250px;
    max-width: 1350px;
    white-space: normal;
    word-wrap: break-word;
  }

  td:nth-child(7), th:nth-child(7) {
    min-width: 220px;
    max-width: 1350px;
    white-space: normal;
    word-wrap: break-word;
  }

  td:nth-child(8), th:nth-child(8) {
    min-width: 250px;
    max-width: 1350px;
    white-space: normal;
    word-wrap: break-word;
  }

  td:nth-child(9), th:nth-child(9) {
    min-width: 250px;
    max-width: 1350px;
    white-space: normal;
    word-wrap: break-word;
  }

  td:nth-child(13), th:nth-child(13) {
    min-width: 250px;
    max-width: 1350px;
    white-space: normal;
    word-wrap: break-word;
  }

  td:nth-child(15), th:nth-child(15) {
    min-width: 250px;
    max-width: 1350px;
    white-space: normal;
    word-wrap: break-word;
  }

  td button {
    border: none;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 14px;
    margin: 2px;
  }

  .btn-warning {
    background-color: #fbc02d;
    color: #222;
  }

  .btn-danger {
    background-color: #e53935;
    color: #fff;
  }

  .modal-dialog {
    will-change: transform;
    backface-visibility: hidden;
    transform: translateZ(0);
  }

  .modal.fade .modal-dialog {
    transition: transform 0.2s ease-out;
  }

  .modal-body {
    overflow-y: auto;
    max-height: calc(100vh - 200px);
  }

  .modal input,
  .modal textarea,
  .modal select {
    will-change: auto;
    backface-visibility: hidden;
  }

  .modal input:focus,
  .modal textarea:focus,
  .modal select:focus {
    transition: none;
  }

  .btn-warning:hover {
    background-color: #f9a825;
  }

  .btn-danger:hover {
    background-color: #c62828;
  }
`;
document.head.appendChild(style);

/* ====== Utility ====== */
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

/**
 * Ekstrak pesan error yang user-friendly dari error message
 */
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

  if (!message) {
    return 'Terjadi kesalahan yang tidak diketahui';
  }

  return message;
}

/**
 * Tampilkan pesan error yang user-friendly
 */
function showAlert(message, originalError = null) {
  if (originalError) {
    console.error('Error Detail:', originalError);
  }
  alert(message);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ====== Load & Render ====== */
async function loadSiswa() {
  try {
    // ✅ Tauri Command: get_all_siswa (tanpa parameter)
    const data = await invokeCommand('get_all_siswa');
    renderSiswaTable(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Gagal load data siswa:', err);
    const userMessage = extractUserFriendlyMessage(err);
    showAlert('Gagal memuat data siswa: ' + userMessage, err);
    renderSiswaTable([]);
  }
}

function renderSiswaTable(list) {
  siswaTableBody.innerHTML = '';

  if (list.length === 0) {
    siswaTableBody.innerHTML = `
      <tr>
        <td colspan="20" class="text-center">🧑🏻‍🎓 Belum ada data siswa</td>
      </tr>
    `;
    return;
  }

  list.forEach((s, i) => {
    const tr = document.createElement('tr');
    tr.dataset.id = s.id;
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(String(s.nis || ''))}</td>
      <td>${escapeHtml(String(s.nisn || ''))}</td>
      <td>${escapeHtml(String(s.nama || ''))}</td>
      <td>${escapeHtml(String(s.kelas || ''))}</td>
      <td>${escapeHtml(String(s.jenis_kelamin || ''))}</td>
      <td>${escapeHtml(String(s.created_at || ''))}</td>
      <td>${escapeHtml(String(s.nama_ayah || ''))}</td>
      <td>${escapeHtml(String(s.nama_ibu || ''))}</td>
      <td>${escapeHtml(String(s.alamat_ortu || ''))}</td>
      <td>${escapeHtml(String(s.kontak_ortu || ''))}</td>
      <td>${escapeHtml(String(s.email_ortu || ''))}</td>
      <td>${escapeHtml(String(s.pekerjaan_ayah || ''))}</td>
      <td>${escapeHtml(String(s.pekerjaan_ibu || ''))}</td>
      <td>${escapeHtml(String(s.nama_wali || ''))}</td>
      <td>${escapeHtml(String(s.alamat_wali || ''))}</td>
      <td>${escapeHtml(String(s.kontak_wali || ''))}</td>
      <td>${escapeHtml(String(s.email_wali || ''))}</td>
      <td>${escapeHtml(String(s.pekerjaan_wali || ''))}</td>
      <td>
        <button class="btn btn-sm btn-warning btn-edit" data-id="${s.id}">✒️</button>
        <button class="btn btn-sm btn-danger btn-delete" data-id="${s.id}">🗑️</button>
      </td>
    `;
    siswaTableBody.appendChild(tr);
  });
}

/* ====== Modal Handling (OPTIMIZED) ====== */
function openAddModal() {
  requestAnimationFrame(() => {
    formSiswa.reset();
    document.getElementById('siswaId').value = '';
    modalTitle.textContent = 'Tambah Siswa';
    document.getElementById('jenis_kelamin').value = 'L';
    
    modalSiswa.show();
  });
}

function openEditModal(s) {
  if (!s) return;
  
  requestAnimationFrame(() => {
    formSiswa.reset();

    // Data Siswa
    document.getElementById('siswaId').value = s.id || '';
    document.getElementById('nis').value = s.nis || '';
    document.getElementById('nisn').value = s.nisn || '';
    document.getElementById('nama').value = s.nama || '';
    document.getElementById('kelas').value = s.kelas || '';
    document.getElementById('jenis_kelamin').value = (s.jenis_kelamin || 'L').toUpperCase();

    // Data Orang Tua
    document.getElementById('nama_ayah').value = s.nama_ayah || '';
    document.getElementById('nama_ibu').value = s.nama_ibu || '';
    document.getElementById('alamat_ortu').value = s.alamat_ortu || '';
    document.getElementById('kontak_ortu').value = s.kontak_ortu || '';
    document.getElementById('email_ortu').value = s.email_ortu || '';
    document.getElementById('pekerjaan_ayah').value = s.pekerjaan_ayah || '';
    document.getElementById('pekerjaan_ibu').value = s.pekerjaan_ibu || '';

    // Data Wali
    document.getElementById('nama_wali').value = s.nama_wali || '';
    document.getElementById('alamat_wali').value = s.alamat_wali || '';
    document.getElementById('kontak_wali').value = s.kontak_wali || '';
    document.getElementById('email_wali').value = s.email_wali || '';
    document.getElementById('pekerjaan_wali').value = s.pekerjaan_wali || '';

    modalTitle.textContent = 'Edit Siswa';
    
    setTimeout(() => {
      modalSiswa.show();
    }, 10);
  });
}

// Modal performance optimization
modalEl.addEventListener('show.bs.modal', () => {
  const modalDialog = modalEl.querySelector('.modal-dialog');
  if (modalDialog) {
    modalDialog.style.willChange = 'transform, opacity';
  }
});

modalEl.addEventListener('shown.bs.modal', () => {
  const jkSelect = document.getElementById('jenis_kelamin');
  if (!jkSelect.value) jkSelect.value = 'L';
  
  const modalDialog = modalEl.querySelector('.modal-dialog');
  if (modalDialog) {
    setTimeout(() => {
      modalDialog.style.willChange = 'auto';
    }, 500);
  }
});

// Prevent multiple rapid opens
let isModalOpening = false;
const originalShowModal = modalSiswa.show;
modalSiswa.show = function() {
  if (isModalOpening) return;
  isModalOpening = true;
  originalShowModal.call(this);
  setTimeout(() => {
    isModalOpening = false;
  }, 300);
};

/* ====== Validasi ====== */
function validateFormData(data) {
  if (!data || typeof data !== 'object') throw new Error('Data tidak valid');

  // NIS
  if (!data.nis || !/^[0-9]{9,11}$/.test(String(data.nis).trim())) {
    throw new Error('NIS harus berupa angka 9-11 digit');
  }

  // NISN (opsional, tapi jika ada harus valid)
  if (data.nisn && String(data.nisn).trim() !== '' && !/^[0-9]{9,11}$/.test(String(data.nisn).trim())) {
    throw new Error('NISN harus berupa angka 9-11 digit');
  }

  // Nama
  const nama = String(data.nama || '').trim();
  if (nama.length < 3) throw new Error('Nama siswa minimal 3 karakter');

  // Kelas
  if (!data.kelas || String(data.kelas).trim().length === 0) {
    throw new Error('Kelas tidak boleh kosong');
  }

  // Jenis kelamin
  const jk = String(data.jenis_kelamin || '').trim().toUpperCase();
  if (!['L', 'P'].includes(jk)) throw new Error('Jenis kelamin harus L atau P');

  // Validasi Email Orang Tua
  if (data.email_ortu && data.email_ortu.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email_ortu.trim())) {
      throw new Error('Format email orang tua tidak valid');
    }
  }

  // Validasi Email Wali
  if (data.email_wali && data.email_wali.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email_wali.trim())) {
      throw new Error('Format email wali tidak valid');
    }
  }

  // Validasi Nomor Telepon
  if (data.kontak_ortu && data.kontak_ortu.trim() !== '') {
    if (!/^[0-9+\-\s()]{10,15}$/.test(data.kontak_ortu.trim())) {
      throw new Error('Format kontak orang tua tidak valid (10-15 digit)');
    }
  }

  if (data.kontak_wali && data.kontak_wali.trim() !== '') {
    if (!/^[0-9+\-\s()]{10,15}$/.test(data.kontak_wali.trim())) {
      throw new Error('Format kontak wali tidak valid (10-15 digit)');
    }
  }

  // Return validated data dengan konversi null untuk optional fields
  return {
    nis: String(data.nis).trim(),
    nisn: String(data.nisn || '').trim() || null,
    nama: nama,
    kelas: String(data.kelas).trim(),
    jenis_kelamin: jk,
    nama_ayah: String(data.nama_ayah || '').trim() || null,
    nama_ibu: String(data.nama_ibu || '').trim() || null,
    alamat_ortu: String(data.alamat_ortu || '').trim() || null,
    kontak_ortu: String(data.kontak_ortu || '').trim() || null,
    email_ortu: String(data.email_ortu || '').trim() || null,
    pekerjaan_ayah: String(data.pekerjaan_ayah || '').trim() || null,
    pekerjaan_ibu: String(data.pekerjaan_ibu || '').trim() || null,
    nama_wali: String(data.nama_wali || '').trim() || null,
    alamat_wali: String(data.alamat_wali || '').trim() || null,
    kontak_wali: String(data.kontak_wali || '').trim() || null,
    email_wali: String(data.email_wali || '').trim() || null,
    pekerjaan_wali: String(data.pekerjaan_wali || '').trim() || null
  };
}

/* ====== Real-time Validation dengan Debounce ====== */
function debounce(func, wait = 300) {
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

const validateEmailInput = debounce((input) => {
  const value = input.value.trim();
  
  if (!value) {
    input.setCustomValidity('');
    input.classList.remove('is-invalid');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    input.setCustomValidity('Format email tidak valid');
    input.classList.add('is-invalid');
  } else {
    input.setCustomValidity('');
    input.classList.remove('is-invalid');
  }
}, 500);

const validateKontakInput = debounce((input) => {
  const value = input.value.trim();
  
  if (!value) {
    input.setCustomValidity('');
    input.classList.remove('is-invalid');
    return;
  }
  
  if (!/^[0-9+\-\s()]{10,15}$/.test(value)) {
    input.setCustomValidity('Format kontak tidak valid (10-15 digit)');
    input.classList.add('is-invalid');
  } else {
    input.setCustomValidity('');
    input.classList.remove('is-invalid');
  }
}, 500);

function setupInputValidators() {
  const emailOrtu = document.getElementById('email_ortu');
  const emailWali = document.getElementById('email_wali');
  
  if (emailOrtu) {
    emailOrtu.removeEventListener('input', emailOrtu._validator);
    emailOrtu._validator = () => validateEmailInput(emailOrtu);
    emailOrtu.addEventListener('input', emailOrtu._validator);
  }
  
  if (emailWali) {
    emailWali.removeEventListener('input', emailWali._validator);
    emailWali._validator = () => validateEmailInput(emailWali);
    emailWali.addEventListener('input', emailWali._validator);
  }
  
  const kontakOrtu = document.getElementById('kontak_ortu');
  const kontakWali = document.getElementById('kontak_wali');
  
  if (kontakOrtu) {
    kontakOrtu.removeEventListener('input', kontakOrtu._validator);
    kontakOrtu._validator = () => validateKontakInput(kontakOrtu);
    kontakOrtu.addEventListener('input', kontakOrtu._validator);
  }
  
  if (kontakWali) {
    kontakWali.removeEventListener('input', kontakWali._validator);
    kontakWali._validator = () => validateKontakInput(kontakWali);
    kontakWali.addEventListener('input', kontakWali._validator);
  }
}

/* ====== Save Handler ====== */
async function saveSiswaHandler() {
  if (btnSaveSiswa.disabled) return;
  
  try {
    btnSaveSiswa.disabled = true;
    btnSaveSiswa.textContent = '⏳ Menyimpan...';
    
    const id = document.getElementById('siswaId').value;
    const jkEl = document.getElementById('jenis_kelamin');
    let jkValue = sanitizeInput(jkEl.value).toUpperCase();

    if (!jkValue) {
      jkValue = 'L';
      jkEl.value = 'L';
    }

    const payload = {
      nis: sanitizeInput(document.getElementById('nis').value),
      nisn: sanitizeInput(document.getElementById('nisn').value),
      nama: sanitizeInput(document.getElementById('nama').value),
      kelas: sanitizeInput(document.getElementById('kelas').value),
      jenis_kelamin: jkValue,
      nama_ayah: sanitizeInput(document.getElementById('nama_ayah').value),
      nama_ibu: sanitizeInput(document.getElementById('nama_ibu').value),
      alamat_ortu: sanitizeInput(document.getElementById('alamat_ortu').value),
      kontak_ortu: sanitizeInput(document.getElementById('kontak_ortu').value),
      email_ortu: sanitizeInput(document.getElementById('email_ortu').value),
      pekerjaan_ayah: sanitizeInput(document.getElementById('pekerjaan_ayah').value),
      pekerjaan_ibu: sanitizeInput(document.getElementById('pekerjaan_ibu').value),
      nama_wali: sanitizeInput(document.getElementById('nama_wali').value),
      alamat_wali: sanitizeInput(document.getElementById('alamat_wali').value),
      kontak_wali: sanitizeInput(document.getElementById('kontak_wali').value),
      email_wali: sanitizeInput(document.getElementById('email_wali').value),
      pekerjaan_wali: sanitizeInput(document.getElementById('pekerjaan_wali').value)
    };

    const validated = validateFormData(payload);

    if (id) {
      // ✅ Tauri Command: update_siswa
      // Backend expect: UpdateSiswaRequest { id: i64, data: AddSiswaRequest }
      await invokeCommand('update_siswa', {
        req: {
          id: parseInt(id),
          data: validated
        }
      });
    } else {
      // ✅ Tauri Command: add_siswa
      // Backend expect: AddSiswaRequest (langsung objek)
      await invokeCommand('add_siswa', { 
        req: validated 
      });
    }

    modalSiswa.hide();
    
    setTimeout(() => {
      loadSiswa();
    }, 100);
    
  } catch (err) {
    console.error('Gagal menyimpan siswa:', err);
    const userMessage = extractUserFriendlyMessage(err);
    showAlert(userMessage, err);
  } finally {
    setTimeout(() => {
      btnSaveSiswa.disabled = false;
      btnSaveSiswa.textContent = '💾 Simpan';
    }, 500);
  }
}

/* ====== Delete ====== */
async function deleteSiswaHandler(id) {
  if (!id) return;
  if (!confirm('⚠️ Apakah Anda yakin ingin menghapus data siswa ini?\n\nMenghapus siswa akan menghapus semua nilai dan absensi terkait!')) return;
  
  try {
    // ✅ Tauri Command: delete_siswa
    await invokeCommand('delete_siswa', { id: parseInt(id) });
    await loadSiswa();
  } catch (err) {
    console.error('Gagal hapus siswa:', err);
    const userMessage = extractUserFriendlyMessage(err);
    showAlert('Gagal menghapus siswa: ' + userMessage, err);
  }
}

/* ====== Delegation ====== */
siswaTableBody.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.btn-edit');
  const delBtn = e.target.closest('.btn-delete');

  if (editBtn) {
    const id = editBtn.dataset.id;
    try {
      // ✅ Tauri Command: get_siswa_by_id
      const siswa = await invokeCommand('get_siswa_by_id', { id: parseInt(id) });
      if (!siswa) return showAlert('Data siswa tidak ditemukan');
      openEditModal(siswa);
    } catch (err) {
      console.error('Gagal ambil data untuk edit:', err);
      const userMessage = extractUserFriendlyMessage(err);
      showAlert('Gagal ambil data siswa: ' + userMessage, err);
    }
    return;
  }

  if (delBtn) {
    const id = delBtn.dataset.id;
    deleteSiswaHandler(id);
    return;
  }
});

/* ====== Tombol ====== */
btnTambahSiswa.addEventListener('click', () => openAddModal());
btnSaveSiswa.addEventListener('click', () => saveSiswaHandler());

/* ====== Search ====== */
searchInput.addEventListener('input', (e) => {
  const term = String(e.target.value || '').toLowerCase();
  document.querySelectorAll("#siswaTableBody tr").forEach(row => {
    if (row.cells.length < 20) return;
    
    const nis = row.cells[1]?.textContent.toLowerCase() || '';
    const nisn = row.cells[2]?.textContent.toLowerCase() || '';
    const nama = row.cells[3]?.textContent.toLowerCase() || '';
    const kelas = row.cells[4]?.textContent.toLowerCase() || '';
    const namaAyah = row.cells[7]?.textContent.toLowerCase() || '';
    const namaIbu = row.cells[8]?.textContent.toLowerCase() || '';
    const namaWali = row.cells[14]?.textContent.toLowerCase() || '';
    
    const match = nis.includes(term) || 
                  nisn.includes(term) || 
                  nama.includes(term) ||
                  kelas.includes(term) ||
                  namaAyah.includes(term) ||
                  namaIbu.includes(term) ||
                  namaWali.includes(term);
    
    row.style.display = match ? '' : 'none';
  });
});

// Smooth Closing Animation 
document.addEventListener('DOMContentLoaded', function() {
  const modalEl = document.getElementById('modalSiswa');
  
  if (modalEl) {
    modalEl.addEventListener('hide.bs.modal', function(e) {
      const modalDialog = this.querySelector('.modal-dialog');
      modalDialog.style.animation = 'modalSlideOut 0.3s ease-out forwards';
    });
    
    modalEl.addEventListener('show.bs.modal', function(e) {
      const modalDialog = this.querySelector('.modal-dialog');
      modalDialog.style.animation = '';
    });
  }
});

/* ====== Logout ====== */
logoutBtn.addEventListener('click', async () => {
  if (confirm('Apakah kamu yakin ingin keluar?')) {
    window.location.href = 'login.html';
  }
});

/* ====== Init ====== */
(function init() {
  loadSiswa();
  setupInputValidators();
  modalEl.addEventListener('hidden.bs.modal', () => formSiswa.reset());
})();
