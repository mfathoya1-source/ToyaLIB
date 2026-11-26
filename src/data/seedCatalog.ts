import type { BookCategory, BookFormat } from '../types/library';

export interface SeedBookInput {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  publisher: string;
  year: number;
  synopsis: string;
  coverUrl: string;
  format: BookFormat;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  borrowCount: number;
}

export const SEED_BOOKS: SeedBookInput[] = [
  {
    id: 'bk_arsitektur_sistem',
    title: 'Geometri & Arsitektur Sistem Terdistribusi',
    author: 'Dr. Raka Pradipta',
    isbn: '978-602-441-102-8',
    category: 'Teknologi',
    publisher: 'Penerbit Informatika Nusantara',
    year: 2025,
    synopsis:
      'Panduan komprehensif merancang sistem perangkat lunak berskala besar, konsistensi data real-time, replikasi basis data, serta ketahanan layanan cloud modern.',
    coverUrl: '/src/assets/images/cover_arsitektur_sistem_1795657835690.jpg',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak A-01 · Lantai 2',
    totalCopies: 6,
    availableCopies: 5,
    borrowCount: 38,
  },
  {
    id: 'bk_sastra_nusantara',
    title: 'Kronik Kepulauan: Antologi Sastra Maritim',
    author: 'Ratna Ayu Lestari',
    isbn: '978-602-441-214-8',
    category: 'Sastra',
    publisher: 'Balai Pustaka Aksara',
    year: 2024,
    synopsis:
      'Kumpulan prosa liris dan esai budaya yang merekam perjalanan jalur rempah, tradisi tulis pesisir, serta dialog sastra klasik dan kontemporer Nusantara.',
    coverUrl: '/src/assets/images/cover_sastra_nusantara_1795657835414.jpg',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak B-04 · Lantai 1',
    totalCopies: 5,
    availableCopies: 4,
    borrowCount: 29,
  },
  {
    id: 'bk_kosmologi_sains',
    title: 'Atlas Kosmologi & Mekanika Benda Langit',
    author: 'Prof. Hendra Wijaya',
    isbn: '978-602-441-309-1',
    category: 'Sains',
    publisher: 'Lembaga Sains Indonesia',
    year: 2025,
    synopsis:
      'Eksplorasi mendalam tentang dinamika orbit, observatorium modern di ekuator, astrofisika komputasional, dan pemetaan katalog bintang belahan selatan.',
    coverUrl: '/src/assets/images/cover_kosmologi_sains_1795657836014.jpg',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak C-02 · Lantai 2',
    totalCopies: 4,
    availableCopies: 3,
    borrowCount: 24,
  },
  {
    id: 'bk_sejarah_maritim',
    title: 'Kartografi Samudra & Jalur Niaga 1400–1800',
    author: 'Dr. Bambang Suryonegoro',
    isbn: '978-602-441-418-0',
    category: 'Sejarah',
    publisher: 'Arsip Sejarah Merdeka',
    year: 2023,
    synopsis:
      'Studi arsip peta kuno, catatan pelabuhan dagang Asia Tenggara, serta transformasi teknologi navigasi pelayaran lintas benua selama empat abad.',
    coverUrl: '/src/assets/images/cover_sejarah_maritim_1795657837121.jpg',
    format: 'Cetak',
    shelfLocation: 'Rak D-07 · Lantai 1',
    totalCopies: 4,
    availableCopies: 4,
    borrowCount: 19,
  },
  {
    id: 'bk_desain_tipografi',
    title: 'Ruang, Bentuk & Grid Tipografi Modern',
    author: 'Nadia Kusumawardhani',
    isbn: '978-602-441-522-4',
    category: 'Desain',
    publisher: 'Studio Grafika Bandung',
    year: 2026,
    synopsis:
      'Referensi praktis mengenai sistem grid editorial, hierarki tipografi antarmuka digital, kontras warna aksesibel, dan konstruksi identitas visual.',
    coverUrl: '/src/assets/images/cover_desain_tipografi_1795657836455.jpg',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak E-03 · Lantai 2',
    totalCopies: 7,
    availableCopies: 6,
    borrowCount: 42,
  },
  {
    id: 'bk_ekonomi_digital',
    title: 'Ekonomi Platform & Tata Kelola Bisnis Berkelanjutan',
    author: 'Aditya Mahendra',
    isbn: '978-602-441-630-6',
    category: 'Bisnis',
    publisher: 'Pustaka Ekonomi Terapan',
    year: 2025,
    synopsis:
      'Analisis model operasional perusahaan teknologi, metrik unit ekonomi, manajemen rantai pasok berbasis data, dan strategi pertumbuhan jangka panjang.',
    coverUrl: '',
    format: 'E-Book',
    shelfLocation: 'Repositori Digital · D-12',
    totalCopies: 10,
    availableCopies: 9,
    borrowCount: 31,
  },
  {
    id: 'bk_kecerdasan_data',
    title: 'Rekayasa Basis Data & Analitik Sirkulasi',
    author: 'Siti Nurhaliza, M.Kom.',
    isbn: '978-602-441-745-7',
    category: 'Teknologi',
    publisher: 'Penerbit Informatika Nusantara',
    year: 2026,
    synopsis:
      'Pembahasan terstruktur tentang pemodelan data relasional dan dokumen, pengindeksan kueri cepat, serta pelaporan otomatis berbasis peristiwa real-time.',
    coverUrl: '',
    format: 'E-Book',
    shelfLocation: 'Repositori Digital · A-09',
    totalCopies: 8,
    availableCopies: 8,
    borrowCount: 27,
  },
  {
    id: 'bk_biologi_tropis',
    title: 'Ekologi Hutan Hujan & Keanekaragaman Hayati',
    author: 'Dr. Kartika Wulandari',
    isbn: '978-602-441-812-6',
    category: 'Sains',
    publisher: 'Lembaga Sains Indonesia',
    year: 2024,
    synopsis:
      'Dokumentasi ilmiah ekosistem kanopi tropis, konservasi spesies endemik kepulauan, serta metodologi pemantauan lingkungan berbasis sensor lapangan.',
    coverUrl: '',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak C-05 · Lantai 2',
    totalCopies: 5,
    availableCopies: 5,
    borrowCount: 15,
  },
];
