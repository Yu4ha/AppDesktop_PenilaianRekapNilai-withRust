/**
 * models/mapel.rs (Converted from mapelModel.js)
 * --------------------------------------------------------
 * Model CRUD untuk data mata pelajaran (mapel)
 * 
 * FITUR:
 * ✅ CRUD operations lengkap
 * ✅ Validasi KKM (0-100)
 * ✅ Search & statistik mapel
 * ✅ Security: SQL Injection Protection
 * --------------------------------------------------------
 */

use rusqlite::{params, Result as SqlResult, Row};
use serde::{Deserialize, Serialize};
use log::{info, warn, error, debug};

use crate::database;

// ==========================
// STRUCTS
// ==========================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mapel {
    pub id: i64,
    pub nama_mapel: String,
    pub kkm: i32,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MapelInput {
    pub nama_mapel: String,
    pub kkm: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MapelStats {
    pub mapel: Mapel,
    pub statistik: StatistikMapel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikMapel {
    pub total_siswa: i32,
    pub total_nilai_entries: i32,
    pub rata_rata_nilai: Option<f64>,
    pub nilai_terendah: Option<f64>,
    pub nilai_tertinggi: Option<f64>,
}

// ==========================
// VALIDATION FUNCTIONS
// ==========================

/// Validasi nilai KKM
pub fn validate_kkm(kkm: i32) -> Result<(), String> {
    if kkm < 0 || kkm > 100 {
        return Err("KKM harus antara 0-100".to_string());
    }

    if kkm < 50 {
        warn!("KKM terlalu rendah: {}", kkm);
    }

    if kkm > 90 {
        warn!("KKM sangat tinggi: {}", kkm);
    }

    Ok(())
}

/// Validasi data mapel lengkap
pub fn validate_mapel_data(input: &MapelInput) -> Result<(), String> {
    // Validasi nama mapel
    let nama = input.nama_mapel.trim();
    if nama.is_empty() {
        return Err("Nama mapel harus diisi dan berupa teks".to_string());
    }

    if nama.len() < 3 {
        return Err("Nama mapel minimal 3 karakter".to_string());
    }

    if nama.len() > 100 {
        return Err("Nama mapel maksimal 100 karakter".to_string());
    }

    // Validasi karakter khusus
    let invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    if nama.chars().any(|c| invalid_chars.contains(&c)) {
        return Err("Nama mapel mengandung karakter tidak valid".to_string());
    }

    // Validasi KKM
    if let Some(kkm) = input.kkm {
        validate_kkm(kkm)?;
    }

    Ok(())
}

// ==========================
// HELPER FUNCTIONS
// ==========================

/// Cek apakah nama mapel sudah ada
pub fn is_mapel_exist(nama_mapel: &str, exclude_id: Option<i64>) -> SqlResult<bool> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let query = if let Some(id) = exclude_id {
            "SELECT id FROM mapel WHERE LOWER(nama_mapel) = LOWER(?1) AND id != ?2"
        } else {
            "SELECT id FROM mapel WHERE LOWER(nama_mapel) = LOWER(?1)"
        };

        let result = if let Some(id) = exclude_id {
            conn.query_row(query, params![nama_mapel.trim(), id], |_| Ok(()))
        } else {
            conn.query_row(query, params![nama_mapel.trim()], |_| Ok(()))
        };

        Ok(result.is_ok())
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

// ==========================
// CRUD OPERATIONS
// ==========================

/// Get semua mapel
pub fn get_all_mapel() -> SqlResult<Vec<Mapel>> {
    database::query_all(
        "SELECT * FROM mapel ORDER BY nama_mapel ASC",
        &[],
        map_mapel_from_row,
    )
}

/// Get mapel by ID
pub fn get_mapel_by_id(id: i64) -> SqlResult<Option<Mapel>> {
    database::query_one(
        "SELECT * FROM mapel WHERE id = ?1",
        &[&id],
        map_mapel_from_row,
    )
}

/// Get mapel by name (case-insensitive)
pub fn get_mapel_by_name(nama_mapel: &str) -> SqlResult<Option<Mapel>> {
    database::query_one(
        "SELECT * FROM mapel WHERE LOWER(nama_mapel) = LOWER(?1)",
        &[&nama_mapel.trim()],
        map_mapel_from_row,
    )
}

/// Tambah mapel baru
pub fn add_mapel(input: MapelInput) -> SqlResult<i64> {
    // Validasi data
    validate_mapel_data(&input)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    // Cek duplikasi
    if is_mapel_exist(&input.nama_mapel, None)? {
        return Err(rusqlite::Error::InvalidParameterName(
            format!("Mapel '{}' sudah ada", input.nama_mapel)
        ));
    }

    let kkm = input.kkm.unwrap_or(70);

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        conn.execute(
            "INSERT INTO mapel (nama_mapel, kkm) VALUES (?1, ?2)",
            params![input.nama_mapel.trim(), kkm],
        )?;

        let id = conn.last_insert_rowid();
        info!("Tambah mapel baru berhasil: id={}, nama_mapel={}, kkm={}", 
              id, input.nama_mapel, kkm);
        Ok(id)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Update mapel
pub fn update_mapel(id: i64, input: MapelInput) -> SqlResult<bool> {
    // Cek apakah mapel ada
    let existing = get_mapel_by_id(id)?;
    if existing.is_none() {
        return Err(rusqlite::Error::InvalidParameterName(
            format!("Mapel dengan ID={} tidak ditemukan", id)
        ));
    }

    // Validasi data baru
    validate_mapel_data(&input)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    // Cek duplikasi nama (kecuali untuk ID yang sama)
    if is_mapel_exist(&input.nama_mapel, Some(id))? {
        return Err(rusqlite::Error::InvalidParameterName(
            format!("Mapel '{}' sudah ada", input.nama_mapel)
        ));
    }

    let kkm = input.kkm.unwrap_or(70);

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let changes = conn.execute(
            "UPDATE mapel SET
                nama_mapel = ?1,
                kkm = ?2,
                updated_at = datetime('now','localtime')
             WHERE id = ?3",
            params![input.nama_mapel.trim(), kkm, id],
        )?;

        info!("Update mapel berhasil: id={}, nama_mapel={}, kkm={}, changes={}", 
              id, input.nama_mapel, kkm, changes);
        Ok(changes > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Update hanya KKM
pub fn update_kkm(id: i64, kkm: i32) -> SqlResult<bool> {
    validate_kkm(kkm)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let changes = conn.execute(
            "UPDATE mapel SET
                kkm = ?1,
                updated_at = datetime('now','localtime')
             WHERE id = ?2",
            params![kkm, id],
        )?;

        info!("Update KKM mapel berhasil: id={}, kkm={}, changes={}", 
              id, kkm, changes);
        Ok(changes > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Delete mapel (CASCADE akan menghapus nilai terkait)
pub fn delete_mapel(id: i64) -> SqlResult<bool> {
    let existing = get_mapel_by_id(id)?;
    if existing.is_none() {
        return Err(rusqlite::Error::InvalidParameterName(
            format!("Mapel ID={} tidak ditemukan", id)
        ));
    }

    let mapel = existing.unwrap();

    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        // Cek jumlah nilai yang akan terhapus
        let nilai_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM nilai WHERE mapel_id = ?1",
            params![id],
            |row| row.get(0),
        ).unwrap_or(0);

        if nilai_count > 0 {
            warn!("Menghapus mapel akan menghapus {} nilai terkait", nilai_count);
        }

        let changes = conn.execute("DELETE FROM mapel WHERE id = ?1", params![id])?;
        
        info!("Hapus mapel berhasil: id={}, nama_mapel={}, changes={}", 
              id, mapel.nama_mapel, changes);
        Ok(changes > 0)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

/// Search mapel by keyword (case-insensitive)
pub fn search_mapel(keyword: &str) -> SqlResult<Vec<Mapel>> {
    if keyword.trim().is_empty() {
        return get_all_mapel();
    }

    let pattern = format!("%{}%", keyword.trim());
    
    database::query_all(
        "SELECT * FROM mapel
         WHERE LOWER(nama_mapel) LIKE LOWER(?1)
         ORDER BY nama_mapel ASC",
        &[&pattern.as_str()],
        map_mapel_from_row,
    )
}

/// Get statistik mapel
pub fn get_mapel_stats(id: Option<i64>) -> SqlResult<Vec<MapelStats>> {
    if let Some(mapel_id) = id {
        // Statistik untuk satu mapel
        let mapel = get_mapel_by_id(mapel_id)?
            .ok_or_else(|| rusqlite::Error::InvalidParameterName(
                format!("Mapel ID={} tidak ditemukan", mapel_id)
            ))?;

        let stats = get_stats_for_mapel(mapel_id)?;
        
        Ok(vec![MapelStats { mapel, statistik: stats }])
    } else {
        // Statistik untuk semua mapel
        let all_mapel = get_all_mapel()?;
        let mut results = Vec::new();

        for mapel in all_mapel {
            let stats = get_stats_for_mapel(mapel.id)?;
            results.push(MapelStats { mapel, statistik: stats });
        }

        Ok(results)
    }
}

fn get_stats_for_mapel(mapel_id: i64) -> SqlResult<StatistikMapel> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare(
            "SELECT 
                COUNT(DISTINCT n.siswa_id) AS total_siswa,
                COUNT(n.id) AS total_nilai_entries,
                AVG(n.nilai) AS rata_rata_nilai,
                MIN(n.nilai) AS nilai_terendah,
                MAX(n.nilai) AS nilai_tertinggi
             FROM nilai n
             WHERE n.mapel_id = ?1"
        )?;

        let stats = stmt.query_row(params![mapel_id], |row| {
            Ok(StatistikMapel {
                total_siswa: row.get(0).unwrap_or(0),
                total_nilai_entries: row.get(1).unwrap_or(0),
                rata_rata_nilai: row.get::<_, Option<f64>>(2)?
                    .map(|v| (v * 100.0).round() / 100.0),
                nilai_terendah: row.get(3)?,
                nilai_tertinggi: row.get(4)?,
            })
        })?;

        Ok(stats)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

// ==========================
// ROW MAPPING
// ==========================

fn map_mapel_from_row(row: &Row) -> SqlResult<Mapel> {
    Ok(Mapel {
        id: row.get(0)?,
        nama_mapel: row.get(1)?,
        kkm: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4).ok(),
    })
}
