## 📁 **Struktur Folder Lengkap:**
```
src-tauri/
├── Cargo.toml              ⭐ Dependencies
├── tauri.conf.json         ⭐ Configuration
├── build.rs                ⭐ Build script
└── src/
    ├── main.rs             ⭐ Entry point (code di atas)
    │
    ├── database.rs         ⭐ Database connection & init
    │
    ├── models/
    │   ├── mod.rs          ⭐ Module export
    │   ├── siswa.rs        ⭐ Siswa struct & DB operations
    │   ├── mapel.rs        ⭐ Mapel struct & DB operations
    │   ├── nilai.rs        ⭐ Nilai struct & DB operations
    │   └── absensi.rs      ⭐ Absensi struct & DB operations
    │
    ├── commands/
    │   ├── mod.rs          ⭐ Module export
    │   ├── siswa.rs        ⭐ Siswa Tauri commands
    │   ├── mapel.rs        ⭐ Mapel Tauri commands
    │   ├── nilai.rs        ⭐ Nilai Tauri commands
    │   ├── absensi.rs      ⭐ Absensi Tauri commands
    │   ├── kehadiran.rs    ⭐ Kehadiran Tauri commands
    │   └── penilaian.rs    ⭐ Penilaian logic commands
    │
    └── logic/
        ├── mod.rs          ⭐ Module export
        └── penilaian.rs    ⭐ Business logic (ranking, kelulusan)
