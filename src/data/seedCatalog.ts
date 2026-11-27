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
    id: 'manga_naruto_01',
    title: 'Naruto: Shippuden Vol. 01 — Kebangkitan Shinobi',
    author: 'Masashi Kishimoto',
    isbn: '978-408-873-842-0',
    category: 'Shonen',
    publisher: 'Shueisha · Elex Media',
    year: 2025,
    synopsis:
      'Kisah Naruto Uzumaki, ninja muda dari Desa Konohagakure yang membawa segel Rubah Ekor Sembilan dan bertekad menjadi Hokage sambil melindungi sahabat-sahabatnya dari ancaman Akatsuki.',
    coverUrl: '',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak Manga A-01 · Lantai 1',
    totalCopies: 8,
    availableCopies: 6,
    borrowCount: 64,
  },
  {
    id: 'manga_jujutsu_01',
    title: 'Jujutsu Kaisen Vol. 01 — Ryomen Sukuna',
    author: 'Gege Akutami',
    isbn: '978-408-881-516-9',
    category: 'Action',
    publisher: 'Shueisha · Elex Media',
    year: 2025,
    synopsis:
      'Yuji Itadori menelan pusaka kutukan jari Ryomen Sukuna demi menyelamatkan teman-temannya, membawanya masuk ke Sekolah Tinggi Jujutsu Tokyo di bawah bimbingan Satoru Gojo.',
    coverUrl: '',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak Manga A-03 · Lantai 1',
    totalCopies: 7,
    availableCopies: 5,
    borrowCount: 52,
  },
  {
    id: 'manga_spy_family_01',
    title: 'Spy x Family Vol. 01 — Operasi Strix',
    author: 'Tatsuya Endo',
    isbn: '978-408-882-011-8',
    category: 'Slice of Life',
    publisher: 'Shueisha · Elex Media',
    year: 2026,
    synopsis:
      'Agen rahasia Twilight membentuk keluarga palsu bersama pembunuh bayaran Yor dan telepatis cilik Anya Forger demi menjaga perdamaian antara Westalis dan Ostania.',
    coverUrl: '',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak Manga B-02 · Lantai 1',
    totalCopies: 6,
    availableCopies: 5,
    borrowCount: 47,
  },
  {
    id: 'manga_chainsaw_01',
    title: 'Chainsaw Man Vol. 01 — Anjing & Gergaji',
    author: 'Tatsuki Fujimoto',
    isbn: '978-408-881-780-4',
    category: 'Seinen',
    publisher: 'Shueisha · m&c!',
    year: 2025,
    synopsis:
      'Denji bersekutu dengan iblis gergaji Pochita untuk melunasi utang masa lalunya dan direkrut ke Divisi Khusus Pemburu Iblis Keamanan Publik di Tokyo.',
    coverUrl: '',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak Manga C-01 · Lantai 2',
    totalCopies: 6,
    availableCopies: 4,
    borrowCount: 45,
  },
  {
    id: 'manga_frieren_01',
    title: 'Frieren: Beyond Journey’s End Vol. 01',
    author: 'Kanehito Yamada',
    isbn: '978-409-850-180-9',
    category: 'Fantasy',
    publisher: 'Shogakukan · m&c!',
    year: 2026,
    synopsis:
      'Setelah kelompok pahlawan mengalahkan Raja Iblis, penyihir elf Frieren memulai perjalanan baru melintasi benua untuk memahami makna waktu, ingatan, dan ikatan antar manusia.',
    coverUrl: '',
    format: 'Cetak & Digital',
    shelfLocation: 'Rak Manga D-04 · Lantai 2',
    totalCopies: 5,
    availableCopies: 4,
    borrowCount: 39,
  },
  {
    id: 'manga_kimetsu_01',
    title: 'Kimetsu no Yaiba (Demon Slayer) Vol. 01',
    author: 'Koyoharu Gotouge',
    isbn: '978-408-880-723-2',
    category: 'Action',
    publisher: 'Shueisha · Elex Media',
    year: 2024,
    synopsis:
      'Tanjiro Kamado menempuh latihan teknik Pernapasan Air dan bergabung dengan Korps Pembasmi Iblis demi memulihkan adiknya Nezuko kembali menjadi manusia.',
    coverUrl: '',
    format: 'E-Book',
    shelfLocation: 'Repositori E-Manga · M-06',
    totalCopies: 10,
    availableCopies: 8,
    borrowCount: 41,
  },
  {
    id: 'manga_onepiece_01',
    title: 'One Piece Vol. 01 — Romance Dawn',
    author: 'Eiichiro Oda',
    isbn: '978-408-872-509-3',
    category: 'Shonen',
    publisher: 'Shueisha · Elex Media',
    year: 2024,
    synopsis:
      'Monkey D. Luffy memulai pelayaran di lautan East Blue bersama topi jerami warisan Shanks untuk membentuk kru bajak laut dan menemukan harta karun legendaris One Piece.',
    coverUrl: '',
    format: 'Cetak',
    shelfLocation: 'Rak Manga A-08 · Lantai 1',
    totalCopies: 6,
    availableCopies: 5,
    borrowCount: 56,
  },
  {
    id: 'manga_aoharuride_01',
    title: 'Ao Haru Ride (Blue Spring Ride) Vol. 01',
    author: 'Io Sakisaka',
    isbn: '978-408-846-647-7',
    category: 'Shojo',
    publisher: 'Shueisha · m&c!',
    year: 2024,
    synopsis:
      'Futaba Yoshioka kembali bertemu dengan Ko Mabuchi di bangku SMA setelah berpisah sejak SMP, membuka kembali kisah persahabatan dan perasaan masa remaja.',
    coverUrl: '',
    format: 'E-Book',
    shelfLocation: 'Repositori E-Manga · S-02',
    totalCopies: 8,
    availableCopies: 7,
    borrowCount: 28,
  },
];
