## 📂 **Struktur folder lengkap dari src-tauri:**
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

## 📁 **Struktur root folder projek:**

ppDesktop_PenilaianRekapNilai-withRust/
├── build/
├── node_modules/
├── package.json
├── package-lock.json
├── README.md
├── src-tauri/
├── vite.config.js
└── UI/
    ├── assets/
    ├── CSS/
    ├── index.html
    ├── index-absensi.html
    ├── index-dataSiswa.html
    ├── index-kelulusan.html
    ├── index-mapel.html
    ├── index-penilaian.html
    ├── index-rekapNilai.html
    ├── pengguna.html
    └── js/
        ├── absensi.js
        ├── closeWindow.js
        ├── dataSiswa.js
        ├── index.js
        ├── kelulusan.js
        ├── mapel.js
        ├── mapelUI.js
        ├── namaUser.js
        ├── penilaian.js
        └── rekapNilai.js
        

==============================================================
HOW TO RUN THIS APP
==============================================================

Just type npm run tauri dev in your console, terminal, CMD, notepad (just joke 😂) or any console you have.

==============================================================
CARA MEMBANGUN APLIKASI DESKTOP SISPENILAN
==============================================================

1. Build frontend (output ke UI/dist/)
- npm run build

2. Build Tauri jadi .exe
- npm run tauri build

==============================================================
HAL-HAL YANG PERLU DI PERHATIKAN
==============================================================

- Pastikan PC/Laptop kamu sudah ada node.js versi 20 minimal dan rust lalu Desktop development with C#/C++ <== ini bisa kamu unduh dari visual studio installer biasanya sudah include kalau kamu install rust lebih dulu.

- Ini projek yang sepenuhnya open source jadi kamu bebas mengambil/menjarah :) memperbaiki, meningkatkan, memproduksi massal untuk tujuan komersil (Asal legal!), dan atau mempelajarinya.


Written 🖋️ by: Yu4ha []~(￣▽￣)~*


log date: 23, November/11 | 2025