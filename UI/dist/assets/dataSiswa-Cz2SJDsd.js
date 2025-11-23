import"./closeWindow-BOCvx3Ut.js";/* empty css             */import{i as m}from"./tauriAPIhelper-CqjvmD2y.js";const g=document.getElementById("siswaTableBody"),d=document.getElementById("modalSiswa"),c=new bootstrap.Modal(d),k=document.getElementById("formSiswa"),L=document.getElementById("modalTitle"),q=document.getElementById("btnTambahSiswa"),r=document.getElementById("btnSaveSiswa"),D=document.getElementById("searchInput"),V=document.getElementById("logoutBtn"),j=document.createElement("style");j.textContent=`
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
`;document.head.appendChild(j);function l(t){return typeof t!="string"?"":t.trim()}function w(t){let e="";if(t&&typeof t=="object"&&t.message)e=t.message;else if(typeof t=="string")e=t;else return"Terjadi kesalahan yang tidak diketahui";const a=[/^Error:\s*/gi,/^Error invoking remote method '[^']+?':\s*/gi,/^Error:\s*Error:\s*/gi];for(const n of a)e=e.replace(n,"");return e=e.trim(),e||"Terjadi kesalahan yang tidak diketahui"}function u(t,e=null){e&&console.error("Error Detail:",e),alert(t)}function i(t){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}async function _(){try{const t=await m("get_all_siswa");I(Array.isArray(t)?t:[])}catch(t){console.error("Gagal load data siswa:",t);const e=w(t);u("Gagal memuat data siswa: "+e,t),I([])}}function I(t){if(g.innerHTML="",t.length===0){g.innerHTML=`
      <tr>
        <td colspan="20" class="text-center">🧑🏻‍🎓 Belum ada data siswa</td>
      </tr>
    `;return}t.forEach((e,a)=>{const n=document.createElement("tr");n.dataset.id=e.id,n.innerHTML=`
      <td>${a+1}</td>
      <td>${i(String(e.nis||""))}</td>
      <td>${i(String(e.nisn||""))}</td>
      <td>${i(String(e.nama||""))}</td>
      <td>${i(String(e.kelas||""))}</td>
      <td>${i(String(e.jenis_kelamin||""))}</td>
      <td>${i(String(e.created_at||""))}</td>
      <td>${i(String(e.nama_ayah||""))}</td>
      <td>${i(String(e.nama_ibu||""))}</td>
      <td>${i(String(e.alamat_ortu||""))}</td>
      <td>${i(String(e.kontak_ortu||""))}</td>
      <td>${i(String(e.email_ortu||""))}</td>
      <td>${i(String(e.pekerjaan_ayah||""))}</td>
      <td>${i(String(e.pekerjaan_ibu||""))}</td>
      <td>${i(String(e.nama_wali||""))}</td>
      <td>${i(String(e.alamat_wali||""))}</td>
      <td>${i(String(e.kontak_wali||""))}</td>
      <td>${i(String(e.email_wali||""))}</td>
      <td>${i(String(e.pekerjaan_wali||""))}</td>
      <td>
        <button class="btn btn-sm btn-warning btn-edit" data-id="${e.id}">✒️</button>
        <button class="btn btn-sm btn-danger btn-delete" data-id="${e.id}">🗑️</button>
      </td>
    `,g.appendChild(n)})}function G(){requestAnimationFrame(()=>{k.reset(),document.getElementById("siswaId").value="",L.textContent="Tambah Siswa",document.getElementById("jenis_kelamin").value="L",c.show()})}function H(t){t&&requestAnimationFrame(()=>{k.reset(),document.getElementById("siswaId").value=t.id||"",document.getElementById("nis").value=t.nis||"",document.getElementById("nisn").value=t.nisn||"",document.getElementById("nama").value=t.nama||"",document.getElementById("kelas").value=t.kelas||"",document.getElementById("jenis_kelamin").value=(t.jenis_kelamin||"L").toUpperCase(),document.getElementById("nama_ayah").value=t.nama_ayah||"",document.getElementById("nama_ibu").value=t.nama_ibu||"",document.getElementById("alamat_ortu").value=t.alamat_ortu||"",document.getElementById("kontak_ortu").value=t.kontak_ortu||"",document.getElementById("email_ortu").value=t.email_ortu||"",document.getElementById("pekerjaan_ayah").value=t.pekerjaan_ayah||"",document.getElementById("pekerjaan_ibu").value=t.pekerjaan_ibu||"",document.getElementById("nama_wali").value=t.nama_wali||"",document.getElementById("alamat_wali").value=t.alamat_wali||"",document.getElementById("kontak_wali").value=t.kontak_wali||"",document.getElementById("email_wali").value=t.email_wali||"",document.getElementById("pekerjaan_wali").value=t.pekerjaan_wali||"",L.textContent="Edit Siswa",setTimeout(()=>{c.show()},10)})}d.addEventListener("show.bs.modal",()=>{const t=d.querySelector(".modal-dialog");t&&(t.style.willChange="transform, opacity")});d.addEventListener("shown.bs.modal",()=>{const t=document.getElementById("jenis_kelamin");t.value||(t.value="L");const e=d.querySelector(".modal-dialog");e&&setTimeout(()=>{e.style.willChange="auto"},500)});let h=!1;const R=c.show;c.show=function(){h||(h=!0,R.call(this),setTimeout(()=>{h=!1},300))};function O(t){if(!t||typeof t!="object")throw new Error("Data tidak valid");if(!t.nis||!/^[0-9]{9,11}$/.test(String(t.nis).trim()))throw new Error("NIS harus berupa angka 9-11 digit");if(t.nisn&&String(t.nisn).trim()!==""&&!/^[0-9]{9,11}$/.test(String(t.nisn).trim()))throw new Error("NISN harus berupa angka 9-11 digit");const e=String(t.nama||"").trim();if(e.length<3)throw new Error("Nama siswa minimal 3 karakter");if(!t.kelas||String(t.kelas).trim().length===0)throw new Error("Kelas tidak boleh kosong");const a=String(t.jenis_kelamin||"").trim().toUpperCase();if(!["L","P"].includes(a))throw new Error("Jenis kelamin harus L atau P");if(t.email_ortu&&t.email_ortu.trim()!==""&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email_ortu.trim()))throw new Error("Format email orang tua tidak valid");if(t.email_wali&&t.email_wali.trim()!==""&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email_wali.trim()))throw new Error("Format email wali tidak valid");if(t.kontak_ortu&&t.kontak_ortu.trim()!==""&&!/^[0-9+\-\s()]{10,15}$/.test(t.kontak_ortu.trim()))throw new Error("Format kontak orang tua tidak valid (10-15 digit)");if(t.kontak_wali&&t.kontak_wali.trim()!==""&&!/^[0-9+\-\s()]{10,15}$/.test(t.kontak_wali.trim()))throw new Error("Format kontak wali tidak valid (10-15 digit)");return{nis:String(t.nis).trim(),nisn:String(t.nisn||"").trim()||null,nama:e,kelas:String(t.kelas).trim(),jenis_kelamin:a,nama_ayah:String(t.nama_ayah||"").trim()||null,nama_ibu:String(t.nama_ibu||"").trim()||null,alamat_ortu:String(t.alamat_ortu||"").trim()||null,kontak_ortu:String(t.kontak_ortu||"").trim()||null,email_ortu:String(t.email_ortu||"").trim()||null,pekerjaan_ayah:String(t.pekerjaan_ayah||"").trim()||null,pekerjaan_ibu:String(t.pekerjaan_ibu||"").trim()||null,nama_wali:String(t.nama_wali||"").trim()||null,alamat_wali:String(t.alamat_wali||"").trim()||null,kontak_wali:String(t.kontak_wali||"").trim()||null,email_wali:String(t.email_wali||"").trim()||null,pekerjaan_wali:String(t.pekerjaan_wali||"").trim()||null}}function C(t,e=300){let a;return function(...o){const s=()=>{clearTimeout(a),t(...o)};clearTimeout(a),a=setTimeout(s,e)}}const x=C(t=>{const e=t.value.trim();if(!e){t.setCustomValidity(""),t.classList.remove("is-invalid");return}/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)?(t.setCustomValidity(""),t.classList.remove("is-invalid")):(t.setCustomValidity("Format email tidak valid"),t.classList.add("is-invalid"))},500),B=C(t=>{const e=t.value.trim();if(!e){t.setCustomValidity(""),t.classList.remove("is-invalid");return}/^[0-9+\-\s()]{10,15}$/.test(e)?(t.setCustomValidity(""),t.classList.remove("is-invalid")):(t.setCustomValidity("Format kontak tidak valid (10-15 digit)"),t.classList.add("is-invalid"))},500);function N(){const t=document.getElementById("email_ortu"),e=document.getElementById("email_wali");t&&(t.removeEventListener("input",t._validator),t._validator=()=>x(t),t.addEventListener("input",t._validator)),e&&(e.removeEventListener("input",e._validator),e._validator=()=>x(e),e.addEventListener("input",e._validator));const a=document.getElementById("kontak_ortu"),n=document.getElementById("kontak_wali");a&&(a.removeEventListener("input",a._validator),a._validator=()=>B(a),a.addEventListener("input",a._validator)),n&&(n.removeEventListener("input",n._validator),n._validator=()=>B(n),n.addEventListener("input",n._validator))}async function U(){if(!r.disabled)try{r.disabled=!0,r.textContent="⏳ Menyimpan...";const t=document.getElementById("siswaId").value,e=document.getElementById("jenis_kelamin");let a=l(e.value).toUpperCase();a||(a="L",e.value="L");const n={nis:l(document.getElementById("nis").value),nisn:l(document.getElementById("nisn").value),nama:l(document.getElementById("nama").value),kelas:l(document.getElementById("kelas").value),jenis_kelamin:a,nama_ayah:l(document.getElementById("nama_ayah").value),nama_ibu:l(document.getElementById("nama_ibu").value),alamat_ortu:l(document.getElementById("alamat_ortu").value),kontak_ortu:l(document.getElementById("kontak_ortu").value),email_ortu:l(document.getElementById("email_ortu").value),pekerjaan_ayah:l(document.getElementById("pekerjaan_ayah").value),pekerjaan_ibu:l(document.getElementById("pekerjaan_ibu").value),nama_wali:l(document.getElementById("nama_wali").value),alamat_wali:l(document.getElementById("alamat_wali").value),kontak_wali:l(document.getElementById("kontak_wali").value),email_wali:l(document.getElementById("email_wali").value),pekerjaan_wali:l(document.getElementById("pekerjaan_wali").value)},o=O(n);t?await m("update_siswa",{req:{id:parseInt(t),data:o}}):await m("add_siswa",{req:o}),c.hide(),setTimeout(()=>{_()},100)}catch(t){console.error("Gagal menyimpan siswa:",t);const e=w(t);u(e,t)}finally{setTimeout(()=>{r.disabled=!1,r.textContent="💾 Simpan"},500)}}async function z(t){if(t&&confirm(`⚠️ Apakah Anda yakin ingin menghapus data siswa ini?

Menghapus siswa akan menghapus semua nilai dan absensi terkait!`))try{await m("delete_siswa",{id:parseInt(t)}),await _()}catch(e){console.error("Gagal hapus siswa:",e);const a=w(e);u("Gagal menghapus siswa: "+a,e)}}g.addEventListener("click",async t=>{const e=t.target.closest(".btn-edit"),a=t.target.closest(".btn-delete");if(e){const n=e.dataset.id;try{const o=await m("get_siswa_by_id",{id:parseInt(n)});if(!o)return u("Data siswa tidak ditemukan");H(o)}catch(o){console.error("Gagal ambil data untuk edit:",o);const s=w(o);u("Gagal ambil data siswa: "+s,o)}return}if(a){const n=a.dataset.id;z(n);return}});q.addEventListener("click",()=>G());r.addEventListener("click",()=>U());D.addEventListener("input",t=>{const e=String(t.target.value||"").toLowerCase();document.querySelectorAll("#siswaTableBody tr").forEach(a=>{var p,y,v,f,E,b,S;if(a.cells.length<20)return;const n=((p=a.cells[1])==null?void 0:p.textContent.toLowerCase())||"",o=((y=a.cells[2])==null?void 0:y.textContent.toLowerCase())||"",s=((v=a.cells[3])==null?void 0:v.textContent.toLowerCase())||"",$=((f=a.cells[4])==null?void 0:f.textContent.toLowerCase())||"",T=((E=a.cells[7])==null?void 0:E.textContent.toLowerCase())||"",A=((b=a.cells[8])==null?void 0:b.textContent.toLowerCase())||"",M=((S=a.cells[14])==null?void 0:S.textContent.toLowerCase())||"",F=n.includes(e)||o.includes(e)||s.includes(e)||$.includes(e)||T.includes(e)||A.includes(e)||M.includes(e);a.style.display=F?"":"none"})});document.addEventListener("DOMContentLoaded",function(){const t=document.getElementById("modalSiswa");t&&(t.addEventListener("hide.bs.modal",function(e){const a=this.querySelector(".modal-dialog");a.style.animation="modalSlideOut 0.3s ease-out forwards"}),t.addEventListener("show.bs.modal",function(e){const a=this.querySelector(".modal-dialog");a.style.animation=""}))});V.addEventListener("click",async()=>{confirm("Apakah kamu yakin ingin keluar?")&&(window.location.href="login.html")});(function(){_(),N(),d.addEventListener("hidden.bs.modal",()=>k.reset())})();
