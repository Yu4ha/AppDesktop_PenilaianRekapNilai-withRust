import"./closeWindow-BOCvx3Ut.js";/* empty css             */import{i as E}from"./tauriAPIhelper-CqjvmD2y.js";let k=[],S=[],T=[],b=[],H=!1,c=null,u=null,p=null,C=[],y={siswa_id:null,mapel_id:null,tugasList:[]};const G=0,O=100;document.addEventListener("DOMContentLoaded",async()=>{try{await W(),re(),le(),V()}catch(e){console.error("Inisialisasi gagal:",e),g("Gagal memuat halaman. Cek konsol untuk detail.")}});const R=document.createElement("style");R.textContent=`
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
`;document.head.appendChild(R);function V(){document.body.insertAdjacentHTML("beforeend",`
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
  `),document.getElementById("popupCloseBtn").addEventListener("click",N),document.getElementById("popupSaveBtn").addEventListener("click",Q),document.getElementById("tugasPopupOverlay").addEventListener("click",t=>{t.target.id==="tugasPopupOverlay"&&N()})}function q(e,t,a,n){y.siswa_id=e,y.mapel_id=t;const l=k.filter(r=>r.siswa_id===e&&r.mapel_id===t&&r.jenis==="Tugas"&&r.kelas===c&&r.semester===u&&r.tahun_ajaran===p);y.tugasList=l.map(r=>({id:r.id,nilai:r.nilai})),y.tugasList.length===0&&y.tugasList.push({id:null,nilai:""}),document.getElementById("popupTitle").textContent=`Detail Tugas: ${a} - ${n}`,F(),P(),document.getElementById("tugasPopupOverlay").classList.add("active")}function N(){document.getElementById("tugasPopupOverlay").classList.remove("active"),y={siswa_id:null,mapel_id:null,tugasList:[]}}function F(){const e=document.getElementById("popupBody");e.innerHTML="",y.tugasList.forEach((a,n)=>{const l=document.createElement("div");l.className="tugas-item",l.innerHTML=`
      <span class="tugas-label">Tugas ${n+1}:</span>
      <input 
        type="number" 
        class="tugas-input" 
        value="${a.nilai}" 
        min="0" 
        max="100" 
        placeholder="0-100"
        data-index="${n}"
      />
      ${y.tugasList.length>1?`<button class="tugas-delete-btn" data-index="${n}">🗑️</button>`:""}
    `,e.appendChild(l)});const t=document.createElement("button");t.className="add-tugas-btn",t.textContent="+ Tambah Tugas Baru",t.addEventListener("click",X),e.appendChild(t),J()}function J(){document.querySelectorAll(".tugas-input").forEach(e=>{e.addEventListener("input",t=>{const a=parseInt(t.target.dataset.index);let n=parseFloat(t.target.value);isNaN(n)?y.tugasList[a].nilai="":(n<0&&(n=0),n>100&&(n=100),t.target.value=n,y.tugasList[a].nilai=n),P()})}),document.querySelectorAll(".tugas-delete-btn").forEach(e=>{e.addEventListener("click",t=>{const a=parseInt(t.target.dataset.index);y.tugasList.splice(a,1),F(),P()})})}function X(){y.tugasList.push({id:null,nilai:""}),F()}function P(){const e=y.tugasList.map(a=>parseFloat(a.nilai)).filter(a=>!isNaN(a)&&a>=0&&a<=100);let t="-";e.length>0&&(t=(e.reduce((n,l)=>n+l,0)/e.length).toFixed(2)),document.getElementById("popupRataValue").textContent=t}async function Q(){try{const{siswa_id:e,mapel_id:t,tugasList:a}=y;if(!e||!t){g("⚠️ Data tidak valid");return}const n=a.filter(r=>{const i=parseFloat(r.nilai);return!isNaN(i)&&i>=0&&i<=100});if(n.length===0){g("⚠️ Minimal 1 tugas harus diisi dengan nilai valid (0-100)");return}const l=k.filter(r=>r.siswa_id===e&&r.mapel_id===t&&r.jenis==="Tugas"&&r.kelas===c&&r.semester===u&&r.tahun_ajaran===p);for(const r of l)try{await E("delete_nilai",{id:r.id})}catch(i){console.error("Error deleting tugas:",i)}for(const r of n){const i={siswa_id:e,mapel_id:t,kelas:c,semester:u,tahun_ajaran:p,jenis:"Tugas",nilai:parseFloat(r.nilai),tanggal_input:null};await E("add_nilai",{req:i})}await j(),_(),B(),N(),g(`✅ Berhasil menyimpan ${n.length} tugas!`)}catch(e){console.error("Error saving popup tugas:",e),g("❌ Gagal menyimpan tugas: "+$(e))}}function $(e){let t="";if(e&&typeof e=="object"&&e.message)t=e.message;else if(typeof e=="string")t=e;else return"Terjadi kesalahan yang tidak diketahui";const a=[/^Error:\s*/gi,/^Error invoking remote method '[^']+?':\s*/gi,/^Error:\s*Error:\s*/gi];for(const n of a)t=t.replace(n,"");return t=t.trim(),t||"Terjadi kesalahan yang tidak diketahui"}function g(e,t=null){t&&console.error("Error Detail:",t),alert(e)}function Y(e,t){const a=k.filter(r=>r.siswa_id===e&&r.mapel_id===t&&r.jenis==="Tugas"&&r.kelas===c&&r.semester===u&&r.tahun_ajaran===p);if(a.length===0)return null;const l=a.reduce((r,i)=>r+i.nilai,0)/a.length;return Math.round(l*100)/100}function L(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function D(e){const t=document.getElementById("nilaiInputTableBody"),a=document.getElementById("nilaiTableBody");e&&(t&&(t.innerHTML=`
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
      `),a&&(a.innerHTML=`
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
      `))}async function W(){D(!0);try{await Z(),ee();const e=new URLSearchParams(window.location.search),t=e.get("kelas"),a=e.get("semester"),n=e.get("tahun");if(t&&a&&n){c=t,u=parseInt(a),p=n;const l=document.getElementById("filterKelas"),r=document.getElementById("filterSemester"),i=document.getElementById("filterTahunAjaran");l&&(l.value=c),r&&(r.value=u),i&&(i.value=p)}else{const l=new Date,r=l.getFullYear(),i=l.getMonth()+1;p=i>=7?`${r}/${r+1}`:`${r-1}/${r}`,u=i>=7?1:2;const d=document.getElementById("filterTahunAjaran"),m=document.getElementById("filterSemester");d&&(d.value=p),m&&(m.value=u)}await U()}catch(e){throw console.error("Error initializing page:",e),e}finally{D(!1)}}async function Z(){try{const[e,t,a]=await Promise.all([E("get_all_siswa"),E("get_all_mapel"),E("get_daftar_tahun_ajaran")]);S=Array.isArray(e)?e:[],T=Array.isArray(t)?t:[],C=Array.isArray(a)?a:[];const n=new Date,l=n.getFullYear(),i=n.getMonth()+1>=7?`${l}/${l+1}`:`${l-1}/${l}`;C.includes(i)||C.unshift(i)}catch(e){throw console.error("loadInitialData error:",e),e}}async function j(){try{if(c&&u){const t=await E("get_jenis_nilai_input",{kelas:c,semester:u});Array.isArray(t)?t.length>0&&typeof t[0]=="object"?b=t.map(a=>String(a.nama_jenis||a.nama||a)).filter(Boolean):b=t.map(String):b=["Tugas","UTS","UAS"]}else b=["Tugas","UTS","UAS"];const e=await E("get_all_nilai");k=Array.isArray(e)?e:[],(c||u||p)&&(k=k.filter(t=>{let a=!0;return c&&(a=a&&t.kelas===c),u&&(a=a&&t.semester===u),p&&(a=a&&t.tahun_ajaran===p),a}))}catch(e){throw console.error("loadFilteredData error:",e),e}}function ee(){const e=document.getElementById("filterKelas");if(e){const a=[...new Set(S.map(n=>n.kelas))].sort();e.innerHTML='<option value="">-- Pilih Kelas --</option>'+a.map(n=>`<option value="${n}">${n}</option>`).join("")}const t=document.getElementById("filterTahunAjaran");t&&(t.innerHTML='<option value="">-- Pilih Tahun Ajaran --</option>'+C.map(a=>`<option value="${a}">${a}</option>`).join(""))}async function U(){const e=document.getElementById("filterKelas"),t=document.getElementById("filterSemester"),a=document.getElementById("filterTahunAjaran");if(!(e!=null&&e.value)||!(t!=null&&t.value)||!(a!=null&&a.value))return;c=e.value||null,u=t.value?parseInt(t.value):null,p=a.value||null;const n=new URLSearchParams;n.set("kelas",c),n.set("semester",u),n.set("tahun",p),window.history.replaceState({},"",`?${n.toString()}`),D(!0);try{await j(),_(),B()}catch(l){console.error("Error applying filters:",l),g("❌ Gagal menerapkan filter: "+$(l))}finally{D(!1)}}async function te(){c=null,u=null,p=null,document.getElementById("filterKelas").value="",document.getElementById("filterSemester").value="",document.getElementById("filterTahunAjaran").value="",window.history.replaceState({},"",window.location.pathname),k=[],b=[],_(),B()}function _(){const e=document.getElementById("nilaiInputTableHead"),t=document.getElementById("nilaiInputTableBody");if(!e||!t){console.error("Element tidak ditemukan!");return}if(e.innerHTML="",t.innerHTML="",!c||!u||!p){t.innerHTML=`<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;return}if(!S.length||!T.length||!b.length){t.innerHTML='<tr><td colspan="999">⚠️ Data belum tersedia.</td></tr>';return}const a=S.filter(i=>i.kelas===c);if(a.length===0){t.innerHTML=`<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📭 Tidak ada siswa di kelas <strong>${c}</strong>
    </td></tr>`;return}const n=document.createElement("tr");n.innerHTML=`
    <th rowspan="2">No</th>
    <th rowspan="2">NIS</th>
    <th rowspan="2">NISN</th>
    <th rowspan="2">Nama Siswa</th>
  `,T.forEach(i=>{const d=document.createElement("th");d.colSpan=b.length,d.innerHTML=`${i.nama_mapel}<br><small>KKM: ${i.kkm}</small>`,n.appendChild(d)}),e.appendChild(n);const l=document.createElement("tr");T.forEach(()=>{b.forEach(i=>{const d=document.createElement("th");d.textContent=i,l.appendChild(d)})}),e.appendChild(l);const r={};k.forEach(i=>{if(i.jenis!=="Tugas"){const d=`${i.siswa_id}_${i.mapel_id}_${i.jenis}`;r[d]={id:i.id,nilai:i.nilai}}}),a.forEach((i,d)=>{const m=document.createElement("tr");m.innerHTML=`
      <td>${d+1}</td>
      <td>${i.nis}</td>
      <td>${i.nisn}</td>
      <td>${i.nama}</td>
    `,T.forEach(o=>{b.forEach(f=>{const w=document.createElement("td");if(f==="Tugas"){const x=Y(i.id,o.id),h=document.createElement("div");h.className="tugas-cell";const s=document.createElement("span");s.className="tugas-value",s.textContent=x!==null?x:"-",x===null&&s.classList.add("tugas-empty");const v=document.createElement("button");v.className="tugas-detail-btn",v.textContent="📋",v.title="Detail Tugas",v.addEventListener("click",()=>{q(i.id,o.id,i.nama,o.nama_mapel)}),h.appendChild(s),h.appendChild(v),w.appendChild(h)}else{const x=`${i.id}_${o.id}_${f}`,h=r[x],s=document.createElement("input");s.type="number",s.min="0",s.max="100",s.placeholder="0",s.dataset.siswaId=i.id,s.dataset.mapelId=o.id,s.dataset.jenis=f,s.dataset.kelas=c,s.dataset.semester=u,s.dataset.tahunAjaran=p,s.name=x,h&&(s.value=h.nilai,s.dataset.nilaiId=h.id),s.addEventListener("input",function(){let v=parseFloat(this.value);isNaN(v)?this.value="":v<0?this.value="0":v>100&&(this.value="100")}),w.appendChild(s)}m.appendChild(w)})}),t.appendChild(m)})}function B(){const e=document.getElementById("nilaiTableBody");if(!e){console.error("Element #nilaiTableBody tidak ditemukan!");return}const t=e.closest("table"),a=t?t.querySelector("thead"):null;if(!a){console.warn("Element thead tidak ditemukan"),ae();return}if(a.innerHTML="",e.innerHTML="",!c||!u||!p){e.innerHTML=`<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;return}if(!S.length||!T.length||!b.length){e.innerHTML='<tr><td colspan="999">⚠️ Data belum tersedia.</td></tr>';return}const n=S.filter(o=>o.kelas===c);if(n.length===0){e.innerHTML=`<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📭 Tidak ada siswa di kelas <strong>${c}</strong>
    </td></tr>`;return}const l=document.createElement("tr");l.innerHTML=`
    <th rowspan="2">No</th>
    <th rowspan="2">NIS</th>
    <th rowspan="2">NISN</th>
    <th rowspan="2">Nama Siswa</th>
  `,T.forEach(o=>{const f=document.createElement("th");f.colSpan=b.length,f.innerHTML=`${o.nama_mapel}<br><small>KKM: ${o.kkm}</small>`,l.appendChild(f)});const r=document.createElement("th");r.rowSpan=2,r.textContent="Aksi",l.appendChild(r),a.appendChild(l);const i=document.createElement("tr");T.forEach(()=>{b.forEach(o=>{const f=document.createElement("th");f.textContent=o,i.appendChild(f)})}),a.appendChild(i);const d=k.filter(o=>o.kelas===c&&String(o.semester)===String(u)&&o.tahun_ajaran===p),m={};d.forEach(o=>{if(o.jenis!=="Tugas"){const f=`${o.siswa_id}_${o.mapel_id}_${o.jenis}`;m[f]={id:o.id,nilai:o.nilai}}}),n.forEach((o,f)=>{const w=document.createElement("tr");w.innerHTML=`
      <td>${f+1}</td>
      <td>${o.nis}</td>
      <td>${o.nisn}</td>
      <td>${L(o.nama)}</td>
    `;let x=!1;T.forEach(s=>{b.forEach(v=>{const I=document.createElement("td");if(v==="Tugas"){const A=Y(o.id,s.id);A!==null?(x=!0,I.innerHTML=`<span class="nilai-display">${A}</span>`):I.innerHTML='<span style="color: #999;">-</span>'}else{const A=`${o.id}_${s.id}_${v}`,M=m[A];M?(x=!0,I.innerHTML=`
              <span class="nilai-display" title="ID: ${M.id}">
                ${M.nilai}
              </span>
            `,I.dataset.nilaiId=M.id):I.innerHTML='<span style="color: #999;">-</span>'}w.appendChild(I)})});const h=document.createElement("td");if(x){const s=document.createElement("button");s.className="btn-action btn-delete",s.textContent="🗑️ Hapus Semua",s.type="button",s.dataset.siswaId=o.id,s.dataset.kelas=c,s.dataset.semester=u,s.dataset.tahunAjaran=p,h.appendChild(s)}else h.innerHTML='<span style="color: #ccc;">-</span>';w.appendChild(h),e.appendChild(w)}),ie()}function ae(){const e=document.getElementById("nilaiTableBody");if(e.innerHTML="",!c||!u||!p){e.innerHTML=`<tr><td colspan="999" style="padding: 40px; text-align: center; color: #999;">
      📋 Silakan pilih <strong>Kelas, Semester, dan Tahun Ajaran</strong> untuk menampilkan data
    </td></tr>`;return}const t=k.filter(n=>n.kelas===c&&String(n.semester)===String(u)&&n.tahun_ajaran===p);if(t.length===0){e.innerHTML=`<tr>
      <td colspan="8" style="text-align:center; padding:30px; color:#999;">
        📭 Belum ada data nilai tersimpan untuk filter yang dipilih.
      </td>
    </tr>`;return}const a=document.createDocumentFragment();t.forEach(n=>{const l=document.createElement("tr");l.innerHTML=`
      <td>${L(n.nama_siswa||"-")}</td>
      <td>${L(n.kelas||"-")}</td>
      <td>${L(String(n.semester||"-"))}</td>
      <td>${L(n.tahun_ajaran||"-")}</td>
      <td>${L(n.nama_mapel||"-")}</td>
      <td><span class="jenis-badge">${L(n.jenis||"-")}</span></td>
      <td><span class="nilai-display">${L(String(n.nilai||"-"))}</span></td>
      <td>
        <button class="btn-action btn-delete" data-id="${n.id}">🗑️</button>
      </td>
    `,a.appendChild(l)}),e.appendChild(a),ne()}async function K(e){var r;if(e.preventDefault(),H)return g("⏳ Sedang menyimpan, tunggu hingga proses selesai...");if(!c||!u||!p)return g("⚠️ Silakan pilih Kelas, Semester, dan Tahun Ajaran terlebih dahulu!");const t=document.getElementById("nilaiTableForm");if(!t){console.error("Form #nilaiTableForm tidak ditemukan.");return}const a=Array.from(t.querySelectorAll('input[type="number"]')),n=[];for(const i of a){if(((r=i.closest("tr"))==null?void 0:r.style.display)==="none")continue;const d=parseInt(i.dataset.siswaId,10),m=parseInt(i.dataset.mapelId,10),o=i.dataset.jenis,f=i.dataset.kelas,w=parseInt(i.dataset.semester,10),x=i.dataset.tahunAjaran,h=i.value.trim();if(h==="")continue;const s=Number(h);if(!Number.isFinite(s)||s<G||s>O){g("⚠️ Nilai tidak valid. Pastikan 0–100."),i.focus();return}n.push({siswa_id:d,mapel_id:m,kelas:f,semester:w,tahun_ajaran:x,jenis:o,nilai:s,tanggal_input:null})}if(n.length===0)return g("⚠️ Tidak ada nilai yang diisi.");H=!0;const l=document.querySelector('#nilaiTableForm button[type="submit"]');l&&(l.disabled=!0,l.textContent="⏳ Menyimpan...");try{let i=0,d=0;for(const m of n)try{await E("add_nilai",{req:m}),i++}catch(o){console.error("Error saving nilai:",o),d++}g(d===0?`✅ Berhasil menyimpan ${i} nilai!`:`⚠️ Berhasil: ${i}, Gagal: ${d}`),await j(),_(),B()}catch(i){console.error("handleSaveAll error:",i),g("❌ Gagal menyimpan nilai: "+$(i))}finally{H=!1,l&&(l.disabled=!1,l.textContent="💾 Simpan Semua Nilai")}}function ne(){document.querySelectorAll(".btn-delete").forEach(a=>{a.removeEventListener("click",t),a.addEventListener("click",t)});async function t(a){const n=parseInt(a.currentTarget.dataset.id,10);if(!Number.isFinite(n))return g("⚠️ ID tidak valid untuk penghapusan.");if(confirm("⚠️ Yakin ingin menghapus data nilai ini?"))try{await E("delete_nilai",{id:n}),g("✅ Nilai berhasil dihapus."),await j(),B(),_()}catch(l){console.error("Delete error:",l),g("❌ Gagal menghapus nilai: "+$(l))}}}function ie(){document.querySelectorAll("#nilaiTableBody .btn-delete").forEach(a=>{a.removeEventListener("click",t),a.addEventListener("click",t)});async function t(a){a.preventDefault();const n=parseInt(a.currentTarget.dataset.siswaId,10),l=a.currentTarget.dataset.kelas,r=parseInt(a.currentTarget.dataset.semester,10),i=a.currentTarget.dataset.tahunAjaran;if(!Number.isFinite(n))return g("⚠️ ID siswa tidak valid.");if(confirm("⚠️ Yakin ingin menghapus SEMUA nilai siswa ini?"))try{const d=k.filter(m=>m.siswa_id===n&&m.kelas===l&&m.semester===r&&m.tahun_ajaran===i);if(d.length===0)return g("⚠️ Tidak ada nilai untuk dihapus.");for(const m of d)await E("delete_nilai",{id:m.id});g(`✅ Berhasil menghapus ${d.length} nilai siswa.`),await j(),B(),_()}catch(d){console.error("Bulk delete error:",d),g("❌ Gagal menghapus nilai: "+$(d))}}}function re(){const e=document.getElementById("nilaiTableForm");e&&(e.removeEventListener("submit",K),e.addEventListener("submit",K));const t=document.getElementById("logoutBtn");t&&(t.removeEventListener("click",z),t.addEventListener("click",z))}async function z(){if(confirm("📝 Apakah kamu yakin ingin keluar dari aplikasi?"))try{window.location.href="login.html"}catch(e){console.error("Logout error:",e),window.location.href="login.html"}}function le(){const e=window.location.pathname.split("/").pop();document.querySelectorAll(".nav-item").forEach(a=>{const n=a.getAttribute("href");n&&((e===n||e===""&&n==="index-penilaian.html")&&a.classList.add("active"),a.addEventListener("click",l=>{var r;(r=document.querySelector(".nav-item.active"))==null||r.classList.remove("active"),l.currentTarget.classList.add("active")}))})}window.applyFilters=U;window.resetFilters=te;window.openTugasPopup=q;window.closePopup=N;
