/**
 * models/siswa.rs (v6.1 - Converted from siswaModel.js)
 * =============================================================
 * Model CRUD untuk data siswa SD Kelas 4-6
 * 
 * FITUR v6.1:
 * ✅ Field kelas: TEXT (support "4A", "4B", "5A", dst)
 * ✅ Data Orang Tua (Ayah & Ibu) lengkap
 * ✅ Data Wali lengkap
 * ✅ Validasi email dan nomor telepon
 * ✅ Security: SQL Injection Protection
 * =============================================================
 */

use rusqlite::{params, Result as SqlResult, Row};
use serde::{Deserialize, Serialize};
use log::{info, warn, error, debug};

use crate::database;

// ==========================
// CONSTANTS
// ==========================

const KELAS_TINGKAT_VALID: [i32; 3] = [4, 5, 6]; // SD Kelas 4-6
const JENIS_KELAMIN_VALID: [&str; 2] = ["L", "P"];

// ==========================
// STRUCTS
// ==========================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Siswa {
    pub id: i64,
    pub nis: String,
    pub nisn: String,
    pub nama: String,
    pub kelas: String,
    pub jenis_kelamin: String,
    
    // Data Orang Tua
    pub nama_ayah: String,
    pub nama_ibu: String,
    pub alamat_ortu: String,
    pub kontak_ortu: String,
    pub email_ortu: String,
    pub pekerjaan_ayah: String,
    pub pekerjaan_ibu: String,
    
    // Data Wali
    pub nama_wali: String,
    pub alamat_wali: String,
    pub kontak_wali: String,
    pub email_wali: String,
    pub pekerjaan_wali: String,
    
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiswaInput {
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikSiswa {
    pub kelas: Option<String>,
    pub tingkat: Option<i32>,
    pub total_siswa: i32,
    pub laki_laki: i32,
    pub perempuan: i32,
}

// ==========================
// VALIDATION FUNCTIONS
// ==========================

/// Validasi kelas siswa (TEXT format: "4A", "5B", dst)
pub fn validate_kelas(kelas: &str) -> Result<String, String> {
    if kelas.trim().is_empty() {
        return Err("Kelas tidak boleh kosong".to_string());
    }

    let kelas_str = kelas.trim().to_uppercase();
    
    // Ekstrak angka tingkat kelas
    let tingkat_char = kelas_str.chars().next()
        .ok_or_else(|| "Kelas tidak valid".to_string())?;
    
    let tingkat = tingkat_char.to_digit(10)
        .ok_or_else(|| "Kelas harus dimulai dengan angka 4, 5, atau 6".to_string())? as i32;
    
    if !KELAS_TINGKAT_VALID.contains(&tingkat) {
        return Err("Tingkat kelas harus 4, 5, atau 6 (SD tingkat atas)".to_string());
    }
    
    // Validasi format: angka + optional huruf
    if !kelas_str.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c.is_whitespace()) {
        return Err("Format kelas tidak valid. Contoh valid: \"4\", \"4A\", \"5B\"".to_string());
    }
    
    // Normalize: hapus spasi/dash
    let kelas_normalized = kelas_str.replace(&[' ', '-'][..], "");
    
    Ok(kelas_normalized)
}

/// Extract tingkat dari kelas
pub fn extract_tingkat_kelas(kelas: &str) -> Result<i32, String> {
    let tingkat_char = kelas.chars().next()
        .ok_or_else(|| "Kelas tidak valid".to_string())?;
    
    tingkat_char.to_digit(10)
        .map(|d| d as i32)
        .ok_or_else(|| format!("Tingkat kelas '{}' tidak valid", kelas))
}

/// Validasi jenis kelamin
pub fn validate_jenis_kelamin(jk: &str) -> Result<String, String> {
    let jk_upper = jk.trim().to_uppercase();
    
    if !JENIS_KELAMIN_VALID.contains(&jk_upper.as_str()) {
        return Err("Jenis kelamin harus 'L' (Laki-laki) atau 'P' (Perempuan)".to_string());
    }
    
    Ok(jk_upper)
}

/// Validasi format email
pub fn is_valid_email(email: &str) -> bool {
    if email.trim().is_empty() {
        return true; // Email opsional
    }
    
    let email_regex = regex::Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
    email_regex.is_match(email.trim())
}

/// Validasi format nomor telepon
pub fn is_valid_phone(phone: &str) -> bool {
    if phone.trim().is_empty() {
        return true; // Phone opsional
    }
    
    let phone_regex = regex::Regex::new(r"^[0-9+\-\s()]{10,15}$").unwrap();
    phone_regex.is_match(phone.trim())
}

/// Validasi data siswa lengkap
pub fn validate_siswa_data(input: &SiswaInput) -> Result<(), String> {
    // Validasi NIS (maksimal 11 digit)
    let nis_str = input.nis.trim();
    if nis_str.is_empty() {
        return Err("NIS tidak boleh kosong".to_string());
    }
    if !nis_str.chars().all(|c| c.is_ascii_digit()) || nis_str.len() > 11 {
        return Err("NIS harus berupa angka maksimal 11 digit".to_string());
    }

    // Validasi NISN (maksimal 11 digit, opsional)
    if let Some(nisn) = &input.nisn {
        let nisn_str = nisn.trim();
        if !nisn_str.is_empty() {
            if !nisn_str.chars().all(|c| c.is_ascii_digit()) || nisn_str.len() > 11 {
                return Err("NISN harus berupa angka maksimal 11 digit".to_string());
            }
        }
    }

    // Validasi nama
    let nama = input.nama.trim();
    if nama.is_empty() {
        return Err("Nama siswa tidak boleh kosong".to_string());
    }
    if nama.len() < 3 {
        return Err("Nama siswa minimal 3 karakter".to_string());
    }
    if nama.len() > 100 {
        return Err("Nama siswa maksimal 100 karakter".to_string());
    }

    // Validasi kelas
    validate_kelas(&input.kelas)?;

    // Validasi jenis kelamin
    validate_jenis_kelamin(&input.jenis_kelamin)?;

    // Validasi email orang tua
    if let Some(email) = &input.email_ortu {
        if !is_valid_email(email) {
            return Err("Format email orang tua tidak valid".to_string());
        }
    }

    // Validasi email wali
    if let Some(email) = &input.email_wali {
        if !is_valid_email(email) {
            return Err("Format email wali tidak valid".to_string());
        }
    }

    // Validasi kontak orang tua
    if let Some(kontak) = &input.kontak_ortu {
        if !is_valid_phone(kontak) {
            return Err("Format nomor kontak orang tua tidak valid (10-15 digit)".to_string());
        }
    }

    // Validasi kontak wali
    if let Some(kontak) = &input.kontak_wali {
        if !is_valid_phone(kontak) {
            return Err("Format nomor kontak wali tidak valid (10-15 digit)".to_string());
        }
    }

    Ok(())
}

// ==========================
// HELPER FUNCTIONS
// ==========================

/// Cek apakah NIS sudah ada
pub fn is_nis_exist(nis: &str, exclude_id: Option<i64>) -> SqlResult<bool> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let query = if let Some(id) = exclude_id {
            "SELECT id FROM siswa WHERE nis = ?1 AND id != ?2"
        } else {
            "SELECT id FROM siswa WHERE nis = ?1"
        };

        let result = if let Some(id) = exclude_id {
            conn.query_row(query, params![nis.trim(), id], |_| Ok(()))
        } else {
            conn.query_row(query, params![nis.trim()], |_| Ok(()))
        };

        Ok(result.is_ok())
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Cek apakah NISN sudah ada (jika diisi)
pub fn is_nisn_exist(nisn: &str, exclude_id: Option<i64>) -> SqlResult<bool> {
    if nisn.trim().is_empty() {
        return Ok(false);
    }

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let query = if let Some(id) = exclude_id {
            "SELECT id FROM siswa WHERE nisn = ?1 AND nisn != '' AND id != ?2"
        } else {
            "SELECT id FROM siswa WHERE nisn = ?1 AND nisn != ''"
        };

        let result = if let Some(id) = exclude_id {
            conn.query_row(query, params![nisn.trim(), id], |_| Ok(()))
        } else {
            conn.query_row(query, params![nisn.trim()], |_| Ok(()))
        };

        Ok(result.is_ok())
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

// ==========================
// CRUD OPERATIONS
// ==========================

/// Get semua siswa
pub fn get_all_siswa() -> SqlResult<Vec<Siswa>> {
    database::query_all(
        "SELECT * FROM siswa ORDER BY kelas ASC, nama ASC",
        &[],
        map_siswa_from_row,
    )
}

/// Get siswa by ID
pub fn get_siswa_by_id(id: i64) -> SqlResult<Option<Siswa>> {
    database::query_one(
        "SELECT * FROM siswa WHERE id = ?1",
        &[&id],
        map_siswa_from_row,
    )
}

/// Get siswa by kelas
pub fn get_siswa_by_kelas(kelas: &str) -> SqlResult<Vec<Siswa>> {
    let kelas_valid = validate_kelas(kelas)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    database::query_all(
        "SELECT * FROM siswa WHERE kelas = ?1 ORDER BY nama ASC",
        &[&kelas_valid.as_str()],
        map_siswa_from_row,
    )
}

/// Get siswa by tingkat (4, 5, atau 6)
pub fn get_siswa_by_tingkat(tingkat: i32) -> SqlResult<Vec<Siswa>> {
    if !KELAS_TINGKAT_VALID.contains(&tingkat) {
        return Err(rusqlite::Error::InvalidParameterName(
            "Tingkat harus 4, 5, atau 6".to_string()
        ));
    }

    let pattern = format!("{}%", tingkat);
    
    database::query_all(
        "SELECT * FROM siswa WHERE kelas LIKE ?1 ORDER BY kelas ASC, nama ASC",
        &[&pattern.as_str()],
        map_siswa_from_row,
    )
}

/// Tambah siswa baru
pub fn add_siswa(input: SiswaInput) -> SqlResult<i64> {
    // Validasi data lengkap
    validate_siswa_data(&input)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    // Cek duplikasi NIS
    if is_nis_exist(&input.nis, None)? {
        return Err(rusqlite::Error::InvalidParameterName(
            format!("NIS '{}' sudah terdaftar", input.nis)
        ));
    }

    // Cek duplikasi NISN (jika diisi)
    if let Some(ref nisn) = input.nisn {
        if !nisn.trim().is_empty() && is_nisn_exist(nisn, None)? {
            return Err(rusqlite::Error::InvalidParameterName(
                format!("NISN '{}' sudah terdaftar", nisn)
            ));
        }
    }

    let kelas_valid = validate_kelas(&input.kelas)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
    let jk_valid = validate_jenis_kelamin(&input.jenis_kelamin)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        conn.execute(
            "INSERT INTO siswa (
                nis, nisn, nama, kelas, jenis_kelamin,
                nama_ayah, nama_ibu, alamat_ortu, kontak_ortu, email_ortu,
                pekerjaan_ayah, pekerjaan_ibu,
                nama_wali, alamat_wali, kontak_wali, email_wali, pekerjaan_wali
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5,
                ?6, ?7, ?8, ?9, ?10,
                ?11, ?12,
                ?13, ?14, ?15, ?16, ?17
            )",
            params![
                input.nis.trim(),
                input.nisn.as_deref().unwrap_or("").trim(),
                input.nama.trim(),
                kelas_valid,
                jk_valid,
                input.nama_ayah.as_deref().unwrap_or("").trim(),
                input.nama_ibu.as_deref().unwrap_or("").trim(),
                input.alamat_ortu.as_deref().unwrap_or("").trim(),
                input.kontak_ortu.as_deref().unwrap_or("").trim(),
                input.email_ortu.as_deref().unwrap_or("").trim(),
                input.pekerjaan_ayah.as_deref().unwrap_or("").trim(),
                input.pekerjaan_ibu.as_deref().unwrap_or("").trim(),
                input.nama_wali.as_deref().unwrap_or("").trim(),
                input.alamat_wali.as_deref().unwrap_or("").trim(),
                input.kontak_wali.as_deref().unwrap_or("").trim(),
                input.email_wali.as_deref().unwrap_or("").trim(),
                input.pekerjaan_wali.as_deref().unwrap_or("").trim(),
            ],
        )?;

        let id = conn.last_insert_rowid();
        info!("Tambah siswa baru berhasil: id={}, nama={}, nis={}, kelas={}", 
              id, input.nama, input.nis, kelas_valid);
        Ok(id)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Update siswa
pub fn update_siswa(id: i64, input: SiswaInput) -> SqlResult<bool> {
    // Cek apakah siswa ada
    let existing = get_siswa_by_id(id)?;
    if existing.is_none() {
        return Err(rusqlite::Error::InvalidParameterName(
            format!("Siswa dengan ID={} tidak ditemukan", id)
        ));
    }

    // Validasi data baru
    validate_siswa_data(&input)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    // Cek duplikasi NIS (kecuali untuk ID yang sama)
    if is_nis_exist(&input.nis, Some(id))? {
        return Err(rusqlite::Error::InvalidParameterName(
            format!("NIS '{}' sudah digunakan oleh siswa lain", input.nis)
        ));
    }

    // Cek duplikasi NISN
    if let Some(ref nisn) = input.nisn {
        if !nisn.trim().is_empty() && is_nisn_exist(nisn, Some(id))? {
            return Err(rusqlite::Error::InvalidParameterName(
                format!("NISN '{}' sudah digunakan oleh siswa lain", nisn)
            ));
        }
    }

    let kelas_valid = validate_kelas(&input.kelas)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
    let jk_valid = validate_jenis_kelamin(&input.jenis_kelamin)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let changes = conn.execute(
            "UPDATE siswa SET
                nis = ?1, nisn = ?2, nama = ?3, kelas = ?4, jenis_kelamin = ?5,
                nama_ayah = ?6, nama_ibu = ?7, alamat_ortu = ?8, kontak_ortu = ?9, email_ortu = ?10,
                pekerjaan_ayah = ?11, pekerjaan_ibu = ?12,
                nama_wali = ?13, alamat_wali = ?14, kontak_wali = ?15, email_wali = ?16, pekerjaan_wali = ?17,
                updated_at = datetime('now','localtime')
             WHERE id = ?18",
            params![
                input.nis.trim(),
                input.nisn.as_deref().unwrap_or("").trim(),
                input.nama.trim(),
                kelas_valid,
                jk_valid,
                input.nama_ayah.as_deref().unwrap_or("").trim(),
                input.nama_ibu.as_deref().unwrap_or("").trim(),
                input.alamat_ortu.as_deref().unwrap_or("").trim(),
                input.kontak_ortu.as_deref().unwrap_or("").trim(),
                input.email_ortu.as_deref().unwrap_or("").trim(),
                input.pekerjaan_ayah.as_deref().unwrap_or("").trim(),
                input.pekerjaan_ibu.as_deref().unwrap_or("").trim(),
                input.nama_wali.as_deref().unwrap_or("").trim(),
                input.alamat_wali.as_deref().unwrap_or("").trim(),
                input.kontak_wali.as_deref().unwrap_or("").trim(),
                input.email_wali.as_deref().unwrap_or("").trim(),
                input.pekerjaan_wali.as_deref().unwrap_or("").trim(),
                id,
            ],
        )?;

        info!("Update siswa berhasil: id={}, nama={}, kelas={}, changes={}", 
              id, input.nama, kelas_valid, changes);
        Ok(changes > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Delete siswa
pub fn delete_siswa(id: i64) -> SqlResult<bool> {
    let existing = get_siswa_by_id(id)?;
    if existing.is_none() {
        return Err(rusqlite::Error::InvalidParameterName(
            format!("Siswa ID={} tidak ditemukan", id)
        ));
    }

    let siswa = existing.unwrap();

    // Warning jika ada data terkait
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let nilai_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM nilai WHERE siswa_id = ?1",
            params![id],
            |row| row.get(0),
        ).unwrap_or(0);

        if nilai_count > 0 {
            warn!("Menghapus siswa akan menghapus {} data nilai terkait", nilai_count);
        }

        let changes = conn.execute("DELETE FROM siswa WHERE id = ?1", params![id])?;
        
        info!("Hapus siswa berhasil: id={}, nama={}, nis={}, changes={}", 
              id, siswa.nama, siswa.nis, changes);
        Ok(changes > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Search siswa by keyword
pub fn search_siswa(keyword: &str) -> SqlResult<Vec<Siswa>> {
    if keyword.trim().is_empty() {
        return get_all_siswa();
    }

    let pattern = format!("%{}%", keyword.trim());
    
    database::query_all(
        "SELECT * FROM siswa
         WHERE LOWER(nama) LIKE LOWER(?1)
            OR nis LIKE ?1
            OR nisn LIKE ?1
            OR kelas LIKE ?1
            OR LOWER(nama_ayah) LIKE LOWER(?1)
            OR LOWER(nama_ibu) LIKE LOWER(?1)
            OR LOWER(nama_wali) LIKE LOWER(?1)
         ORDER BY kelas ASC, nama ASC",
        &[&pattern.as_str()],
        map_siswa_from_row,
    )
}

/// Get total siswa
pub fn get_total_siswa() -> SqlResult<i32> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let total: i32 = conn.query_row(
            "SELECT COUNT(*) FROM siswa",
            [],
            |row| row.get(0),
        )?;
        Ok(total)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Get statistik siswa per kelas atau tingkat
pub fn get_statistik_siswa(kelas: Option<&str>) -> SqlResult<Vec<StatistikSiswa>> {
    if let Some(kelas_str) = kelas {
        // Cek apakah input adalah tingkat (4, 5, 6) atau kelas lengkap (4A, 5B, dll)
        let is_tingkat = kelas_str.len() == 1 && kelas_str.chars().all(|c| c.is_ascii_digit());

        if is_tingkat {
            let tingkat: i32 = kelas_str.parse().unwrap();
            get_statistik_by_tingkat(tingkat).map(|s| vec![s])
        } else {
            get_statistik_by_kelas(kelas_str).map(|s| vec![s])
        }
    } else {
        // Get statistik untuk semua tingkat
        let mut results = Vec::new();
        for tingkat in KELAS_TINGKAT_VALID {
            if let Ok(stat) = get_statistik_by_tingkat(tingkat) {
                results.push(stat);
            }
        }
        Ok(results)
    }
}

fn get_statistik_by_tingkat(tingkat: i32) -> SqlResult<StatistikSiswa> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let pattern = format!("{}%", tingkat);
        
        let total: i32 = conn.query_row(
            "SELECT COUNT(*) FROM siswa WHERE kelas LIKE ?1",
            params![pattern],
            |row| row.get(0),
        )?;

        let laki_laki: i32 = conn.query_row(
            "SELECT COUNT(*) FROM siswa WHERE kelas LIKE ?1 AND jenis_kelamin = 'L'",
            params![pattern],
            |row| row.get(0),
        ).unwrap_or(0);

        let perempuan: i32 = conn.query_row(
            "SELECT COUNT(*) FROM siswa WHERE kelas LIKE ?1 AND jenis_kelamin = 'P'",
            params![pattern],
            |row| row.get(0),
        ).unwrap_or(0);

        Ok(StatistikSiswa {
            kelas: None,
            tingkat: Some(tingkat),
            total_siswa: total,
            laki_laki,
            perempuan,
        })
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

fn get_statistik_by_kelas(kelas: &str) -> SqlResult<StatistikSiswa> {
    let kelas_valid = validate_kelas(kelas)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let total: i32 = conn.query_row(
            "SELECT COUNT(*) FROM siswa WHERE kelas = ?1",
            params![kelas_valid],
            |row| row.get(0),
        )?;

        let laki_laki: i32 = conn.query_row(
            "SELECT COUNT(*) FROM siswa WHERE kelas = ?1 AND jenis_kelamin = 'L'",
            params![kelas_valid],
            |row| row.get(0),
        ).unwrap_or(0);

        let perempuan: i32 = conn.query_row(
            "SELECT COUNT(*) FROM siswa WHERE kelas = ?1 AND jenis_kelamin = 'P'",
            params![kelas_valid],
            |row| row.get(0),
        ).unwrap_or(0);

        Ok(StatistikSiswa {
            kelas: Some(kelas_valid),
            tingkat: None,
            total_siswa: total,
            laki_laki,
            perempuan,
        })
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

// ==========================
// ROW MAPPING
// ==========================

fn map_siswa_from_row(row: &Row) -> SqlResult<Siswa> {
    Ok(Siswa {
        id: row.get(0)?,
        nis: row.get(1)?,
        nisn: row.get(2)?,
        nama: row.get(3)?,
        kelas: row.get(4)?,
        jenis_kelamin: row.get(5)?,
        nama_ayah: row.get(6).unwrap_or_default(),
        nama_ibu: row.get(7).unwrap_or_default(),
        alamat_ortu: row.get(8).unwrap_or_default(),
        kontak_ortu: row.get(9).unwrap_or_default(),
        email_ortu: row.get(10).unwrap_or_default(),
        pekerjaan_ayah: row.get(11).unwrap_or_default(),
        pekerjaan_ibu: row.get(12).unwrap_or_default(),
        nama_wali: row.get(13).unwrap_or_default(),
        alamat_wali: row.get(14).unwrap_or_default(),
        kontak_wali: row.get(15).unwrap_or_default(),
        email_wali: row.get(16).unwrap_or_default(),
        pekerjaan_wali: row.get(17).unwrap_or_default(),
        created_at: row.get(18)?,
        updated_at: row.get(19).ok(),
    })
}
