import{i as z}from"./closeWindow-BOCvx3Ut.js";/* empty css             */async function h(e,a={}){try{const t=await z(e,a);if(t&&typeof t=="object"&&"success"in t){if(!t.success)throw new Error(t.error||"Command failed");return t.data}return t}catch(t){throw console.error(`[Tauri Command Error] ${e}:`,t),t}}let v=[],p=[],w=!1,c=null,l=null,s=null,y=[];document.addEventListener("DOMContentLoaded",async()=>{try{await D(),R(),N()}catch(e){console.error("Inisialisasi gagal:",e),u("Gagal memuat halaman. Cek konsol untuk detail.")}});async function D(){k(!0);try{await K(),C();const e=new URLSearchParams(window.location.search),a=e.get("kelas"),t=e.get("semester"),n=e.get("tahun");if(a&&t&&n)c=a,l=parseInt(t),s=n,document.getElementById("filterKelas").value=c,document.getElementById("filterSemester").value=l,document.getElementById("filterTahunAjaran").value=s,await L();else{const r=new Date,i=r.getFullYear(),o=r.getMonth()+1;s=o>=7?`${i}/${i+1}`:`${i-1}/${i}`,l=o>=7?1:2,document.getElementById("filterTahunAjaran").value=s,document.getElementById("filterSemester").value=l}}catch(e){console.error("Error initializing page:",e),u("Gagal memuat data: "+g(e))}finally{k(!1)}}async function K(){try{const[e,a]=await Promise.all([h("get_all_siswa"),h("get_daftar_tahun_ajaran")]);v=Array.isArray(e)?e:[],y=Array.isArray(a)?a:[];const t=new Date,n=t.getFullYear(),i=t.getMonth()+1>=7?`${n}/${n+1}`:`${n-1}/${n}`;y.includes(i)||y.unshift(i)}catch(e){throw console.error("loadInitialData error:",e),e}}async function $(){try{if(!c||!l||!s){p=[];return}const e=await h("get_kehadiran_by_kelas",{kelas:c,semester:l,tahunAjaran:s});p=Array.isArray(e)?e:[],console.log("Loaded kehadiran:",p)}catch(e){console.error("loadFilteredKehadiran error:",e),p=[]}}const B=document.createElement("style");B.textContent=`
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
`;document.head.appendChild(B);function C(){const e=document.getElementById("filterKelas");if(e){const t=[...new Set(v.map(n=>n.kelas))].sort();e.innerHTML='<option value="">-- Pilih Kelas --</option>'+t.map(n=>`<option value="${n}">${n}</option>`).join("")}const a=document.getElementById("filterTahunAjaran");a&&(a.innerHTML='<option value="">-- Pilih Tahun Ajaran --</option>'+y.map(t=>`<option value="${t}">${t}</option>`).join(""))}async function L(){const e=document.getElementById("filterKelas"),a=document.getElementById("filterSemester"),t=document.getElementById("filterTahunAjaran");if(!(e!=null&&e.value)||!(a!=null&&a.value)||!(t!=null&&t.value)){u("⚠️ Silakan pilih Kelas, Semester, dan Tahun Ajaran terlebih dahulu!");return}c=e.value,l=parseInt(a.value),s=t.value;const n=new URLSearchParams;n.set("kelas",c),n.set("semester",l),n.set("tahun",s),window.history.replaceState({},"",`?${n.toString()}`);const r=document.getElementById("infoSection"),i=document.getElementById("infoContent");r&&i&&(r.style.display="block",i.innerHTML=`
      <strong>Kelas:</strong> ${c} | 
      <strong>Semester:</strong> ${l} | 
      <strong>Tahun Ajaran:</strong> ${s}
    `),k(!0);try{await $(),b(),x()}catch(o){console.error("Error applying filters:",o),u("❌ Gagal menerapkan filter: "+g(o))}finally{k(!1)}}function H(){c=null,l=null,s=null,document.getElementById("filterKelas").value="",document.getElementById("filterSemester").value="",document.getElementById("filterTahunAjaran").value="";const e=document.getElementById("infoSection");e&&(e.style.display="none"),window.history.replaceState({},"",window.location.pathname),p=[],b(),x()}function b(){const e=document.getElementById("kehadiranTableBody");if(!e){console.error("Element #kehadiranTableBody tidak ditemukan!");return}if(e.innerHTML="",typeof f<"u"&&f.clear(),!c||!l||!s){e.innerHTML=`<tr><td colspan="10" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;return}const a=v.filter(t=>t.kelas===c);if(a.length===0){e.innerHTML=`<tr><td colspan="10" style="padding: 40px; text-align: center; color: #999;">
      📭 Tidak ada siswa di kelas <strong>${c}</strong>
    </td></tr>`;return}a.forEach((t,n)=>{const r=p.find(o=>o.siswa_id===t.id),i=document.createElement("tr");i.innerHTML=`
      <td>${n+1}</td>
      <td>${t.nis}</td>
      <td>${t.nisn||"-"}</td>
      <td style="text-align: center; padding-left: 10px;">${A(t.nama)}</td>
      <td>
        <input 
          type="number" 
          class="kehadiran-input hadir" 
          value="${r?r.hadir:""}" 
          min="0" 
          placeholder="0"
          data-siswa-id="${t.id}"
          data-type="hadir"
        />
      </td>
      <td>
        <input 
          type="number" 
          class="kehadiran-input sakit" 
          value="${r?r.sakit:""}" 
          min="0" 
          placeholder="0"
          data-siswa-id="${t.id}"
          data-type="sakit"
        />
      </td>
      <td>
        <input 
          type="number" 
          class="kehadiran-input izin" 
          value="${r?r.izin:""}" 
          min="0" 
          placeholder="0"
          data-siswa-id="${t.id}"
          data-type="izin"
        />
      </td>
      <td>
        <input 
          type="number" 
          class="kehadiran-input alpa" 
          value="${r?r.alpa:""}" 
          min="0" 
          placeholder="0"
          data-siswa-id="${t.id}"
          data-type="alpa"
        />
      </td>
      <td>
        <span class="total-display" data-siswa-id="${t.id}">${r?r.total:"-"}</span>
      </td>
      <td>
        <span class="nilai-display" data-siswa-id="${t.id}">${r?r.nilai:"-"}</span>
      </td>
    `,e.appendChild(i)}),P()}function x(){const e=document.getElementById("riwayatTableBody");if(!e){console.error("Element #riwayatTableBody tidak ditemukan!");return}if(e.innerHTML="",!c||!l||!s){e.innerHTML=`<tr><td colspan="11" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;return}if(p.length===0){e.innerHTML=`<tr><td colspan="11" style="padding: 40px; text-align: center; color: #999;">
      📭 Belum ada data kehadiran tersimpan untuk filter yang dipilih
    </td></tr>`;return}p.forEach((a,t)=>{const n=document.createElement("tr");n.innerHTML=`
      <td>${t+1}</td>
      <td>${a.nis}</td>
      <td>${a.nisn||"-"}</td>
      <td style="text-align: center; padding-left: 10px;">${A(a.nama_siswa)}</td>

      <td style="background: #4caf50; color: white; text-align: center;">${a.hadir??0}</td>
      <td style="background: #ff9800; color: white; text-align: center;">${a.sakit??0}</td>
      <td style="background: #2196f3; color: white; text-align: center;">${a.izin??0}</td>
      <td style="background: #f44336; color: white; text-align: center;">${a.alpa??0}</td>

      <td style="background: #9e9e9e; color: white; text-align: center;">${a.total??0}</td>
      <td style="background: #673ab7; color: white; text-align: center;">
        <span class="nilai-display">${typeof a.nilai=="number"?a.nilai.toFixed(2):"-"}</span>
      </td>

      <td>
        <button class="btn-delete-kehadiran" 
          data-id="${a.id}" 
          data-nama="${a.nama_siswa}">
          🗑️ Hapus
        </button>
      </td>
    `,e.appendChild(n)}),Y()}function E(e){const a=parseInt(e.hadir)||0,t=parseInt(e.sakit)||0,n=parseInt(e.izin)||0,r=parseInt(e.alpa)||0;return a+t+n+r}function F(e){const a=E(e);if(a===0)return"-";const t=parseInt(e.hadir)||0;return(Math.round(t/a*1e4)/100).toFixed(2)}function _(e,a=200){let t;return function(...r){const i=()=>{clearTimeout(t),e(...r)};clearTimeout(t),t=setTimeout(i,a)}}const f=new Map;function q(e){if(f.has(e))return f.get(e);const a={inputs:document.querySelectorAll(`.kehadiran-input[data-siswa-id="${e}"]`),totalDisplay:document.querySelector(`.total-display[data-siswa-id="${e}"]`),nilaiDisplay:document.querySelector(`.nilai-display[data-siswa-id="${e}"]`)};return f.set(e,a),a}function P(){const e=document.querySelectorAll(".kehadiran-input");f.clear();const a=_(t=>{I(t)},200);e.forEach(t=>{t.addEventListener("input",n=>{let r=n.target.value;if(r&&!/^\d+$/.test(r)){n.target.value=r.replace(/\D/g,"");return}if(parseInt(r)<0){n.target.value="0";return}const o=n.target.dataset.siswaId;a(o)}),t.addEventListener("blur",n=>{const r=n.target.dataset.siswaId;I(r)})})}function I(e){const a=q(e);if(!a.inputs||a.inputs.length===0)return;const t={hadir:0,sakit:0,izin:0,alpa:0};if(a.inputs.forEach(n=>{const r=n.dataset.type,i=parseInt(n.value)||0;t[r]=i}),a.totalDisplay){const n=E(t);a.totalDisplay.textContent=n||"-"}if(a.nilaiDisplay){const n=F(t);a.nilaiDisplay.textContent=n}}async function G(e){if(e.preventDefault(),w)return u("⏳ Sedang menyimpan, tunggu hingga proses selesai...");if(!c||!l||!s)return u("⚠️ Silakan pilih Kelas, Semester, dan Tahun Ajaran terlebih dahulu!");const a=document.getElementById("kehadiranForm");if(!a){console.error("Form #kehadiranForm tidak ditemukan.");return}const t=a.querySelectorAll("#kehadiranTableBody tr"),n=[];for(const i of t){const o=i.querySelectorAll(".kehadiran-input");if(o.length===0)continue;const m=parseInt(o[0].dataset.siswaId),d={hadir:0,sakit:0,izin:0,alpa:0};o.forEach(S=>{const j=S.dataset.type,M=parseInt(S.value)||0;d[j]=M}),E(d)!==0&&n.push({siswaId:m,kelas:c,semester:l,tahunAjaran:s,hadir:d.hadir,sakit:d.sakit,izin:d.izin,alpa:d.alpa})}if(n.length===0)return u("⚠️ Tidak ada data kehadiran yang diisi.");w=!0;const r=a.querySelector('button[type="submit"]');r&&(r.disabled=!0,r.textContent="⏳ Menyimpan...");try{let i=0,o=0;const m=[];for(const d of n)try{await h("save_kehadiran",{req:{siswa_id:d.siswaId,kelas:d.kelas,semester:d.semester,tahun_ajaran:d.tahunAjaran,hadir:d.hadir,sakit:d.sakit,izin:d.izin,alpa:d.alpa}}),i++}catch(T){o++,m.push({siswa_id:d.siswaId,error:g(T)})}o===0?u(`✅ Berhasil menyimpan ${i} data kehadiran!`):(u(`⚠️ Berhasil: ${i}, Gagal: ${o}`),console.error("Save errors:",m)),await $(),b(),x()}catch(i){console.error("handleSaveKehadiran error:",i),u("❌ Gagal menyimpan kehadiran: "+g(i))}finally{w=!1,r&&(r.disabled=!1,r.textContent="💾 Simpan Semua Kehadiran")}}function Y(){document.querySelectorAll(".btn-delete-kehadiran").forEach(a=>{a.addEventListener("click",async function(){const t=parseInt(this.dataset.id),n=this.dataset.nama;if(confirm(`⚠️ Hapus data kehadiran ${n}?

Tindakan ini tidak dapat dibatalkan.`))try{await h("delete_kehadiran",{id:t}),u(`✅ Data kehadiran ${n} berhasil dihapus.`),await $(),b(),x()}catch(r){console.error("Delete error:",r),u("❌ Gagal menghapus: "+g(r))}})})}function R(){const e=document.getElementById("kehadiranForm");e&&e.addEventListener("submit",G);const a=document.getElementById("logoutBtn");a&&a.addEventListener("click",U)}async function U(){confirm("📝 Apakah kamu yakin ingin keluar dari aplikasi?")&&(window.location.href="index.html")}function N(){const e=window.location.pathname.split("/").pop();document.querySelectorAll(".nav-item").forEach(t=>{const n=t.getAttribute("href");n&&((e===n||e===""&&n==="index-absensi.html")&&t.classList.add("active"),t.addEventListener("click",r=>{var i;(i=document.querySelector(".nav-item.active"))==null||i.classList.remove("active"),r.currentTarget.classList.add("active")}))})}function u(e){alert(e)}function A(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function g(e){return e&&typeof e=="object"&&e.message?e.message.replace(/^Error:\s*/gi,"").trim():typeof e=="string"?e.trim():"Terjadi kesalahan yang tidak diketahui"}function k(e){const a=document.getElementById("kehadiranTableBody"),t=document.getElementById("riwayatTableBody");if(e){const n=`
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
    `;a&&(a.innerHTML=n),t&&(t.innerHTML=n.replace('colspan="10"','colspan="11"'))}}window.applyFilters=L;window.resetFilters=H;
