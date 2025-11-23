var A=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);import"./closeWindow-BOCvx3Ut.js";/* empty css             *//* empty css                    */var I=A((R,y)=>{const{invoke:E}=window.__TAURI__.tauri;async function h(t,e={}){try{console.log(`🔄 Invoking: ${t}`,e);const a=new Promise((i,s)=>setTimeout(()=>s(new Error(`Timeout: ${t} took too long (>30s)`)),3e4)),n=E(t,e),l=await Promise.race([n,a]);if(console.log(`✅ Response from ${t}:`,l),!l.success)throw new Error(l.error||"Command failed");return l.data}catch(a){throw console.error(`❌ Error invoking ${t}:`,a),a}}let u={kelas:null,tahun_ajaran:null},w=[],$=!1;(async()=>{try{await M(),console.log("🚀 Auto-loading semua data kelulusan..."),await L(),D(),console.log("✅ Init complete with auto-loaded data")}catch(t){console.error("Gagal inisialisasi halaman kelulusan:",t),p("error","Gagal memuat halaman kelulusan")}})();const S=document.createElement("style");S.textContent=`

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
 `;document.head.appendChild(S);async function M(){var t,e;try{const a=await h("get_tahun_ajaran_aktif"),n=await h("get_daftar_tahun_ajaran"),l=await h("get_all_siswa");u.tahun_ajaran=a;const i=l.filter(d=>parseInt(String(d.kelas).charAt(0))===6),s=[...new Set(i.map(d=>d.kelas))].filter(d=>d).sort((d,f)=>String(d).localeCompare(String(f)));let r='<option value="">Semua Kelas 6</option>';s.forEach(d=>{r+=`<option value="${d}">Kelas ${d}</option>`});let o="";n&&n.length>0?o=n.map(d=>`<option value="${d}" ${d===a?"selected":""}>${d}</option>`).join(""):o=`<option value="${a}" selected>${a}</option>`;const b=document.createElement("div");b.className="filter-container mb-4",b.innerHTML=`
      <div class="row g-3 align-items-end">
        <div class="col-md-4">
          <label class="form-label fw-semibold">
            🏫 Kelas:
          </label>
          <select id="filterKelas" class="form-select">
            ${r}
          </select>
        </div>
        
        <div class="col-md-4">
          <label class="form-label fw-semibold">
            📆 Tahun Ajaran:
          </label>
          <select id="filterTahunAjaran" class="form-select">
            ${o}
          </select>
        </div>
        
        <div class="col-md-4">
          <button id="btnApplyFilter" class="btn btn-primary w-100">
            <i class="bi bi-funnel"></i> Terapkan Filter
          </button>
        </div>
      </div>
    `;const c=document.querySelector(".stats-container");c&&c.parentNode.insertBefore(b,c),document.getElementById("btnApplyFilter").addEventListener("click",k),(t=document.getElementById("filterKelas"))==null||t.addEventListener("change",k),(e=document.getElementById("filterTahunAjaran"))==null||e.addEventListener("change",k),console.log("✅ Filter controls initialized")}catch(a){console.error("Gagal init filter controls:",a),p("error","Gagal inisialisasi filter: "+a.message)}}function k(){try{const t=document.getElementById("filterKelas"),e=document.getElementById("filterTahunAjaran");u.kelas=t.value||null,u.tahun_ajaran=e.value,console.log("Applying client-side filter:",u);let a=[...w];u.kelas&&(a=a.filter(n=>n.kelas===u.kelas)),a.sort((n,l)=>{const i=x(n);return x(l)-i}),a.forEach((n,l)=>{n.ranking=l+1}),j(a),C(a),B(a),p("success","Filter berhasil diterapkan")}catch(t){console.error("Gagal apply filter:",t),p("error","Gagal menerapkan filter: "+t.message)}}async function L(){if($){console.warn("⚠️ Already loading, skipping duplicate call");return}$=!0;try{console.log("📡 Loading laporan kelulusan from backend..."),console.time("Load Duration");const t=document.querySelector(".table tbody");t&&(t.innerHTML=`
        <tr>
          <td colspan="9" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 mb-0 text-muted">Memuat data kelulusan...</p>
          </td>
        </tr>
      `);const e=await h("hitung_statistik_kelulusan");if(console.log("✅ JSON.stringify data:",JSON.stringify(e,null,2)),console.log("✅ Raw data:",e),console.log("✅ Data type:",typeof e),console.log("✅ Data.detail:",e==null?void 0:e.detail),console.log("✅ Data keys:",Object.keys(e||{})),console.timeEnd("Load Duration"),console.log("✅ Statistik kelulusan loaded:",e),!e)throw new Error("Gagal memuat data kelulusan dari backend");w=e.detail||[],k(),console.log("✅ Laporan kelulusan loaded successfully")}catch(t){console.error("❌ Gagal load laporan kelulusan:",t),p("error","Gagal memuat data kelulusan: "+t.message);const e=document.querySelector(".table tbody");e&&(e.innerHTML=`
        <tr>
          <td colspan="9" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
            <p class="mt-2 mb-0">Gagal memuat data</p>
            <small class="text-muted">${t.message}</small>
          </td>
        </tr>
      `)}finally{$=!1}}function x(t){return!t.hasil_per_mapel||t.hasil_per_mapel.length===0?0:t.hasil_per_mapel.reduce((a,n)=>a+(n.nilai_akhir||0),0)/t.hasil_per_mapel.length}function j(t){const e=document.querySelector(".stats-container");if(!e)return;const a=t.length,n=t.filter(r=>r.status_kelulusan==="LULUS").length,l=a-n,i=a>0?(n/a*100).toFixed(2):0,s=e.querySelectorAll(".stat-box");s[0]&&(s[0].querySelector(".value").textContent=a),s[1]&&(s[1].querySelector(".value").textContent=n),s[2]&&(s[2].querySelector(".value").textContent=l),s[3]&&(s[3].querySelector(".value").textContent=i+"%")}function C(t){let e=document.querySelector(".filter-info");if(!e){e=document.createElement("div"),e.className="filter-info alert alert-info mb-3";const r=document.querySelector(".stats-container");r&&r.parentNode.insertBefore(e,r.nextSibling)}const a=u.kelas?`Kelas ${u.kelas}`:"Semua Kelas 6",n=u.tahun_ajaran||"-",l=t.length,i=t.filter(r=>r.status_kelulusan==="LULUS").length,s=l>0?(i/l*100).toFixed(2):0;e.innerHTML=`
    <div class="row">
      <div class="col-md-6">
        <div class="d-flex align-items-center">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Filter Aktif:</strong>
          <span class="badge bg-primary ms-2">${a}</span>
          <span class="badge bg-primary ms-1">${n}</span>
        </div>
      </div>
      <div class="col-md-6 text-end">
        <small class="text-muted">
          <strong>${l}</strong> siswa | 
          Lulus: <strong>${i}</strong> (${s}%)
        </small>
      </div>
    </div>
  `}function B(t){const e=document.querySelector(".table tbody");if(e){if(!t||t.length===0){e.innerHTML=`
      <tr>
        <td colspan="9" class="text-center text-muted py-4">
          <i class="bi bi-inbox" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0">Belum ada data kelulusan untuk filter ini</p>
          <small class="text-muted">
            Filter: ${u.kelas?`Kelas ${u.kelas}`:"Semua Kelas 6"} | 
            ${u.tahun_ajaran}
          </small>
        </td>
      </tr>
    `;return}e.innerHTML=t.map((a,n)=>{var v,g;const l=x(a);let i="E";l>=90?i="A":l>=76?i="B":l>=70?i="C":l>=50&&(i="D");const s=a.ranking||n+1,o=(m=>m===1?"ranking-gold":m===2?"ranking-silver":m===3?"ranking-bronze":"ranking-default")(s),b=s===1?"🥇":s===2?"🥈":s===3?"🥉":"";let c="nilai-rendah";l>=90?c="nilai-tinggi":l>=75&&(c="nilai-sedang");const f={LULUS:{class:"bg-success",icon:"✓",text:"LULUS"},"TIDAK LULUS":{class:"bg-danger",icon:"✗",text:"TIDAK LULUS"}}[a.status_kelulusan]||{class:"bg-secondary",icon:"-",text:a.status_kelulusan||"Belum Ada Data"};return`
      <tr>
        <td>
          <span class="ranking-badge ${o}">
            ${b} #${s}
          </span>
        </td>
        <td>${a.nis||"-"}</td>
        <td>${a.nisn||"-"}</td>
        <td class="fw-semibold">${a.nama||"-"}</td>
        <td>
          <span class="badge bg-info text-dark">Kelas ${a.kelas||"-"}</span>
        </td>
        <td>
          <span class="nilai-badge ${c}">
            ${l.toFixed(2)}
          </span>
          <small class="d-block text-muted mt-1">Predikat: ${i}</small>
        </td>
        <td>
          <span class="badge ${f.class}">
            ${f.icon} ${f.text}
          </span>
          <small class="d-block text-muted mt-1">
            ${((v=a.statistik)==null?void 0:v.mapel_lulus)||0}/${((g=a.statistik)==null?void 0:g.total_mapel)||0} mapel
          </small>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary" 
                  onclick="showDetailKelulusan(${a.siswa_id})"
                  title="Lihat Detail">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `}).join("")}}window.showDetailKelulusan=async function(t){var e,a,n,l;try{const i=await h("get_rekap_kelulusan",{siswaId:t});if(!i){p("error","Gagal memuat detail kelulusan");return}const s=i.siswa||w.find(c=>c.siswa_id===t);if(!s){p("error","Data siswa tidak ditemukan");return}i.detail_per_mapel&&(s.hasil_per_mapel=i.detail_per_mapel),i.status&&(s.statistik=i.status.statistik,s.status_kelulusan=i.status.kelulusan);let r=`
      <div class="modal fade" id="detailModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detail Kelulusan: ${s.nama}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row mb-3">
                <div class="col-md-6">
                  <strong>NIS:</strong> ${s.nis}<br>
                  <strong>NISN:</strong> ${s.nisn}<br>
                  <strong>Kelas:</strong> ${s.kelas}
                </div>
                <div class="col-md-6 text-end">
                  <span class="badge ${s.status_kelulusan==="LULUS"?"bg-success":"bg-danger"} fs-6">
                    ${s.status_kelulusan}
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
                  ${((e=s.hasil_per_mapel)==null?void 0:e.map(c=>{var d;return`
                    <tr>
                      <td>${c.nama_mapel}</td>
                      <td>${c.kkm||70}</td>
                      <td><strong>${((d=c.nilai_akhir)==null?void 0:d.toFixed(2))||"-"}</strong></td>
                      <td><span class="badge bg-secondary">${c.predikat||"-"}</span></td>
                      <td>
                        <span class="badge ${c.status==="LULUS"?"bg-success":"bg-danger"}">
                          ${c.status||"-"}
                        </span>
                      </td>
                    </tr>
                  `}).join(""))||'<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>'}
                </tbody>
              </table>
              
              <div class="alert alert-info mt-3">
                <strong>Statistik:</strong><br>
                Total Mapel: ${((a=s.statistik)==null?void 0:a.total_mapel)||0}<br>
                Mapel Lulus: ${((n=s.statistik)==null?void 0:n.mapel_lulus)||0}<br>
                Persentase: ${((l=s.statistik)==null?void 0:l.persen_lulus)||0}%
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
                  onclick="printDetailKelulusan(${t})">
                  <i class="bi bi-printer"></i> Cetak
                </button>
              </div>
          </div>
        </div>
      </div>
    `;const o=document.getElementById("detailModal");o&&o.remove(),document.body.insertAdjacentHTML("beforeend",r),new bootstrap.Modal(document.getElementById("detailModal")).show()}catch(i){console.error("Gagal show detail kelulusan:",i),p("error","Gagal menampilkan detail: "+i.message)}};window.printDetailKelulusan=async function(t){var e,a,n,l,i;try{const s=document.querySelector(`button[onclick="printDetailKelulusan(${t})"]`);if(s){const m=s.innerHTML;s.innerHTML='<i class="spinner-border spinner-border-sm"></i> Memproses...',s.disabled=!0}const r=await h("get_rekap_kelulusan",{siswaId:t});if(!r)throw new Error("Gagal memuat data kelulusan");const o=r.siswa||w.find(m=>m.siswa_id===t);if(!o)throw new Error("Data siswa tidak ditemukan");r.detail_per_mapel&&(o.hasil_per_mapel=r.detail_per_mapel),r.status&&(o.statistik=r.status.statistik,o.status_kelulusan=r.status.kelulusan);const b={nama:"SD Swasta Plus Insan Mulia",alamat:"Jl. Pasir Randu, Kp. Ceper, Ds. Sukasari, Kec. Serang Baru, Kab. Bekasi",email:"sdplusinsanmulia14@gmail.com"},c=x(o);let d="E";c>=90?d="A":c>=76?d="B":c>=70?d="C":c>=50&&(d="D");const f=new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}),v=`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Laporan Kelulusan - ${o.nama}</title>
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
            background: ${o.status_kelulusan==="LULUS"?"#d4edda":"#f8d7da"};
            border: 2px solid ${o.status_kelulusan==="LULUS"?"#28a745":"#dc3545"};
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            border-radius: 5px;
          }

          .status-box h3 {
            font-size: 18pt;
            font-weight: bold;
            color: ${o.status_kelulusan==="LULUS"?"#155724":"#721c24"};
            margin-bottom: 5px;
          }

          .status-box .status-text {
            font-size: 24pt;
            font-weight: bold;
            color: ${o.status_kelulusan==="LULUS"?"#28a745":"#dc3545"};
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
          <h1>${b.nama}</h1>
          <div class="subtitle">${b.alamat}</div>
          <div class="contact">Email: ${b.email}</div>
        </div>

        <!-- Judul Dokumen -->
        <div class="document-title">
          <h2>LAPORAN KELULUSAN SISWA</h2>
          <div class="subtitle">Tahun Ajaran ${u.tahun_ajaran||"-"}</div>
        </div>

        <!-- Informasi Siswa -->
        <div class="info-section">
          <div class="info-row">
            <div class="info-label">Nama Siswa</div>
            <div class="info-value">: <strong>${o.nama||"-"}</strong></div>
          </div>
          <div class="info-row">
            <div class="info-label">NIS / NISN</div>
            <div class="info-value">: ${o.nis||"-"} / ${o.nisn||"-"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Kelas</div>
            <div class="info-value">: ${o.kelas||"-"}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Tanggal Cetak</div>
            <div class="info-value">: ${f}</div>
          </div>
        </div>

        <!-- Status Kelulusan -->
        <div class="status-box">
          <h3>Status Kelulusan</h3>
          <div class="status-text">${o.status_kelulusan||"BELUM TERSEDIA"}</div>
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
            ${((e=o.hasil_per_mapel)==null?void 0:e.map((m,T)=>{var _;const K=m.status==="LULUS"?"badge-success":"badge-danger";return`
                <tr>
                  <td class="center">${T+1}</td>
                  <td><strong>${m.nama_mapel}</strong></td>
                  <td class="center">${m.kkm||70}</td>
                  <td class="center"><strong>${((_=m.nilai_akhir)==null?void 0:_.toFixed(2))||"-"}</strong></td>
                  <td class="center">${m.predikat||"-"}</td>
                  <td class="center">
                    <span class="badge ${K}">${m.status||"-"}</span>
                  </td>
                </tr>
              `}).join(""))||'<tr><td colspan="6" class="center">Tidak ada data nilai</td></tr>'}
          </tbody>
        </table>

        <!-- Ringkasan Statistik -->
        <div class="summary-section">
          <h4>Ringkasan Statistik Kelulusan</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Total Mata Pelajaran:</span>
              <span class="summary-value">${((a=o.statistik)==null?void 0:a.total_mapel)||0}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Mata Pelajaran Lulus:</span>
              <span class="summary-value">${((n=o.statistik)==null?void 0:n.mapel_lulus)||0}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Mata Pelajaran Tidak Lulus:</span>
              <span class="summary-value">${((l=o.statistik)==null?void 0:l.mapel_tidak_lulus)||0}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Persentase Kelulusan:</span>
              <span class="summary-value"><strong>${((i=o.statistik)==null?void 0:i.persen_lulus)||0}%</strong></span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Nilai Akhir Rata-rata:</span>
              <span class="summary-value"><strong>${c.toFixed(2)}</strong></span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Predikat Keseluruhan:</span>
              <span class="summary-value"><strong>${d}</strong></span>
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
          <p>Dicetak pada: ${new Date().toLocaleString("id-ID")}</p>
        </div>
      </body>
      </html>
    `,g=window.open("","_blank");if(!g)throw new Error("Pop-up diblokir. Harap izinkan pop-up untuk mencetak.");g.document.write(v),g.document.close(),g.onload=function(){g.focus(),setTimeout(()=>{g.print(),g.onafterprint=function(){g.close()}},250)},s&&setTimeout(()=>{s.innerHTML='<i class="bi bi-printer"></i> Cetak',s.disabled=!1},1e3),p("success","Jendela cetak telah dibuka")}catch(s){console.error("Gagal mencetak laporan kelulusan:",s),p("error","Gagal mencetak: "+s.message);const r=document.querySelector(`button[onclick="printDetailKelulusan(${t})"]`);r&&(r.innerHTML='<i class="bi bi-printer"></i> Cetak',r.disabled=!1)}};function D(){const t=document.getElementById("btnRefresh");t&&t.addEventListener("click",async()=>{try{const e=t.querySelector("i");e.classList.add("spinner-border","spinner-border-sm"),e.classList.remove("bi-arrow-clockwise"),t.disabled=!0,await L(),p("success","Data berhasil di-refresh"),e.classList.remove("spinner-border","spinner-border-sm"),e.classList.add("bi-arrow-clockwise"),t.disabled=!1}catch(e){console.error("Gagal refresh:",e),p("error","Gagal refresh data: "+e.message);const a=t.querySelector("i");a.classList.remove("spinner-border","spinner-border-sm"),a.classList.add("bi-arrow-clockwise"),t.disabled=!1}})}function p(t,e){let a=document.getElementById("toastContainer");a||(a=document.createElement("div"),a.id="toastContainer",a.className="toast-container position-fixed top-0 end-0 p-3",a.style.zIndex="10000",document.body.appendChild(a));const n=document.createElement("div");n.className=`toast align-items-center text-white bg-${t==="success"?"success":t==="info"?"info":"danger"} border-0`,n.setAttribute("role","alert"),n.innerHTML=`
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-${t==="success"?"check-circle-fill":t==="info"?"info-circle-fill":"exclamation-triangle-fill"}"></i>
        ${e}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `,a.appendChild(n),typeof bootstrap<"u"?(new bootstrap.Toast(n,{autohide:!0,delay:3e3}).show(),n.addEventListener("hidden.bs.toast",()=>n.remove())):(n.style.display="block",setTimeout(()=>{n.style.opacity="0",n.style.transition="opacity 0.3s",setTimeout(()=>n.remove(),300)},3e3))}typeof y<"u"&&y.exports&&(y.exports={loadLaporanKelulusan:L,applyClientSideFilter:k,currentFilter:u});console.log("✅ kelulusan.js loaded successfully (Auto-load + Client-side Filter)")});export default I();
