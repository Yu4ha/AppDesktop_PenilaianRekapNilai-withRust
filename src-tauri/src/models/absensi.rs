/**
 * models/absensi.rs
 * --------------------------------------------------------
 * Data Model untuk Absensi Siswa
 * 
 * Status Absensi:
 * - H (Hadir)
 * - S (Sakit)
 * - I (Izin)
 * - A (Alpa/Tanpa Keterangan)
 * 
 * Converted from: core/absensiModel.js
 * --------------------------------------------------------
 */

use rusqlite::{params, Result as SqlResult, Row};
use serde::{Deserialize, Serialize};
use log::{info, warn, error, debug};

use crate::database;

// ==========================
// CONSTANTS
// ==========================

const VALID_STATUS: [&str; 4] = ["H", "S", "I", "A"];

// ==========================
// STRUCTS & TYPES
// ==========================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Absensi {
    pub id: i64,
    pub siswa_id: i64,
    pub tanggal: String,
    pub status: String,
    pub keterangan: Option<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbsensiWithSiswa {
    #[serde(flatten)]
    pub absensi: Absensi,
    pub nama_siswa: String,
    pub nis: String,
    pub nisn: String,
    pub kelas: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikAbsensi {
    pub hadir: i32,
    pub sakit: i32,
    pub izin: i32,
    pub alpa: i32,
    pub total_pertemuan: i32,
    pub persentase_hadir: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaporanAbsensiHarian {
    pub siswa_id: i64,
    pub nama: String,
    pub nis: String,
    pub kelas: String,
    pub status: Option<String>,
    pub status_name: String,
    pub keterangan: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RekapAbsensiSiswa {
    pub siswa_id: i64,
    pub nama: String,
    pub nis: String,
    pub kelas: String,
    pub hadir: i32,
    pub sakit: i32,
    pub izin: i32,
    pub alpa: i32,
    pub total_pertemuan: i32,
    pub persentase_hadir: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddOrUpdateResult {
    pub id: i64,
    pub action: String, // "insert" or "update"
}

// ==========================
// VALIDASI & UTILITY
// ==========================

/// Validasi status absensi
pub fn validate_status(status: &str) -> Result<(), String> {
    if !VALID_STATUS.contains(&status) {
        return Err(format!(
            "Status '{}' tidak valid. Status yang tersedia: {}",
            status,
            VALID_STATUS.join(", ")
        ));
    }
    Ok(())
}

/// Validasi format tanggal (YYYY-MM-DD)
pub fn validate_tanggal(tanggal: &str) -> Result<(), String> {
    let re = regex::Regex::new(r"^\d{4}-\d{2}-\d{2}$").unwrap();
    if !re.is_match(tanggal) {
        return Err("Format tanggal harus YYYY-MM-DD".to_string());
    }
    Ok(())
}

/// Get nama lengkap status absensi
pub fn get_status_name(status: &str) -> String {
    match status {
        "H" => "Hadir".to_string(),
        "S" => "Sakit".to_string(),
        "I" => "Izin".to_string(),
        "A" => "Alpa".to_string(),
        _ => status.to_string(),
    }
}

// ==========================
// CRUD FUNCTIONS
// ==========================

/// Tambah/Update absensi siswa
/// Jika sudah ada absensi di tanggal yang sama, akan diupdate
pub fn add_or_update_absensi(
    siswa_id: i64,
    tanggal: &str,
    status: &str,
    keterangan: Option<&str>,
) -> SqlResult<AddOrUpdateResult> {
    // Validasi input
    validate_tanggal(tanggal)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
    validate_status(status)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let status_upper = status.to_uppercase();

    // Cek siswa exists (simplified check)
    if !siswa_exists(siswa_id)? {
        return Err(rusqlite::Error::InvalidParameterName(
            format!("Siswa dengan ID {} tidak ditemukan", siswa_id)
        ));
    }

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        // Cek apakah sudah ada absensi di tanggal tersebut
        let existing: Option<i64> = conn.query_row(
            "SELECT id FROM absensi WHERE siswa_id = ?1 AND tanggal = ?2",
            params![siswa_id, tanggal],
            |row| row.get(0),
        ).ok();

        let result = if let Some(id) = existing {
            // Update existing
            conn.execute(
                "UPDATE absensi 
                 SET status = ?1, keterangan = ?2, updated_at = datetime('now','localtime')
                 WHERE id = ?3",
                params![status_upper, keterangan, id],
            )?;

            info!("Update absensi berhasil: id={}, siswa_id={}, tanggal={}, status={}", 
                  id, siswa_id, tanggal, status_upper);

            AddOrUpdateResult {
                id,
                action: "update".to_string(),
            }
        } else {
            // Insert new
            conn.execute(
                "INSERT INTO absensi (siswa_id, tanggal, status, keterangan)
                 VALUES (?1, ?2, ?3, ?4)",
                params![siswa_id, tanggal, status_upper, keterangan],
            )?;

            let id = conn.last_insert_rowid();
            info!("Tambah absensi berhasil: id={}, siswa_id={}, tanggal={}, status={}", 
                  id, siswa_id, tanggal, status_upper);

            AddOrUpdateResult {
                id,
                action: "insert".to_string(),
            }
        };

        Ok(result)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Hapus absensi berdasarkan ID
pub fn delete_absensi(id: i64) -> SqlResult<bool> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let changes = conn.execute("DELETE FROM absensi WHERE id = ?1", params![id])?;
        info!("Hapus absensi berhasil: id={}, changes={}", id, changes);
        Ok(changes > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Ambil semua absensi dengan join siswa
pub fn get_all_absensi() -> SqlResult<Vec<AbsensiWithSiswa>> {
    database::query_all(
        "SELECT 
            a.id, a.siswa_id, a.tanggal, a.status, a.keterangan, a.created_at, a.updated_at,
            s.nama AS nama_siswa, s.nis, s.nisn, s.kelas
         FROM absensi a
         JOIN siswa s ON s.id = a.siswa_id
         ORDER BY a.tanggal DESC, s.nama ASC",
        &[],
        map_absensi_with_siswa,
    )
}

/// Ambil absensi berdasarkan ID
pub fn get_absensi_by_id(id: i64) -> SqlResult<Option<AbsensiWithSiswa>> {
    database::query_one(
        "SELECT 
            a.id, a.siswa_id, a.tanggal, a.status, a.keterangan, a.created_at, a.updated_at,
            s.nama AS nama_siswa, s.nis, s.nisn, s.kelas
         FROM absensi a
         JOIN siswa s ON s.id = a.siswa_id
         WHERE a.id = ?1",
        &[&id],
        map_absensi_with_siswa,
    )
}

/// Ambil absensi siswa tertentu dengan filter tanggal
pub fn get_absensi_by_siswa(
    siswa_id: i64,
    dari_tanggal: Option<&str>,
    sampai_tanggal: Option<&str>,
) -> SqlResult<Vec<Absensi>> {
    // Validasi tanggal jika ada
    if let Some(dari) = dari_tanggal {
        validate_tanggal(dari)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
    }
    if let Some(sampai) = sampai_tanggal {
        validate_tanggal(sampai)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
    }

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut query = "SELECT a.* FROM absensi a WHERE a.siswa_id = ?1".to_string();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(siswa_id)];

        if let Some(dari) = dari_tanggal {
            query.push_str(" AND a.tanggal >= ?");
            params_vec.push(Box::new(dari.to_string()));
        }

        if let Some(sampai) = sampai_tanggal {
            query.push_str(" AND a.tanggal <= ?");
            params_vec.push(Box::new(sampai.to_string()));
        }

        query.push_str(" ORDER BY a.tanggal DESC");

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter()
            .map(|p| p.as_ref() as &dyn rusqlite::ToSql)
            .collect();

        let mut stmt = conn.prepare(&query)?;
        let rows = stmt.query_map(params_refs.as_slice(), map_absensi)?;
        
        let results: SqlResult<Vec<_>> = rows.collect();
        debug!("Get absensi by siswa: siswa_id={}, count={}", siswa_id, results.as_ref().map(|r| r.len()).unwrap_or(0));
        results
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Ambil absensi berdasarkan tanggal
pub fn get_absensi_by_tanggal(tanggal: &str) -> SqlResult<Vec<AbsensiWithSiswa>> {
    validate_tanggal(tanggal)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    database::query_all(
        "SELECT 
            a.id, a.siswa_id, a.tanggal, a.status, a.keterangan, a.created_at, a.updated_at,
            s.nama AS nama_siswa, s.nis, s.nisn, s.kelas
         FROM absensi a
         JOIN siswa s ON s.id = a.siswa_id
         WHERE a.tanggal = ?1
         ORDER BY s.nama ASC",
        &[&tanggal],
        map_absensi_with_siswa,
    )
}

// ==========================
// STATISTIK & LAPORAN
// ==========================

/// 🆕 FUNGSI UTAMA untuk nilaiModel
/// Hitung statistik absensi siswa
pub fn get_statistik_absensi_siswa(
    siswa_id: i64,
    dari_tanggal: Option<&str>,
    sampai_tanggal: Option<&str>,
) -> SqlResult<StatistikAbsensi> {
    // Validasi tanggal jika ada
    if let Some(dari) = dari_tanggal {
        validate_tanggal(dari)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
    }
    if let Some(sampai) = sampai_tanggal {
        validate_tanggal(sampai)
            .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
    }

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut query = "
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'H' THEN 1 ELSE 0 END) as hadir,
                SUM(CASE WHEN status = 'S' THEN 1 ELSE 0 END) as sakit,
                SUM(CASE WHEN status = 'I' THEN 1 ELSE 0 END) as izin,
                SUM(CASE WHEN status = 'A' THEN 1 ELSE 0 END) as alpa
            FROM absensi
            WHERE siswa_id = ?1
        ".to_string();

        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(siswa_id)];

        if let Some(dari) = dari_tanggal {
            query.push_str(" AND tanggal >= ?");
            params_vec.push(Box::new(dari.to_string()));
        }

        if let Some(sampai) = sampai_tanggal {
            query.push_str(" AND tanggal <= ?");
            params_vec.push(Box::new(sampai.to_string()));
        }

        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter()
            .map(|p| p.as_ref() as &dyn rusqlite::ToSql)
            .collect();

        let result = conn.query_row(&query, params_refs.as_slice(), |row| {
            let total: i32 = row.get(0).unwrap_or(0);
            let hadir: i32 = row.get(1).unwrap_or(0);
            let sakit: i32 = row.get(2).unwrap_or(0);
            let izin: i32 = row.get(3).unwrap_or(0);
            let alpa: i32 = row.get(4).unwrap_or(0);

            let persentase_hadir = if total > 0 {
                ((hadir as f64 / total as f64) * 10000.0).round() / 100.0
            } else {
                0.0
            };

            Ok(StatistikAbsensi {
                hadir,
                sakit,
                izin,
                alpa,
                total_pertemuan: total,
                persentase_hadir,
            })
        });

        match result {
            Ok(stats) => {
                debug!("Statistik absensi siswa: siswa_id={}, total={}", siswa_id, stats.total_pertemuan);
                Ok(stats)
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                debug!("Tidak ada data absensi untuk siswa_id={}", siswa_id);
                Ok(StatistikAbsensi {
                    hadir: 0,
                    sakit: 0,
                    izin: 0,
                    alpa: 0,
                    total_pertemuan: 0,
                    persentase_hadir: 0.0,
                })
            }
            Err(e) => Err(e),
        }
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Ambil laporan absensi semua siswa di tanggal tertentu
pub fn get_laporan_absensi_harian(tanggal: &str) -> SqlResult<Vec<LaporanAbsensiHarian>> {
    validate_tanggal(tanggal)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let siswa_list = get_all_siswa_simple()?;
    let absensi_data = get_absensi_by_tanggal(tanggal)?;

    let mut laporan = Vec::new();

    for siswa in siswa_list {
        let absensi = absensi_data.iter().find(|a| a.absensi.siswa_id == siswa.id);

        let (status, status_name, keterangan) = if let Some(a) = absensi {
            (
                Some(a.absensi.status.clone()),
                get_status_name(&a.absensi.status),
                a.absensi.keterangan.clone(),
            )
        } else {
            (None, "Belum diisi".to_string(), None)
        };

        laporan.push(LaporanAbsensiHarian {
            siswa_id: siswa.id,
            nama: siswa.nama,
            nis: siswa.nis,
            kelas: siswa.kelas,
            status,
            status_name,
            keterangan,
        });
    }

    info!("Generate laporan absensi harian: tanggal={}, total_siswa={}", tanggal, laporan.len());
    Ok(laporan)
}

/// Ambil rekap absensi semua siswa dalam periode tertentu
pub fn get_rekap_absensi_semua(
    dari_tanggal: Option<&str>,
    sampai_tanggal: Option<&str>,
) -> SqlResult<Vec<RekapAbsensiSiswa>> {
    let siswa_list = get_all_siswa_simple()?;
    let mut rekap = Vec::new();

    for siswa in siswa_list {
        let stats = get_statistik_absensi_siswa(siswa.id, dari_tanggal, sampai_tanggal)?;

        rekap.push(RekapAbsensiSiswa {
            siswa_id: siswa.id,
            nama: siswa.nama,
            nis: siswa.nis,
            kelas: siswa.kelas,
            hadir: stats.hadir,
            sakit: stats.sakit,
            izin: stats.izin,
            alpa: stats.alpa,
            total_pertemuan: stats.total_pertemuan,
            persentase_hadir: stats.persentase_hadir,
        });
    }

    info!("Generate rekap absensi semua siswa: total={}", rekap.len());
    Ok(rekap)
}

// ==========================
// HELPER FUNCTIONS
// ==========================

#[derive(Debug, Clone)]
struct SiswaSimple {
    id: i64,
    nama: String,
    nis: String,
    kelas: String,
}

fn siswa_exists(siswa_id: i64) -> SqlResult<bool> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM siswa WHERE id = ?1",
            params![siswa_id],
            |row| row.get(0),
        )?;
        Ok(count > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

fn get_all_siswa_simple() -> SqlResult<Vec<SiswaSimple>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare("SELECT id, nama, nis, kelas FROM siswa")?;
        let rows = stmt.query_map([], |row| {
            Ok(SiswaSimple {
                id: row.get(0)?,
                nama: row.get(1)?,
                nis: row.get(2)?,
                kelas: row.get(3)?,
            })
        })?;
        rows.collect()
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

// ==========================
// ROW MAPPING FUNCTIONS
// ==========================

fn map_absensi(row: &Row) -> SqlResult<Absensi> {
    Ok(Absensi {
        id: row.get(0)?,
        siswa_id: row.get(1)?,
        tanggal: row.get(2)?,
        status: row.get(3)?,
        keterangan: row.get(4).ok(),
        created_at: row.get(5)?,
        updated_at: row.get(6).ok(),
    })
}

fn map_absensi_with_siswa(row: &Row) -> SqlResult<AbsensiWithSiswa> {
    Ok(AbsensiWithSiswa {
        absensi: Absensi {
            id: row.get(0)?,
            siswa_id: row.get(1)?,
            tanggal: row.get(2)?,
            status: row.get(3)?,
            keterangan: row.get(4).ok(),
            created_at: row.get(5)?,
            updated_at: row.get(6).ok(),
        },
        nama_siswa: row.get(7)?,
        nis: row.get(8)?,
        nisn: row.get(9)?,
        kelas: row.get(10)?,
    })
}
