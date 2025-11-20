/**
 * commands/siswa.rs
 * =================
 * Tauri Commands untuk Data Siswa
 * 
 * FITUR:
 * ✅ CRUD Siswa lengkap (add, update, delete, get)
 * ✅ Search & Filter (by kelas, tingkat, keyword)
 * ✅ Validasi (NIS, NISN, email, phone)
 * ✅ Statistik Siswa
 * ✅ Data Orang Tua & Wali lengkap
 */

use serde::{Deserialize, Serialize};
use log::{info, error};

use crate::models::siswa;
use crate::commands::ApiResponse;

// ==========================
// REQUEST STRUCTS
// ==========================

#[derive(Debug, Deserialize)]
pub struct AddSiswaRequest {
    pub nis: String,
    pub nisn: Option<String>,
    pub nama: String,
    pub kelas: String,
    pub jenis_kelamin: String,
    
    // Data Orang Tua (opsional)
    pub nama_ayah: Option<String>,
    pub nama_ibu: Option<String>,
    pub alamat_ortu: Option<String>,
    pub kontak_ortu: Option<String>,
    pub email_ortu: Option<String>,
    pub pekerjaan_ayah: Option<String>,
    pub pekerjaan_ibu: Option<String>,
    
    // Data Wali (opsional)
    pub nama_wali: Option<String>,
    pub alamat_wali: Option<String>,
    pub kontak_wali: Option<String>,
    pub email_wali: Option<String>,
    pub pekerjaan_wali: Option<String>,
}

impl From<AddSiswaRequest> for siswa::SiswaInput {
    fn from(req: AddSiswaRequest) -> Self {
        Self {
            nis: req.nis,
            nisn: req.nisn,
            nama: req.nama,
            kelas: req.kelas,
            jenis_kelamin: req.jenis_kelamin,
            nama_ayah: req.nama_ayah,
            nama_ibu: req.nama_ibu,
            alamat_ortu: req.alamat_ortu,
            kontak_ortu: req.kontak_ortu,
            email_ortu: req.email_ortu,
            pekerjaan_ayah: req.pekerjaan_ayah,
            pekerjaan_ibu: req.pekerjaan_ibu,
            nama_wali: req.nama_wali,
            alamat_wali: req.alamat_wali,
            kontak_wali: req.kontak_wali,
            email_wali: req.email_wali,
            pekerjaan_wali: req.pekerjaan_wali,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateSiswaRequest {
    pub id: i64,
    pub data: AddSiswaRequest,
}

// ==========================
// CRUD COMMANDS
// ==========================

/// Tambah siswa baru
#[tauri::command]
pub async fn add_siswa(req: AddSiswaRequest) -> Result<ApiResponse<i64>, String> {
    info!("Command: add_siswa - nis={}, nama={}, kelas={}", 
          req.nis, req.nama, req.kelas);

    let input: siswa::SiswaInput = req.into();

    match siswa::add_siswa(input) {
        Ok(id) => {
            info!("Siswa berhasil ditambahkan: id={}", id);
            Ok(ApiResponse::success(id))
        }
        Err(e) => {
            error!("Gagal tambah siswa: {}", e);
            Err(format!("Gagal menambah siswa: {}", e))
        }
    }
}

/// Update siswa
#[tauri::command]
pub async fn update_siswa(req: UpdateSiswaRequest) -> Result<ApiResponse<bool>, String> {
    info!("Command: update_siswa - id={}", req.id);

    let input: siswa::SiswaInput = req.data.into();

    match siswa::update_siswa(req.id, input) {
        Ok(updated) => {
            if updated {
                info!("Siswa berhasil diupdate: id={}", req.id);
            } else {
                info!("Tidak ada perubahan: id={}", req.id);
            }
            Ok(ApiResponse::success(updated))
        }
        Err(e) => {
            error!("Gagal update siswa: {}", e);
            Err(format!("Gagal mengupdate siswa: {}", e))
        }
    }
}

/// Delete siswa
#[tauri::command]
pub async fn delete_siswa(id: i64) -> Result<ApiResponse<bool>, String> {
    info!("Command: delete_siswa - id={}", id);

    match siswa::delete_siswa(id) {
        Ok(deleted) => {
            if deleted {
                info!("Siswa berhasil dihapus: id={}", id);
            } else {
                info!("Siswa tidak ditemukan: id={}", id);
            }
            Ok(ApiResponse::success(deleted))
        }
        Err(e) => {
            error!("Gagal hapus siswa: {}", e);
            Err(format!("Gagal menghapus siswa: {}", e))
        }
    }
}

/// Get semua siswa
#[tauri::command]
pub async fn get_all_siswa() -> Result<ApiResponse<Vec<siswa::Siswa>>, String> {
    info!("Command: get_all_siswa");

    match siswa::get_all_siswa() {
        Ok(data) => {
            info!("Berhasil get {} siswa", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get all siswa: {}", e);
            Err(format!("Gagal mengambil data siswa: {}", e))
        }
    }
}

/// Get siswa by ID
#[tauri::command]
pub async fn get_siswa_by_id(id: i64) -> Result<ApiResponse<Option<siswa::Siswa>>, String> {
    info!("Command: get_siswa_by_id - id={}", id);

    match siswa::get_siswa_by_id(id) {
        Ok(data) => {
            if data.is_some() {
                info!("Siswa ditemukan: id={}", id);
            } else {
                info!("Siswa tidak ditemukan: id={}", id);
            }
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get siswa by id: {}", e);
            Err(format!("Gagal mengambil siswa: {}", e))
        }
    }
}

/// Get siswa by kelas
#[tauri::command]
pub async fn get_siswa_by_kelas(kelas: String) -> Result<ApiResponse<Vec<siswa::Siswa>>, String> {
    info!("Command: get_siswa_by_kelas - kelas={}", kelas);

    match siswa::get_siswa_by_kelas(&kelas) {
        Ok(data) => {
            info!("Berhasil get {} siswa untuk kelas={}", data.len(), kelas);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get siswa by kelas: {}", e);
            Err(format!("Gagal mengambil siswa: {}", e))
        }
    }
}

/// Get siswa by tingkat (4, 5, atau 6)
#[tauri::command]
pub async fn get_siswa_by_tingkat(tingkat: i32) -> Result<ApiResponse<Vec<siswa::Siswa>>, String> {
    info!("Command: get_siswa_by_tingkat - tingkat={}", tingkat);

    match siswa::get_siswa_by_tingkat(tingkat) {
        Ok(data) => {
            info!("Berhasil get {} siswa untuk tingkat={}", data.len(), tingkat);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get siswa by tingkat: {}", e);
            Err(format!("Gagal mengambil siswa: {}", e))
        }
    }
}

/// Search siswa by keyword
#[tauri::command]
pub async fn search_siswa(keyword: String) -> Result<ApiResponse<Vec<siswa::Siswa>>, String> {
    info!("Command: search_siswa - keyword={}", keyword);

    match siswa::search_siswa(&keyword) {
        Ok(data) => {
            info!("Hasil pencarian: {} siswa ditemukan", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal search siswa: {}", e);
            Err(format!("Gagal mencari siswa: {}", e))
        }
    }
}

// ==========================
// STATISTIK COMMANDS
// ==========================

/// Get total siswa
#[tauri::command]
pub async fn get_total_siswa() -> Result<ApiResponse<i32>, String> {
    info!("Command: get_total_siswa");

    match siswa::get_total_siswa() {
        Ok(total) => {
            info!("Total siswa: {}", total);
            Ok(ApiResponse::success(total))
        }
        Err(e) => {
            error!("Gagal get total siswa: {}", e);
            Err(format!("Gagal menghitung total siswa: {}", e))
        }
    }
}

/// Get statistik siswa (per kelas atau semua tingkat)
#[tauri::command]
pub async fn get_statistik_siswa(
    kelas: Option<String>,
) -> Result<ApiResponse<Vec<siswa::StatistikSiswa>>, String> {
    info!("Command: get_statistik_siswa - kelas={:?}", kelas);

    match siswa::get_statistik_siswa(kelas.as_deref()) {
        Ok(data) => {
            info!("Statistik siswa berhasil dihitung: {} data", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get statistik siswa: {}", e);
            Err(format!("Gagal menghitung statistik: {}", e))
        }
    }
}

// ==========================
// VALIDATION COMMANDS
// ==========================

/// Validate kelas
#[tauri::command]
pub async fn validate_kelas(kelas: String) -> Result<ApiResponse<String>, String> {
    info!("Command: validate_kelas - kelas={}", kelas);

    match siswa::validate_kelas(&kelas) {
        Ok(kelas_valid) => {
            info!("Kelas valid: {} -> {}", kelas, kelas_valid);
            Ok(ApiResponse::success(kelas_valid))
        }
        Err(e) => {
            error!("Kelas tidak valid: {}", e);
            Err(e)
        }
    }
}

/// Extract tingkat dari kelas
#[tauri::command]
pub async fn extract_tingkat_kelas(kelas: String) -> Result<ApiResponse<i32>, String> {
    info!("Command: extract_tingkat_kelas - kelas={}", kelas);

    match siswa::extract_tingkat_kelas(&kelas) {
        Ok(tingkat) => {
            info!("Tingkat kelas: {} -> {}", kelas, tingkat);
            Ok(ApiResponse::success(tingkat))
        }
        Err(e) => {
            error!("Gagal extract tingkat: {}", e);
            Err(e)
        }
    }
}

/// Validate jenis kelamin
#[tauri::command]
pub async fn validate_jenis_kelamin(jk: String) -> Result<ApiResponse<String>, String> {
    info!("Command: validate_jenis_kelamin - jk={}", jk);

    match siswa::validate_jenis_kelamin(&jk) {
        Ok(jk_valid) => {
            info!("Jenis kelamin valid: {} -> {}", jk, jk_valid);
            Ok(ApiResponse::success(jk_valid))
        }
        Err(e) => {
            error!("Jenis kelamin tidak valid: {}", e);
            Err(e)
        }
    }
}

/// Validate email
#[tauri::command]
pub async fn is_valid_email(email: String) -> Result<ApiResponse<bool>, String> {
    info!("Command: is_valid_email - email={}", email);

    let is_valid = siswa::is_valid_email(&email);
    info!("Email valid: {} -> {}", email, is_valid);
    
    Ok(ApiResponse::success(is_valid))
}

/// Validate phone
#[tauri::command]
pub async fn is_valid_phone(phone: String) -> Result<ApiResponse<bool>, String> {
    info!("Command: is_valid_phone - phone={}", phone);

    let is_valid = siswa::is_valid_phone(&phone);
    info!("Phone valid: {} -> {}", phone, is_valid);
    
    Ok(ApiResponse::success(is_valid))
}

/// Cek apakah NIS sudah ada
#[tauri::command]
pub async fn is_nis_exist(nis: String, exclude_id: Option<i64>) -> Result<ApiResponse<bool>, String> {
    info!("Command: is_nis_exist - nis={}, exclude_id={:?}", nis, exclude_id);

    match siswa::is_nis_exist(&nis, exclude_id) {
        Ok(exists) => {
            info!("NIS {} exists: {}", nis, exists);
            Ok(ApiResponse::success(exists))
        }
        Err(e) => {
            error!("Gagal cek NIS: {}", e);
            Err(format!("Gagal mengecek NIS: {}", e))
        }
    }
}

/// Cek apakah NISN sudah ada
#[tauri::command]
pub async fn is_nisn_exist(nisn: String, exclude_id: Option<i64>) -> Result<ApiResponse<bool>, String> {
    info!("Command: is_nisn_exist - nisn={}, exclude_id={:?}", nisn, exclude_id);

    match siswa::is_nisn_exist(&nisn, exclude_id) {
        Ok(exists) => {
            info!("NISN {} exists: {}", nisn, exists);
            Ok(ApiResponse::success(exists))
        }
        Err(e) => {
            error!("Gagal cek NISN: {}", e);
            Err(format!("Gagal mengecek NISN: {}", e))
        }
    }
}
