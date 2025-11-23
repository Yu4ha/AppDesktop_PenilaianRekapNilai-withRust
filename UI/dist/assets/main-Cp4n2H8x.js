var $=(e,n)=>()=>(n||e((n={exports:{}}).exports,n),n.exports);import{i as _}from"./closeWindow-BOCvx3Ut.js";/* empty css             *//* empty css                    */import"./namaUser-CSIPI5Jo.js";var K=$((O,b)=>{async function p(e,n={}){try{const t=await _(e,n);if(t&&typeof t=="object"&&"success"in t){if(!t.success)throw new Error(t.error||"Command failed");return t.data}return t}catch(t){throw console.error(`[Tauri Command Error] ${e}:`,t),t}}let o={kelas:null,semester:1,tahun_ajaran:null};function T(){console.log("✅ Tauri environment ready, initializing dashboard..."),I(),(async()=>{try{await C(),await k(),B(),setTimeout(()=>{L()},3e3)}catch(e){console.error("Gagal inisialisasi dashboard:",e),g("error",`Gagal inisialisasi: ${e.message}`)}})()}document.addEventListener("DOMContentLoaded",()=>{T();const e=localStorage.getItem("namaGuru"),n=document.getElementById("guruHeader");e&&n&&(n.textContent=`Selamat datang, ${e} 👋`)});function L(){const e=localStorage.getItem("editNamaGuruNotificationData"),n=new Date().toDateString();let t={date:n,count:0};if(e)try{t=JSON.parse(e)}catch(r){console.error("Error parsing notification data:",r)}if(t.date!==n&&(t={date:n,count:0}),t.count>=2)return;const a=document.createElement("div");a.className="guru-edit-notification",a.innerHTML=`
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
  `,document.body.appendChild(a),t.count++,localStorage.setItem("editNamaGuruNotificationData",JSON.stringify(t)),document.getElementById("closeGuruNotif").addEventListener("click",()=>{s()}),setTimeout(()=>{document.body.contains(a)&&s()},12e3);function s(){a.style.animation="fadeOutUp 0.4s ease-out",setTimeout(()=>{document.body.contains(a)&&document.body.removeChild(a)},400)}}function N(){const e=document.getElementById("modal"),n=document.getElementById("guruInput");if(e&&n){const t=localStorage.getItem("namaGuru")||"Guru";n.value=t,e.classList.add("show"),e.style.display="flex",setTimeout(()=>n.focus(),100)}}function y(){const e=document.getElementById("modal");e&&(e.classList.remove("show"),e.style.display="none")}function x(e){g("info",e)}function I(){const e=document.getElementById("guruHeader"),n=document.getElementById("cancelBtn"),t=document.getElementById("saveBtn"),a=document.getElementById("guruInput"),s=document.getElementById("modal");e&&e.addEventListener("click",N),n&&n.addEventListener("click",y),t&&t.addEventListener("click",async()=>{const r=a==null?void 0:a.value.trim();if(!r){alert("⚠️ Nama guru tidak boleh kosong!"),a==null||a.focus();return}try{localStorage.setItem("namaGuru",r),e&&(e.textContent=`Selamat datang, ${r} 👋`),y(),x(`✅ Nama guru berhasil diubah menjadi: ${r}`)}catch(c){console.error("Error saving nama guru:",c),x("❌ Gagal menyimpan nama guru")}}),s&&s.addEventListener("click",r=>{r.target.id==="modal"&&y()}),a&&a.addEventListener("keypress",r=>{r.key==="Enter"&&(t==null||t.click())})}document.addEventListener("keydown",e=>{if(e.key==="Escape"){const n=document.getElementById("modal");n!=null&&n.classList.contains("show")&&y()}});function B(){const e=localStorage.getItem("panduanNotificationData"),n=new Date().toDateString();let t={date:n,count:0};if(e)try{t=JSON.parse(e)}catch(r){console.error("Error parsing notification data:",r)}if(t.date!==n&&(t={date:n,count:0}),t.count>=2)return;const a=document.createElement("div");a.className="panduan-notification",a.innerHTML=`
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
  `,document.body.appendChild(a),t.count++,localStorage.setItem("panduanNotificationData",JSON.stringify(t)),document.getElementById("closePanduanNotif").addEventListener("click",()=>{s()}),document.getElementById("gotoPanduan").addEventListener("click",()=>{window.location.href="pengguna.html"}),setTimeout(()=>{document.body.contains(a)&&s()},15e3);function s(){a.style.animation="slideOutRight 0.3s ease-out",setTimeout(()=>{document.body.contains(a)&&document.body.removeChild(a)},300)}if(!document.querySelector("#slideOutRightKeyframes")){const r=document.createElement("style");r.id="slideOutRightKeyframes",r.textContent=`
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
    `,document.head.appendChild(r)}}async function C(){try{const[e,n,t]=await Promise.all([p("get_tahun_ajaran_aktif"),p("get_daftar_tahun_ajaran"),p("get_all_siswa")]);o.tahun_ajaran=e;const a=[...new Set(t.map(i=>i.kelas))].filter(i=>i).sort((i,d)=>{const u=parseInt(String(i).charAt(0)),m=parseInt(String(d).charAt(0));return u!==m?u-m:String(i).localeCompare(String(d))}),s={4:a.filter(i=>String(i).startsWith("4")),5:a.filter(i=>String(i).startsWith("5")),6:a.filter(i=>String(i).startsWith("6"))};let r='<option value="">Semua Kelas</option>';[4,5,6].forEach(i=>{const d=s[i];d.length>0&&d.forEach(u=>{r+=`<option value="${u}">Kelas ${u}</option>`})});const c=document.createElement("div");c.className="filter-container mb-4",c.innerHTML=`
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label fw-semibold">
          🏫 Kelas:
          </label>
          <select id="filterKelas" class="form-select">
            ${r}
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
            ${n&&n.length>0?n.map(i=>`<option value="${i}" ${i===e?"selected":""}>${i}</option>`).join(""):`<option value="${e}" selected>${e}</option>`}
          </select>
        </div>
        
        <div class="col-md-3">
          <button id="btnApplyFilter" class="btn btn-primary w-100">
            <i class="bi bi-arrow-repeat"></i> Terapkan Filter
          </button>
        </div>
      </div>
    `;const l=document.querySelector(".stats-container");l&&l.parentNode.insertBefore(c,l),document.getElementById("btnApplyFilter").addEventListener("click",w),["filterKelas","filterSemester","filterTahunAjaran"].forEach(i=>{var d;(d=document.getElementById(i))==null||d.addEventListener("keypress",u=>{u.key==="Enter"&&w()})})}catch(e){console.error("Gagal init filter controls:",e)}}async function w(){try{const e=document.getElementById("filterKelas"),n=document.getElementById("filterSemester"),t=document.getElementById("filterTahunAjaran");o.kelas=e.value||null,o.semester=parseInt(n.value),o.tahun_ajaran=t.value;const a=document.getElementById("btnApplyFilter"),s=a.innerHTML;a.innerHTML='<i class="spinner-border spinner-border-sm"></i> Memuat...',a.disabled=!0,await k(),a.innerHTML=s,a.disabled=!1,g("success","Filter berhasil diterapkan")}catch(e){console.error("Gagal apply filter:",e),g("error","Gagal menerapkan filter")}}async function k(){var e,n;try{const t={kelas:o.kelas,semester:o.semester,tahunAjaran:o.tahun_ajaran};console.log("Loading dashboard dengan filter:",t);const[a,s,r,c,l]=await Promise.all([p("get_total_siswa"),p("get_all_mapel"),p("get_all_nilai"),p("get_top_siswa",{req:{kelas:o.kelas,semester:o.semester,tahun_ajaran:o.tahun_ajaran,limit:10}}),p("hitung_statistik",{req:{kelas:o.kelas,semester:o.semester,tahun_ajaran:o.tahun_ajaran}})]);console.log("Data loaded:",{totalSiswa:a,totalMapel:s==null?void 0:s.length,totalNilai:r==null?void 0:r.length,topSiswa:c,statsGlobal:l});const i=document.querySelector(".stats-container"),d=document.querySelector(".table tbody");if(i){i.querySelector(".stat-box:nth-child(1) .value").textContent=a??0,i.querySelector(".stat-box:nth-child(2) .value").textContent=(s==null?void 0:s.length)??0;const m=((e=l==null?void 0:l.siswa)==null?void 0:e.dengan_nilai)??0;i.querySelector(".stat-box:nth-child(3) .value").textContent=m;const f=((n=l==null?void 0:l.nilai)==null?void 0:n.rata_rata_kelas)??0;i.querySelector(".stat-box:nth-child(4) .value").textContent=f.toFixed(2)}A(l);const u=Array.isArray(c)?c:[];j(u,d,(r==null?void 0:r.length)||0)}catch(t){console.error("Gagal load dashboard:",t),g("error","Gagal memuat data dashboard");const a=document.querySelector(".table tbody");a&&(a.innerHTML=`
        <tr>
          <td colspan="8" class="text-center text-danger">
            <i class="bi bi-exclamation-triangle"></i> Gagal memuat data
            <br><small class="text-muted">${t.message}</small>
          </td>
        </tr>
      `)}}function j(e,n){if(n){if(!e||e.length===0){n.innerHTML=`
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          <i class="bi bi-inbox" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0">Belum ada data penilaian untuk filter ini</p>
          <small class="text-muted">
            Filter: ${o.kelas?`Kelas ${o.kelas}`:"Semua Kelas"} | 
            Semester ${o.semester} | 
            ${o.tahun_ajaran}
          </small>
        </td>
      </tr>
    `;return}n.innerHTML=e.map((t,a)=>{const s=m=>m===1?"ranking-gold":m===2?"ranking-silver":m===3?"ranking-bronze":"ranking-default";let r="nilai-rendah";t.rata_rata>=90?r="nilai-tinggi":t.rata_rata>=75&&(r="nilai-sedang");let c="";if(t.status_naik_kelas){const f={"Naik Kelas":{class:"bg-success",icon:"✓",text:"Naik Kelas"},"Tidak Naik Kelas":{class:"bg-danger",icon:"✗",text:"Tidak Naik"},"Belum Lengkap":{class:"bg-warning text-dark",icon:"⚠",text:"Belum Lengkap"}}[t.status_naik_kelas]||{class:"bg-secondary",icon:"-",text:t.status_naik_kelas};c=`
        <span class="badge ${f.class}">
          ${f.icon} ${f.text}
        </span>
      `}else c='<span class="badge bg-secondary">-</span>';const l=t.statistik?`
      <small class="d-block text-muted mt-1">
        Tuntas: ${t.statistik.mapel_tuntas}/${t.statistik.total_mapel} 
        (${t.statistik.persen_tuntas}%)
      </small>
    `:"",i=t.ranking||a+1;return`
      <tr>
        <td class="text-center">
          <span class="ranking-badge ${s(i)}">
            ${i===1?"🥇":i===2?"🥈":i===3?"🥉":""} #${i}
          </span>
        </td>
        <td>${t.nis||"-"}</td>
        <td>${t.nisn||"-"}</td>
        <td class="fw-semibold">${t.nama||"-"}</td>
        <td>
          <span class="badge bg-info text-dark">Kelas ${t.kelas}</span>
        </td>
        <td>
          <span class="nilai-badge ${r}">
            ${t.rata_rata?t.rata_rata.toFixed(2):"0"}
          </span>
          <small class="d-block text-muted mt-1">Predikat: ${t.predikat||"-"}</small>
        </td>
        <td>
          ${c}
          ${l}
        </td>
      </tr>
    `}).join("")}}function A(e){var u,m,f,E,S;let n=document.querySelector(".filter-info");if(!n){n=document.createElement("div"),n.className="filter-info alert alert-info mb-3";const v=document.querySelector(".stats-container");v&&v.parentNode.insertBefore(n,v.nextSibling)}const t=o.kelas?`Kelas ${o.kelas}`:"Semua Kelas",a=`Semester ${o.semester}`,s=o.tahun_ajaran||"-",r=((u=e==null?void 0:e.siswa)==null?void 0:u.total)??0,c=((m=e==null?void 0:e.siswa)==null?void 0:m.dengan_nilai)??0,l=((f=e==null?void 0:e.nilai)==null?void 0:f.rata_rata_kelas)??0,i=((E=e==null?void 0:e.kenaikan)==null?void 0:E.naik_kelas)??0,d=((S=e==null?void 0:e.kenaikan)==null?void 0:S.persen_naik)??0;n.innerHTML=`
    <div class="row">
      <div class="col-md-6">
        <div class="d-flex align-items-center">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Filter Aktif:</strong>
          <span class="badge bg-primary ms-2">${t}</span>
          <span class="badge bg-primary ms-1">${a}</span>
          <span class="badge bg-primary ms-1">${s}</span>
        </div>
      </div>
      <div class="col-md-6 text-end">
        <small class="text-muted">
          <strong>${c}</strong> dari <strong>${r}</strong> siswa dengan nilai | 
          Rata-rata: <strong>${l.toFixed(2)}</strong> | 
          Naik kelas: <strong>${i}</strong> (${d}%)
        </small>
      </div>
    </div>
  `}function g(e,n){const t=document.getElementById("toastContainer"),a=document.createElement("div");if(a.className=`toast align-items-center text-white bg-${e==="success"?"success":e==="info"?"info":"danger"} border-0`,a.setAttribute("role","alert"),a.setAttribute("aria-live","assertive"),a.setAttribute("aria-atomic","true"),a.innerHTML=`
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-${e==="success"?"check-circle-fill":e==="info"?"info-circle-fill":"exclamation-triangle-fill"}"></i>
        ${n}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `,t)t.appendChild(a);else{if(!document.getElementById("fallbackToastContainer")){const s=document.createElement("div");s.id="fallbackToastContainer",s.style.position="fixed",s.style.top="20px",s.style.right="20px",s.style.zIndex="10000",document.body.appendChild(s)}document.getElementById("fallbackToastContainer").appendChild(a)}typeof bootstrap<"u"?(new bootstrap.Toast(a,{autohide:!0,delay:3e3}).show(),a.addEventListener("hidden.bs.toast",()=>{a.remove()})):(a.style.display="block",setTimeout(()=>{a.style.opacity="0",a.style.transition="opacity 0.3s",setTimeout(()=>a.remove(),300)},3e3))}const h=document.getElementById("btnRefresh");h&&h.addEventListener("click",async()=>{try{const e=h.querySelector("i");e.classList.add("spinner-border","spinner-border-sm"),e.classList.remove("bi-arrow-clockwise"),h.disabled=!0,await k(),g("success","Data berhasil di-refresh"),e.classList.remove("spinner-border","spinner-border-sm"),e.classList.add("bi-arrow-clockwise"),h.disabled=!1}catch(e){console.error("Gagal refresh:",e),g("error","Gagal refresh data");const n=h.querySelector("i");n.classList.remove("spinner-border","spinner-border-sm"),n.classList.add("bi-arrow-clockwise"),h.disabled=!1}});window.addEventListener("kehadiran-updated",async e=>{console.log("🔄 Kehadiran updated:",e.detail);try{const{kelas:n,semester:t,tahun_ajaran:a,success:s}=e.detail;(!o.kelas||o.kelas===n)&&o.semester===t&&o.tahun_ajaran===a?(console.log("✅ Filter match, reload dashboard..."),await k(),g("success",`Data kehadiran berhasil diperbarui (${s} siswa)`)):(console.log("ℹ️ Filter tidak match, skip reload"),g("info","Kehadiran berhasil disimpan (filter berbeda)"))}catch(n){console.error("❌ Gagal reload dashboard:",n),g("error","Gagal refresh data setelah update kehadiran")}});window.addEventListener("nilai-updated",async e=>{console.log("🔄 Nilai updated:",e.detail);try{await k(),g("success","Dashboard berhasil di-refresh")}catch(n){console.error("❌ Gagal reload dashboard:",n)}});console.log("✅ Event listeners registered");typeof b<"u"&&b.exports&&(b.exports={loadDashboardData:k,applyFilter:w,currentFilter:o})});export default K();
