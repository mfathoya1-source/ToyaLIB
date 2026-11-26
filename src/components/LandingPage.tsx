import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, LogIn, Search, X } from 'lucide-react';
import type { Book } from '../types/library';
import { BookCover } from './BookCover';

interface LandingPageProps {
  books: Book[];
  isSignedIn: boolean;
  userName?: string;
  onEnterWorkspace: (initialTab?: 'dashboard' | 'catalog' | 'loans' | 'reports', initialSearch?: string) => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
}

export function LandingPage({
  books,
  isSignedIn,
  userName,
  onEnterWorkspace,
  onOpenLogin,
  onSignOut,
}: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPreview = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q)
        )
      : books;
    return list.slice(0, 4);
  }, [books, searchQuery]);

  const totalCopies = useMemo(
    () => books.reduce((sum, b) => sum + b.totalCopies, 0),
    [books]
  );

  return (
    <div id="beranda" className="min-h-screen bg-[#f6faf7] flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="bg-white border-b border-emerald-200/70 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#beranda"
            className="text-lg font-display font-bold tracking-tight text-neutral-950 whitespace-nowrap shrink-0"
          >
            ToyaLibrary
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <a
              href="#katalog"
              className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              Katalog
            </a>
            <a
              href="#layanan"
              className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              Layanan
            </a>
            <a
              href="#notifikasi"
              className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              Pengingat
            </a>
            {isSignedIn ? (
              <button
                type="button"
                onClick={onSignOut}
                className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0"
              >
                Keluar
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0"
              >
                Masuk
              </button>
            )}
          </nav>

          <button
            type="button"
            onClick={() => onEnterWorkspace('dashboard')}
            className="px-4 py-2 text-xs font-medium text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
          >
            Buka Dashboard
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Split */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-10 lg:pt-16 lg:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-semibold text-emerald-800">
                Perpustakaan Digital Terintegrasi
              </p>

              <h1 className="text-4xl sm:text-5xl font-display font-bold text-neutral-950 tracking-tight leading-[1.12] text-balance">
                Sirkulasi Buku Online, Statistik Real-Time, dan Pengingat Jatuh Tempo
              </h1>

              <p className="text-base text-neutral-600 leading-relaxed max-w-xl">
                Akses katalog buku digital maupun cetak, pantau transaksi peminjaman secara
                langsung dari dashboard Admin dan Member, terbitkan laporan otomatis, serta
                kirim notifikasi jatuh tempo melalui email.
              </p>

              {/* Quick Search Bar on Homepage */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onEnterWorkspace('catalog', searchQuery);
                }}
                className="relative max-w-xl"
              >
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul buku, penulis, ISBN, atau kategori..."
                  className="w-full pl-10 pr-28 py-3 text-sm bg-white border border-neutral-200 rounded-xl text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-24 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800 p-1"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Cari Buku
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onEnterWorkspace('dashboard')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <span>Buka Dashboard & Menu</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </button>

                {isSignedIn ? (
                  <span className="text-xs text-neutral-600 px-2">
                    Masuk sebagai <strong className="text-neutral-950">{userName}</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100/80 transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-emerald-800" />
                    <span>Masuk dengan Google</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Curated Catalog Grid */}
            <div id="katalog" className="lg:col-span-6 flex flex-col justify-between gap-4">
              {filteredPreview.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center flex-1 flex flex-col items-center justify-center">
                  <BookOpen className="w-7 h-7 text-emerald-700 mb-3" />
                  <p className="text-sm font-semibold text-neutral-950">
                    Judul tidak ditemukan di pratinjau
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Coba kata kunci lain atau buka katalog lengkap di dalam dashboard.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 h-full">
                  {filteredPreview.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => onEnterWorkspace('catalog', book.title)}
                      className="group text-left bg-white border border-neutral-200 rounded-xl overflow-hidden flex flex-col hover:border-emerald-400 transition-colors"
                    >
                      <BookCover
                        title={book.title}
                        author={book.author}
                        category={book.category}
                        coverUrl={book.coverUrl}
                        className="aspect-[3/4] w-full"
                      />
                      <div className="p-3.5 w-full">
                        <p className="text-[11px] text-emerald-800 truncate">
                          {book.category} · {book.format}
                        </p>
                        <p className="text-xs font-semibold text-neutral-950 truncate mt-0.5">
                          {book.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4-column quantitative strip below hero */}
          <div className="mt-12 bg-emerald-50/80 border border-emerald-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-emerald-200/80">
            <div className="p-5">
              <p className="text-2xl font-semibold text-neutral-950 font-mono-num">
                {books.length} Judul
              </p>
              <p className="text-xs text-emerald-900/75 mt-1 font-mono-num">
                {totalCopies} eksemplar cetak & digital
              </p>
            </div>
            <div className="p-5">
              <p className="text-2xl font-semibold text-neutral-950 font-mono-num">
                Real-Time
              </p>
              <p className="text-xs text-emerald-900/75 mt-1">
                Dashboard Admin & Portal Member
              </p>
            </div>
            <div className="p-5">
              <p className="text-2xl font-semibold text-neutral-950 font-mono-num">
                Email H-1
              </p>
              <p className="text-xs text-emerald-900/75 mt-1">
                Pengingat jatuh tempo otomatis
              </p>
            </div>
            <div className="p-5">
              <p className="text-2xl font-semibold text-neutral-950 font-mono-num">
                CSV & PDF
              </p>
              <p className="text-xs text-emerald-900/75 mt-1">
                Pelaporan sirkulasi terjadwal
              </p>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section
          id="layanan"
          className="max-w-7xl mx-auto px-6 py-12 border-t border-emerald-200/70"
        >
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-950 tracking-tight text-balance">
              Arsitektur Sirkulasi dari Pencarian Katalog hingga Pelaporan
            </h2>
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
              Setiap modul dapat ditinjau langsung melalui mode pratinjau maupun digunakan secara
              penuh setelah masuk dengan akun Google.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 bg-white border border-neutral-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 font-mono-num">01</p>
                <h3 className="text-lg font-semibold text-neutral-950 mt-2">
                  Peminjaman Buku Online & Manajemen Koleksi
                </h3>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  Anggota memilih durasi pinjam 3, 7, atau 14 hari dengan pembaruan stok otomatis.
                  Administrator dapat menambah, menyunting, dan memantau ketersediaan rak secara
                  langsung.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Katalog interaktif & CRUD koleksi</span>
                <button
                  type="button"
                  onClick={() => onEnterWorkspace('catalog')}
                  className="font-semibold text-emerald-800 hover:text-neutral-950 transition-colors"
                >
                  Jelajahi Katalog →
                </button>
              </div>
            </div>

            <div
              id="notifikasi"
              className="md:col-span-5 bg-white border border-neutral-200 rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-emerald-700 font-mono-num">02</p>
                <h3 className="text-lg font-semibold text-neutral-950 mt-2">
                  Notifikasi Jatuh Tempo Email Real-Time
                </h3>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  Deteksi otomatis transaksi yang mendekati tenggat atau terlambat, dilengkapi log
                  pengiriman email instan dan pengingat massal.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Pantau antrean email</span>
                <button
                  type="button"
                  onClick={() => onEnterWorkspace('loans')}
                  className="font-semibold text-emerald-800 hover:text-neutral-950 transition-colors"
                >
                  Lihat Sirkulasi →
                </button>
              </div>
            </div>

            <div className="md:col-span-5 bg-white border border-neutral-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 font-mono-num">03</p>
                <h3 className="text-lg font-semibold text-neutral-950 mt-2">
                  Sistem Pelaporan Otomatis
                </h3>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  Susun rekapitulasi harian, mingguan, bulanan, atau audit keterlambatan dalam satu
                  klik, siap unduh CSV dan cetak PDF.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Ekspor CSV & dokumen PDF</span>
                <button
                  type="button"
                  onClick={() => onEnterWorkspace('reports')}
                  className="font-semibold text-emerald-800 hover:text-neutral-950 transition-colors"
                >
                  Buka Laporan →
                </button>
              </div>
            </div>

            <div className="md:col-span-7 bg-white border border-neutral-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 font-mono-num">04</p>
                <h3 className="text-lg font-semibold text-neutral-950 mt-2">
                  Dashboard Interaktif Admin & Member Real-Time
                </h3>
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  Visualisasi grafik tren peminjaman 7 hari terakhir, distribusi kategori populer,
                  serta aliran aktivitas transaksi secara langsung tanpa muat ulang halaman.
                </p>
              </div>
              <div className="pt-5 mt-5 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Beralih tampilan Admin & Member</span>
                <button
                  type="button"
                  onClick={() => onEnterWorkspace('dashboard')}
                  className="font-semibold text-emerald-800 hover:text-neutral-950 transition-colors"
                >
                  Buka Dashboard →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-emerald-200/70">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <span className="font-display font-semibold text-neutral-950">ToyaLibrary</span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onEnterWorkspace('dashboard')}
              className="hover:text-emerald-800 transition-colors"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('catalog')}
              className="hover:text-emerald-800 transition-colors"
            >
              Katalog Buku
            </button>
            {!isSignedIn && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="hover:text-emerald-800 transition-colors"
              >
                Masuk Akun
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
