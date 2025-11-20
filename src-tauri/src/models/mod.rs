/**
 * models/mod.rs
 * --------------------------------------------------------
 * Module export untuk semua data models
 * --------------------------------------------------------
 */

pub mod siswa;
pub mod mapel;
pub mod nilai;
pub mod absensi;

// Re-export structs yang sering digunakan
pub use siswa::{Siswa, SiswaInput, StatistikSiswa};
pub use mapel::{Mapel, MapelInput, MapelStats, StatistikMapel};
pub use nilai::{
    Nilai, NilaiWithDetails, 
    JenisNilaiConfig, PredikatConfig,
    KomponenNilaiSemester, KehadiranData, KehadiranBreakdown,
    NilaiAkhirKelulusan, AkumulasiNilai, NilaiPerSemester,
    StatusKenaikanKelas, StatusKelulusan,
    HasilMapel, HasilMapelKelulusan,
};