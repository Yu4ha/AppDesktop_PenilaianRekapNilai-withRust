/**
 * logic/penilaian.rs (v5.1 - Converted from penilaianLogic.js)
 * =============================================================
 * Business Logic Layer untuk Perhitungan Penilaian Siswa
 * 
 * VERSI 5.1 FINAL:
 * ✅ Kehadiran MASUK dalam perhitungan nilai akademik
 * ✅ Tanpa normalisasi (nilai 0 jika belum diisi)
 * ✅ Formula konsisten dengan nilaiModel v5.1
 * 
 * Formula Nilai Semester:
 * Nilai = (Tugas × 25%) + (UTS × 25%) + (UAS × 35%) + (Kehadiran × 15%)
 * 
 * Formula Nilai Kelulusan:
 * Nilai Akhir = (Rata6Semester × 60%) + (UjianSekolah × 40%)
 * =============================================================
 */

use rusqlite::Result as SqlResult;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use log::{info, warn, error, debug};

use crate::models::nilai::{
    self, KomponenNilaiSemester, NilaiAkhirKelulusan,
    validate_kelas_and_semester, extract_tingkat_kelas,
    tentukan_predikat, generate_tahun_ajaran,
};
use crate::database;

// ==========================
// CONSTANTS
// ==========================

const JENIS_NILAI_WAJIB: [&str; 3] = ["Tugas", "UTS", "UAS"];
const JENIS_NILAI_WAJIB_KELULUSAN: [&str; 4] = ["Tugas", "UTS", "UAS", "Ujian Sekolah"];
const TOLERANSI_REMEDIAL: i32 = 5;

// ==========================
// STRUCTS & TYPES
// ==========================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Context {
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KelengkapanNilai {
    pub siswa_id: i64,
    pub mapel_id: i64,
    pub context: Context,
    pub lengkap: bool,
    pub jenis_terisi: Vec<String>,
    pub jenis_kosong: Vec<String>,
    pub total_jenis_wajib: usize,
    pub total_terisi: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RataRataSiswa {
    pub siswa_id: i64,
    pub nis: String,
    pub nisn: String,
    pub nama: String,
    pub kelas: String,
    pub context: Context,
    pub rata_rata: f64,
    pub predikat: String,
    pub status_naik_kelas: String,
    pub statistik: StatistikKenaikan,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikKenaikan {
    pub total_mapel: usize,
    pub mapel_tuntas: usize,
    pub mapel_remedial: usize,
    pub mapel_tidak_tuntas: usize,
    pub mapel_belum_lengkap: usize,
    pub persen_tuntas: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RankingSiswa {
    #[serde(flatten)]
    pub data: RataRataSiswa,
    pub ranking: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikKelas {
    pub filter: FilterStatistik,
    pub siswa: StatistikSiswa,
    pub kenaikan: StatistikKenaikanKelas,
    pub nilai: StatistikNilai,
    pub distribusi_predikat: HashMap<String, usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterStatistik {
    pub kelas: String,
    pub semester: i32,
    pub tahun_ajaran: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikSiswa {
    pub total: usize,
    pub dengan_nilai: usize,
    pub belum_input: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikKenaikanKelas {
    pub naik_kelas: usize,
    pub tidak_naik_kelas: usize,
    pub persen_naik: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikNilai {
    pub rata_rata_kelas: f64,
    pub tertinggi: f64,
    pub terendah: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RekapNilai {
    pub siswa: SiswaInfo,
    pub context: Context,
    pub nilai: NilaiInfo,
    pub status: StatusNilai,
    pub detail_per_mapel: Vec<DetailMapel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiswaInfo {
    pub id: i64,
    pub nis: String,
    pub nisn: String,
    pub nama: String,
    pub kelas: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NilaiInfo {
    pub rata_rata: Option<f64>,
    pub predikat: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusNilai {
    pub naik_kelas: String,
    pub statistik: StatistikKenaikan,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailMapel {
    pub mapel_id: i64,
    pub nama_mapel: String,
    pub nilai_akhir: f64,
    pub komponen: HashMap<String, f64>,
    pub kkm: i32,
    pub predikat: String,
    pub status: String,
    pub kelengkapan: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikKelulusan {
    pub total_siswa: usize,
    pub siswa_lulus: usize,
    pub siswa_tidak_lulus: usize,
    pub persen_lulus: f64,
    pub detail: Vec<DetailKelulusan>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailKelulusan {
    pub siswa_id: i64,
    pub nis: String,
    pub nisn: String,
    pub nama: String,
    pub kelas: String,
    pub status_kelulusan: String,
    pub statistik: StatistikKelulusanSiswa,
    pub hasil_per_mapel: Vec<HasilMapelKelulusan>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatistikKelulusanSiswa {
    pub total_mapel: usize,
    pub mapel_lulus: usize,
    pub mapel_tidak_lulus: usize,
    pub persen_lulus: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HasilMapelKelulusan {
    pub mapel_id: i64,
    pub nama_mapel: String,
    pub nilai_akhir: f64,
    pub predikat: String,
    pub status: String,
}

// ==========================
// HELPER FUNCTIONS
// ==========================

/// Validasi context object
pub fn validate_context(context: &Context) -> Result<(), String> {
    validate_kelas_and_semester(&context.kelas, context.semester)?;
    
    if context.tahun_ajaran.is_empty() {
        return Err("Parameter tahun_ajaran diperlukan".to_string());
    }

    Ok(())
}

/// Normalisasi nama jenis nilai
fn normalize_jenis_nilai(jenis_nilai: &str) -> String {
    let lower = jenis_nilai.to_lowercase().trim().to_string();
    
    match lower.as_str() {
        "tugas" | "uh" | "ulangan harian" => "tugas".to_string(),
        "pts" => "uts".to_string(),
        "pas" => "uas".to_string(),
        "ujian sekolah" | "us" => "ujian sekolah".to_string(),
        _ => lower,
    }
}

// ==========================
// PERHITUNGAN NILAI
// ==========================

/// Hitung nilai kehadiran siswa (dari tabel nilai)
pub fn hitung_nilai_kehadiran(siswa_id: i64, context: &Context) -> SqlResult<f64> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    match nilai::get_kehadiran(siswa_id, &context.kelas, context.semester, &context.tahun_ajaran)? {
        Some(kehadiran_data) => {
            debug!("Nilai kehadiran dihitung: siswa_id={}, nilai={}", siswa_id, kehadiran_data.nilai);
            Ok(kehadiran_data.nilai)
        }
        None => {
            debug!("Tidak ada data kehadiran untuk siswa_id={}", siswa_id);
            Ok(0.0)
        }
    }
}

/// Hitung nilai akhir per semester (akademik + kehadiran)
pub fn hitung_nilai_akhir(
    siswa_id: i64,
    mapel_id: i64,
    context: &Context,
) -> SqlResult<NilaiAkhirDetail> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    // 1. Komponen akademik
    let komponen_akademik = nilai::hitung_komponen_nilai_semester(
        siswa_id,
        mapel_id,
        &context.kelas,
        context.semester,
        &context.tahun_ajaran,
    )?;

    // 2. Ekstrak komponen
    let mut komponen = HashMap::new();
    komponen.insert("tugas".to_string(), *komponen_akademik.rata_per_jenis.get("Tugas").unwrap_or(&0.0));
    komponen.insert("uts".to_string(), *komponen_akademik.rata_per_jenis.get("UTS").unwrap_or(&0.0));
    komponen.insert("uas".to_string(), *komponen_akademik.rata_per_jenis.get("UAS").unwrap_or(&0.0));
    komponen.insert("kehadiran".to_string(), *komponen_akademik.rata_per_jenis.get("Kehadiran").unwrap_or(&0.0));

    Ok(NilaiAkhirDetail {
        siswa_id,
        mapel_id,
        context: context.clone(),
        komponen,
        nilai_akademik: komponen_akademik.nilai_akademik,
        nilai_akhir: komponen_akademik.nilai_akademik,
        predikat: komponen_akademik.predikat_akademik,
        kkm: komponen_akademik.kkm,
        status: komponen_akademik.status,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NilaiAkhirDetail {
    pub siswa_id: i64,
    pub mapel_id: i64,
    pub context: Context,
    pub komponen: HashMap<String, f64>,
    pub nilai_akademik: f64,
    pub nilai_akhir: f64,
    pub predikat: String,
    pub kkm: i32,
    pub status: String,
}

/// Hitung nilai akhir kelulusan (wrapper)
pub fn hitung_nilai_kelulusan(siswa_id: i64, mapel_id: i64) -> SqlResult<NilaiAkhirKelulusan> {
    nilai::hitung_nilai_akhir_kelulusan(siswa_id, mapel_id)
}

// ==========================
// KELENGKAPAN NILAI
// ==========================

/// Cek kelengkapan nilai siswa
pub fn cek_kelengkapan_nilai(
    siswa_id: i64,
    mapel_id: i64,
    context: &Context,
) -> SqlResult<KelengkapanNilai> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let nilai_list = nilai::get_nilai_siswa_by_mapel(
        siswa_id,
        mapel_id,
        Some(&context.kelas),
        Some(context.semester),
        Some(&context.tahun_ajaran),
    )?;

    // Tentukan jenis wajib
    let tingkat = extract_tingkat_kelas(&context.kelas)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;
    
    let jenis_wajib: Vec<String> = if tingkat == 6 && context.semester == 2 {
        JENIS_NILAI_WAJIB_KELULUSAN.iter().map(|s| s.to_string()).collect()
    } else {
        JENIS_NILAI_WAJIB.iter().map(|s| s.to_string()).collect()
    };

    // Jenis yang sudah terisi
    let mut jenis_terisi: Vec<String> = nilai_list
        .iter()
        .map(|n| n.jenis.clone())
        .collect();
    jenis_terisi.sort();
    jenis_terisi.dedup();

    let jenis_terisi_normalized: Vec<String> = jenis_terisi
        .iter()
        .map(|j| normalize_jenis_nilai(j))
        .collect();

    // Jenis yang kosong
    let jenis_kosong: Vec<String> = jenis_wajib
        .iter()
        .filter(|jenis| {
            let normalized = normalize_jenis_nilai(jenis);
            !jenis_terisi_normalized.contains(&normalized)
        })
        .cloned()
        .collect();

    let lengkap = jenis_kosong.is_empty();

    Ok(KelengkapanNilai {
        siswa_id,
        mapel_id,
        context: context.clone(),
        lengkap,
        jenis_terisi,
        jenis_kosong,
        total_jenis_wajib: jenis_wajib.len(),
        total_terisi: jenis_terisi_normalized.len(),
    })
}

// ==========================
// STATUS KETUNTASAN
// ==========================

/// Tentukan status per mapel
pub fn tentukan_status(siswa_id: i64, mapel_id: i64, context: &Context) -> SqlResult<String> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let kelengkapan = cek_kelengkapan_nilai(siswa_id, mapel_id, context)?;

    if kelengkapan.total_terisi == 0 {
        return Ok("Belum Ada Nilai".to_string());
    }

    if !kelengkapan.lengkap {
        return Ok("Belum Lengkap".to_string());
    }

    match hitung_nilai_akhir(siswa_id, mapel_id, context) {
        Ok(komponen_nilai) => {
            let batas_remedial = komponen_nilai.kkm - TOLERANSI_REMEDIAL;

            if komponen_nilai.nilai_akhir >= komponen_nilai.kkm as f64 {
                Ok("Tuntas".to_string())
            } else if komponen_nilai.nilai_akhir >= batas_remedial as f64 {
                Ok("Remedial".to_string())
            } else {
                Ok("Tidak Tuntas".to_string())
            }
        }
        Err(e) => {
            warn!("Gagal tentukan status: siswa_id={}, mapel_id={}, error={}", siswa_id, mapel_id, e);
            Ok("Belum Lengkap".to_string())
        }
    }
}

// ==========================
// KENAIKAN KELAS & KELULUSAN
// ==========================

/// Cek kenaikan kelas siswa
pub fn cek_kenaikan_kelas(siswa_id: i64, context: &Context) -> SqlResult<StatusKenaikanKelasDetail> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let siswa = get_siswa_by_id(siswa_id)?;
    let mapel_list = get_all_mapel()?;
    let mut detail = Vec::new();

    let mut mapel_tuntas = 0;
    let mut mapel_remedial = 0;
    let mut mapel_tidak_tuntas = 0;
    let mut mapel_belum_lengkap = 0;

    for mapel in &mapel_list {
        let kelengkapan = cek_kelengkapan_nilai(siswa_id, mapel.id, context)?;
        let status = tentukan_status(siswa_id, mapel.id, context)?;

        let komponen_nilai = match hitung_nilai_akhir(siswa_id, mapel.id, context) {
            Ok(k) => k,
            Err(_) => {
                debug!("Skip komponen nilai mapel_id={}", mapel.id);
                NilaiAkhirDetail {
                    siswa_id,
                    mapel_id: mapel.id,
                    context: context.clone(),
                    komponen: HashMap::new(),
                    nilai_akademik: 0.0,
                    nilai_akhir: 0.0,
                    predikat: "-".to_string(),
                    kkm: mapel.kkm,
                    status: "Belum Lengkap".to_string(),
                }
            }
        };

        match status.as_str() {
            "Tuntas" => mapel_tuntas += 1,
            "Remedial" => mapel_remedial += 1,
            "Tidak Tuntas" => mapel_tidak_tuntas += 1,
            _ => mapel_belum_lengkap += 1,
        }

        detail.push(DetailMapel {
            mapel_id: mapel.id,
            nama_mapel: mapel.nama.clone(),
            nilai_akhir: komponen_nilai.nilai_akhir,
            komponen: komponen_nilai.komponen,
            kkm: komponen_nilai.kkm,
            predikat: komponen_nilai.predikat,
            status,
            kelengkapan: kelengkapan.lengkap,
        });
    }

    let total_mapel = mapel_list.len();
    let persen_tuntas = if total_mapel > 0 {
        ((mapel_tuntas as f64 / total_mapel as f64) * 100.0).round()
    } else {
        0.0
    };

    let status_naik_kelas = if mapel_belum_lengkap == 0 {
        if persen_tuntas >= 75.0 {
            "Naik Kelas".to_string()
        } else {
            "Tidak Naik Kelas".to_string()
        }
    } else {
        "Belum Lengkap".to_string()
    };

    Ok(StatusKenaikanKelasDetail {
        siswa_id,
        context: context.clone(),
        status_naik_kelas,
        statistik: StatistikKenaikan {
            total_mapel,
            mapel_tuntas,
            mapel_remedial,
            mapel_tidak_tuntas,
            mapel_belum_lengkap,
            persen_tuntas,
        },
        detail,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusKenaikanKelasDetail {
    pub siswa_id: i64,
    pub context: Context,
    pub status_naik_kelas: String,
    pub statistik: StatistikKenaikan,
    pub detail: Vec<DetailMapel>,
}

/// Cek kelulusan siswa (Kelas 6)
pub fn cek_kelulusan_siswa(siswa_id: i64) -> SqlResult<StatusKelulusanDetail> {
    let siswa = get_siswa_by_id(siswa_id)?;
    let mapel_list = get_all_mapel()?;
    let mut detail = Vec::new();

    let mut mapel_lulus = 0;
    let mut mapel_tidak_lulus = 0;

    for mapel in &mapel_list {
        let (nilai_akhir, predikat, status, komponen) = match hitung_nilai_kelulusan(siswa_id, mapel.id) {
            Ok(nk) => {
                if nk.status_kelulusan == "LULUS" {
                    mapel_lulus += 1;
                } else {
                    mapel_tidak_lulus += 1;
                }

                let mut komp = HashMap::new();
                komp.insert("rata_6_semester".to_string(), nk.akumulasi_6_semester.rata_akumulasi);
                komp.insert("ujian_sekolah".to_string(), nk.nilai_ujian_sekolah);

                (nk.nilai_akhir, nk.predikat, nk.status_kelulusan, komp)
            }
            Err(e) => {
                debug!("Skip mapel {}: {}", mapel.nama, e);
                (0.0, "-".to_string(), "Belum Ada Nilai".to_string(), HashMap::new())
            }
        };

        detail.push(DetailMapelKelulusan {
            mapel_id: mapel.id,
            nama_mapel: mapel.nama.clone(),
            nilai_akhir,
            komponen,
            kkm: mapel.kkm,
            predikat,
            status,
        });
    }

    let total_mapel = mapel_list.len();
    let persen_lulus = if total_mapel > 0 {
        ((mapel_lulus as f64 / total_mapel as f64) * 100.0).round()
    } else {
        0.0
    };

    let status_kelulusan = if mapel_tidak_lulus == 0 && mapel_lulus > 0 {
        "LULUS".to_string()
    } else {
        "TIDAK LULUS".to_string()
    };

    Ok(StatusKelulusanDetail {
        siswa_id,
        status_kelulusan,
        statistik: StatistikKelulusanSiswa {
            total_mapel,
            mapel_lulus,
            mapel_tidak_lulus,
            persen_lulus,
        },
        detail,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusKelulusanDetail {
    pub siswa_id: i64,
    pub status_kelulusan: String,
    pub statistik: StatistikKelulusanSiswa,
    pub detail: Vec<DetailMapelKelulusan>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailMapelKelulusan {
    pub mapel_id: i64,
    pub nama_mapel: String,
    pub nilai_akhir: f64,
    pub komponen: HashMap<String, f64>,
    pub kkm: i32,
    pub predikat: String,
    pub status: String,
}

// ==========================
// RATA-RATA & RANKING
// ==========================

/// Hitung rata-rata nilai siswa
pub fn hitung_rata_rata(siswa_id: i64, context: &Context) -> SqlResult<Option<f64>> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let mapel_list = get_all_mapel()?;
    if mapel_list.is_empty() {
        return Ok(None);
    }

    let mut total_nilai = 0.0;
    let mut jumlah_mapel = 0;

    for mapel in &mapel_list {
        if let Ok(komponen_nilai) = hitung_nilai_akhir(siswa_id, mapel.id, context) {
            if komponen_nilai.nilai_akhir > 0.0 {
                total_nilai += komponen_nilai.nilai_akhir;
                jumlah_mapel += 1;
            }
        }
    }

    if jumlah_mapel == 0 {
        return Ok(None);
    }

    let rata = (total_nilai / jumlah_mapel as f64 * 100.0).round() / 100.0;
    Ok(Some(rata))
}

/// Ambil semua rata-rata siswa dengan filter
pub fn get_all_rata_rata(kelas: Option<&str>, semester: i32, tahun_ajaran: &str) -> SqlResult<Vec<RataRataSiswa>> {
    let context_partial = Context {
        kelas: kelas.unwrap_or("").to_string(),
        semester,
        tahun_ajaran: tahun_ajaran.to_string(),
    };

    // Get siswa list
    let siswa_list = if let Some(k) = kelas {
        get_siswa_by_kelas(k)?
    } else {
        get_all_siswa()?
    };

    let mut hasil = Vec::new();

    for siswa in siswa_list {
        let context = Context {
            kelas: siswa.kelas.clone(),
            semester,
            tahun_ajaran: tahun_ajaran.to_string(),
        };

        if let Some(rata_rata) = hitung_rata_rata(siswa.id, &context)? {
            let predikat = tentukan_predikat(rata_rata)?;
            let status_kenaikan = cek_kenaikan_kelas(siswa.id, &context)?;

            hasil.push(RataRataSiswa {
                siswa_id: siswa.id,
                nis: siswa.nis,
                nisn: siswa.nisn,
                nama: siswa.nama,
                kelas: siswa.kelas,
                context: context_partial.clone(),
                rata_rata,
                predikat,
                status_naik_kelas: status_kenaikan.status_naik_kelas,
                statistik: status_kenaikan.statistik,
            });
        }
    }

    info!("Berhasil hitung {} siswa", hasil.len());
    Ok(hasil)
}

/// Hitung ranking siswa
pub fn hitung_ranking(kelas: Option<&str>, semester: i32, tahun_ajaran: &str) -> SqlResult<Vec<RankingSiswa>> {
    let mut data = get_all_rata_rata(kelas, semester, tahun_ajaran)?;

    // Sort: nilai tertinggi → terendah, lalu nama A-Z
    data.sort_by(|a, b| {
        if (a.rata_rata - b.rata_rata).abs() < 0.01 {
            a.nama.cmp(&b.nama)
        } else {
            b.rata_rata.partial_cmp(&a.rata_rata).unwrap_or(std::cmp::Ordering::Equal)
        }
    });

    // Tambahkan ranking dengan tie handling
    let mut hasil: Vec<RankingSiswa> = Vec::new();
    let mut current_rank = 1;

    for (index, item) in data.iter().enumerate() {
        let ranking = if index > 0 && (data[index - 1].rata_rata - item.rata_rata).abs() < 0.01 {
            hasil[index - 1].ranking
        } else {
            current_rank
        };

        hasil.push(RankingSiswa {
            data: item.clone(),
            ranking,
        });

        current_rank += 1;
    }

    info!("Ranking berhasil dihitung untuk {} siswa", hasil.len());
    Ok(hasil)
}

/// Ambil top N siswa
pub fn get_top_siswa(kelas: Option<&str>, semester: i32, tahun_ajaran: &str, limit: usize) -> SqlResult<Vec<RankingSiswa>> {
    let ranking = hitung_ranking(kelas, semester, tahun_ajaran)?;
    Ok(ranking.into_iter().take(limit).collect())
}

// ==========================
// STATISTIK
// ==========================

/// Hitung statistik untuk filter tertentu
pub fn hitung_statistik(kelas: Option<&str>, semester: i32, tahun_ajaran: &str) -> SqlResult<StatistikKelas> {
    let all_rata_rata = get_all_rata_rata(kelas, semester, tahun_ajaran)?;

    let total_siswa_kelas = if let Some(k) = kelas {
        get_siswa_by_kelas(k)?.len()
    } else {
        get_all_siswa()?.len()
    };

    if all_rata_rata.is_empty() {
        return Ok(StatistikKelas {
            filter: FilterStatistik {
                kelas: kelas.unwrap_or("Semua").to_string(),
                semester,
                tahun_ajaran: tahun_ajaran.to_string(),
            },
            siswa: StatistikSiswa {
                total: total_siswa_kelas,
                dengan_nilai: 0,
                belum_input: total_siswa_kelas,
            },
            kenaikan: StatistikKenaikanKelas {
                naik_kelas: 0,
                tidak_naik_kelas: 0,
                persen_naik: 0.0,
            },
            nilai: StatistikNilai {
                rata_rata_kelas: 0.0,
                tertinggi: 0.0,
                terendah: 0.0,
            },
            distribusi_predikat: HashMap::new(),
        });
    }

    let siswa_dengan_nilai = all_rata_rata.len();
    let siswa_naik_kelas = all_rata_rata.iter().filter(|s| s.status_naik_kelas == "Naik Kelas").count();
    let siswa_tidak_naik_kelas = all_rata_rata.iter().filter(|s| s.status_naik_kelas == "Tidak Naik Kelas").count();

    let nilai_list: Vec<f64> = all_rata_rata.iter().map(|s| s.rata_rata).collect();
    let total_nilai: f64 = nilai_list.iter().sum();
    let rata_rata_kelas = (total_nilai / nilai_list.len() as f64 * 100.0).round() / 100.0;
    let nilai_tertinggi = nilai_list.iter().cloned().fold(0.0, f64::max);
    let nilai_terendah = nilai_list.iter().cloned().fold(100.0, f64::min);

    let mut distribusi_predikat = HashMap::new();
    distribusi_predikat.insert("A".to_string(), 0);
    distribusi_predikat.insert("B".to_string(), 0);
    distribusi_predikat.insert("C".to_string(), 0);
    distribusi_predikat.insert("D".to_string(), 0);
    distribusi_predikat.insert("E".to_string(), 0);

    for siswa in &all_rata_rata {
        *distribusi_predikat.entry(siswa.predikat.clone()).or_insert(0) += 1;
    }

    Ok(StatistikKelas {
        filter: FilterStatistik {
            kelas: kelas.unwrap_or("Semua").to_string(),
            semester,
            tahun_ajaran: tahun_ajaran.to_string(),
        },
        siswa: StatistikSiswa {
            total: total_siswa_kelas,
            dengan_nilai: siswa_dengan_nilai,
            belum_input: total_siswa_kelas - siswa_dengan_nilai,
        },
        kenaikan: StatistikKenaikanKelas {
            naik_kelas: siswa_naik_kelas,
            tidak_naik_kelas: siswa_tidak_naik_kelas,
            persen_naik: if siswa_dengan_nilai > 0 {
                ((siswa_naik_kelas as f64 / siswa_dengan_nilai as f64) * 100.0).round()
            } else {
                0.0
            },
        },
        nilai: StatistikNilai {
            rata_rata_kelas,
            tertinggi: nilai_tertinggi,
            terendah: nilai_terendah,
        },
        distribusi_predikat,
    })
}

/// Statistik kelulusan (Kelas 6)
pub fn hitung_statistik_kelulusan() -> SqlResult<StatistikKelulusan> {
    let siswa_kelas_6: Vec<_> = get_all_siswa()?
        .into_iter()
        .filter(|s| {
            if let Ok(tingkat) = extract_tingkat_kelas(&s.kelas) {
                tingkat == 6
            } else {
                false
            }
        })
        .collect();

    if siswa_kelas_6.is_empty() {
        return Ok(StatistikKelulusan {
            total_siswa: 0,
            siswa_lulus: 0,
            siswa_tidak_lulus: 0,
            persen_lulus: 0.0,
            detail: Vec::new(),
        });
    }

    let mut siswa_lulus = 0;
    let mut siswa_tidak_lulus = 0;
    let mut detail = Vec::new();

    for siswa in &siswa_kelas_6 {
        match nilai::cek_kelulusan(siswa.id) {
            Ok(status_kelulusan) => {
                if status_kelulusan.status_kelulusan == "LULUS" {
                    siswa_lulus += 1;
                } else {
                    siswa_tidak_lulus += 1;
                }

                let hasil_per_mapel: Vec<HasilMapelKelulusan> = status_kelulusan
                    .hasil_per_mapel
                    .iter()
                    .map(|h| HasilMapelKelulusan {
                        mapel_id: h.mapel_id,
                        nama_mapel: h.nama_mapel.clone(),
                        nilai_akhir: h.nilai_akhir,
                        predikat: h.predikat.clone(),
                        status: h.status.clone(),
                    })
                    .collect();

                detail.push(DetailKelulusan {
                    siswa_id: siswa.id,
                    nis: siswa.nis.clone(),
                    nisn: siswa.nisn.clone(),
                    nama: siswa.nama.clone(),
                    kelas: siswa.kelas.clone(),
                    status_kelulusan: status_kelulusan.status_kelulusan,
                    statistik: StatistikKelulusanSiswa {
                        total_mapel: status_kelulusan.total_mapel,
                        mapel_lulus: status_kelulusan.jumlah_lulus,
                        mapel_tidak_lulus: status_kelulusan.jumlah_tidak_lulus,
                        persen_lulus: status_kelulusan.persen_lulus,
                    },
                    hasil_per_mapel,
                });
            }
            Err(e) => {
                debug!("Skip siswa {}: {}", siswa.id, e);
                detail.push(DetailKelulusan {
                    siswa_id: siswa.id,
                    nis: siswa.nis.clone(),
                    nisn: siswa.nisn.clone(),
                    nama: siswa.nama.clone(),
                    kelas: siswa.kelas.clone(),
                    status_kelulusan: "ERROR".to_string(),
                    statistik: StatistikKelulusanSiswa {
                        total_mapel: 0,
                        mapel_lulus: 0,
                        mapel_tidak_lulus: 0,
                        persen_lulus: 0.0,
                    },
                    hasil_per_mapel: Vec::new(),
                });
            }
        }
    }

    let total_siswa = siswa_kelas_6.len();
    let persen_lulus = if total_siswa > 0 {
        ((siswa_lulus as f64 / total_siswa as f64) * 100.0).round()
    } else {
        0.0
    };

    Ok(StatistikKelulusan {
        total_siswa,
        siswa_lulus,
        siswa_tidak_lulus,
        persen_lulus,
        detail,
    })
}

// ==========================
// REKAP & LAPORAN
// ==========================

/// Generate rekap nilai lengkap
pub fn get_rekap_nilai(siswa_id: i64, context: &Context) -> SqlResult<RekapNilai> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let siswa = get_siswa_by_id(siswa_id)?;
    let rata_rata = hitung_rata_rata(siswa_id, context)?;
    let predikat = if let Some(rr) = rata_rata {
        tentukan_predikat(rr)?
    } else {
        "-".to_string()
    };
    let status_kenaikan = cek_kenaikan_kelas(siswa_id, context)?;

    Ok(RekapNilai {
        siswa: SiswaInfo {
            id: siswa.id,
            nis: siswa.nis,
            nisn: siswa.nisn,
            nama: siswa.nama,
            kelas: siswa.kelas,
        },
        context: context.clone(),
        nilai: NilaiInfo {
            rata_rata,
            predikat,
        },
        status: StatusNilai {
            naik_kelas: status_kenaikan.status_naik_kelas,
            statistik: status_kenaikan.statistik,
        },
        detail_per_mapel: status_kenaikan.detail,
    })
}

/// Generate rekap kelulusan
pub fn get_rekap_kelulusan(siswa_id: i64) -> SqlResult<RekapKelulusan> {
    let siswa = get_siswa_by_id(siswa_id)?;
    let status_kelulusan = cek_kelulusan_siswa(siswa_id)?;

    Ok(RekapKelulusan {
        siswa: SiswaInfo {
            id: siswa.id,
            nis: siswa.nis,
            nisn: siswa.nisn,
            nama: siswa.nama,
            kelas: siswa.kelas,
        },
        status: StatusKelulusanInfo {
            kelulusan: status_kelulusan.status_kelulusan,
            statistik: status_kelulusan.statistik,
        },
        detail_per_mapel: status_kelulusan.detail,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RekapKelulusan {
    pub siswa: SiswaInfo,
    pub status: StatusKelulusanInfo,
    pub detail_per_mapel: Vec<DetailMapelKelulusan>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusKelulusanInfo {
    pub kelulusan: String,
    pub statistik: StatistikKelulusanSiswa,
}

// ==========================
// BATCH OPERATIONS
// ==========================

/// Hitung nilai akhir untuk semua siswa di kelas tertentu
pub fn batch_hitung_nilai(context: &Context) -> SqlResult<Vec<BatchNilaiSiswa>> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let siswa_list = get_siswa_by_kelas(&context.kelas)?;
    let mapel_list = get_all_mapel()?;
    let mut hasil = Vec::new();

    for siswa in siswa_list {
        let mut nilai_per_mapel = Vec::new();

        for mapel in &mapel_list {
            if let Ok(komponen_nilai) = hitung_nilai_akhir(siswa.id, mapel.id, context) {
                let status = tentukan_status(siswa.id, mapel.id, context)?;

                nilai_per_mapel.push(NilaiPerMapelBatch {
                    mapel_id: mapel.id,
                    nama_mapel: mapel.nama.clone(),
                    nilai_akhir: komponen_nilai.nilai_akhir,
                    komponen: komponen_nilai.komponen,
                    predikat: komponen_nilai.predikat,
                    status,
                });
            }
        }

        if !nilai_per_mapel.is_empty() {
            let rata_rata = hitung_rata_rata(siswa.id, context)?;
            let status_kenaikan = cek_kenaikan_kelas(siswa.id, context)?;

            hasil.push(BatchNilaiSiswa {
                siswa_id: siswa.id,
                nis: siswa.nis,
                nama: siswa.nama,
                rata_rata,
                status_naik_kelas: status_kenaikan.status_naik_kelas,
                nilai_per_mapel,
            });
        }
    }

    info!("Batch hitung nilai: {} siswa diproses", hasil.len());
    Ok(hasil)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchNilaiSiswa {
    pub siswa_id: i64,
    pub nis: String,
    pub nama: String,
    pub rata_rata: Option<f64>,
    pub status_naik_kelas: String,
    pub nilai_per_mapel: Vec<NilaiPerMapelBatch>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NilaiPerMapelBatch {
    pub mapel_id: i64,
    pub nama_mapel: String,
    pub nilai_akhir: f64,
    pub komponen: HashMap<String, f64>,
    pub predikat: String,
    pub status: String,
}

/// Cek kelengkapan nilai untuk semua siswa di kelas
pub fn batch_cek_kelengkapan(context: &Context) -> SqlResult<Vec<BatchKelengkapanSiswa>> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let siswa_list = get_siswa_by_kelas(&context.kelas)?;
    let mapel_list = get_all_mapel()?;
    let mut hasil = Vec::new();

    for siswa in siswa_list {
        let mut kelengkapan_per_mapel = Vec::new();
        let mut total_lengkap = 0;
        let mut total_mapel = 0;

        for mapel in &mapel_list {
            if let Ok(kelengkapan) = cek_kelengkapan_nilai(siswa.id, mapel.id, context) {
                kelengkapan_per_mapel.push(KelengkapanPerMapel {
                    mapel_id: mapel.id,
                    nama_mapel: mapel.nama.clone(),
                    lengkap: kelengkapan.lengkap,
                    jenis_kosong: kelengkapan.jenis_kosong,
                });

                total_mapel += 1;
                if kelengkapan.lengkap {
                    total_lengkap += 1;
                }
            }
        }

        let persen_lengkap = if total_mapel > 0 {
            ((total_lengkap as f64 / total_mapel as f64) * 100.0).round()
        } else {
            0.0
        };

        hasil.push(BatchKelengkapanSiswa {
            siswa_id: siswa.id,
            nis: siswa.nis,
            nama: siswa.nama,
            total_mapel,
            mapel_lengkap: total_lengkap,
            persen_lengkap,
            detail: kelengkapan_per_mapel,
        });
    }

    info!("Batch cek kelengkapan: {} siswa diproses", hasil.len());
    Ok(hasil)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchKelengkapanSiswa {
    pub siswa_id: i64,
    pub nis: String,
    pub nama: String,
    pub total_mapel: usize,
    pub mapel_lengkap: usize,
    pub persen_lengkap: f64,
    pub detail: Vec<KelengkapanPerMapel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KelengkapanPerMapel {
    pub mapel_id: i64,
    pub nama_mapel: String,
    pub lengkap: bool,
    pub jenis_kosong: Vec<String>,
}

// ==========================
// ANALISIS KELAS
// ==========================

/// Analisis komprehensif per kelas
pub fn analisis_kelas(context: &Context) -> SqlResult<AnalisisKelasLengkap> {
    validate_context(context)
        .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

    let statistik = hitung_statistik(Some(&context.kelas), context.semester, &context.tahun_ajaran)?;
    let ranking = hitung_ranking(Some(&context.kelas), context.semester, &context.tahun_ajaran)?;
    
    let top_5: Vec<_> = ranking.iter().take(5).cloned().collect();
    let bottom_5: Vec<_> = ranking.iter().rev().take(5).cloned().collect();

    // Analisis per mapel
    let mapel_list = get_all_mapel()?;
    let siswa_list = get_siswa_by_kelas(&context.kelas)?;
    let mut analisis_mapel = Vec::new();

    for mapel in &mapel_list {
        let mut total_nilai = 0.0;
        let mut jumlah_siswa = 0;
        let mut siswa_tuntas = 0;

        for siswa in &siswa_list {
            if let Ok(komponen_nilai) = hitung_nilai_akhir(siswa.id, mapel.id, context) {
                if let Ok(status) = tentukan_status(siswa.id, mapel.id, context) {
                    if komponen_nilai.nilai_akhir > 0.0 {
                        total_nilai += komponen_nilai.nilai_akhir;
                        jumlah_siswa += 1;

                        if status == "Tuntas" {
                            siswa_tuntas += 1;
                        }
                    }
                }
            }
        }

        if jumlah_siswa > 0 {
            let rata_rata = (total_nilai / jumlah_siswa as f64 * 100.0).round() / 100.0;
            let persen_tuntas = ((siswa_tuntas as f64 / jumlah_siswa as f64) * 100.0).round();

            analisis_mapel.push(AnalisisMapel {
                mapel_id: mapel.id,
                nama_mapel: mapel.nama.clone(),
                kkm: mapel.kkm,
                rata_rata,
                jumlah_siswa,
                siswa_tuntas,
                persen_tuntas,
            });
        }
    }

    // Sort mapel by persen_tuntas (terendah dulu = butuh perhatian)
    analisis_mapel.sort_by(|a, b| a.persen_tuntas.partial_cmp(&b.persen_tuntas).unwrap());

    let mapel_perlu_perhatian: Vec<_> = analisis_mapel
        .iter()
        .filter(|m| m.persen_tuntas < 75.0)
        .take(3)
        .cloned()
        .collect();

    let siswa_perlu_bimbingan: Vec<_> = bottom_5
        .iter()
        .map(|s| SiswaPerluBimbingan {
            siswa_id: s.data.siswa_id,
            nama: s.data.nama.clone(),
            rata_rata: s.data.rata_rata,
            status: s.data.status_naik_kelas.clone(),
        })
        .collect();

    Ok(AnalisisKelasLengkap {
        context: context.clone(),
        statistik_umum: statistik,
        top_5_siswa: top_5,
        bottom_5_siswa: bottom_5,
        analisis_per_mapel: analisis_mapel,
        rekomendasi: Rekomendasi {
            mapel_perlu_perhatian,
            siswa_perlu_bimbingan,
        },
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalisisKelasLengkap {
    pub context: Context,
    pub statistik_umum: StatistikKelas,
    pub top_5_siswa: Vec<RankingSiswa>,
    pub bottom_5_siswa: Vec<RankingSiswa>,
    pub analisis_per_mapel: Vec<AnalisisMapel>,
    pub rekomendasi: Rekomendasi,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalisisMapel {
    pub mapel_id: i64,
    pub nama_mapel: String,
    pub kkm: i32,
    pub rata_rata: f64,
    pub jumlah_siswa: usize,
    pub siswa_tuntas: usize,
    pub persen_tuntas: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rekomendasi {
    pub mapel_perlu_perhatian: Vec<AnalisisMapel>,
    pub siswa_perlu_bimbingan: Vec<SiswaPerluBimbingan>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiswaPerluBimbingan {
    pub siswa_id: i64,
    pub nama: String,
    pub rata_rata: f64,
    pub status: String,
}

// ==========================
// HELPER FUNCTIONS - DATABASE QUERIES
// ==========================

#[derive(Debug, Clone)]
struct SiswaSimple {
    id: i64,
    nis: String,
    nisn: String,
    nama: String,
    kelas: String,
}

#[derive(Debug, Clone)]
struct MapelSimple {
    id: i64,
    nama: String,
    kkm: i32,
}

fn get_siswa_by_id(siswa_id: i64) -> SqlResult<SiswaSimple> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        conn.query_row(
            "SELECT id, nis, nisn, nama, kelas FROM siswa WHERE id = ?1",
            rusqlite::params![siswa_id],
            |row| {
                Ok(SiswaSimple {
                    id: row.get(0)?,
                    nis: row.get(1)?,
                    nisn: row.get(2)?,
                    nama: row.get(3)?,
                    kelas: row.get(4)?,
                })
            },
        )
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

fn get_all_siswa() -> SqlResult<Vec<SiswaSimple>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare("SELECT id, nis, nisn, nama, kelas FROM siswa")?;
        let rows = stmt.query_map([], |row| {
            Ok(SiswaSimple {
                id: row.get(0)?,
                nis: row.get(1)?,
                nisn: row.get(2)?,
                nama: row.get(3)?,
                kelas: row.get(4)?,
            })
        })?;
        rows.collect()
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

fn get_siswa_by_kelas(kelas: &str) -> SqlResult<Vec<SiswaSimple>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare("SELECT id, nis, nisn, nama, kelas FROM siswa WHERE kelas = ?1")?;
        let rows = stmt.query_map(rusqlite::params![kelas], |row| {
            Ok(SiswaSimple {
                id: row.get(0)?,
                nis: row.get(1)?,
                nisn: row.get(2)?,
                nama: row.get(3)?,
                kelas: row.get(4)?,
            })
        })?;
        rows.collect()
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}

fn get_all_mapel() -> SqlResult<Vec<MapelSimple>> {
    let db = database::get_db();
    let db_lock = db.lock().unwrap();
    
    if let Some(ref conn) = *db_lock {
        let mut stmt = conn.prepare("SELECT id, nama_mapel, kkm FROM mapel")?;
        let rows = stmt.query_map([], |row| {
            Ok(MapelSimple {
                id: row.get(0)?,
                nama: row.get(1)?,
                kkm: row.get(2)?,
            })
        })?;
        rows.collect()
    } else {
        Err(rusqlite::Error::InvalidQuery)
    }
}
