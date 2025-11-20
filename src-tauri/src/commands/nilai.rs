/**
 * commands/nilai.rs (v5.1)
 * ========================
 * Tauri Commands untuk Nilai & Kehadiran
 * 
 * FITUR:
 * ✅ CRUD Nilai (add, update, delete, get)
 * ✅ CRUD Kehadiran dengan auto-calculate
 * ✅ Get konfigurasi (jenis nilai, predikat, bobot)
 * ✅ Perhitungan nilai semester & kelulusan
 * ✅ Error handling proper dengan Result<T, String>
 */

use tauri::State;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use log::{info, error};

use crate::models::nilai;

// ==========================
// REQUEST/RESPONSE STRUCTS
// ==========================

#[derive(Debug, Deserialize)]
pub struct AddNilaiRequest {
    pub siswa_id: i64,
    pub mapel_id: i64,
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
    pub jenis: String,
    pub nilai: f64,
    pub tanggal_input: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNilaiRequest {
    pub id: i64,
    pub nilai: Option<f64>,
    pub tanggal_input: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetNilaiByFilter {
    pub siswa_id: Option<i64>,
    pub mapel_id: Option<i64>,
    pub kelas: Option<String>,
    pub semester: Option<i32>,
    pub tahun_ajaran: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SaveKehadiranRequest {
    pub siswa_id: i64,
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
    pub hadir: i32,
    pub sakit: i32,
    pub izin: i32,
    pub alpa: i32,
}

#[derive(Debug, Deserialize)]
pub struct GetKehadiranRequest {
    pub siswa_id: i64,
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
}

#[derive(Debug, Deserialize)]
pub struct HitungKomponenRequest {
    pub siswa_id: i64,
    pub mapel_id: i64,
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

// ==========================
// CRUD NILAI COMMANDS
// ==========================

/// Tambah nilai baru
#[tauri::command]
pub async fn add_nilai(req: AddNilaiRequest) -> Result<ApiResponse<i64>, String> {
    info!("Command: add_nilai - siswa_id={}, mapel_id={}, jenis={}", 
          req.siswa_id, req.mapel_id, req.jenis);

    match nilai::add_nilai(
        req.siswa_id,
        req.mapel_id,
        &req.kelas,
        req.semester,
        &req.tahun_ajaran,
        &req.jenis,
        req.nilai,
        req.tanggal_input.as_deref(),
    ) {
        Ok(id) => {
            info!("Nilai berhasil ditambahkan: id={}", id);
            Ok(ApiResponse::success(id))
        }
        Err(e) => {
            error!("Gagal tambah nilai: {}", e);
            Err(format!("Gagal menambah nilai: {}", e))
        }
    }
}

/// Update nilai
#[tauri::command]
pub async fn update_nilai(req: UpdateNilaiRequest) -> Result<ApiResponse<bool>, String> {
    info!("Command: update_nilai - id={}", req.id);

    match nilai::update_nilai(req.id, req.nilai, req.tanggal_input.as_deref()) {
        Ok(updated) => {
            if updated {
                info!("Nilai berhasil diupdate: id={}", req.id);
            } else {
                info!("Tidak ada perubahan: id={}", req.id);
            }
            Ok(ApiResponse::success(updated))
        }
        Err(e) => {
            error!("Gagal update nilai: {}", e);
            Err(format!("Gagal update nilai: {}", e))
        }
    }
}

/// Delete nilai
#[tauri::command]
pub async fn delete_nilai(id: i64) -> Result<ApiResponse<bool>, String> {
    info!("Command: delete_nilai - id={}", id);

    match nilai::delete_nilai(id) {
        Ok(deleted) => {
            if deleted {
                info!("Nilai berhasil dihapus: id={}", id);
            } else {
                info!("Nilai tidak ditemukan: id={}", id);
            }
            Ok(ApiResponse::success(deleted))
        }
        Err(e) => {
            error!("Gagal hapus nilai: {}", e);
            Err(format!("Gagal menghapus nilai: {}", e))
        }
    }
}

/// Get semua nilai
#[tauri::command]
pub async fn get_all_nilai() -> Result<ApiResponse<Vec<nilai::NilaiWithDetails>>, String> {
    info!("Command: get_all_nilai");

    match nilai::get_all_nilai() {
        Ok(data) => {
            info!("Berhasil get {} nilai", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get all nilai: {}", e);
            Err(format!("Gagal mengambil data nilai: {}", e))
        }
    }
}

/// Get nilai by ID
#[tauri::command]
pub async fn get_nilai_by_id(id: i64) -> Result<ApiResponse<Option<nilai::NilaiWithDetails>>, String> {
    info!("Command: get_nilai_by_id - id={}", id);

    match nilai::get_nilai_by_id(id) {
        Ok(data) => {
            if data.is_some() {
                info!("Nilai ditemukan: id={}", id);
            } else {
                info!("Nilai tidak ditemukan: id={}", id);
            }
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get nilai by id: {}", e);
            Err(format!("Gagal mengambil nilai: {}", e))
        }
    }
}

/// Get nilai by siswa dengan filter
#[tauri::command]
pub async fn get_nilai_by_siswa(
    siswa_id: i64,
    kelas: Option<String>,
    semester: Option<i32>,
    tahun_ajaran: Option<String>,
) -> Result<ApiResponse<Vec<nilai::Nilai>>, String> {
    info!("Command: get_nilai_by_siswa - siswa_id={}", siswa_id);

    match nilai::get_nilai_by_siswa(
        siswa_id,
        kelas.as_deref(),
        semester,
        tahun_ajaran.as_deref(),
    ) {
        Ok(data) => {
            info!("Berhasil get {} nilai untuk siswa_id={}", data.len(), siswa_id);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get nilai by siswa: {}", e);
            Err(format!("Gagal mengambil nilai siswa: {}", e))
        }
    }
}

/// Get nilai siswa by mapel
#[tauri::command]
pub async fn get_nilai_siswa_by_mapel(
    siswa_id: i64,
    mapel_id: i64,
    kelas: Option<String>,
    semester: Option<i32>,
    tahun_ajaran: Option<String>,
) -> Result<ApiResponse<Vec<nilai::Nilai>>, String> {
    info!("Command: get_nilai_siswa_by_mapel - siswa_id={}, mapel_id={}", siswa_id, mapel_id);

    match nilai::get_nilai_siswa_by_mapel(
        siswa_id,
        mapel_id,
        kelas.as_deref(),
        semester,
        tahun_ajaran.as_deref(),
    ) {
        Ok(data) => {
            info!("Berhasil get {} nilai", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get nilai siswa by mapel: {}", e);
            Err(format!("Gagal mengambil nilai: {}", e))
        }
    }
}

// ==========================
// KEHADIRAN COMMANDS (v5.1)
// ==========================

// Tambahkan di bagian KEHADIRAN COMMANDS (v5.1)

/// Update kehadiran yang sudah ada
#[tauri::command]
pub async fn update_kehadiran(
    id: i64,
    hadir: Option<i32>,
    sakit: Option<i32>,
    izin: Option<i32>,
    alpa: Option<i32>,
) -> Result<ApiResponse<nilai::KehadiranData>, String> {
    info!("Command: update_kehadiran - id={}", id);

    match nilai::update_kehadiran(id, hadir, sakit, izin, alpa) {
        Ok(data) => {
            info!("Kehadiran berhasil diupdate: id={}, nilai={}", id, data.nilai);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal update kehadiran: {}", e);
            Err(format!("Gagal update kehadiran: {}", e))
        }
    }
}

/// Get list kehadiran per kelas dan semester
#[tauri::command]
pub async fn get_kehadiran_by_kelas(
    kelas: String,
    semester: i32,
    tahun_ajaran: String,
) -> Result<ApiResponse<Vec<nilai::KehadiranWithSiswa>>, String> {
    info!("Command: get_kehadiran_by_kelas - kelas={}, semester={}, tahun_ajaran={}", 
          kelas, semester, tahun_ajaran);

    match nilai::get_kehadiran_by_kelas(&kelas, semester, &tahun_ajaran) {
        Ok(data) => {
            info!("Berhasil get {} data kehadiran untuk kelas {}", data.len(), kelas);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get kehadiran by kelas: {}", e);
            Err(format!("Gagal mengambil data kehadiran: {}", e))
        }
    }
}

/// Get semua kehadiran siswa (untuk rekap)
#[tauri::command]
pub async fn get_all_kehadiran(
    semester: Option<i32>,
    tahun_ajaran: Option<String>,
) -> Result<ApiResponse<Vec<nilai::KehadiranWithSiswa>>, String> {
    info!("Command: get_all_kehadiran");

    match nilai::get_all_kehadiran(semester, tahun_ajaran.as_deref()) {
        Ok(data) => {
            info!("Berhasil get {} data kehadiran", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get all kehadiran: {}", e);
            Err(format!("Gagal mengambil semua data kehadiran: {}", e))
        }
    }
}

/// Save kehadiran dengan auto-calculate
#[tauri::command]
pub async fn save_kehadiran(req: SaveKehadiranRequest) -> Result<ApiResponse<nilai::KehadiranData>, String> {
    info!("Command: save_kehadiran - siswa_id={}, kelas={}, semester={}", 
          req.siswa_id, req.kelas, req.semester);

    match nilai::save_kehadiran(
        req.siswa_id,
        &req.kelas,
        req.semester,
        &req.tahun_ajaran,
        req.hadir,
        req.sakit,
        req.izin,
        req.alpa,
    ) {
        Ok(data) => {
            info!("Kehadiran berhasil disimpan: siswa_id={}, nilai={}", req.siswa_id, data.nilai);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal save kehadiran: {}", e);
            Err(format!("Gagal menyimpan kehadiran: {}", e))
        }
    }
}

/// Get kehadiran siswa
#[tauri::command]
pub async fn get_kehadiran(req: GetKehadiranRequest) -> Result<ApiResponse<Option<nilai::KehadiranData>>, String> {
    info!("Command: get_kehadiran - siswa_id={}, kelas={}, semester={}", 
          req.siswa_id, req.kelas, req.semester);

    match nilai::get_kehadiran(req.siswa_id, &req.kelas, req.semester, &req.tahun_ajaran) {
        Ok(data) => {
            if data.is_some() {
                info!("Kehadiran ditemukan: siswa_id={}", req.siswa_id);
            } else {
                info!("Kehadiran tidak ditemukan: siswa_id={}", req.siswa_id);
            }
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get kehadiran: {}", e);
            Err(format!("Gagal mengambil kehadiran: {}", e))
        }
    }
}

/// Delete kehadiran
#[tauri::command]
pub async fn delete_kehadiran(id: i64) -> Result<ApiResponse<bool>, String> {
    info!("Command: delete_kehadiran - id={}", id);

    match nilai::delete_kehadiran(id) {
        Ok(deleted) => {
            if deleted {
                info!("Kehadiran berhasil dihapus: id={}", id);
            } else {
                info!("Kehadiran tidak ditemukan: id={}", id);
            }
            Ok(ApiResponse::success(deleted))
        }
        Err(e) => {
            error!("Gagal hapus kehadiran: {}", e);
            Err(format!("Gagal menghapus kehadiran: {}", e))
        }
    }
}

// ==========================
// PERHITUNGAN NILAI COMMANDS
// ==========================

/// Hitung komponen nilai semester
#[tauri::command]
pub async fn hitung_komponen_nilai_semester(
    req: HitungKomponenRequest,
) -> Result<ApiResponse<nilai::KomponenNilaiSemester>, String> {
    info!("Command: hitung_komponen_nilai_semester - siswa_id={}, mapel_id={}", 
          req.siswa_id, req.mapel_id);

    match nilai::hitung_komponen_nilai_semester(
        req.siswa_id,
        req.mapel_id,
        &req.kelas,
        req.semester,
        &req.tahun_ajaran,
    ) {
        Ok(data) => {
            info!("Komponen nilai berhasil dihitung: nilai_akademik={}", data.nilai_akademik);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal hitung komponen nilai: {}", e);
            Err(format!("Gagal menghitung nilai: {}", e))
        }
    }
}

/// Hitung akumulasi nilai 6 semester
#[tauri::command]
pub async fn hitung_akumulasi_nilai(
    siswa_id: i64,
    mapel_id: i64,
) -> Result<ApiResponse<nilai::AkumulasiNilai>, String> {
    info!("Command: hitung_akumulasi_nilai - siswa_id={}, mapel_id={}", siswa_id, mapel_id);

    match nilai::hitung_akumulasi_nilai(siswa_id, mapel_id) {
        Ok(data) => {
            info!("Akumulasi nilai berhasil dihitung: {} semester", data.jumlah_semester);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal hitung akumulasi nilai: {}", e);
            Err(format!("Gagal menghitung akumulasi nilai: {}", e))
        }
    }
}

/// Hitung nilai akhir kelulusan
#[tauri::command]
pub async fn hitung_nilai_akhir_kelulusan(
    siswa_id: i64,
    mapel_id: i64,
) -> Result<ApiResponse<nilai::NilaiAkhirKelulusan>, String> {
    info!("Command: hitung_nilai_akhir_kelulusan - siswa_id={}, mapel_id={}", siswa_id, mapel_id);

    match nilai::hitung_nilai_akhir_kelulusan(siswa_id, mapel_id) {
        Ok(data) => {
            info!("Nilai akhir kelulusan berhasil dihitung: nilai_akhir={}, status={}", 
                  data.nilai_akhir, data.status_kelulusan);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal hitung nilai akhir kelulusan: {}", e);
            Err(format!("Gagal menghitung nilai kelulusan: {}", e))
        }
    }
}

/// Cek kenaikan kelas
#[tauri::command]
pub async fn cek_kenaikan_kelas(
    siswa_id: i64,
    kelas: String,
    semester: i32,
    tahun_ajaran: String,
) -> Result<ApiResponse<nilai::StatusKenaikanKelas>, String> {
    info!("Command: cek_kenaikan_kelas - siswa_id={}, kelas={}, semester={}", 
          siswa_id, kelas, semester);

    match nilai::cek_kenaikan_kelas(siswa_id, &kelas, semester, &tahun_ajaran) {
        Ok(data) => {
            info!("Status kenaikan kelas: {}", data.status_naik_kelas);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal cek kenaikan kelas: {}", e);
            Err(format!("Gagal mengecek kenaikan kelas: {}", e))
        }
    }
}

/// Cek kelulusan siswa
#[tauri::command]
pub async fn cek_kelulusan(siswa_id: i64) -> Result<ApiResponse<nilai::StatusKelulusan>, String> {
    info!("Command: cek_kelulusan - siswa_id={}", siswa_id);

    match nilai::cek_kelulusan(siswa_id) {
        Ok(data) => {
            info!("Status kelulusan: {}", data.status_kelulusan);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal cek kelulusan: {}", e);
            Err(format!("Gagal mengecek kelulusan: {}", e))
        }
    }
}

// ==========================
// CONFIG COMMANDS
// ==========================

/// Get jenis nilai aktif
#[tauri::command]
pub async fn get_active_jenis_nilai(
    include_kehadiran: Option<bool>,
    include_ujian_sekolah: Option<bool>,
) -> Result<ApiResponse<Vec<nilai::JenisNilaiConfig>>, String> {
    info!("Command: get_active_jenis_nilai");

    match nilai::get_active_jenis_nilai(
        include_kehadiran.unwrap_or(true),
        include_ujian_sekolah.unwrap_or(true),
    ) {
        Ok(data) => {
            info!("Berhasil get {} jenis nilai", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get jenis nilai: {}", e);
            Err(format!("Gagal mengambil jenis nilai: {}", e))
        }
    }
}

/// Get bobot jenis nilai
#[tauri::command]
pub async fn get_bobot_jenis_nilai() -> Result<ApiResponse<HashMap<String, f64>>, String> {
    info!("Command: get_bobot_jenis_nilai");

    match nilai::get_bobot_jenis_nilai() {
        Ok(data) => {
            info!("Berhasil get bobot jenis nilai");
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get bobot jenis nilai: {}", e);
            Err(format!("Gagal mengambil bobot jenis nilai: {}", e))
        }
    }
}

/// Get predikat config
#[tauri::command]
pub async fn get_predikat_config() -> Result<ApiResponse<Vec<nilai::PredikatConfig>>, String> {
    info!("Command: get_predikat_config");

    match nilai::get_predikat_config() {
        Ok(data) => {
            info!("Berhasil get predikat config");
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get predikat config: {}", e);
            Err(format!("Gagal mengambil konfigurasi predikat: {}", e))
        }
    }
}

/// Get daftar tahun ajaran yang tersedia dari data nilai
#[tauri::command]
pub async fn get_daftar_tahun_ajaran() -> Result<ApiResponse<Vec<String>>, String> {
    info!("Command: get_daftar_tahun_ajaran");

    use crate::database;
    use rusqlite::params;

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = match conn.prepare(
            "SELECT DISTINCT tahun_ajaran 
             FROM nilai 
             WHERE tahun_ajaran IS NOT NULL 
             ORDER BY tahun_ajaran DESC"
        ) {
            Ok(stmt) => stmt,
            Err(e) => {
                error!("Gagal prepare query: {}", e);
                return Err(format!("Gagal mengambil daftar tahun ajaran: {}", e));
            }
        };

        let rows = match stmt.query_map([], |row| row.get::<_, String>(0)) {
            Ok(rows) => rows,
            Err(e) => {
                error!("Gagal query tahun ajaran: {}", e);
                return Err(format!("Gagal mengambil daftar tahun ajaran: {}", e));
            }
        };

        let mut tahun_ajaran_list: Vec<String> = Vec::new();
        for row_result in rows {
            if let Ok(tahun) = row_result {
                tahun_ajaran_list.push(tahun);
            }
        }

        // Jika tidak ada data, generate tahun ajaran saat ini
        if tahun_ajaran_list.is_empty() {
            let current_tahun = nilai::generate_tahun_ajaran();
            tahun_ajaran_list.push(current_tahun);
        }

        info!("Berhasil get {} tahun ajaran", tahun_ajaran_list.len());
        Ok(ApiResponse::success(tahun_ajaran_list))
    } else {
        error!("Database connection tidak tersedia");
        Err("Koneksi database gagal".to_string())
    }
}

/// Get jenis nilai untuk input berdasarkan kelas dan semester
#[tauri::command]
pub async fn get_jenis_nilai_input(
    kelas: String,
    semester: i32,
) -> Result<ApiResponse<Vec<String>>, String> {
    info!("Command: get_jenis_nilai_input - kelas={}, semester={}", kelas, semester);

    // Validasi kelas dan semester
    if let Err(e) = nilai::validate_kelas_and_semester(&kelas, semester) {
        error!("Validasi gagal: {}", e);
        return Err(e);
    }

    // Extract tingkat kelas
    let tingkat = match nilai::extract_tingkat_kelas(&kelas) {
        Ok(t) => t,
        Err(e) => {
            error!("Gagal extract tingkat kelas: {}", e);
            return Err(e);
        }
    };

    // Tentukan jenis nilai berdasarkan tingkat dan semester
    let jenis_nilai = if tingkat == 6 && semester == 2 {
        // Kelas 6 Semester 2: Tambah Ujian Sekolah
        vec![
            "Tugas".to_string(),
            "UTS".to_string(),
            "UAS".to_string(),
            "Ujian Sekolah".to_string(),
        ]
    } else {
        // Kelas 4, 5, atau Kelas 6 Semester 1: Nilai standar
        vec![
            "Tugas".to_string(),
            "UTS".to_string(),
            "UAS".to_string(),
        ]
    };

    info!("Jenis nilai untuk kelas {} semester {}: {:?}", kelas, semester, jenis_nilai);
    Ok(ApiResponse::success(jenis_nilai))
}

/// Generate tahun ajaran aktif
#[tauri::command]
pub async fn get_tahun_ajaran_aktif() -> Result<ApiResponse<String>, String> {
    info!("Command: get_tahun_ajaran_aktif");
    
    let tahun_ajaran = nilai::generate_tahun_ajaran();
    info!("Tahun ajaran aktif: {}", tahun_ajaran);
    
    Ok(ApiResponse::success(tahun_ajaran))
}

/// Tentukan predikat dari nilai
#[tauri::command]
pub async fn tentukan_predikat(nilai_akhir: f64) -> Result<ApiResponse<String>, String> {
    info!("Command: tentukan_predikat - nilai={}", nilai_akhir);

    match nilai::tentukan_predikat(nilai_akhir) {
        Ok(predikat) => {
            info!("Predikat: {}", predikat);
            Ok(ApiResponse::success(predikat))
        }
        Err(e) => {
            error!("Gagal tentukan predikat: {}", e);
            Err(format!("Gagal menentukan predikat: {}", e))
        }
    }
}
