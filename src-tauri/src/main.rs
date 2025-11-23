// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod models;
mod commands;
mod logic;

fn main() {
        env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .init();
        
    // Initialize database
    database::init_database(None).expect("Failed to initialize database");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // === SISWA COMMANDS ===
            commands::siswa::add_siswa,
            commands::siswa::update_siswa,
            commands::siswa::delete_siswa,
            commands::siswa::get_all_siswa,
            commands::siswa::get_siswa_by_id,
            commands::siswa::get_siswa_by_kelas,
            commands::siswa::get_siswa_by_tingkat,
            commands::siswa::search_siswa,
            commands::siswa::get_total_siswa,
            commands::siswa::get_statistik_siswa,
            commands::siswa::validate_kelas,
            commands::siswa::extract_tingkat_kelas,
            commands::siswa::validate_jenis_kelamin,
            commands::siswa::is_valid_email,
            commands::siswa::is_valid_phone,
            commands::siswa::is_nis_exist,
            commands::siswa::is_nisn_exist,
            
            // === NILAI COMMANDS ===
            commands::nilai::add_nilai,
            commands::nilai::update_nilai,
            commands::nilai::delete_nilai,
            commands::nilai::get_all_nilai,
            commands::nilai::get_nilai_by_id,
            commands::nilai::get_nilai_by_siswa,
            commands::nilai::get_nilai_siswa_by_mapel,
            
            // === KEHADIRAN COMMANDS ===
            commands::nilai::save_kehadiran,
            commands::nilai::get_kehadiran,
            commands::nilai::update_kehadiran,              // ✅ TAMBAH
            commands::nilai::delete_kehadiran,
            commands::nilai::get_kehadiran_by_kelas,        // ✅ TAMBAH
            commands::nilai::get_all_kehadiran,             // ✅ TAMBAH
            
            // === PERHITUNGAN NILAI COMMANDS ===
            commands::nilai::hitung_komponen_nilai_semester,
            commands::nilai::hitung_akumulasi_nilai,
            commands::nilai::hitung_nilai_akhir_kelulusan,
            commands::nilai::cek_kenaikan_kelas,
            commands::nilai::cek_kelulusan,
            
            // === CONFIG COMMANDS ===
            commands::nilai::get_active_jenis_nilai,
            commands::nilai::get_bobot_jenis_nilai,
            commands::nilai::get_predikat_config,
            commands::nilai::get_daftar_tahun_ajaran,
            commands::nilai::get_jenis_nilai_input,
            commands::nilai::get_tahun_ajaran_aktif,
            commands::nilai::tentukan_predikat,
            
            // === PENILAIAN COMMANDS (Business Logic) ===
            commands::penilaian::cek_kelengkapan_nilai,
            commands::penilaian::tentukan_status,
            commands::penilaian::hitung_nilai_akhir,
            commands::penilaian::cek_kenaikan_kelas_detail,
            commands::penilaian::cek_kelulusan_siswa,
            commands::penilaian::hitung_rata_rata,
            commands::penilaian::get_all_rata_rata,
            commands::penilaian::hitung_ranking,
            commands::penilaian::get_top_siswa,
            commands::penilaian::hitung_statistik,
            commands::penilaian::hitung_statistik_kelulusan,
            commands::penilaian::get_rekap_nilai,
            commands::penilaian::get_rekap_kelulusan,
            commands::penilaian::batch_hitung_nilai,
            commands::penilaian::batch_cek_kelengkapan,
            commands::penilaian::analisis_kelas,
            commands::penilaian::validate_context,
            commands::penilaian::hitung_nilai_kehadiran,

            // === MAPEL COMMANDS ===
            commands::mapel::add_mapel,
            commands::mapel::update_mapel,
            commands::mapel::update_kkm_mapel,
            commands::mapel::delete_mapel,
            commands::mapel::get_all_mapel,
            commands::mapel::get_mapel_by_id,
            commands::mapel::get_mapel_by_name,
            commands::mapel::search_mapel,
            commands::mapel::get_mapel_stats,
            commands::mapel::validate_kkm,
            commands::mapel::is_mapel_exist,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
