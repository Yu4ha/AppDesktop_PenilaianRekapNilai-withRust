/**
 * commands/penilaian.rs (v5.1)
 * ==============================
 * Tauri Commands untuk Business Logic Penilaian
 * 
 * FITUR:
 * ✅ Kelengkapan & Status Ketuntasan
 * ✅ Rata-rata & Ranking Siswa
 * ✅ Statistik Kelas & Kelulusan
 * ✅ Rekap Nilai & Kelulusan
 * ✅ Batch Operations
 * ✅ Analisis Kelas Lengkap
 */

use tauri::State;
use serde::{Deserialize, Serialize};
use log::{info, error};

use crate::logic::penilaian;
use crate::commands::nilai::ApiResponse;

// ==========================
// REQUEST STRUCTS
// ==========================

#[derive(Debug, Deserialize)]
pub struct ContextRequest {
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
}

impl From<ContextRequest> for penilaian::Context {
    fn from(req: ContextRequest) -> Self {
        Self {
            kelas: req.kelas,
            semester: req.semester,
            tahun_ajaran: req.tahun_ajaran,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct KelengkapanRequest {
    pub siswa_id: i64,
    pub mapel_id: i64,
    pub context: ContextRequest,
}

#[derive(Debug, Deserialize)]
pub struct StatusRequest {
    pub siswa_id: i64,
    pub mapel_id: i64,
    pub context: ContextRequest,
}

#[derive(Debug, Deserialize)]
pub struct RataRataRequest {
    pub siswa_id: i64,
    pub context: ContextRequest,
}

#[derive(Debug, Deserialize)]
pub struct RankingRequest {
    pub kelas: Option<String>,
    pub semester: i32,
    pub tahun_ajaran: String,
}

#[derive(Debug, Deserialize)]
pub struct TopSiswaRequest {
    pub kelas: Option<String>,
    pub semester: i32,
    pub tahun_ajaran: String,
    pub limit: Option<usize>,
}

#[derive(Debug, Deserialize)]
pub struct RekapNilaiRequest {
    pub siswa_id: i64,
    pub context: ContextRequest,
}

// ==========================
// KELENGKAPAN & STATUS COMMANDS
// ==========================

/// Cek kelengkapan nilai siswa
#[tauri::command]
pub async fn cek_kelengkapan_nilai(
    req: KelengkapanRequest,
) -> Result<ApiResponse<penilaian::KelengkapanNilai>, String> {
    info!("Command: cek_kelengkapan_nilai - siswa_id={}, mapel_id={}", 
          req.siswa_id, req.mapel_id);

    let context = req.context.into();

    match penilaian::cek_kelengkapan_nilai(req.siswa_id, req.mapel_id, &context) {
        Ok(data) => {
            info!("Kelengkapan nilai: lengkap={}, terisi={}/{}", 
                  data.lengkap, data.total_terisi, data.total_jenis_wajib);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal cek kelengkapan nilai: {}", e);
            Err(format!("Gagal mengecek kelengkapan nilai: {}", e))
        }
    }
}

/// Tentukan status ketuntasan
#[tauri::command]
pub async fn tentukan_status(req: StatusRequest) -> Result<ApiResponse<String>, String> {
    info!("Command: tentukan_status - siswa_id={}, mapel_id={}", 
          req.siswa_id, req.mapel_id);

    let context = req.context.into();

    match penilaian::tentukan_status(req.siswa_id, req.mapel_id, &context) {
        Ok(status) => {
            info!("Status ketuntasan: {}", status);
            Ok(ApiResponse::success(status))
        }
        Err(e) => {
            error!("Gagal tentukan status: {}", e);
            Err(format!("Gagal menentukan status: {}", e))
        }
    }
}

/// Hitung nilai akhir dengan kehadiran
#[tauri::command]
pub async fn hitung_nilai_akhir(
    siswa_id: i64,
    mapel_id: i64,
    context: ContextRequest,
) -> Result<ApiResponse<penilaian::NilaiAkhirDetail>, String> {
    info!("Command: hitung_nilai_akhir - siswa_id={}, mapel_id={}", siswa_id, mapel_id);

    let ctx = context.into();

    match penilaian::hitung_nilai_akhir(siswa_id, mapel_id, &ctx) {
        Ok(data) => {
            info!("Nilai akhir berhasil dihitung: nilai_akhir={}, status={}", 
                  data.nilai_akhir, data.status);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal hitung nilai akhir: {}", e);
            Err(format!("Gagal menghitung nilai akhir: {}", e))
        }
    }
}

/// Cek kenaikan kelas siswa (business logic)
#[tauri::command]
pub async fn cek_kenaikan_kelas_detail(
    siswa_id: i64,
    context: ContextRequest,
) -> Result<ApiResponse<penilaian::StatusKenaikanKelasDetail>, String> {
    info!("Command: cek_kenaikan_kelas_detail - siswa_id={}", siswa_id);

    let ctx = context.into();

    match penilaian::cek_kenaikan_kelas(siswa_id, &ctx) {
        Ok(data) => {
            info!("Status kenaikan kelas: {}, persen_tuntas={}%", 
                  data.status_naik_kelas, data.statistik.persen_tuntas);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal cek kenaikan kelas: {}", e);
            Err(format!("Gagal mengecek kenaikan kelas: {}", e))
        }
    }
}

/// Cek kelulusan siswa (business logic)
#[tauri::command]
pub async fn cek_kelulusan_siswa(
    siswa_id: i64,
) -> Result<ApiResponse<penilaian::StatusKelulusanDetail>, String> {
    info!("Command: cek_kelulusan_siswa - siswa_id={}", siswa_id);

    match penilaian::cek_kelulusan_siswa(siswa_id) {
        Ok(data) => {
            info!("Status kelulusan: {}, persen_lulus={}%", 
                  data.status_kelulusan, data.statistik.persen_lulus);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal cek kelulusan siswa: {}", e);
            Err(format!("Gagal mengecek kelulusan siswa: {}", e))
        }
    }
}

// ==========================
// RATA-RATA & RANKING COMMANDS
// ==========================

/// Hitung rata-rata nilai siswa
#[tauri::command]
pub async fn hitung_rata_rata(req: RataRataRequest) -> Result<ApiResponse<Option<f64>>, String> {
    info!("Command: hitung_rata_rata - siswa_id={}", req.siswa_id);

    let context = req.context.into();

    match penilaian::hitung_rata_rata(req.siswa_id, &context) {
        Ok(rata) => {
            if let Some(r) = rata {
                info!("Rata-rata nilai: {}", r);
            } else {
                info!("Belum ada nilai untuk siswa_id={}", req.siswa_id);
            }
            Ok(ApiResponse::success(rata))
        }
        Err(e) => {
            error!("Gagal hitung rata-rata: {}", e);
            Err(format!("Gagal menghitung rata-rata: {}", e))
        }
    }
}

/// Get semua rata-rata siswa
#[tauri::command]
pub async fn get_all_rata_rata(
    req: RankingRequest,
) -> Result<ApiResponse<Vec<penilaian::RataRataSiswa>>, String> {
    info!("Command: get_all_rata_rata - kelas={:?}, semester={}", 
          req.kelas, req.semester);

    match penilaian::get_all_rata_rata(
        req.kelas.as_deref(),
        req.semester,
        &req.tahun_ajaran,
    ) {
        Ok(data) => {
            info!("Berhasil get rata-rata {} siswa", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get all rata-rata: {}", e);
            Err(format!("Gagal mengambil rata-rata siswa: {}", e))
        }
    }
}

/// Hitung ranking siswa
#[tauri::command]
pub async fn hitung_ranking(
    req: RankingRequest,
) -> Result<ApiResponse<Vec<penilaian::RankingSiswa>>, String> {
    info!("Command: hitung_ranking - kelas={:?}, semester={}", 
          req.kelas, req.semester);

    match penilaian::hitung_ranking(
        req.kelas.as_deref(),
        req.semester,
        &req.tahun_ajaran,
    ) {
        Ok(data) => {
            info!("Ranking berhasil dihitung: {} siswa", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal hitung ranking: {}", e);
            Err(format!("Gagal menghitung ranking: {}", e))
        }
    }
}

/// Get top N siswa
#[tauri::command]
pub async fn get_top_siswa(
    req: TopSiswaRequest,
) -> Result<ApiResponse<Vec<penilaian::RankingSiswa>>, String> {
    let limit = req.limit.unwrap_or(10);
    info!("Command: get_top_siswa - kelas={:?}, semester={}, limit={}", 
          req.kelas, req.semester, limit);

    match penilaian::get_top_siswa(
        req.kelas.as_deref(),
        req.semester,
        &req.tahun_ajaran,
        limit,
    ) {
        Ok(data) => {
            info!("Top {} siswa berhasil diambil", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get top siswa: {}", e);
            Err(format!("Gagal mengambil top siswa: {}", e))
        }
    }
}

// ==========================
// STATISTIK COMMANDS
// ==========================

/// Hitung statistik kelas
#[tauri::command]
pub async fn hitung_statistik(
    req: RankingRequest,
) -> Result<ApiResponse<penilaian::StatistikKelas>, String> {
    info!("Command: hitung_statistik - kelas={:?}, semester={}", 
          req.kelas, req.semester);

    match penilaian::hitung_statistik(
        req.kelas.as_deref(),
        req.semester,
        &req.tahun_ajaran,
    ) {
        Ok(data) => {
            info!("Statistik kelas: total_siswa={}, dengan_nilai={}, rata_rata_kelas={}", 
                  data.siswa.total, data.siswa.dengan_nilai, data.nilai.rata_rata_kelas);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal hitung statistik: {}", e);
            Err(format!("Gagal menghitung statistik: {}", e))
        }
    }
}

/// Hitung statistik kelulusan (Kelas 6)
#[tauri::command]
pub async fn hitung_statistik_kelulusan() -> Result<ApiResponse<penilaian::StatistikKelulusan>, String> {
    info!("Command: hitung_statistik_kelulusan");

    match penilaian::hitung_statistik_kelulusan() {
        Ok(data) => {
            info!("Statistik kelulusan: total={}, lulus={}, tidak_lulus={}, persen_lulus={}%", 
                  data.total_siswa, data.siswa_lulus, data.siswa_tidak_lulus, data.persen_lulus);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal hitung statistik kelulusan: {}", e);
            Err(format!("Gagal menghitung statistik kelulusan: {}", e))
        }
    }
}

// ==========================
// REKAP & LAPORAN COMMANDS
// ==========================

/// Get rekap nilai lengkap
#[tauri::command]
pub async fn get_rekap_nilai(
    req: RekapNilaiRequest,
) -> Result<ApiResponse<penilaian::RekapNilai>, String> {
    info!("Command: get_rekap_nilai - siswa_id={}", req.siswa_id);

    let context = req.context.into();

    match penilaian::get_rekap_nilai(req.siswa_id, &context) {
        Ok(data) => {
            info!("Rekap nilai berhasil dibuat: siswa={}, status={}", 
                  data.siswa.nama, data.status.naik_kelas);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get rekap nilai: {}", e);
            Err(format!("Gagal membuat rekap nilai: {}", e))
        }
    }
}

/// Get rekap kelulusan
#[tauri::command]
pub async fn get_rekap_kelulusan(siswa_id: i64) -> Result<ApiResponse<penilaian::RekapKelulusan>, String> {
    info!("Command: get_rekap_kelulusan - siswa_id={}", siswa_id);

    match penilaian::get_rekap_kelulusan(siswa_id) {
        Ok(data) => {
            info!("Rekap kelulusan berhasil dibuat: siswa={}, status={}", 
                  data.siswa.nama, data.status.kelulusan);
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal get rekap kelulusan: {}", e);
            Err(format!("Gagal membuat rekap kelulusan: {}", e))
        }
    }
}

// ==========================
// BATCH OPERATIONS COMMANDS
// ==========================

/// Batch hitung nilai untuk semua siswa di kelas
#[tauri::command]
pub async fn batch_hitung_nilai(
    context: ContextRequest,
) -> Result<ApiResponse<Vec<penilaian::BatchNilaiSiswa>>, String> {
    info!("Command: batch_hitung_nilai - kelas={}, semester={}", 
          context.kelas, context.semester);

    let ctx = context.into();

    match penilaian::batch_hitung_nilai(&ctx) {
        Ok(data) => {
            info!("Batch hitung nilai selesai: {} siswa", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal batch hitung nilai: {}", e);
            Err(format!("Gagal menghitung nilai batch: {}", e))
        }
    }
}

/// Batch cek kelengkapan untuk semua siswa di kelas
#[tauri::command]
pub async fn batch_cek_kelengkapan(
    context: ContextRequest,
) -> Result<ApiResponse<Vec<penilaian::BatchKelengkapanSiswa>>, String> {
    info!("Command: batch_cek_kelengkapan - kelas={}, semester={}", 
          context.kelas, context.semester);

    let ctx = context.into();

    match penilaian::batch_cek_kelengkapan(&ctx) {
        Ok(data) => {
            info!("Batch cek kelengkapan selesai: {} siswa", data.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal batch cek kelengkapan: {}", e);
            Err(format!("Gagal mengecek kelengkapan batch: {}", e))
        }
    }
}

// ==========================
// ANALISIS KELAS COMMAND
// ==========================

/// Analisis komprehensif per kelas
#[tauri::command]
pub async fn analisis_kelas(
    context: ContextRequest,
) -> Result<ApiResponse<penilaian::AnalisisKelasLengkap>, String> {
    info!("Command: analisis_kelas - kelas={}, semester={}", 
          context.kelas, context.semester);

    let ctx = context.into();

    match penilaian::analisis_kelas(&ctx) {
        Ok(data) => {
            info!("Analisis kelas selesai: rata_rata_kelas={}, mapel_perlu_perhatian={}", 
                  data.statistik_umum.nilai.rata_rata_kelas, 
                  data.rekomendasi.mapel_perlu_perhatian.len());
            Ok(ApiResponse::success(data))
        }
        Err(e) => {
            error!("Gagal analisis kelas: {}", e);
            Err(format!("Gagal menganalisis kelas: {}", e))
        }
    }
}

// ==========================
// UTILITY COMMANDS
// ==========================

/// Validate context
#[tauri::command]
pub async fn validate_context(context: ContextRequest) -> Result<ApiResponse<bool>, String> {
    info!("Command: validate_context - kelas={}, semester={}", 
          context.kelas, context.semester);

    let ctx: penilaian::Context = context.into();

    match penilaian::validate_context(&ctx) {
        Ok(_) => {
            info!("Context valid");
            Ok(ApiResponse::success(true))
        }
        Err(e) => {
            error!("Context tidak valid: {}", e);
            Err(e)
        }
    }
}

/// Hitung nilai kehadiran (wrapper)
#[tauri::command]
pub async fn hitung_nilai_kehadiran(
    siswa_id: i64,
    context: ContextRequest,
) -> Result<ApiResponse<f64>, String> {
    info!("Command: hitung_nilai_kehadiran - siswa_id={}", siswa_id);

    let ctx = context.into();

    match penilaian::hitung_nilai_kehadiran(siswa_id, &ctx) {
        Ok(nilai) => {
            info!("Nilai kehadiran: {}", nilai);
            Ok(ApiResponse::success(nilai))
        }
        Err(e) => {
            error!("Gagal hitung nilai kehadiran: {}", e);
            Err(format!("Gagal menghitung nilai kehadiran: {}", e))
        }
    }
}
