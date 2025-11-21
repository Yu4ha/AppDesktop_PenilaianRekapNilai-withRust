/**
 * models/nilai.rs (v5.1 - Converted from nilaiModel.js)
 * --------------------------------------------------------
 * Data Model Layer untuk Nilai
 * 
 * FITUR v5.1:
 * ✅ Kehadiran MASUK dalam perhitungan nilai akademik
 * ✅ Bobot: Tugas(25%), UTS(25%), UAS(35%), Kehadiran(15%)
 * ✅ CRUD operations lengkap
 * ✅ Perhitungan nilai semester & kelulusan
 * ✅ Kehadiran management dengan breakdown
 * --------------------------------------------------------
 */

use rusqlite::{params, Result as SqlResult, Row};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use log::{info, warn, error, debug};
use chrono::Local;
use chrono::Datelike;

use crate::database;

// ==========================
// CONSTANTS & CONFIG
// ==========================

/// Bobot Penilaian v5.1
const BOBOT_TUGAS: f64 = 0.25;
const BOBOT_UTS: f64 = 0.25;
const BOBOT_UAS: f64 = 0.35;
const BOBOT_KEHADIRAN: f64 = 0.15;
const BOBOT_UJIAN_SEKOLAH: f64 = 0.00; // Dihitung terpisah

/// Bobot Kelulusan
const BOBOT_AKUMULASI_SEMESTER: f64 = 0.60;
const BOBOT_UJIAN_SEKOLAH_KELULUSAN: f64 = 0.40;

/// Jenis Nilai Valid
const JENIS_NILAI_VALID: [&str; 5] = ["Tugas", "UTS", "UAS", "Ujian Sekolah", "Kehadiran"];

// ==========================
// STRUCTS & TYPES
// ==========================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Nilai {
    pub id: i64,
    pub siswa_id: i64,
    pub mapel_id: i64,
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
    pub jenis: String,
    pub nilai: f64,
    pub hadir: Option<i32>,
    pub sakit: Option<i32>,
    pub izin: Option<i32>,
    pub alpa: Option<i32>,
    pub tanggal_input: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NilaiWithDetails {
    #[serde(flatten)]
    pub nilai: Nilai,
    pub nama_siswa: String,
    pub nis: String,
    pub nisn: String,
    pub nama_mapel: String,
    pub kkm: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JenisNilaiConfig {
    pub id: i64,
    pub nama_jenis: String,
    pub bobot: f64,
    pub is_active: bool,
    pub is_ujian_sekolah: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredikatConfig {
    pub id: i64,
    pub huruf: String,
    pub min_nilai: f64,
    pub max_nilai: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KomponenNilaiSemester {
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
    pub rata_per_jenis: HashMap<String, f64>,
    pub nilai_akademik: f64,
    pub predikat_akademik: String,
    pub kkm: i32,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KehadiranData {
    pub id: Option<i64>,
    pub nilai: f64,
    pub breakdown: KehadiranBreakdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KehadiranBreakdown {
    pub hadir: i32,
    pub sakit: i32,
    pub izin: i32,
    pub alpa: i32,
    pub total: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NilaiAkhirKelulusan {
    pub akumulasi_6_semester: AkumulasiNilai,
    pub nilai_ujian_sekolah: f64,
    pub bobot_akumulasi: f64,
    pub bobot_ujian_sekolah: f64,
    pub nilai_akhir: f64,
    pub predikat: String,
    pub kkm: i32,
    pub status_kelulusan: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AkumulasiNilai {
    pub nilai_per_semester: Vec<NilaiPerSemester>,
    pub jumlah_semester: usize,
    pub rata_akumulasi: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NilaiPerSemester {
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
    pub nilai_akademik: f64,
}

// ==========================
// HELPER FUNCTIONS
// ==========================

/// Validasi jenis nilai
pub fn validate_jenis_nilai(jenis: &str, kelas: Option<&str>, semester: Option<i32>) -> Result<(), String> {
    if !JENIS_NILAI_VALID.contains(&jenis) {
        return Err(format!(
            "Jenis nilai '{}' tidak valid. Yang tersedia: {}",
            jenis,
            JENIS_NILAI_VALID.join(", ")
        ));
    }

    if jenis == "Ujian Sekolah" {
        if let (Some(kelas_str), Some(sem)) = (kelas, semester) {
            let tingkat = extract_tingkat_kelas(kelas_str)?;
            if tingkat != 6 || sem != 2 {
                return Err("Ujian Sekolah hanya untuk Kelas 6 Semester 2".to_string());
            }
        }
    }

    Ok(())
}

/// Extract tingkat dari kelas (4A → 4, 5B → 5, dll)
pub fn extract_tingkat_kelas(kelas: &str) -> Result<i32, String> {
    let tingkat_char = kelas.chars().next()
        .ok_or_else(|| "Kelas tidak valid".to_string())?;
    
    tingkat_char.to_digit(10)
        .map(|d| d as i32)
        .ok_or_else(|| format!("Tingkat kelas '{}' tidak valid", kelas))
}

/// Validasi kelas dan semester
pub fn validate_kelas_and_semester(kelas: &str, semester: i32) -> Result<(), String> {
    let tingkat = extract_tingkat_kelas(kelas)?;
    
    if ![4, 5, 6].contains(&tingkat) {
        return Err("Tingkat kelas harus 4, 5, atau 6".to_string());
    }

    if ![1, 2].contains(&semester) {
        return Err("Semester harus 1 atau 2".to_string());
    }

    Ok(())
}

/// Tentukan predikat berdasarkan nilai
pub fn tentukan_predikat(nilai_akhir: f64) -> SqlResult<String> {
    let predikat_list = get_predikat_config()?;
    
    // Cek dari nilai tertinggi ke terendah
    for p in predikat_list {
        if nilai_akhir >= p.min_nilai {
            return Ok(p.huruf);
        }
    }
    
    Ok("E".to_string())
}

/// Tentukan status ketuntasan
pub fn tentukan_status(nilai_akhir: f64, kkm: i32) -> String {
    if nilai_akhir >= kkm as f64 {
        "Tuntas".to_string()
    } else {
        "Belum Tuntas".to_string()
    }
}

/// Generate tahun ajaran dari tanggal
pub fn generate_tahun_ajaran() -> String {
    let now = Local::now();
    let year = now.year();
    let month = now.month();

    if month >= 7 {
        format!("{}/{}", year, year + 1)
    } else {
        format!("{}/{}", year - 1, year)
    }
}

// ==========================
// CONFIG FUNCTIONS
// ==========================

/// Get konfigurasi jenis nilai aktif
pub fn get_active_jenis_nilai(
    include_kehadiran: bool, 
    include_ujian_sekolah: bool
) -> SqlResult<Vec<JenisNilaiConfig>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut query = "SELECT id, nama_jenis, bobot, is_active, is_ujian_sekolah 
                        FROM jenis_nilai_config 
                        WHERE is_active = 1".to_string();

        if !include_kehadiran {
            query.push_str(" AND LOWER(nama_jenis) != 'kehadiran'");
        }

        if !include_ujian_sekolah {
            query.push_str(" AND is_ujian_sekolah = 0");
        }

        query.push_str(" ORDER BY 
            CASE nama_jenis
                WHEN 'Tugas' THEN 1
                WHEN 'UTS' THEN 2
                WHEN 'UAS' THEN 3
                WHEN 'Kehadiran' THEN 4
                WHEN 'Ujian Sekolah' THEN 5
                ELSE 6
            END");

        let mut stmt = conn.prepare(&query)?;
        let rows = stmt.query_map([], |row| {
            Ok(JenisNilaiConfig {
                id: row.get(0)?,
                nama_jenis: row.get(1)?,
                bobot: row.get(2)?,
                is_active: row.get::<_, i32>(3)? == 1,
                is_ujian_sekolah: row.get::<_, i32>(4)? == 1,
            })
        })?;

        let results: SqlResult<Vec<_>> = rows.collect();
        debug!("Ambil jenis nilai aktif (v5.1): {} items", results.as_ref().map(|r| r.len()).unwrap_or(0));
        results
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Get bobot jenis nilai
pub fn get_bobot_jenis_nilai() -> SqlResult<HashMap<String, f64>> {
    let jenis_list = get_active_jenis_nilai(true, true)?;
    let mut bobot = HashMap::new();
    let mut total_bobot = 0.0;

    for j in &jenis_list {
        bobot.insert(j.nama_jenis.clone(), j.bobot);
        if j.nama_jenis != "Ujian Sekolah" {
            total_bobot += j.bobot;
        }
    }

    // Normalisasi jika total != 1.0
    if total_bobot > 0.0 && (total_bobot - 1.0).abs() > 0.01 {
        warn!("Total bobot tidak 1.0, normalisasi otomatis: {}", total_bobot);
        for (key, value) in bobot.iter_mut() {
            if key != "Ujian Sekolah" {
                *value /= total_bobot;
            }
        }
    }

    Ok(bobot)
}

/// Get konfigurasi predikat
pub fn get_predikat_config() -> SqlResult<Vec<PredikatConfig>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare(
            "SELECT id, huruf, min_nilai, max_nilai 
             FROM predikat_config 
             ORDER BY min_nilai DESC"
        )?;
        
        let rows = stmt.query_map([], |row| {
            Ok(PredikatConfig {
                id: row.get(0)?,
                huruf: row.get(1)?,
                min_nilai: row.get(2)?,
                max_nilai: row.get(3)?,
            })
        })?;

        rows.collect()
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

// ==========================
// CRUD OPERATIONS
// ==========================

/// Tambah nilai baru
pub fn add_nilai(
    siswa_id: i64,
    mapel_id: i64,
    kelas: &str,
    semester: i32,
    tahun_ajaran: &str,
    jenis: &str,
    nilai: f64,
    tanggal_input: Option<&str>,
) -> SqlResult<i64> {
    // Validasi
    validate_kelas_and_semester(kelas, semester)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
    validate_jenis_nilai(jenis, Some(kelas), Some(semester))
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    if nilai < 0.0 || nilai > 100.0 {
        return Err(rusqlite::Error::InvalidParameterName(
            "Nilai harus antara 0-100".to_string()
        ));
    }

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let query = if tanggal_input.is_some() {
            "INSERT INTO nilai (siswa_id, mapel_id, kelas, semester, tahun_ajaran, jenis, nilai, tanggal_input)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
        } else {
            "INSERT INTO nilai (siswa_id, mapel_id, kelas, semester, tahun_ajaran, jenis, nilai)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
        };

        if let Some(tanggal) = tanggal_input {
            conn.execute(
                query,
                params![siswa_id, mapel_id, kelas, semester, tahun_ajaran, jenis, nilai, tanggal],
            )?;
        } else {
            conn.execute(
                query,
                params![siswa_id, mapel_id, kelas, semester, tahun_ajaran, jenis, nilai],
            )?;
        }

        let id = conn.last_insert_rowid();
        info!("Tambah nilai berhasil (v5.1): id={}, siswa_id={}, mapel_id={}, kelas={}, semester={}, jenis={}, nilai={}", 
              id, siswa_id, mapel_id, kelas, semester, jenis, nilai);
        Ok(id)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Update nilai
pub fn update_nilai(id: i64, nilai: Option<f64>, tanggal_input: Option<&str>) -> SqlResult<bool> {
    if let Some(n) = nilai {
        if n < 0.0 || n > 100.0 {
            return Err(rusqlite::Error::InvalidParameterName(
                "Nilai harus antara 0-100".to_string()
            ));
        }
    }

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(n) = nilai {
            updates.push("nilai = ?");
            params_vec.push(Box::new(n));
        }

        if let Some(tanggal) = tanggal_input {
            updates.push("tanggal_input = ?");
            params_vec.push(Box::new(tanggal.to_string()));
        }

        updates.push("updated_at = datetime('now','localtime')");

        if updates.is_empty() {
            info!("Update nilai tanpa perubahan data: id={}", id);
            return Ok(false);
        }

        let query = format!("UPDATE nilai SET {} WHERE id = ?", updates.join(", "));
        params_vec.push(Box::new(id));

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter()
            .map(|p| p.as_ref() as &dyn rusqlite::ToSql)
            .collect();

        let changes = conn.execute(&query, params_refs.as_slice())?;
        
        info!("Update nilai berhasil (v5.1): id={}, changes={}", id, changes);
        Ok(changes > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Hapus nilai
pub fn delete_nilai(id: i64) -> SqlResult<bool> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let changes = conn.execute("DELETE FROM nilai WHERE id = ?1", params![id])?;
        info!("Hapus nilai berhasil: id={}, changes={}", id, changes);
        Ok(changes > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Get semua nilai
pub fn get_all_nilai() -> SqlResult<Vec<NilaiWithDetails>> {
    database::query_all(
        "SELECT n.*, s.nama AS nama_siswa, s.nis, s.nisn, m.nama_mapel, m.kkm
         FROM nilai n
         JOIN siswa s ON s.id = n.siswa_id
         JOIN mapel m ON m.id = n.mapel_id
         ORDER BY n.tahun_ajaran DESC, n.kelas ASC, n.semester ASC, s.nama ASC",
        &[],
        map_nilai_with_details,
    )
}

/// Get nilai by ID
pub fn get_nilai_by_id(id: i64) -> SqlResult<Option<NilaiWithDetails>> {
    database::query_one(
        "SELECT n.*, s.nama AS nama_siswa, s.nis, s.nisn, m.nama_mapel, m.kkm
         FROM nilai n
         JOIN siswa s ON s.id = n.siswa_id
         JOIN mapel m ON m.id = n.mapel_id
         WHERE n.id = ?1",
        &[&id],
        map_nilai_with_details,
    )
}

/// Get nilai by siswa dengan filter
pub fn get_nilai_by_siswa(
    siswa_id: i64,
    kelas: Option<&str>,
    semester: Option<i32>,
    tahun_ajaran: Option<&str>,
) -> SqlResult<Vec<Nilai>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut query = "SELECT n.* FROM nilai n WHERE n.siswa_id = ?1".to_string();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(siswa_id)];

        if let Some(k) = kelas {
            query.push_str(" AND n.kelas = ?");
            params_vec.push(Box::new(k.to_string()));
        }
        if let Some(s) = semester {
            query.push_str(" AND n.semester = ?");
            params_vec.push(Box::new(s));
        }
        if let Some(ta) = tahun_ajaran {
            query.push_str(" AND n.tahun_ajaran = ?");
            params_vec.push(Box::new(ta.to_string()));
        }

        query.push_str(" ORDER BY n.kelas ASC, n.semester ASC, n.jenis ASC");

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter()
            .map(|p| p.as_ref() as &dyn rusqlite::ToSql)
            .collect();

        let mut stmt = conn.prepare(&query)?;
        let rows = stmt.query_map(params_refs.as_slice(), map_nilai)?;
        rows.collect()
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Get nilai siswa by mapel
pub fn get_nilai_siswa_by_mapel(
    siswa_id: i64,
    mapel_id: i64,
    kelas: Option<&str>,
    semester: Option<i32>,
    tahun_ajaran: Option<&str>,
) -> SqlResult<Vec<Nilai>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut query = "SELECT n.* FROM nilai n 
                        WHERE n.siswa_id = ?1 AND n.mapel_id = ?2".to_string();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![
            Box::new(siswa_id),
            Box::new(mapel_id),
        ];

        if let Some(k) = kelas {
            query.push_str(" AND n.kelas = ?");
            params_vec.push(Box::new(k.to_string()));
        }
        if let Some(s) = semester {
            query.push_str(" AND n.semester = ?");
            params_vec.push(Box::new(s));
        }
        if let Some(ta) = tahun_ajaran {
            query.push_str(" AND n.tahun_ajaran = ?");
            params_vec.push(Box::new(ta.to_string()));
        }

        query.push_str(" ORDER BY n.kelas ASC, n.semester ASC, n.jenis ASC");

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter()
            .map(|p| p.as_ref() as &dyn rusqlite::ToSql)
            .collect();

        let mut stmt = conn.prepare(&query)?;
        let rows = stmt.query_map(params_refs.as_slice(), map_nilai)?;
        rows.collect()
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

// ==========================
// ROW MAPPING FUNCTIONS
// ==========================

fn map_nilai(row: &Row) -> SqlResult<Nilai> {
    Ok(Nilai {
        id: row.get(0)?,
        siswa_id: row.get(1)?,
        mapel_id: row.get(2)?,
        kelas: row.get(3)?,
        semester: row.get(4)?,
        tahun_ajaran: row.get(5)?,
        jenis: row.get(6)?,
        nilai: row.get(7)?,
        hadir: row.get(8).ok(),
        sakit: row.get(9).ok(),
        izin: row.get(10).ok(),
        alpa: row.get(11).ok(),
        tanggal_input: row.get(12).ok(),
        created_at: row.get(13)?,
        updated_at: row.get(14).ok(),
    })
}

fn map_nilai_with_details(row: &Row) -> SqlResult<NilaiWithDetails> {
    Ok(NilaiWithDetails {
        nilai: Nilai {
            id: row.get(0)?,
            siswa_id: row.get(1)?,
            mapel_id: row.get(2)?,
            kelas: row.get(3)?,
            semester: row.get(4)?,
            tahun_ajaran: row.get(5)?,
            jenis: row.get(6)?,
            nilai: row.get(7)?,
            hadir: row.get(8).ok(),
            sakit: row.get(9).ok(),
            izin: row.get(10).ok(),
            alpa: row.get(11).ok(),
            tanggal_input: row.get(12).ok(),
            created_at: row.get(13)?,
            updated_at: row.get(14).ok(),
        },
        nama_siswa: row.get(15)?,
        nis: row.get(16)?,
        nisn: row.get(17)?,
        nama_mapel: row.get(18)?,
        kkm: row.get(19)?,
    })
}

// ==========================
// PERHITUNGAN NILAI - PART 2
// ==========================

/// Hitung rata-rata per jenis nilai
pub fn hitung_rata_per_jenis(
    siswa_id: i64,
    mapel_id: i64,
    kelas: &str,
    semester: i32,
    tahun_ajaran: &str,
) -> SqlResult<HashMap<String, f64>> {
    validate_kelas_and_semester(kelas, semester)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare(
            "SELECT jenis, AVG(nilai) as rata
             FROM nilai
             WHERE siswa_id = ?1 AND mapel_id = ?2
               AND kelas = ?3 AND semester = ?4 AND tahun_ajaran = ?5
             GROUP BY jenis"
        )?;

        let rows = stmt.query_map(
            params![siswa_id, mapel_id, kelas, semester, tahun_ajaran],
            |row| {
                let jenis: String = row.get(0)?;
                let rata: f64 = row.get(1)?;
                Ok((jenis, rata))
            },
        )?;

        let mut result = HashMap::new();
        for row in rows {
            let (jenis, rata) = row?;
            result.insert(jenis, rata);
        }

        Ok(result)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Hitung nilai akademik semester (v5.1 - Kehadiran MASUK)
/// Formula: (Tugas × 25%) + (UTS × 25%) + (UAS × 35%) + (Kehadiran × 15%)
pub fn hitung_nilai_akademik_semester(rata_per_jenis: &HashMap<String, f64>) -> SqlResult<f64> {
    let bobot = get_bobot_jenis_nilai()?;
    
    debug!("=== DEBUG hitung_nilai_akademik_semester ===");
    debug!("rata_per_jenis: {:?}", rata_per_jenis);
    debug!("bobot: {:?}", bobot);

    let mut nilai_akademik = 0.0;
    let jenis_akademik = ["Tugas", "UTS", "UAS", "Kehadiran"];

    for jenis in &jenis_akademik {
        let nilai_jenis = rata_per_jenis.get(*jenis).copied().unwrap_or(0.0);
        if let Some(&bobot_jenis) = bobot.get(*jenis) {
            let kontribusi = nilai_jenis * bobot_jenis;
            debug!("{}: {} × {} = {}", jenis, nilai_jenis, bobot_jenis, kontribusi);
            nilai_akademik += kontribusi;
        }
    }

    debug!("TOTAL Nilai Akademik: {}", nilai_akademik);
    debug!("=========================================");

    Ok((nilai_akademik * 100.0).round() / 100.0)
}

/// Hitung komponen nilai semester lengkap
pub fn hitung_komponen_nilai_semester(
    siswa_id: i64,
    mapel_id: i64,
    kelas: &str,
    semester: i32,
    tahun_ajaran: &str,
) -> SqlResult<KomponenNilaiSemester> {
    validate_kelas_and_semester(kelas, semester)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let mut rata_per_jenis = hitung_rata_per_jenis(siswa_id, mapel_id, kelas, semester, tahun_ajaran)?;

    // ✅ PENTING: Ambil nilai kehadiran dari tabel nilai
    if let Some(kehadiran) = get_kehadiran(siswa_id, kelas, semester, tahun_ajaran)? {
        if kehadiran.nilai > 0.0 {
            rata_per_jenis.insert("Kehadiran".to_string(), kehadiran.nilai);
        }
    }

    let nilai_akademik = hitung_nilai_akademik_semester(&rata_per_jenis)?;
    let predikat = tentukan_predikat(nilai_akademik)?;

    // Get KKM dari mapel
    let kkm = get_kkm_mapel(mapel_id)?;
    let status = tentukan_status(nilai_akademik, kkm);

    Ok(KomponenNilaiSemester {
        kelas: kelas.to_string(),
        semester,
        tahun_ajaran: tahun_ajaran.to_string(),
        rata_per_jenis,
        nilai_akademik,
        predikat_akademik: predikat,
        kkm,
        status,
    })
}

/// Helper: Get KKM dari mapel
fn get_kkm_mapel(mapel_id: i64) -> SqlResult<i32> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let kkm: i32 = conn.query_row(
            "SELECT kkm FROM mapel WHERE id = ?1",
            params![mapel_id],
            |row| row.get(0),
        ).unwrap_or(70);
        Ok(kkm)
    } else {
        Ok(70)
    }
}

/// Hitung akumulasi nilai 6 semester
pub fn hitung_akumulasi_nilai(siswa_id: i64, mapel_id: i64) -> SqlResult<AkumulasiNilai> {
    let semester_list = vec![
        ("4", 1), ("4", 2),
        ("5", 1), ("5", 2),
        ("6", 1), ("6", 2),
    ];

    let mut nilai_per_semester = Vec::new();
    let mut total_nilai = 0.0;
    let mut jumlah_semester = 0;

    // Get kelas siswa saat ini
    let siswa_kelas = get_siswa_kelas(siswa_id)?;

    for (tingkat_str, semester) in semester_list {
        let tingkat_siswa = extract_tingkat_kelas(&siswa_kelas)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
        let tingkat_target: i32 = tingkat_str.parse().unwrap();

        if tingkat_siswa != tingkat_target {
            continue;
        }

        // Cari tahun ajaran untuk semester ini
        if let Some(tahun_ajaran) = get_tahun_ajaran_for_semester(siswa_id, mapel_id, tingkat_str, semester)? {
            match hitung_komponen_nilai_semester(siswa_id, mapel_id, &siswa_kelas, semester, &tahun_ajaran) {
                Ok(komponen_nilai) => {
                    nilai_per_semester.push(NilaiPerSemester {
                        kelas: siswa_kelas.clone(),
                        semester,
                        tahun_ajaran: tahun_ajaran.clone(),
                        nilai_akademik: komponen_nilai.nilai_akademik,
                    });

                    total_nilai += komponen_nilai.nilai_akademik;
                    jumlah_semester += 1;
                }
                Err(e) => {
                    debug!("Skip semester {}-{}: {}", tingkat_str, semester, e);
                }
            }
        }
    }

    let rata_akumulasi = if jumlah_semester > 0 {
        (total_nilai / jumlah_semester as f64 * 100.0).round() / 100.0
    } else {
        0.0
    };

    Ok(AkumulasiNilai {
        nilai_per_semester,
        jumlah_semester,
        rata_akumulasi,
    })
}

/// Helper: Get kelas siswa
fn get_siswa_kelas(siswa_id: i64) -> SqlResult<String> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        conn.query_row(
            "SELECT kelas FROM siswa WHERE id = ?1",
            params![siswa_id],
            |row| row.get(0),
        )
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Helper: Get tahun ajaran untuk semester tertentu
fn get_tahun_ajaran_for_semester(
    siswa_id: i64,
    mapel_id: i64,
    kelas_pattern: &str,
    semester: i32,
) -> SqlResult<Option<String>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let pattern = format!("{}%", kelas_pattern);
        let result = conn.query_row(
            "SELECT DISTINCT tahun_ajaran 
             FROM nilai 
             WHERE siswa_id = ?1 AND mapel_id = ?2
               AND kelas LIKE ?3 AND semester = ?4
             LIMIT 1",
            params![siswa_id, mapel_id, pattern, semester],
            |row| row.get(0),
        );

        match result {
            Ok(ta) => Ok(Some(ta)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Hitung nilai akhir kelulusan
/// Formula: (Rata 6 Semester × 60%) + (Ujian Sekolah × 40%)
pub fn hitung_nilai_akhir_kelulusan(siswa_id: i64, mapel_id: i64) -> SqlResult<NilaiAkhirKelulusan> {
    let akumulasi = hitung_akumulasi_nilai(siswa_id, mapel_id)?;

    // Get nilai Ujian Sekolah
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    let nilai_ujian_sekolah = if let Some(ref conn) = *db_lock {
        let result: Result<Vec<f64>, _> = conn
            .prepare(
                "SELECT nilai FROM nilai
                 WHERE siswa_id = ?1 AND mapel_id = ?2
                   AND kelas LIKE '6%' AND semester = 2 AND jenis = 'Ujian Sekolah'"
            )?
            .query_map(params![siswa_id, mapel_id], |row| row.get(0))?
            .collect();

        match result {
            Ok(nilai_list) if !nilai_list.is_empty() => {
                let total: f64 = nilai_list.iter().sum();
                total / nilai_list.len() as f64
            }
            _ => 0.0,
        }
    } else {
        0.0
    };

    let nilai_akhir = (akumulasi.rata_akumulasi * BOBOT_AKUMULASI_SEMESTER) 
                    + (nilai_ujian_sekolah * BOBOT_UJIAN_SEKOLAH_KELULUSAN);
    let nilai_akhir_rounded = (nilai_akhir * 100.0).round() / 100.0;

    let predikat = tentukan_predikat(nilai_akhir_rounded)?;
    let kkm = get_kkm_mapel(mapel_id)?;
    let status_kelulusan = if nilai_akhir_rounded >= kkm as f64 {
        "LULUS".to_string()
    } else {
        "TIDAK LULUS".to_string()
    };

    Ok(NilaiAkhirKelulusan {
        akumulasi_6_semester: akumulasi,
        nilai_ujian_sekolah,
        bobot_akumulasi: BOBOT_AKUMULASI_SEMESTER,
        bobot_ujian_sekolah: BOBOT_UJIAN_SEKOLAH_KELULUSAN,
        nilai_akhir: nilai_akhir_rounded,
        predikat,
        kkm,
        status_kelulusan,
    })
}

// ==========================
// KEHADIRAN MANAGEMENT (v5.1)
// ==========================

/// Save kehadiran dengan auto-calculate nilai
/// Save kehadiran dengan auto-calculate nilai
pub fn save_kehadiran(
    siswa_id: i64,
    kelas: &str,
    semester: i32,
    tahun_ajaran: &str,
    hadir: i32,
    sakit: i32,
    izin: i32,
    alpa: i32,
) -> SqlResult<KehadiranData> {
    validate_kelas_and_semester(kelas, semester)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    // Validasi nilai tidak negatif
    if hadir < 0 || sakit < 0 || izin < 0 || alpa < 0 {
        return Err(rusqlite::Error::InvalidParameterName(
            "Nilai kehadiran tidak boleh negatif".to_string()
        ));
    }

    let total_pertemuan = hadir + sakit + izin + alpa;
    if total_pertemuan == 0 {
        return Err(rusqlite::Error::InvalidParameterName(
            "Total pertemuan tidak boleh 0. Minimal ada 1 data kehadiran.".to_string()
        ));
    }

    // Hitung nilai kehadiran (0-100)
    let nilai_kehadiran = ((hadir as f64 / total_pertemuan as f64) * 10000.0).round() / 100.0;

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        // ✅ FIXED: Cek dengan mapel_id IS NULL
        let existing: Option<i64> = conn.query_row(
            "SELECT id FROM nilai
             WHERE siswa_id = ?1 AND mapel_id IS NULL 
               AND kelas = ?2 AND semester = ?3 
               AND tahun_ajaran = ?4 AND jenis = 'Kehadiran'",
            params![siswa_id, kelas, semester, tahun_ajaran],
            |row| row.get(0),
        ).ok();

        let result_id = if let Some(id) = existing {
            // Update existing
            conn.execute(
                "UPDATE nilai 
                 SET nilai = ?1, hadir = ?2, sakit = ?3, izin = ?4, alpa = ?5,
                     updated_at = datetime('now','localtime')
                 WHERE id = ?6",
                params![nilai_kehadiran, hadir, sakit, izin, alpa, id],
            )?;

            info!("Update kehadiran berhasil (v5.1): id={}, siswa_id={}, nilai={}", 
                  id, siswa_id, nilai_kehadiran);
            id
        } else {
            // ✅ FIXED: Insert dengan mapel_id = NULL
            conn.execute(
                "INSERT INTO nilai (siswa_id, mapel_id, kelas, semester, tahun_ajaran, 
                                   jenis, nilai, hadir, sakit, izin, alpa)
                 VALUES (?1, NULL, ?2, ?3, ?4, 'Kehadiran', ?5, ?6, ?7, ?8, ?9)",
                params![siswa_id, kelas, semester, tahun_ajaran,
                       nilai_kehadiran, hadir, sakit, izin, alpa],
            )?;

            let id = conn.last_insert_rowid();
            info!("Tambah kehadiran berhasil (v5.1): id={}, siswa_id={}, nilai={}", 
                  id, siswa_id, nilai_kehadiran);
            id
        };

        Ok(KehadiranData {
            id: Some(result_id),
            nilai: nilai_kehadiran,
            breakdown: KehadiranBreakdown {
                hadir,
                sakit,
                izin,
                alpa,
                total: total_pertemuan,
            },
        })
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Get kehadiran siswa
/// Get kehadiran siswa
pub fn get_kehadiran(
    siswa_id: i64,
    kelas: &str,
    semester: i32,
    tahun_ajaran: &str,
) -> SqlResult<Option<KehadiranData>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        // ✅ FIXED: Filter dengan mapel_id IS NULL
        let result = conn.query_row(
            "SELECT id, nilai, hadir, sakit, izin, alpa
             FROM nilai
             WHERE siswa_id = ?1 AND mapel_id IS NULL 
               AND kelas = ?2 AND semester = ?3 
               AND tahun_ajaran = ?4 AND jenis = 'Kehadiran'",
            params![siswa_id, kelas, semester, tahun_ajaran],
            |row| {
                let hadir: i32 = row.get(2).unwrap_or(0);
                let sakit: i32 = row.get(3).unwrap_or(0);
                let izin: i32 = row.get(4).unwrap_or(0);
                let alpa: i32 = row.get(5).unwrap_or(0);

                Ok(KehadiranData {
                    id: Some(row.get(0)?),
                    nilai: row.get(1)?,
                    breakdown: KehadiranBreakdown {
                        hadir,
                        sakit,
                        izin,
                        alpa,
                        total: hadir + sakit + izin + alpa,
                    },
                })
            },
        );

        match result {
            Ok(data) => Ok(Some(data)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Delete kehadiran
pub fn delete_kehadiran(id: i64) -> SqlResult<bool> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        // ✅ FIXED: Tambah filter mapel_id IS NULL
        let changes = conn.execute(
            "DELETE FROM nilai WHERE id = ?1 AND mapel_id IS NULL AND jenis = 'Kehadiran'",
            params![id],
        )?;
        
        info!("Hapus kehadiran berhasil: id={}, changes={}", id, changes);
        Ok(changes > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

// ==========================
// KEHADIRAN ADDITIONAL FUNCTIONS
// ==========================

/// Update kehadiran yang sudah ada
pub fn update_kehadiran(
    id: i64,
    hadir: Option<i32>,
    sakit: Option<i32>,
    izin: Option<i32>,
    alpa: Option<i32>,
) -> SqlResult<KehadiranData> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        // Get data kehadiran yang ada
        let existing: (i32, i32, i32, i32) = conn.query_row(
            "SELECT hadir, sakit, izin, alpa FROM nilai 
             WHERE id = ?1 AND mapel_id IS NULL AND jenis = 'Kehadiran'",
            params![id],
            |row| Ok((
                row.get(0).unwrap_or(0),
                row.get(1).unwrap_or(0),
                row.get(2).unwrap_or(0),
                row.get(3).unwrap_or(0),
            )),
        )?;

        // Update dengan nilai baru atau gunakan yang lama
        let new_hadir = hadir.unwrap_or(existing.0);
        let new_sakit = sakit.unwrap_or(existing.1);
        let new_izin = izin.unwrap_or(existing.2);
        let new_alpa = alpa.unwrap_or(existing.3);

        // Validasi
        if new_hadir < 0 || new_sakit < 0 || new_izin < 0 || new_alpa < 0 {
            return Err(rusqlite::Error::InvalidParameterName(
                "Nilai kehadiran tidak boleh negatif".to_string()
            ));
        }

        let total_pertemuan = new_hadir + new_sakit + new_izin + new_alpa;
        if total_pertemuan == 0 {
            return Err(rusqlite::Error::InvalidParameterName(
                "Total pertemuan tidak boleh 0".to_string()
            ));
        }

        // Hitung ulang nilai kehadiran
        let nilai_kehadiran = ((new_hadir as f64 / total_pertemuan as f64) * 10000.0).round() / 100.0;

        // Update database
        conn.execute(
            "UPDATE nilai 
             SET nilai = ?1, hadir = ?2, sakit = ?3, izin = ?4, alpa = ?5,
                 updated_at = datetime('now','localtime')
             WHERE id = ?6",
            params![nilai_kehadiran, new_hadir, new_sakit, new_izin, new_alpa, id],
        )?;

        info!("Update kehadiran berhasil: id={}, nilai={}", id, nilai_kehadiran);

        Ok(KehadiranData {
            id: Some(id),
            nilai: nilai_kehadiran,
            breakdown: KehadiranBreakdown {
                hadir: new_hadir,
                sakit: new_sakit,
                izin: new_izin,
                alpa: new_alpa,
                total: total_pertemuan,
            },
        })
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Struct untuk kehadiran dengan detail siswa
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KehadiranWithSiswa {
    pub id: i64,
    pub siswa_id: i64,
    pub nama_siswa: String,
    pub nis: String,
    pub nisn: String, 
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
    pub nilai: f64,
    pub hadir: i32,
    pub sakit: i32,
    pub izin: i32,
    pub alpa: i32,
    pub total: i32,
}

/// Get kehadiran by kelas dan semester
pub fn get_kehadiran_by_kelas(
    kelas: &str,
    semester: i32,
    tahun_ajaran: &str,
) -> SqlResult<Vec<KehadiranWithSiswa>> {
    validate_kelas_and_semester(kelas, semester)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare(
            "SELECT n.id, n.siswa_id, s.nama, s.nis, s.nisn, n.kelas, n.semester, 
                    n.tahun_ajaran, n.nilai, n.hadir, n.sakit, n.izin, n.alpa
             FROM nilai n
             JOIN siswa s ON s.id = n.siswa_id
             WHERE n.mapel_id IS NULL AND n.jenis = 'Kehadiran'
               AND n.kelas = ?1 AND n.semester = ?2 AND n.tahun_ajaran = ?3
             ORDER BY s.nama ASC"
        )?;

        let rows = stmt.query_map(
            params![kelas, semester, tahun_ajaran],
            |row| {
            let hadir: i32 = row.get(9).unwrap_or(0);   
            let sakit: i32 = row.get(10).unwrap_or(0);
            let izin: i32 = row.get(11).unwrap_or(0);
            let alpa: i32 = row.get(12).unwrap_or(0);

                Ok(KehadiranWithSiswa {
                    id: row.get(0)?,
                    siswa_id: row.get(1)?,
                    nama_siswa: row.get(2)?,
                    nis: row.get(3)?,
                    nisn: row.get(4)?,
                    kelas: row.get(5)?,
                    semester: row.get(6)?,
                    tahun_ajaran: row.get(7)?,
                    nilai: row.get(8)?,
                    hadir,
                    sakit,
                    izin,
                    alpa,
                    total: hadir + sakit + izin + alpa,
                })
            },
        )?;

        let results: SqlResult<Vec<_>> = rows.collect();
        info!("Get kehadiran by kelas: kelas={}, semester={}, count={}", 
              kelas, semester, results.as_ref().map(|r| r.len()).unwrap_or(0));
        results
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Get semua kehadiran dengan optional filter
pub fn get_all_kehadiran(
    semester: Option<i32>,
    tahun_ajaran: Option<&str>,
) -> SqlResult<Vec<KehadiranWithSiswa>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut query = "SELECT n.id, n.siswa_id, s.nama, s.nis, s.nisn, n.kelas, n.semester, 
                                n.tahun_ajaran, n.nilai, n.hadir, n.sakit, n.izin, n.alpa
                         FROM nilai n
                         JOIN siswa s ON s.id = n.siswa_id
                         WHERE n.mapel_id IS NULL AND n.jenis = 'Kehadiran'".to_string();
        
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(sem) = semester {
            query.push_str(" AND n.semester = ?");
            params_vec.push(Box::new(sem));
        }

        if let Some(ta) = tahun_ajaran {
            query.push_str(" AND n.tahun_ajaran = ?");
            params_vec.push(Box::new(ta.to_string()));
        }

        query.push_str(" ORDER BY n.tahun_ajaran DESC, n.kelas ASC, n.semester ASC, s.nama ASC");

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter()
            .map(|p| p.as_ref() as &dyn rusqlite::ToSql)
            .collect();

        let mut stmt = conn.prepare(&query)?;
        let rows = stmt.query_map(params_refs.as_slice(), |row| {
            let hadir: i32 = row.get(9).unwrap_or(0);
            let sakit: i32 = row.get(10).unwrap_or(0);
            let izin: i32 = row.get(11).unwrap_or(0);
            let alpa: i32 = row.get(12).unwrap_or(0);

            Ok(KehadiranWithSiswa {
                id: row.get(0)?,
                siswa_id: row.get(1)?,
                nama_siswa: row.get(2)?,
                nis: row.get(3)?,
                nisn: row.get(4)?, 
                kelas: row.get(5)?,
                semester: row.get(6)?,
                tahun_ajaran: row.get(7)?,
                nilai: row.get(8)?,
                hadir,
                sakit,
                izin,
                alpa,
                total: hadir + sakit + izin + alpa,
            })
        })?;

        let results: SqlResult<Vec<_>> = rows.collect();
        info!("Get all kehadiran: count={}", results.as_ref().map(|r| r.len()).unwrap_or(0));
        results
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

// ==========================
// STATUS FUNCTIONS
// ==========================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusKenaikanKelas {
    pub siswa_id: i64,
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
    pub hasil_per_mapel: Vec<HasilMapel>,
    pub total_mapel: usize,
    pub jumlah_tuntas: usize,
    pub jumlah_belum_tuntas: usize,
    pub persen_tuntas: f64,
    pub status_naik_kelas: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HasilMapel {
    pub mapel_id: i64,
    pub nama_mapel: String,
    pub kkm: i32,
    pub nilai_akademik: f64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusKelulusan {
    pub siswa_id: i64,
    pub hasil_per_mapel: Vec<HasilMapelKelulusan>,
    pub total_mapel: usize,
    pub jumlah_lulus: usize,
    pub jumlah_tidak_lulus: usize,
    pub persen_lulus: f64,
    pub status_kelulusan: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HasilMapelKelulusan {
    pub mapel_id: i64,
    pub nama_mapel: String,
    pub kkm: i32,
    pub nilai_akhir: f64,
    pub predikat: String,
    pub status: String,
}

/// Cek kenaikan kelas siswa
pub fn cek_kenaikan_kelas(
    siswa_id: i64,
    kelas: &str,
    semester: i32,
    tahun_ajaran: &str,
) -> SqlResult<StatusKenaikanKelas> {
    validate_kelas_and_semester(kelas, semester)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let mapel_list = get_all_mapel()?;
    let mut hasil_per_mapel = Vec::new();
    let mut jumlah_tuntas = 0;
    let mut jumlah_belum_tuntas = 0;

    for mapel in &mapel_list {
        match hitung_komponen_nilai_semester(siswa_id, mapel.id, kelas, semester, tahun_ajaran) {
            Ok(komponen) => {
                if komponen.status == "Tuntas" {
                    jumlah_tuntas += 1;
                } else {
                    jumlah_belum_tuntas += 1;
                }

                hasil_per_mapel.push(HasilMapel {
                    mapel_id: mapel.id,
                    nama_mapel: mapel.nama.clone(),
                    kkm: komponen.kkm,
                    nilai_akademik: komponen.nilai_akademik,
                    status: komponen.status.clone(),
                });
            }
            Err(e) => {
                debug!("Skip mapel {}: {}", mapel.nama, e);
            }
        }
    }

    let total_mapel = mapel_list.len();
    let persen_tuntas = if total_mapel > 0 {
        ((jumlah_tuntas as f64 / total_mapel as f64) * 100.0).round()
    } else {
        0.0
    };

    let status_naik_kelas = if persen_tuntas >= 75.0 {
        "NAIK KELAS".to_string()
    } else {
        "TIDAK NAIK KELAS".to_string()
    };

    Ok(StatusKenaikanKelas {
        siswa_id,
        kelas: kelas.to_string(),
        semester,
        tahun_ajaran: tahun_ajaran.to_string(),
        hasil_per_mapel,
        total_mapel,
        jumlah_tuntas,
        jumlah_belum_tuntas,
        persen_tuntas,
        status_naik_kelas,
    })
}

/// Cek kelulusan siswa (Kelas 6)
pub fn cek_kelulusan(siswa_id: i64) -> SqlResult<StatusKelulusan> {
    let mapel_list = get_all_mapel()?;
    let mut hasil_per_mapel = Vec::new();
    let mut jumlah_lulus = 0;
    let mut jumlah_tidak_lulus = 0;

    for mapel in &mapel_list {
        match hitung_nilai_akhir_kelulusan(siswa_id, mapel.id) {
            Ok(nilai_akhir) => {
                if nilai_akhir.status_kelulusan == "LULUS" {
                    jumlah_lulus += 1;
                } else {
                    jumlah_tidak_lulus += 1;
                }

                hasil_per_mapel.push(HasilMapelKelulusan {
                    mapel_id: mapel.id,
                    nama_mapel: mapel.nama.clone(),
                    kkm: nilai_akhir.kkm,
                    nilai_akhir: nilai_akhir.nilai_akhir,
                    predikat: nilai_akhir.predikat.clone(),
                    status: nilai_akhir.status_kelulusan.clone(),
                });
            }
            Err(e) => {
                debug!("Skip mapel {}: {}", mapel.nama, e);
            }
        }
    }

    let total_mapel = mapel_list.len();
    let persen_lulus = if total_mapel > 0 {
        ((jumlah_lulus as f64 / total_mapel as f64) * 100.0).round()
    } else {
        0.0
    };

    let status_kelulusan = if jumlah_tidak_lulus == 0 && jumlah_lulus > 0 {
        "LULUS".to_string()
    } else {
        "TIDAK LULUS".to_string()
    };

    Ok(StatusKelulusan {
        siswa_id,
        hasil_per_mapel,
        total_mapel,
        jumlah_lulus,
        jumlah_tidak_lulus,
        persen_lulus,
        status_kelulusan,
    })
}

/// Helper: Get all mapel (simplified struct)
#[derive(Debug, Clone)]
struct MapelSimple {
    id: i64,
    nama: String,
}

fn get_all_mapel() -> SqlResult<Vec<MapelSimple>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare("SELECT id, nama_mapel FROM mapel")?;
        let rows = stmt.query_map([], |row| {
            Ok(MapelSimple {
                id: row.get(0)?,
                nama: row.get(1)?,
            })
        })?;
        rows.collect()
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}
