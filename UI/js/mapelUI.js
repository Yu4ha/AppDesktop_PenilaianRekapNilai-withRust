/**
 * ============================================================
 * 📘 MAPEL UI CONTROLLER - FINAL-FINAL VERSION
 * ============================================================
 * Tauri-friendly: window.__TAURI__.tauri.invoke
 */

document.addEventListener('DOMContentLoaded', () => {
  // ======================
  // Element references
  // ======================
  const modalEl = document.getElementById('modalMapel');
  const modal = new bootstrap.Modal(modalEl);

  const form = document.getElementById('mapelForm');
  const inputId = document.getElementById('mapelId');
  const inputNama = document.getElementById('namaMapel');
  const inputKKM = document.getElementById('kkm');
  const modalTitle = document.getElementById('modalMapelTitle');
  const btnSave = document.getElementById('btnSaveMapel');
  const btnTambah = document.getElementById('btnTambahMapel');
  const tableBody = document.getElementById('mapelTableBody');

  let allMapel = [];

  // ======================
  // Helper: Tauri invoke
  // ======================
  async function invokeCommand(command, args = {}) {
    if (!window.__TAURI__ || !window.__TAURI__.tauri) {
      throw new Error('❌ Tauri API belum dimuat. Pastikan withGlobalTauri: true di tauri.conf.json');
    }
    return await window.__TAURI__.tauri.invoke(command, args);
  }

  // ======================
  // Load & Render
  // ======================
  async function loadMapel() {
    try {
      const res = await invokeCommand('get_all_mapel');
      allMapel = res.data || [];
      renderTable(allMapel);
      updateStats(allMapel);
    } catch (err) {
      console.error('❌ Gagal load mapel:', err);
      alert('Gagal memuat data mapel. Cek console.');
    }
  }

  function renderTable(mapelList = []) {
    tableBody.innerHTML = '';
    if (!mapelList.length) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center">📚 Belum ada data mapel</td></tr>`;
      return;
    }
    mapelList.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    mapelList.forEach((m,i)=>{
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i+1}</td>
        <td>${m.nama_mapel}</td>
        <td>${m.kkm}</td>
        <td>${m.created_at||'-'}</td>
        <td>
          <button class="btn btn-sm btn-warning btn-edit" data-id="${m.id}" type="button">✒️</button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${m.id}" type="button">🗑️</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    tableBody.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', handleEdit));
    tableBody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', handleDelete));
  }

  function updateStats(mapelList = []) {
    const total = mapelList.length;
    const kkms = mapelList.map(m=>m.kkm);
    const avg = kkms.length ? (kkms.reduce((a,b)=>a+b,0)/kkms.length).toFixed(1) : '0';
    const max = kkms.length ? Math.max(...kkms) : '0';
    const min = kkms.length ? Math.min(...kkms) : '0';
    document.getElementById('totalMapel').textContent = total;
    document.getElementById('avgKKM').textContent = avg;
    document.getElementById('highestKKM').textContent = max;
    document.getElementById('lowestKKM').textContent = min;
  }

  // ======================
  // Modal actions
  // ======================
  btnTambah.addEventListener('click', () => {
    form.reset();
    inputId.value = '';
    modalTitle.textContent = 'Tambah Mata Pelajaran';
    modal.show();
  });

  btnSave.addEventListener('click', async ()=>{
    const id = inputId.value.trim();
    const nama = inputNama.value.trim();
    const kkm = parseInt(inputKKM.value.trim());

    // Validasi
    if (!nama || nama.length < 3 || nama.length > 100) {
      return alert('⚠️ Nama mapel harus 3-100 karakter!');
    }
    if (isNaN(kkm) || kkm < 0 || kkm > 100) {
      return alert('⚠️ KKM harus 0-100!');
    }

    try {
      if (id) {
        // Update mapel
        await invokeCommand('update_mapel', { req: { id: parseInt(id), nama_mapel: nama, kkm } });
        alert('✅ Mapel berhasil diupdate!');
      } else {
        // Tambah mapel baru
        await invokeCommand('add_mapel', { req: { nama_mapel: nama, kkm } });
        alert('✅ Mapel berhasil ditambahkan!');
      }
      modal.hide();
      await loadMapel();
    } catch(err) {
      console.error('❌ Gagal simpan mapel:', err);
      alert('❌ Terjadi kesalahan saat menyimpan data. Cek console.');
    }
  });

  async function handleEdit(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    try {
      const res = await invokeCommand('get_mapel_by_id', { id: parseInt(id) });
      const mapel = res.data;
      if (!mapel) return alert('❌ Data tidak ditemukan!');
      inputId.value = mapel.id;
      inputNama.value = mapel.nama_mapel;
      inputKKM.value = mapel.kkm;
      modalTitle.textContent = 'Edit Mata Pelajaran';
      modal.show();
    } catch(err) {
      console.error('❌ Gagal ambil data mapel:', err);
    }
  }

  async function handleDelete(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    if (!confirm('⚠️ Yakin hapus mapel ini?')) return;
    try {
      await invokeCommand('delete_mapel', { id: parseInt(id) });
      alert('✅ Mapel berhasil dihapus!');
      await loadMapel();
    } catch(err) {
      console.error('❌ Gagal hapus mapel:', err);
    }
  }

  // ======================
  // Load awal
  // ======================
  loadMapel();
});

console.log('✅ Mapel UI FINAL-FINAL loaded');

