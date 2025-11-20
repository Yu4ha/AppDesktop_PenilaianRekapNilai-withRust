/**
 * commands/absensi.rs
 * ===================
 * Tauri Commands untuk Absensi Siswa
 * 
 * FITUR:
 * ✅ CRUD Absensi (add/update, delete, get)
 * ✅ Statistik Absensi Siswa
 * ✅ Laporan Harian & Rekap
 * ✅ Helper Functions (validate, get status name)
 */

use serde::{Deserialize, Serialize};
use log::{info, error};

use crate::models::absensi;
use crate::commands::ApiResponse;

// ==========================
// REQUEST STRUCTS
// ==========================

#[derive(Debug, Deserialize)]
pub struct AddOrUpdateAbsensiRequest {
    pub siswa_id: i64,
    pub tanggal: String,
    pub status: String,
    pub keterangan: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetAbsensiBySiswaRequest {
    pub siswa_id: i64,
    pub dari_tanggal: Option<String>,
    pub sampai_tanggal: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetStatistikRequest {
    pub siswa_id: i64,
    pub dari_tanggal: Option<String>,
    pub sampai_tanggal: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetRekapRequest {
    pub dari_tanggal: Option<String>,
    pub sampai_tanggal: Option<String>,
}

// ==========================
// CRUD COMMANDS
// ==========================

/// Tambah/Update absensi siswa
#[tauri::command]
pub async fn add_or_update_absensi(
    req: AddOrUpdateAbsensiRequest,
) -> Result<ApiResponse<absensi::AddOrUpdateResult>, String> {
    info!("Command: add_or_update_absensi - siswa_id={}, tanggal={}, status={}", 
          req.siswa_id, req.tanggal, req.status);

    match absensi::add_or_update_absensi(
        req.siswa_id,
        &req.tanggal,
        &req.status,
        req.keterangan.as_deref(),
    ) {
        Ok(result) => {
            info!("Absensi berhasil di-{}: id={}", result.action, result.id);
            Ok(ApiResponse::success(result))
        }
        Err(e) => {
            error!("Gagal add/update absensi: {}", e);
            Err(format!("Gagal menyimpan absensi: {}", e))
        }
    }
}

/// Hapus absensi
#[tauri::command]
pub async fn delete_absensi(id: i64) -> Result<ApiResponse<bool>, String> {
    info!("Command: delete_absensi - id={}", id);

    match absensi::delete_absensi(id) {
        Ok(deleted) => {
            if deleted {
                info!("Absensi berhasil dihapus: id={}", id);
            } else {
                info!("Absensi tidak ditemukan: id={}", id);
            }
            Ok(ApiResponse::success(deleted))
        }
        Err(e) => {
            error!("Gagal hapus absensi: {}", e);
            Err(format!("Gagal menghapus absensi: {}", e))
        }
    }
}

/// Get semua absensi
#[tauri::command]
pub async fn get_all_absensi() -> Result<ApiResponse<Vec<absensi::AbsensiWithSiswa>>, String> {
    info!("Command: get_all_absensi");

    match absensi::get_all_absensi() {
        Ok(data) => {
            info!("Berhasil get {} absensi", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get all absensi: {}", e);
            Err(format!("Gagal mengambil data absensi: {}", e))
        }
    }
}

/// Get absensi by ID
#[tauri::command]
pub async fn get_absensi_by_id(id: i64) -> Result<ApiResponse<Option<absensi::AbsensiWithSiswa>>, String> {
    info!("Command: get_absensi_by_id - id={}", id);

    match absensi::get_absensi_by_id(id) {
        Ok(data) => {
            if data.is_some() {
                info!("Absensi ditemukan: id={}", id);
            } else {
                info!("Absensi tidak ditemukan: id={}", id);
            }
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get absensi by id: {}", e);
            Err(format!("Gagal mengambil absensi: {}", e))
        }
    }
}

/// Get absensi by siswa dengan filter tanggal
#[tauri::command]
pub async fn get_absensi_by_siswa(
    req: GetAbsensiBySiswaRequest,
) -> Result<ApiResponse<Vec<absensi::Absensi>>, String> {
    info!("Command: get_absensi_by_siswa - siswa_id={}", req.siswa_id);

    match absensi::get_absensi_by_siswa(
        req.siswa_id,
        req.dari_tanggal.as_deref(),
        req.sampai_tanggal.as_deref(),
    ) {
        Ok(data) => {
            info!("Berhasil get {} absensi untuk siswa_id={}", data.len(), req.siswa_id);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get absensi by siswa: {}", e);
            Err(format!("Gagal mengambil absensi siswa: {}", e))
        }
    }
}

/// Get absensi by tanggal
#[tauri::command]
pub async fn get_absensi_by_tanggal(
    tanggal: String,
) -> Result<ApiResponse<Vec<absensi::AbsensiWithSiswa>>, String> {
    info!("Command: get_absensi_by_tanggal - tanggal={}", tanggal);

    match absensi::get_absensi_by_tanggal(&tanggal) {
        Ok(data) => {
            info!("Berhasil get {} absensi untuk tanggal={}", data.len(), tanggal);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get absensi by tanggal: {}", e);
            Err(format!("Gagal mengambil absensi: {}", e))
        }
    }
}

// ==========================
// STATISTIK & LAPORAN COMMANDS
// ==========================

/// Get statistik absensi siswa (untuk nilaiModel)
#[tauri::command]
pub async fn get_statistik_absensi_siswa(
    req: GetStatistikRequest,
) -> Result<ApiResponse<absensi::StatistikAbsensi>, String> {
    info!("Command: get_statistik_absensi_siswa - siswa_id={}", req.siswa_id);

    match absensi::get_statistik_absensi_siswa(
        req.siswa_id,
        req.dari_tanggal.as_deref(),
        req.sampai_tanggal.as_deref(),
    ) {
        Ok(data) => {
            info!("Statistik absensi: siswa_id={}, total={}, persentase={}%", 
                  req.siswa_id, data.total_pertemuan, data.persentase_hadir);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get statistik absensi: {}", e);
            Err(format!("Gagal menghitung statistik absensi: {}", e))
        }
    }
}

/// Get laporan absensi harian
#[tauri::command]
pub async fn get_laporan_absensi_harian(
    tanggal: String,
) -> Result<ApiResponse<Vec<absensi::LaporanAbsensiHarian>>, String> {
    info!("Command: get_laporan_absensi_harian - tanggal={}", tanggal);

    match absensi::get_laporan_absensi_harian(&tanggal) {
        Ok(data) => {
            info!("Laporan absensi harian: tanggal={}, total_siswa={}", tanggal, data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get laporan absensi harian: {}", e);
            Err(format!("Gagal membuat laporan absensi: {}", e))
        }
    }
}

/// Get rekap absensi semua siswa
#[tauri::command]
pub async fn get_rekap_absensi_semua(
    req: GetRekapRequest,
) -> Result<ApiResponse<Vec<absensi::RekapAbsensiSiswa>>, String> {
    info!("Command: get_rekap_absensi_semua");

    match absensi::get_rekap_absensi_semua(
        req.dari_tanggal.as_deref(),
        req.sampai_tanggal.as_deref(),
    ) {
        Ok(data) => {
            info!("Rekap absensi semua: total_siswa={}", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get rekap absensi: {}", e);
            Err(format!("Gagal membuat rekap absensi: {}", e))
        }
    }
}

// ==========================
// HELPER COMMANDS
// ==========================

/// Validate status absensi
#[tauri::command]
pub async fn validate_status_absensi(status: String) -> Result<ApiResponse<bool>, String> {
    info!("Command: validate_status_absensi - status={}", status);

    match absensi::validate_status(&status) {
        Ok(_) => {
            info!("Status valid: {}", status);
            Ok(ApiResponse::success(true))
        }
        Err(e) => {
            error!("Status tidak valid: {}", e);
            Err(e)
        }
    }
}

/// Validate tanggal
#[tauri::command]
pub async fn validate_tanggal_absensi(tanggal: String) -> Result<ApiResponse<bool>, String> {
    info!("Command: validate_tanggal_absensi - tanggal={}", tanggal);

    match absensi::validate_tanggal(&tanggal) {
        Ok(_) => {
            info!("Tanggal valid: {}", tanggal);
            Ok(ApiResponse::success(true))
        }
        Err(e) => {
            error!("Tanggal tidak valid: {}", e);
            Err(e)
        }
    }
}

/// Get nama lengkap status
#[tauri::command]
pub async fn get_status_name_absensi(status: String) -> Result<ApiResponse<String>, String> {
    info!("Command: get_status_name_absensi - status={}", status);
    
    let status_name = absensi::get_status_name(&status);
    info!("Status name: {} -> {}", status, status_name);
    
    Ok(ApiResponse::success(status_name))
}
