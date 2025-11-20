/**
 * database.rs (v6.1 FIXED - Complete Schema)
 *
 * FIXES:
 * ✅ Tabel siswa lengkap dengan 12 kolom parent/wali
 * ✅ Tabel jenis_nilai_config dengan data default
 * ✅ Tabel predikat_config dengan data default
 * ✅ All migrations tetap berfungsi untuk backward compatibility
 */

use rusqlite::{Connection, Result as SqlResult, params};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use log::{info, warn, error, debug};
use chrono::Local;
use chrono::Datelike; 
use once_cell::sync::Lazy;

// ==========================
// STATIC DATABASE INSTANCE
// ==========================

static DB_INSTANCE: Lazy<Arc<Mutex<Option<Connection>>>> = Lazy::new(|| {
    Arc::new(Mutex::new(None))
});

// ==========================
// PATH CONFIGURATION
// ==========================

/// Mendapatkan direktori user data untuk aplikasi.
/// Tidak menggunakan `tauri::Config::default()` karena itu tidak valid.
/// `data_dir()` jauh lebih aman dan portable.
fn get_user_data_dir() -> PathBuf {
    // Coba pakai data_dir() bawaan tauri
    if let Some(base) = tauri::api::path::data_dir() {
        return base.join("sistem-penilaian-rekap-nilai");
    }

    // Fallback aman ke $HOME
    warn!("Gagal mendapatkan data_dir, menggunakan fallback ke HOME");
    let home = dirs::home_dir().expect("Gagal mendapatkan home directory");
    home.join(".sistem-penilaian-rekap-nilai")
}

pub struct DatabasePaths {
    pub user_data_dir: PathBuf,
    pub data_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub db_file: PathBuf,
    pub log_file: PathBuf,
}

impl DatabasePaths {
    pub fn new() -> Self {
        let user_data_dir = get_user_data_dir();
        let data_dir = user_data_dir.join("data");
        let logs_dir = user_data_dir.join("logs");
        let db_file = data_dir.join("database.sqlite");
        let log_file = logs_dir.join("app.log");

        Self {
            user_data_dir,
            data_dir,
            logs_dir,
            db_file,
            log_file,
        }
    }
}

// ==========================
// DIRECTORY SETUP
// ==========================

fn ensure_directory(dir_path: &Path) -> std::io::Result<()> {
    if !dir_path.exists() {
        fs::create_dir_all(dir_path)?;
        info!("Direktori dibuat: {:?}", dir_path);
    }
    Ok(())
}

// ==========================
// MIGRATION FUNCTIONS
// ==========================

/// Migrasi tabel siswa (kelas INTEGER -> TEXT)
fn check_and_migrate_siswa_table(conn: &Connection) -> SqlResult<bool> {
    let table_info: Vec<(i32, String, String, i32, Option<String>, i32)> = 
        conn.prepare("PRAGMA table_info(siswa)")?
            .query_map([], |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                ))
            })?
            .collect::<SqlResult<Vec<_>>>()?;

    let kelas_column = table_info.iter().find(|(_, name, _, _, _, _)| name == "kelas");

    if let Some((_, _, col_type, _, _, _)) = kelas_column {
        if col_type.to_uppercase() == "INTEGER" {
            info!("Migrasi tabel siswa dimulai (kelas INTEGER -> TEXT)...");

            conn.execute(
                "CREATE TABLE IF NOT EXISTS siswa_backup_int AS SELECT * FROM siswa",
                [],
            )?;

            // Create new table with full schema
            conn.execute(
                "CREATE TABLE siswa_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nis TEXT NOT NULL CHECK(length(nis) <= 11),
                    nisn TEXT NOT NULL CHECK(length(nisn) <= 11),
                    nama TEXT NOT NULL,
                    kelas TEXT NOT NULL,
                    jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L','P')) NOT NULL,
                    nama_ayah TEXT DEFAULT '',
                    nama_ibu TEXT DEFAULT '',
                    alamat_ortu TEXT DEFAULT '',
                    kontak_ortu TEXT DEFAULT '',
                    email_ortu TEXT DEFAULT '',
                    pekerjaan_ayah TEXT DEFAULT '',
                    pekerjaan_ibu TEXT DEFAULT '',
                    nama_wali TEXT DEFAULT '',
                    alamat_wali TEXT DEFAULT '',
                    kontak_wali TEXT DEFAULT '',
                    email_wali TEXT DEFAULT '',
                    pekerjaan_wali TEXT DEFAULT '',
                    created_at TEXT DEFAULT (datetime('now','localtime')),
                    updated_at TEXT DEFAULT (datetime('now','localtime')),
                    UNIQUE(nis),
                    UNIQUE(nisn)
                )",
                [],
            )?;

            conn.execute(
                "INSERT INTO siswa_new (id, nis, nisn, nama, kelas, jenis_kelamin, created_at, updated_at)
                SELECT 
                    id, nis, nisn, nama,
                    CAST(kelas AS TEXT) as kelas,
                    jenis_kelamin, created_at, updated_at
                FROM siswa",
                [],
            )?;

            conn.execute("DROP TABLE siswa", [])?;
            conn.execute("ALTER TABLE siswa_new RENAME TO siswa", [])?;

            info!("Migrasi tabel siswa selesai (kelas sekarang TEXT)");
            return Ok(true);
        }
    }

    debug!("Tabel siswa sudah menggunakan kelas TEXT");
    Ok(false)
}

/// Migrasi tabel siswa - Tambah kolom orang tua & wali
fn check_and_migrate_siswa_parent_data(conn: &Connection) -> SqlResult<bool> {
    info!("🔍 Mengecek kebutuhan migrasi data orang tua & wali...");

    let table_info: Vec<String> = conn
        .prepare("PRAGMA table_info(siswa)")?
        .query_map([], |row| row.get(1))?
        .collect::<SqlResult<Vec<_>>>()?;

    let required_columns = vec![
        ("nama_ayah", "TEXT", ""),
        ("nama_ibu", "TEXT", ""),
        ("alamat_ortu", "TEXT", ""),
        ("kontak_ortu", "TEXT", ""),
        ("email_ortu", "TEXT", ""),
        ("pekerjaan_ayah", "TEXT", ""),
        ("pekerjaan_ibu", "TEXT", ""),
        ("nama_wali", "TEXT", ""),
        ("alamat_wali", "TEXT", ""),
        ("kontak_wali", "TEXT", ""),
        ("email_wali", "TEXT", ""),
        ("pekerjaan_wali", "TEXT", ""),
    ];

    let columns_to_add: Vec<_> = required_columns
        .iter()
        .filter(|(name, _, _)| !table_info.contains(&name.to_string()))
        .collect();

    if columns_to_add.is_empty() {
        info!("✅ Semua kolom orang tua & wali sudah ada");
        return Ok(false);
    }

    info!("🔄 Menambahkan {} kolom baru...", columns_to_add.len());

    let mut success_count = 0;

    for (name, col_type, default_value) in columns_to_add {
        match conn.execute(
            &format!("ALTER TABLE siswa ADD COLUMN {} {}", name, col_type),
            [],
        ) {
            Ok(_) => {
                conn.execute(
                    &format!("UPDATE siswa SET {} = ? WHERE {} IS NULL", name, name),
                    params![default_value],
                )?;
                info!("  ✅ Kolom '{}' berhasil ditambahkan", name);
                success_count += 1;
            }
            Err(e) => {
                if e.to_string().contains("duplicate column name") {
                    debug!("  ⚠️ Kolom '{}' sudah ada (skip)", name);
                    success_count += 1;
                } else {
                    error!("  ❌ Gagal menambahkan kolom '{}': {}", name, e);
                }
            }
        }
    }

    info!(
        "✅ Migrasi selesai. {}/{} kolom berhasil ditambahkan.",
        success_count,
        required_columns.len()
    );

    Ok(true)
}

/// Migrasi tabel nilai
fn check_and_migrate_nilai_table(conn: &Connection) -> SqlResult<bool> {
    let table_info: Vec<(String, String)> = conn
        .prepare("PRAGMA table_info(nilai)")?
        .query_map([], |row| Ok((row.get(1)?, row.get(2)?)))?
        .collect::<SqlResult<Vec<_>>>()?;

    let columns: Vec<String> = table_info.iter().map(|(name, _)| name.clone()).collect();
    let kelas_column = table_info.iter().find(|(name, _)| name == "kelas");

    let needs_migration = !columns.contains(&"kelas".to_string())
        || !columns.contains(&"semester".to_string())
        || !columns.contains(&"tahun_ajaran".to_string())
        || (kelas_column.is_some() && kelas_column.unwrap().1.to_uppercase() == "INTEGER");

    if needs_migration {
        info!("Migrasi tabel nilai dimulai...");

        conn.execute(
            "CREATE TABLE IF NOT EXISTS nilai_backup_int AS SELECT * FROM nilai",
            [],
        )?;

        conn.execute(
            "CREATE TABLE nilai_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                siswa_id INTEGER NOT NULL,
                mapel_id INTEGER NOT NULL,
                kelas TEXT NOT NULL,
                semester INTEGER NOT NULL CHECK(semester IN (1, 2)),
                tahun_ajaran TEXT NOT NULL,
                jenis TEXT NOT NULL,
                nilai REAL NOT NULL CHECK(nilai >= 0 AND nilai <= 100),
                tanggal_input TEXT DEFAULT (date('now')),
                created_at TEXT DEFAULT (datetime('now','localtime')),
                updated_at TEXT,
                FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (mapel_id) REFERENCES mapel(id) ON DELETE CASCADE ON UPDATE CASCADE
            )",
            [],
        )?;

        let now = Local::now();
        let current_year = now.year();
        let current_month = now.month();
        let tahun_ajaran = if current_month >= 7 {
            format!("{}/{}", current_year, current_year + 1)
        } else {
            format!("{}/{}", current_year - 1, current_year)
        };

        conn.execute(
            &format!(
                "INSERT INTO nilai_new (id, siswa_id, mapel_id, kelas, semester, tahun_ajaran, jenis, nilai, tanggal_input, created_at, updated_at)
                SELECT 
                    n.id, n.siswa_id, n.mapel_id,
                    COALESCE(s.kelas, '4') as kelas,
                    COALESCE(n.semester, 1) as semester,
                    COALESCE(n.tahun_ajaran, '{}') as tahun_ajaran,
                    n.jenis, n.nilai, n.tanggal_input,
                    n.created_at, n.updated_at
                FROM nilai n
                LEFT JOIN siswa s ON s.id = n.siswa_id",
                tahun_ajaran
            ),
            [],
        )?;

        conn.execute("DROP TABLE nilai", [])?;
        conn.execute("ALTER TABLE nilai_new RENAME TO nilai", [])?;

        info!("Migrasi tabel nilai selesai");
        return Ok(true);
    }

    debug!("Tabel nilai sudah menggunakan schema terbaru");
    Ok(false)
}

// ==========================
// INIT DATABASE
// ==========================

pub fn init_database(db_file_override: Option<PathBuf>) -> SqlResult<()> {
    let mut db_lock = DB_INSTANCE.lock().unwrap();

    if db_lock.is_some() {
        warn!("Database sudah diinisialisasi");
        return Ok(());
    }

    let paths = DatabasePaths::new();
    let db_file = db_file_override.unwrap_or(paths.db_file.clone());

    info!("=== Aplikasi Sistem Penilaian & Rekap Nilai ===");
    info!("User Data Directory: {:?}", paths.user_data_dir);
    info!("Database File: {:?}", db_file);
    info!("Log File: {:?}", paths.log_file);

    ensure_directory(&paths.data_dir).map_err(|e| {
        error!("Gagal membuat directory: {}", e);
        rusqlite::Error::InvalidPath(paths.data_dir.clone())
    })?;
    ensure_directory(&paths.logs_dir).map_err(|e| {
        error!("Gagal membuat directory: {}", e);
        rusqlite::Error::InvalidPath(paths.logs_dir.clone())
    })?;

    info!("Membuka database: {:?}", db_file);

    let conn = Connection::open(&db_file)?;

    // Set pragmas
    // Set foreign_keys
    conn.pragma_update(None, "foreign_keys", &"ON")?;

    // Set journal_mode WAL dengan menangkap hasilnya
    let journal_mode: String = conn.query_row("PRAGMA journal_mode = WAL", [], |row| row.get(0))?;
    info!("Journal mode diatur ke {}", journal_mode);

    // Set synchronous
    conn.pragma_update(None, "synchronous", &"NORMAL")?;
    info!("PRAGMA berhasil diatur");

    // ✅ FIXED: Create tables dengan schema lengkap
    
    // Tabel Siswa (LENGKAP dengan 12 kolom parent/wali)
    let create_siswa_table = "
        CREATE TABLE IF NOT EXISTS siswa (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nis TEXT NOT NULL CHECK(length(nis) <= 11),
            nisn TEXT NOT NULL CHECK(length(nisn) <= 11),
            nama TEXT NOT NULL,
            kelas TEXT NOT NULL,
            jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L','P')) NOT NULL,
            nama_ayah TEXT DEFAULT '',
            nama_ibu TEXT DEFAULT '',
            alamat_ortu TEXT DEFAULT '',
            kontak_ortu TEXT DEFAULT '',
            email_ortu TEXT DEFAULT '',
            pekerjaan_ayah TEXT DEFAULT '',
            pekerjaan_ibu TEXT DEFAULT '',
            nama_wali TEXT DEFAULT '',
            alamat_wali TEXT DEFAULT '',
            kontak_wali TEXT DEFAULT '',
            email_wali TEXT DEFAULT '',
            pekerjaan_wali TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime')),
            UNIQUE(nis),
            UNIQUE(nisn)
        )
    ";

    let create_mapel_table = "
        CREATE TABLE IF NOT EXISTS mapel (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_mapel TEXT NOT NULL UNIQUE,
            kkm INTEGER DEFAULT 70 CHECK(kkm >= 0 AND kkm <= 100),
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT
        )
    ";

    let create_nilai_table = "
        CREATE TABLE IF NOT EXISTS nilai (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            siswa_id INTEGER NOT NULL,
            mapel_id INTEGER NOT NULL,
            kelas TEXT NOT NULL,
            semester INTEGER NOT NULL CHECK(semester IN (1, 2)),
            tahun_ajaran TEXT NOT NULL,
            jenis TEXT NOT NULL,
            nilai REAL NOT NULL CHECK(nilai >= 0 AND nilai <= 100),
            hadir INTEGER DEFAULT 0,
            sakit INTEGER DEFAULT 0,
            izin INTEGER DEFAULT 0,
            alpa INTEGER DEFAULT 0,
            tanggal_input TEXT DEFAULT (date('now')),
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT,
            FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (mapel_id) REFERENCES mapel(id) ON DELETE CASCADE ON UPDATE CASCADE
        )
    ";

    // ✅ NEW: Tabel Jenis Nilai Config
    let create_jenis_nilai_config = "
        CREATE TABLE IF NOT EXISTS jenis_nilai_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_jenis TEXT UNIQUE NOT NULL,
            bobot REAL DEFAULT 0.33 CHECK(bobot >= 0 AND bobot <= 1),
            is_active INTEGER DEFAULT 1,
            is_ujian_sekolah INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT
        )
    ";

    // ✅ Tabel Predikat Config
    let create_predikat_table = "
        CREATE TABLE IF NOT EXISTS predikat_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            huruf TEXT NOT NULL UNIQUE,
            min_nilai REAL NOT NULL CHECK(min_nilai >= 0 AND min_nilai <= 100),
            max_nilai REAL NOT NULL CHECK(max_nilai >= 0 AND max_nilai <= 100),
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT
        )
    ";

    let create_indexes = "
        CREATE INDEX IF NOT EXISTS idx_siswa_nis ON siswa(nis);
        CREATE INDEX IF NOT EXISTS idx_siswa_nisn ON siswa(nisn);
        CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas);
        CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai(siswa_id);
        CREATE INDEX IF NOT EXISTS idx_nilai_mapel ON nilai(mapel_id);
        CREATE INDEX IF NOT EXISTS idx_nilai_jenis ON nilai(jenis);
        CREATE INDEX IF NOT EXISTS idx_nilai_kelas_semester ON nilai(kelas, semester);
        CREATE INDEX IF NOT EXISTS idx_nilai_tahun_ajaran ON nilai(tahun_ajaran);
        CREATE INDEX IF NOT EXISTS idx_nilai_siswa_mapel_semester ON nilai(siswa_id, mapel_id, kelas, semester);
    ";

    // Execute table creation
    conn.execute(create_siswa_table, [])?;
    conn.execute(create_mapel_table, [])?;
    conn.execute(create_nilai_table, [])?;
    conn.execute(create_jenis_nilai_config, [])?;
    conn.execute(create_predikat_table, [])?;
    conn.execute_batch(create_indexes)?;

    info!("✅ Tabel dasar berhasil dibuat/terverifikasi");

    // ✅ NEW: Insert default jenis nilai v5.1
    let default_jenis = [
        ("Tugas", 0.25, 0),
        ("UTS", 0.25, 0),
        ("UAS", 0.35, 0),
        ("Ujian Sekolah", 0.00, 1),
        ("Kehadiran", 0.15, 0),
    ];

    for (nama, bobot, is_ujian) in &default_jenis {
        conn.execute(
            "INSERT OR IGNORE INTO jenis_nilai_config (nama_jenis, bobot, is_ujian_sekolah) 
             VALUES (?1, ?2, ?3)",
            params![nama, bobot, is_ujian],
        )?;
    }
    info!("✅ Data default jenis_nilai_config diinisialisasi");

    // ✅ NEW: Insert default predikat
    let default_predikat = [
        ("A", 87.0, 100.0),
        ("B", 76.0, 86.0),
        ("C", 70.0, 75.0),
        ("D", 50.0, 69.0),
        ("E", 0.0, 49.0),
    ];

    for (huruf, min, max) in &default_predikat {
        conn.execute(
            "INSERT OR IGNORE INTO predikat_config (huruf, min_nilai, max_nilai) 
             VALUES (?1, ?2, ?3)",
            params![huruf, min, max],
        )?;
    }
    info!("✅ Data default predikat_config diinisialisasi");

    // Run migrations (untuk backward compatibility)
    info!("🔄 Menjalankan migrasi database...");
    check_and_migrate_siswa_table(&conn)?;
    check_and_migrate_nilai_table(&conn)?;
    check_and_migrate_siswa_parent_data(&conn)?;

    // Log final statistics
    let tables: Vec<String> = conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")?
        .query_map([], |row| row.get(0))?
        .collect::<SqlResult<Vec<_>>>()?;
    info!("✅ Total tabel: {}, {:?}", tables.len(), tables);

    let siswa_columns: Vec<String> = conn
        .prepare("PRAGMA table_info(siswa)")?
        .query_map([], |row| row.get(1))?
        .collect::<SqlResult<Vec<_>>>()?;
    info!("✅ Total kolom tabel siswa: {}", siswa_columns.len());

    *db_lock = Some(conn);
    Ok(())
}

// ==========================
// DATABASE HELPERS
// ==========================

pub fn get_db() -> Arc<Mutex<Option<Connection>>> {
    DB_INSTANCE.clone()
}

pub fn close_database() -> SqlResult<()> {
    let mut db_lock = DB_INSTANCE.lock().unwrap();
    if let Some(conn) = db_lock.take() {
        conn.close().map_err(|(_, e)| e)?;
        info!("Koneksi database ditutup");
    } else {
        warn!("Close DB dipanggil tetapi DB belum init");
    }
    Ok(())
}

pub fn backup_database(backup_path: &Path) -> SqlResult<bool> {
    let db_lock = DB_INSTANCE.lock().unwrap();
    if let Some(ref conn) = *db_lock {
        let mut backup_conn = Connection::open(&backup_path)?;
        let backup = rusqlite::backup::Backup::new(conn, &mut backup_conn)?;
        backup.run_to_completion(5, std::time::Duration::from_millis(250), None)?;
        info!("Database berhasil di-backup: {:?}", backup_path);
        Ok(true)
    } else {
        error!("Database belum diinisialisasi");
        Ok(false)
    }
}

// ==========================
// QUERY HELPERS
// ==========================

pub fn execute(sql: &str, params: &[&dyn rusqlite::ToSql]) -> SqlResult<usize> {
    let db_lock = DB_INSTANCE.lock().unwrap();
    if let Some(ref conn) = *db_lock {
        conn.execute(sql, params)
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

pub fn query_one<T, F>(sql: &str, params: &[&dyn rusqlite::ToSql], f: F) -> SqlResult<Option<T>>
where
    F: FnOnce(&rusqlite::Row) -> SqlResult<T>,
{
    let db_lock = DB_INSTANCE.lock().unwrap();
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare(sql)?;
        let mut rows = stmt.query(params)?;
        if let Some(row) = rows.next()? {
            Ok(Some(f(row)?))
        } else {
            Ok(None)
        }
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

pub fn query_all<T, F>(sql: &str, params: &[&dyn rusqlite::ToSql], f: F) -> SqlResult<Vec<T>>
where
    F: Fn(&rusqlite::Row) -> SqlResult<T>,
{
    let db_lock = DB_INSTANCE.lock().unwrap();
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt.query_map(params, f)?;
        rows.collect()
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}
