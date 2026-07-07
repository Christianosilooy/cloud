from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Laporan-Cloud-Task-Manager.pdf"


def paragraph(text, style):
    return Paragraph(text.replace("\n", "<br/>"), style)


def build():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            spaceBefore=12,
            spaceAfter=6,
            textColor=colors.HexColor("#15584f"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodySmall",
            parent=styles["BodyText"],
            fontSize=9,
            leading=13,
        )
    )

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=1.7 * cm,
        leftMargin=1.7 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title="Laporan Cloud Task Manager",
    )

    story = [
        Paragraph("Laporan Proyek Aplikasi Berbasis Cloud", styles["Title"]),
        Paragraph("Cloud Task Manager", styles["Heading1"]),
        paragraph(
            "Mata Kuliah: Arsitektur Perangkat Lunak dan Data Berbasis Cloud<br/>"
            "Program Studi: Magister Teknologi Informasi<br/>"
            "Tenggat: 18 Juli 2026 pukul 23:59",
            styles["BodySmall"],
        ),
        Spacer(1, 8),
    ]

    sections = [
        (
            "1. Deskripsi Aplikasi",
            "Cloud Task Manager adalah aplikasi web untuk mengelola tugas proyek secara online. "
            "Pengguna dapat menambah, melihat, mengubah, menghapus, dan memfilter tugas berdasarkan status. "
            "Aplikasi ini dipilih karena mewakili kebutuhan kolaborasi proyek dan mudah dievaluasi melalui fitur CRUD.",
        ),
        (
            "2. Pengguna Aplikasi",
            "Pengguna utama adalah anggota kelompok atau tim proyek. Setiap anggota dapat mencatat pekerjaan, "
            "menentukan penanggung jawab, memberi prioritas, mengatur tenggat, dan memantau progres.",
        ),
        (
            "3. Teknologi yang Digunakan",
            "Frontend menggunakan HTML, CSS, dan JavaScript. Backend/API menggunakan Node.js serverless endpoint "
            "/api/tasks. Database cloud menggunakan Supabase PostgreSQL melalui REST API. Deployment disiapkan untuk "
            "Vercel, Render, atau Railway dengan environment variable SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.",
        ),
        (
            "4. Rancangan Arsitektur Cloud",
            "Alur request: pengguna membuka aplikasi melalui browser, frontend memanggil API /api/tasks, backend "
            "melakukan validasi dan logic service, lalu data disimpan atau dibaca dari Supabase PostgreSQL. Untuk "
            "pengujian lokal, tersedia fallback data/tasks.json agar aplikasi dapat berjalan tanpa koneksi cloud.",
        ),
        (
            "5. Diagram Arsitektur",
            "Browser Pengguna -> Frontend Web -> Backend/API /api/tasks -> Validasi dan Service Logic -> "
            "Supabase PostgreSQL Cloud Database. Backend menyembunyikan service role key agar tidak terekspos ke browser.",
        ),
        (
            "6. Penjelasan Fitur",
            "Fitur utama meliputi create task, read task, update task, delete task, filter status, ringkasan jumlah tugas, "
            "validasi judul minimal 3 karakter, validasi status, validasi prioritas, dan validasi format tanggal.",
        ),
        (
            "7. Dokumentasi Deployment",
            "Langkah deployment: buat project Supabase, jalankan docs/schema.sql, push source code ke GitHub, import "
            "repository ke Vercel, isi environment variable SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY, deploy aplikasi, "
            "lalu uji halaman utama serta endpoint /api/tasks.",
        ),
        (
            "8. Evaluasi Arsitektur Cloud",
            "Skalabilitas cukup baik karena frontend statis dan API serverless dapat diskalakan oleh platform cloud. "
            "Efisiensi resource baik karena aplikasi ringan dan hanya memproses request CRUD. Keamanan dasar diterapkan "
            "melalui validasi input, akses database lewat backend, dan service role key disimpan sebagai environment variable. "
            "Keterbatasan saat ini adalah belum ada autentikasi pengguna dan audit log. Pengembangan berikutnya dapat "
            "menambahkan login, role anggota, notifikasi, dashboard analitik, dan attachment file.",
        ),
        (
            "9. Kerja Sama Tim",
            "Pembagian tugas yang disarankan: Anggota 1 bertanggung jawab pada analisis kebutuhan dan laporan; "
            "Anggota 2 bertanggung jawab pada frontend dan pengalaman pengguna; Anggota 3 bertanggung jawab pada backend, "
            "database, deployment, dan pengujian. Koordinasi dilakukan melalui repository GitHub, pembagian issue, dan "
            "review progres harian.",
        ),
    ]

    for title, body in sections:
        story.append(Paragraph(title, styles["Section"]))
        story.append(paragraph(body, styles["BodySmall"]))

    story.append(Paragraph("10. Hasil Pengujian", styles["Section"]))
    table_data = [
        ["No", "Skenario", "Input", "Hasil yang Diharapkan", "Status"],
        ["1", "Create tugas valid", "Judul, status, prioritas valid", "Data tersimpan dan tampil di daftar", "Berhasil"],
        ["2", "Create tugas tidak valid", "Judul 1 karakter", "API menolak dengan pesan validasi", "Berhasil"],
        ["3", "Read daftar tugas", "GET /api/tasks", "API mengembalikan array data", "Berhasil"],
        ["4", "Update tugas", "Ubah status menjadi done", "Data berubah dan updated_at diperbarui", "Berhasil"],
        ["5", "Delete tugas", "ID tugas valid", "Data terhapus dari penyimpanan", "Berhasil"],
        ["6", "Koneksi database/cloud storage", "Supabase env aktif", "API membaca/menulis ke PostgreSQL", "Siap diuji saat deploy"],
        ["7", "Akses setelah deploy", "URL Vercel", "Halaman dan API dapat diakses online", "Siap diuji saat deploy"],
    ]
    table = Table(table_data, colWidths=[0.8 * cm, 4 * cm, 4 * cm, 5 * cm, 3 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#15584f")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c9d3df")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("LEADING", (0, 0), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f7fb")]),
            ]
        )
    )
    story.append(table)

    story.append(Paragraph("11. Link Luaran", styles["Section"]))
    story.append(
        paragraph(
            "Link aplikasi deploy: isi setelah deploy ke Vercel/Render/Railway.<br/>"
            "Link repository kode program: isi setelah push ke GitHub.<br/>"
            "Source code, dokumentasi, SQL schema, dan laporan PDF tersedia dalam folder proyek ini.",
            styles["BodySmall"],
        )
    )

    doc.build(story)


if __name__ == "__main__":
    build()
    print(OUTPUT)
