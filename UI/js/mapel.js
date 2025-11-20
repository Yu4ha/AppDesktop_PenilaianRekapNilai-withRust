/**
 * mapel.js (Tauri Version - FIXED FINAL)
 */
import { invokeCommand } from './tauriAPIhelper';

// ==========================
// State
// ==========================
let allMapel = [];
let isEditMode = false;
let currentEditId = null;

// ==========================
// Initialization
// ==========================
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  setupNavigation();
  await loadMapelData();
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year:'numeric', month:'short', day:'numeric'
    });
  } catch {
    return dateString;
  }
}

function showLoading(show) {
  const tbody = document.getElementById('mapelTableBody');
  if (!tbody) return;
  tbody.innerHTML = show ? `<tr><td colspan="5" style="text-align:center;padding:30px;">⏳ Memuat data...</td></tr>` : '';
}

// ==========================
// Load & Render
// ==========================
async function loadMapelData() {
  try {
    showLoading(true);
    const mapelData = await invokeCommand('get_all_mapel');
    allMapel = mapelData || [];
    allMapel.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    renderMapelTable();
  } catch (err) {
    console.error(err);
    alert('❌ Gagal memuat data mapel: ' + err.message);
  } finally {
    showLoading(false);
  }
}

function renderMapelTable() {
  const tbody = document.getElementById('mapelTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!allMapel.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">📭 Belum ada data mata pelajaran</td></tr>`;
    return;
  }

  allMapel.forEach((mapel, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${escapeHtml(mapel.nama_mapel)}</td>
      <td>${mapel.kkm ?? '-'}</td>
      <td>${formatDate(mapel.created_at)}</td>
      <td>
        <button class="btn-edit" data-id="${mapel.id}">✏️</button>
        <button class="btn-delete" data-id="${mapel.id}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachTableButtonListeners();
}

// ==========================
// Event Listeners
// ==========================
function attachTableButtonListeners() {
  document.querySelectorAll('.btn-edit').forEach(btn =>
    btn.addEventListener('click', () => handleEdit(parseInt(btn.dataset.id)))
  );
  document.querySelectorAll('.btn-delete').forEach(btn =>
    btn.addEventListener('click', () => handleDelete(parseInt(btn.dataset.id)))
  );
}

function setupEventListeners() {
  const form = document.getElementById('mapelForm');
  if (form) form.addEventListener('submit', handleFormSubmit);

  const searchInput = document.getElementById('searchMapel');
  if (searchInput) searchInput.addEventListener('input', e => handleSearch(e.target.value));
}

function setupNavigation() {
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll('.nav-item').forEach(link => {
    const href = link.getAttribute('href');
    if (currentPage === href || (currentPage === "" && href === "index-mapel.html")) {
      link.classList.add('active');
    }
  });
}

// ==========================
// CRUD Handlers (FIXED)
// ==========================
async function handleFormSubmit(e) {
  e.preventDefault();
  const namaMapel = document.getElementById('namaMapel').value.trim();
  const kkm = parseInt(document.getElementById('kkm').value);

  if (!namaMapel || namaMapel.length < 3 || namaMapel.length > 100) {
    return alert('⚠️ Nama mata pelajaran harus 3-100 karakter!');
  }
  if (isNaN(kkm) || kkm < 0 || kkm > 100) {
    return alert('⚠️ KKM harus 0-100!');
  }

  try {
    if (isEditMode && currentEditId) {
      // update_mapel Rust expects { req: { id, nama_mapel, kkm } }
      await invokeCommand('update_mapel', { req: { id: currentEditId, nama_mapel: namaMapel, kkm } });
      alert('✅ Mapel berhasil diupdate!');
      resetForm();
    } else {
      // add_mapel Rust expects { req: { nama_mapel, kkm } }
      await invokeCommand('add_mapel', { req: { nama_mapel: namaMapel, kkm } });
      alert('✅ Mapel berhasil ditambahkan!');
    }
    await loadMapelData();
    e.target.reset();
  } catch (err) {
    console.error(err);
    alert('❌ Gagal menyimpan mapel: ' + err.message);
  }
}

function handleEdit(id) {
  const mapel = allMapel.find(m => m.id === id);
  if (!mapel) return alert('❌ Data tidak ditemukan!');
  isEditMode = true;
  currentEditId = id;
  document.getElementById('namaMapel').value = mapel.nama_mapel;
  document.getElementById('kkm').value = mapel.kkm;

  const submitBtn = document.querySelector('#mapelForm button[type="submit"]');
  submitBtn.textContent = '✏️ Update Mapel';
  submitBtn.style.background = '#f39c12';

  let cancelBtn = document.getElementById('cancelEditBtn');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancelEditBtn';
    cancelBtn.type = 'button';
    cancelBtn.textContent = '❌ Batal';
    cancelBtn.style.cssText = 'background:#95a5a6;color:white;margin-top:10px;width:100%;';
    cancelBtn.addEventListener('click', resetForm);
    submitBtn.parentNode.appendChild(cancelBtn);
  }
  cancelBtn.style.display = 'block';
}

function resetForm() {
  isEditMode = false;
  currentEditId = null;
  document.getElementById('mapelForm').reset();
  const submitBtn = document.querySelector('#mapelForm button[type="submit"]');
  submitBtn.textContent = '💾 Simpan Mapel';
  submitBtn.style.background = '';
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) cancelBtn.style.display = 'none';
}

async function handleDelete(id) {
  const mapel = allMapel.find(m => m.id === id);
  if (!mapel) return alert('❌ Data tidak ditemukan!');
  if (!confirm(`⚠️ Hapus mapel "${mapel.nama_mapel}"?`)) return;

  try {
    // delete_mapel Rust expects id: i64 (langsung)
    await invokeCommand('delete_mapel', id);
    alert('✅ Mapel berhasil dihapus!');
    if (isEditMode && currentEditId === id) resetForm();
    await loadMapelData();
  } catch (err) {
    console.error(err);
    alert('❌ Gagal menghapus mapel: ' + err.message);
  }
}

// ==========================
// Search
// ==========================
function handleSearch(keyword) {
  const tbody = document.getElementById('mapelTableBody');
  tbody.innerHTML = '';
  if (!keyword.trim()) return renderMapelTable();

  const filtered = allMapel.filter(m => m.nama_mapel.toLowerCase().includes(keyword.toLowerCase()));
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">🔍 Tidak ada hasil untuk "${escapeHtml(keyword)}"</td></tr>`;
    return;
  }

  filtered.forEach((mapel, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${escapeHtml(mapel.nama_mapel)}</td>
      <td>${mapel.kkm ?? '-'}</td>
      <td>${formatDate(mapel.created_at)}</td>
      <td>
        <button class="btn-edit" data-id="${mapel.id}">✏️</button>
        <button class="btn-delete" data-id="${mapel.id}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachTableButtonListeners();
}
