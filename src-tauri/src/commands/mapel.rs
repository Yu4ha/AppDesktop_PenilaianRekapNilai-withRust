/**
 * commands/mapel.rs
 * =================
 * Tauri Commands untuk Data Mata Pelajaran (Mapel)
 * 
 * FITUR:
 * ✅ CRUD Mapel lengkap (add, update, delete, get)
 * ✅ Update KKM khusus
 * ✅ Search mapel
 * ✅ Statistik mapel (total siswa, rata-rata nilai, dll)
 * ✅ Validasi KKM & nama mapel
 */

use serde::{Deserialize, Serialize};
use log::{info, error};

use crate::models::mapel;
use crate::commands::ApiResponse;

// ==========================
// REQUEST STRUCTS
// ==========================

#[derive(Debug, Deserialize)]
pub struct AddMapelRequest {
    pub nama_mapel: String,
    pub kkm: Option<i32>,
}

impl From<AddMapelRequest> for mapel::MapelInput {
    fn from(req: AddMapelRequest) -> Self {
        Self {
            nama_mapel: req.nama_mapel,
            kkm: req.kkm,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateMapelRequest {
    pub id: i64,
    pub nama_mapel: String,
    pub kkm: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateKkmRequest {
    pub id: i64,
    pub kkm: i32,
}

// ==========================
// CRUD COMMANDS
// ==========================

/// Tambah mapel baru
#[tauri::command]
pub async fn add_mapel(req: AddMapelRequest) -> Result<ApiResponse<i64>, String> {
    info!("Command: add_mapel - nama_mapel={}, kkm={:?}", 
          req.nama_mapel, req.kkm);

    let input: mapel::MapelInput = req.into();

    match mapel::add_mapel(input) {
        Ok(id) => {
            info!("Mapel berhasil ditambahkan: id={}", id);
            Ok(ApiResponse::success(id))
        }
        Err(e) => {
            error!("Gagal tambah mapel: {}", e);
            Err(format!("Gagal menambah mapel: {}", e))
        }
    }
}

/// Update mapel
#[tauri::command]
pub async fn update_mapel(req: UpdateMapelRequest) -> Result<ApiResponse<bool>, String> {
    info!("Command: update_mapel - id={}, nama_mapel={}", 
          req.id, req.nama_mapel);

    let input = mapel::MapelInput {
        nama_mapel: req.nama_mapel,
        kkm: req.kkm,
    };

    match mapel::update_mapel(req.id, input) {
        Ok(updated) => {
            if updated {
                info!("Mapel berhasil diupdate: id={}", req.id);
            } else {
                info!("Tidak ada perubahan: id={}", req.id);
            }
            Ok(ApiResponse::success(updated))
        }
        Err(e) => {
            error!("Gagal update mapel: {}", e);
            Err(format!("Gagal mengupdate mapel: {}", e))
        }
    }
}

/// Update hanya KKM
#[tauri::command]
pub async fn update_kkm_mapel(req: UpdateKkmRequest) -> Result<ApiResponse<bool>, String> {
    info!("Command: update_kkm_mapel - id={}, kkm={}", req.id, req.kkm);

    match mapel::update_kkm(req.id, req.kkm) {
        Ok(updated) => {
            if updated {
                info!("KKM mapel berhasil diupdate: id={}, kkm={}", req.id, req.kkm);
            } else {
                info!("Tidak ada perubahan: id={}", req.id);
            }
            Ok(ApiResponse::success(updated))
        }
        Err(e) => {
            error!("Gagal update KKM: {}", e);
            Err(format!("Gagal mengupdate KKM: {}", e))
        }
    }
}

/// Delete mapel
#[tauri::command]
pub async fn delete_mapel(id: i64) -> Result<ApiResponse<bool>, String> {
    info!("Command: delete_mapel - id={}", id);

    match mapel::delete_mapel(id) {
        Ok(deleted) => {
            if deleted {
                info!("Mapel berhasil dihapus: id={}", id);
            } else {
                info!("Mapel tidak ditemukan: id={}", id);
            }
            Ok(ApiResponse::success(deleted))
        }
        Err(e) => {
            error!("Gagal hapus mapel: {}", e);
            Err(format!("Gagal menghapus mapel: {}", e))
        }
    }
}

/// Get semua mapel
#[tauri::command]
pub async fn get_all_mapel() -> Result<ApiResponse<Vec<mapel::Mapel>>, String> {
    info!("Command: get_all_mapel");

    match mapel::get_all_mapel() {
        Ok(data) => {
            info!("Berhasil get {} mapel", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get all mapel: {}", e);
            Err(format!("Gagal mengambil data mapel: {}", e))
        }
    }
}

/// Get mapel by ID
#[tauri::command]
pub async fn get_mapel_by_id(id: i64) -> Result<ApiResponse<Option<mapel::Mapel>>, String> {
    info!("Command: get_mapel_by_id - id={}", id);

    match mapel::get_mapel_by_id(id) {
        Ok(data) => {
            if data.is_some() {
                info!("Mapel ditemukan: id={}", id);
            } else {
                info!("Mapel tidak ditemukan: id={}", id);
            }
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get mapel by id: {}", e);
            Err(format!("Gagal mengambil mapel: {}", e))
        }
    }
}

/// Get mapel by name (case-insensitive)
#[tauri::command]
pub async fn get_mapel_by_name(nama_mapel: String) -> Result<ApiResponse<Option<mapel::Mapel>>, String> {
    info!("Command: get_mapel_by_name - nama_mapel={}", nama_mapel);

    match mapel::get_mapel_by_name(&nama_mapel) {
        Ok(data) => {
            if data.is_some() {
                info!("Mapel ditemukan: nama_mapel={}", nama_mapel);
            } else {
                info!("Mapel tidak ditemukan: nama_mapel={}", nama_mapel);
            }
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get mapel by name: {}", e);
            Err(format!("Gagal mengambil mapel: {}", e))
        }
    }
}

/// Search mapel by keyword
#[tauri::command]
pub async fn search_mapel(keyword: String) -> Result<ApiResponse<Vec<mapel::Mapel>>, String> {
    info!("Command: search_mapel - keyword={}", keyword);

    match mapel::search_mapel(&keyword) {
        Ok(data) => {
            info!("Hasil pencarian: {} mapel ditemukan", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal search mapel: {}", e);
            Err(format!("Gagal mencari mapel: {}", e))
        }
    }
}

// ==========================
// STATISTIK COMMANDS
// ==========================

/// Get statistik mapel (satu atau semua)
#[tauri::command]
pub async fn get_mapel_stats(id: Option<i64>) -> Result<ApiResponse<Vec<mapel::MapelStats>>, String> {
    info!("Command: get_mapel_stats - id={:?}", id);

    match mapel::get_mapel_stats(id) {
        Ok(data) => {
            info!("Statistik mapel berhasil dihitung: {} mapel", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get statistik mapel: {}", e);
            Err(format!("Gagal menghitung statistik: {}", e))
        }
    }
}

// ==========================
// VALIDATION COMMANDS
// ==========================

/// Validate KKM
#[tauri::command]
pub async fn validate_kkm(kkm: i32) -> Result<ApiResponse<bool>, String> {
    info!("Command: validate_kkm - kkm={}", kkm);

    match mapel::validate_kkm(kkm) {
        Ok(_) => {
            info!("KKM valid: {}", kkm);
            Ok(ApiResponse::success(true))
        }
        Err(e) => {
            error!("KKM tidak valid: {}", e);
            Err(e)
        }
    }
}

/// Cek apakah nama mapel sudah ada
#[tauri::command]
pub async fn is_mapel_exist(nama_mapel: String, exclude_id: Option<i64>) -> Result<ApiResponse<bool>, String> {
    info!("Command: is_mapel_exist - nama_mapel={}, exclude_id={:?}", nama_mapel, exclude_id);

    match mapel::is_mapel_exist(&nama_mapel, exclude_id) {
        Ok(exists) => {
            info!("Mapel '{}' exists: {}", nama_mapel, exists);
            Ok(ApiResponse::success(exists))
        }
        Err(e) => {
            error!("Gagal cek mapel: {}", e);
            Err(format!("Gagal mengecek mapel: {}", e))
        }
    }
}
