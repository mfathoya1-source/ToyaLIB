import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  LogIn,
  Mail,
  Search,
  Smartphone,
  Star,
  X,
} from 'lucide-react';
import { borrowBook } from '../services/libraryService';
import { BOOK_CATEGORIES, type Book, type BookCategory, type Loan } from '../types/library';
import { AnimeHeroBackdrop } from './AnimeHeroBackdrop';
import { BookCover } from './BookCover';

interface LandingPageProps {
  books: Book[];
  userLoans: Loan[];
  isSignedIn: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  onEnterWorkspace: (
    initialTab?: 'dashboard' | 'catalog' | 'collections' | 'loans' | 'reports',
    initialSearch?: string
  ) => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const SLIDE_ACCENTS = ['#ff7a00', '#38bdf8', '#fb7185', '#ef4444', '#34d399'];

export function LandingPage({
  books,
  userLoans,
  isSignedIn,
  userId,
  userName,
  userEmail,
  onEnterWorkspace,
  onOpenLogin,
  onSignOut,
  onNotify,
}: LandingPageProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<'Semua' | BookCategory>('Semua');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [borrowModalBook, setBorrowModalBook] = useState<Book | null>(null);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [borrowNoteMode, setBorrowNoteMode] = useState<'digital' | 'fisik'>('digital');
  const [submittingBorrow, setSubmittingBorrow] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const catalogSectionRef = useRef<HTMLElement>(null);

  const featuredList = useMemo(() => {
    const sorted = [...books].sort((a, b) => b.borrowCount - a.borrowCount);
    return sorted.slice(0, 5);
  }, [books]);

  const safeHeroIndex = featuredList.length > 0 ? heroIndex % featuredList.length : 0;
  const activeHeroBook = featuredList[safeHeroIndex] || books[0];

  const sideQueueBooks = useMemo(() => {
    if (featuredList.length <= 1) return [];
    const list: Book[] = [];
    for (let offset = 1; offset <= Math.min(3, featuredList.length - 1); offset++) {
      list.push(featuredList[(safeHeroIndex + offset) % featuredList.length]);
    }
    return list;
  }, [featuredList, safeHeroIndex]);

  const activeBorrowedIds = useMemo(
    () => new Set(userLoans.filter((l) => l.status !== 'returned').map((l) => l.bookId)),
    [userLoans]
  );

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((b) => {
      if (selectedGenre !== 'Semua' && b.category !== selectedGenre) return false;
      if (onlyAvailable && b.availableCopies <= 0) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q)
      );
    });
  }, [books, searchQuery, selectedGenre, onlyAvailable]);

  const totalCopies = useMemo(
    () => books.reduce((sum, b) => sum + b.totalCopies, 0),
    [books]
  );

  const duePreviewDate = useMemo(() => {
    const d = new Date(Date.now() + durationDays * 86400000);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [durationDays]);

  function focusSearchBar() {
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 350);
  }

  function handlePrevSlide() {
    if (featuredList.length === 0) return;
    setHeroIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
  }

  function handleNextSlide() {
    if (featuredList.length === 0) return;
    setHeroIndex((prev) => (prev + 1) % featuredList.length);
  }

  async function handleConfirmQuickBorrow() {
    if (!borrowModalBook) return;
    if (!isSignedIn) {
      setBorrowModalBook(null);
      onOpenLogin();
      return;
    }

    setSubmittingBorrow(true);
    try {
      await borrowBook({
        book: borrowModalBook,
        memberId: userId,
        memberName: userName,
        memberEmail: userEmail,
        durationDays,
      });
      onNotify(
        `Berhasil meminjam manga "${borrowModalBook.title}" (${
          borrowNoteMode === 'digital' ? 'Akses Manga Digital' : 'Pengambilan Fisik'
        }, ${durationDays} hari).`,
        'success'
      );
      setBorrowModalBook(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses peminjaman manga.';
      onNotify(msg, 'error');
    } finally {
      setSubmittingBorrow(false);
    }
  }

  const activeHeadline = activeHeroBook
    ? activeHeroBook.title.split('—')[0].replace(/Vol\.\s*\d+/i, '').trim()
    : 'TOYALIBRARY';

  const heroAccent = SLIDE_ACCENTS[safeHeroIndex % SLIDE_ACCENTS.length];

  return (
    <div id="beranda" className="min-h-screen bg-[#f4f7fb] flex flex-col">
      {/* FULL-BLEED ANIME & MANGA HERO SHOWCASE (Matching attached reference design) */}
      <section
        id="koleksi-terpopuler"
        className="relative min-h-[700px] lg:min-h-[780px] flex flex-col justify-between overflow-hidden"
      >
        <AnimeHeroBackdrop accentHex={heroAccent} />

        {/* Top Bar Contract: 3 clean single-row zones over bright upper moon sky */}
        <header className="relative z-20 w-full">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-8">
            {/* Zone 1: Cloud Crest & Brand */}
            <a
              href="#beranda"
              className="inline-flex items-center gap-2.5 text-xl font-display font-bold tracking-wide uppercase text-[#0c182c] whitespace-nowrap shrink-0"
            >
              <svg
                viewBox="0 0 36 24"
                className="w-8 h-6 shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M9 20h17.5a5.5 5.5 0 0 0 .8-10.94A7 7 0 0 0 13.7 6.8 5 5 0 0 0 9 10a4.5 4.5 0 0 0 0 9Z"
                  fill="#ff7a00"
                  fillOpacity="0.22"
                  stroke="#ff7a00"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 14c1.6-2 4.5-2 5.5 0s-1.5 3.5-3.5 2.5"
                  fill="none"
                  stroke="#0c182c"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span>ToyaLibrary</span>
            </a>

            {/* Zone 2: 4 concise single-line orange navigation links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#ea580c]">
              <a
                href="#koleksi-terpopuler"
                className="hover:text-[#0c182c] transition-colors whitespace-nowrap shrink-0"
              >
                Terpopuler
              </a>
              <a
                href="#katalog-manga"
                className="hover:text-[#0c182c] transition-colors whitespace-nowrap shrink-0"
              >
                Koleksi Manga
              </a>
              <a
                href="#layanan-pinjam"
                className="hover:text-[#0c182c] transition-colors whitespace-nowrap shrink-0"
              >
                Layanan Pinjam
              </a>
              <button
                type="button"
                onClick={() => onEnterWorkspace('dashboard')}
                className="hover:text-[#0c182c] transition-colors whitespace-nowrap shrink-0"
              >
                Dashboard
              </button>
            </nav>

            {/* Zone 3: Search, Reminder Bell, Login / Workspace CTA */}
            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={focusSearchBar}
                className="p-2 text-[#ea580c] hover:text-[#0c182c] transition-colors rounded-lg"
                aria-label="Cari koleksi manga Jepang"
                title="Cari manga Jepang"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onEnterWorkspace('loans')}
                className="p-2 text-[#ea580c] hover:text-[#0c182c] transition-colors rounded-lg"
                aria-label="Lihat pengingat jatuh tempo"
                title="Sirkulasi & Pengingat Email"
              >
                <Bell className="w-5 h-5" />
              </button>
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-sm font-semibold text-[#ea580c] hover:text-[#0c182c] transition-colors whitespace-nowrap shrink-0"
                >
                  Keluar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="text-sm font-semibold text-[#ea580c] hover:text-[#0c182c] transition-colors whitespace-nowrap shrink-0"
                >
                  Masuk
                </button>
              )}
              <button
                type="button"
                onClick={() => onEnterWorkspace('dashboard')}
                className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold text-white bg-[#0c182c] hover:bg-[#172b4d] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Buka Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Main Hero Split */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 py-8 lg:py-10 flex-1 flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">
            {/* Left Showcase Info */}
            <div className="lg:col-span-6 space-y-5">
              <p className="text-sm font-bold text-[#ff7a00] tracking-wide">
                #{safeHeroIndex + 1} Koleksi Terpopuler
              </p>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-[68px] font-bold uppercase tracking-tight text-[#ff7a00] leading-[0.95] text-balance drop-shadow-[0_1px_1px_rgba(255,255,255,0.65)]">
                {activeHeadline}
              </h1>

              {activeHeroBook && (
                <>
                  <p className="text-sm sm:text-[15px] text-slate-900 font-medium leading-relaxed max-w-md">
                    {activeHeroBook.synopsis}
                  </p>

                  {/* Star Rating + Unboxed Circulation Metadata */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1" aria-label="Rating 4.9 dari 5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-4 h-4 text-[#f59e0b] fill-[#f59e0b]"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 font-mono-num">
                      {activeHeroBook.category} · {activeHeroBook.borrowCount}x dipinjam · Stok{' '}
                      {activeHeroBook.availableCopies}/{activeHeroBook.totalCopies}
                    </span>
                  </div>

                  {/* Hero CTA Buttons matching reference screenshot */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={activeHeroBook.availableCopies <= 0}
                      onClick={() => {
                        setBorrowModalBook(activeHeroBook);
                        setDurationDays(7);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#ff7a00] hover:bg-[#e56d00] disabled:opacity-50 rounded-xl shadow-sm transition-colors whitespace-nowrap shrink-0"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Pinjam Manga</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-white/95 hover:bg-white border-2 border-[#ff7a00] rounded-xl transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Lihat Katalog</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right Showcase Stacked Manga Preview Cards (Matching screenshot right side) */}
            <div className="lg:col-span-6 space-y-5">
              {/* Top Row: 2 horizontal 16:9 anime/manga cards */}
              {sideQueueBooks.length >= 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sideQueueBooks.slice(0, 2).map((item) => {
                    const itemIdx = featuredList.findIndex((f) => f.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (itemIdx >= 0) setHeroIndex(itemIdx);
                        }}
                        className="group text-left rounded-xl overflow-hidden border border-white/25 shadow-lg hover:border-[#ff7a00] transition-all"
                      >
                        <BookCover
                          title={item.title}
                          author={item.author}
                          category={item.category}
                          coverUrl={item.coverUrl}
                          variant="scene"
                          className="aspect-video w-full"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bottom Row: Wide Frosted Glass Featured Card */}
              {sideQueueBooks[2] && (
                <div className="bg-[#08111f]/65 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const idx = featuredList.findIndex((f) => f.id === sideQueueBooks[2].id);
                        if (idx >= 0) setHeroIndex(idx);
                      }}
                      className="sm:col-span-7 group text-left rounded-xl overflow-hidden border border-white/15 hover:border-[#ff7a00] transition-colors"
                    >
                      <BookCover
                        title={sideQueueBooks[2].title}
                        author={sideQueueBooks[2].author}
                        category={sideQueueBooks[2].category}
                        coverUrl={sideQueueBooks[2].coverUrl}
                        variant="scene"
                        className="aspect-video w-full"
                      />
                    </button>
                    <div className="sm:col-span-5 text-white space-y-2 px-1">
                      <p className="text-[11px] font-semibold text-[#ff7a00] uppercase tracking-wider">
                        Siap Dipinjam · {sideQueueBooks[2].format}
                      </p>
                      <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                        {sideQueueBooks[2].synopsis}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBorrowModalBook(sideQueueBooks[2]);
                          setDurationDays(7);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-[#ff7a00] transition-colors pt-1"
                      >
                        <span>Pinjam Volume Ini</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Hero Control Strip (Matching screenshot bottom navigation bar) */}
        <div className="relative z-20 max-w-7xl w-full mx-auto px-6 pb-7 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Platform / Format availability */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-white whitespace-nowrap">
                Layanan Pinjam
              </span>
              <span className="h-px bg-white/40 flex-1 sm:w-28" aria-hidden="true" />
              <div className="flex items-center gap-3 text-white/90">
                <span title="Baca Manga Digital">
                  <Smartphone className="w-4 h-4" />
                </span>
                <span title="Pinjam Tankōbon Cetak">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span title="Pengingat Jatuh Tempo Email">
                  <Mail className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Center: Circular Outline Prev / Next Carousel Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="w-11 h-11 rounded-full border border-white/80 text-white hover:bg-[#ff7a00] hover:border-[#ff7a00] transition-colors flex items-center justify-center"
                aria-label="Manga unggulan sebelumnya"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextSlide}
                className="w-11 h-11 rounded-full border border-white/80 text-white hover:bg-[#ff7a00] hover:border-[#ff7a00] transition-colors flex items-center justify-center"
                aria-label="Manga unggulan berikutnya"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Hairline + Orange Slide Index */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
              <span className="h-px bg-white/40 flex-1 sm:w-36" aria-hidden="true" />
              <span className="font-display text-3xl font-bold text-[#ff7a00] tabular-nums">
                {String(safeHeroIndex + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH & GENRE TOOLBAR */}
      <section
        id="katalog-manga"
        ref={catalogSectionRef}
        className="bg-[#0c182c] border-y border-white/10 text-white"
      >
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white">
                Koleksi Manga Jepang
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Cari judul serial, mangaka, atau genre favorit untuk dipinjam secara online maupun cetak.
              </p>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative w-full lg:max-w-md"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Naruto, Jujutsu, mangaka, ISBN..."
                className="w-full pl-10 pr-24 py-2.5 text-sm bg-[#132442] border border-white/15 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-[#ff7a00]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onEnterWorkspace('catalog', searchQuery)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold text-white bg-[#ff7a00] hover:bg-[#e56d00] rounded-lg transition-colors"
              >
                Katalog Full
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#132442] border border-white/10 rounded-lg overflow-x-auto">
              {(['Semua', ...BOOK_CATEGORIES] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedGenre(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedGenre === cat
                      ? 'bg-[#ff7a00] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyAvailable((v) => !v)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  onlyAvailable
                    ? 'bg-[#ff7a00] border-[#ff7a00] text-white'
                    : 'bg-[#132442] border-white/15 text-slate-200 hover:border-[#ff7a00]'
                }`}
              >
                {onlyAvailable ? 'Hanya Stok Tersedia' : 'Tampilkan Semua Stok'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG GRID WITH DIRECT ONLINE BORROWING */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-10">
          {filteredBooks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <BookOpen className="w-8 h-8 text-[#ff7a00] mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-950">
                Koleksi manga tidak ditemukan
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Ubah kata kunci pencarian atau pilih genre lain untuk melihat koleksi manga yang tersedia.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('Semua');
                  setOnlyAvailable(false);
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#0c182c] hover:bg-[#172b4d] rounded-lg transition-colors"
              >
                Atur Ulang Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredBooks.map((book) => {
                const isAvailable = book.availableCopies > 0;
                const alreadyBorrowed = activeBorrowedIds.has(book.id);

                return (
                  <article
                    key={book.id}
                    className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#ff7a00] transition-colors"
                  >
                    <div>
                      <BookCover
                        title={book.title}
                        author={book.author}
                        category={book.category}
                        coverUrl={book.coverUrl}
                        className="aspect-[3/4] w-full border-b border-slate-100"
                      />
                      <div className="p-4">
                        <p className="text-xs font-medium text-[#ea580c]">
                          {book.category} · {book.format} · {book.year}
                        </p>
                        <h3 className="font-display text-lg font-bold uppercase tracking-tight text-[#0c182c] mt-1 leading-snug line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-xs font-medium text-slate-600 mt-1 truncate">
                          Mangaka: {book.author}
                        </p>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {book.synopsis}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-mono-num font-medium ${
                          isAvailable ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {isAvailable
                          ? `Tersedia ${book.availableCopies}/${book.totalCopies}`
                          : 'Stok Habis'}
                      </span>

                      {alreadyBorrowed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea580c]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Dipinjam
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            setBorrowModalBook(book);
                            setDurationDays(7);
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#ff7a00] hover:bg-[#e56d00] disabled:bg-slate-100 disabled:text-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          Pinjam Manga
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* LAYANAN PEMINJAMAN & DASHBOARD ACCESS */}
        <section
          id="layanan-pinjam"
          className="max-w-7xl mx-auto px-6 pb-14 pt-4 space-y-8"
        >
          {/* 4-column quantitative strip */}
          <div className="bg-[#0c182c] text-white border border-slate-800 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            <div className="p-5">
              <p className="font-display text-2xl font-bold text-[#ff7a00] font-mono-num">
                {books.length} Serial
              </p>
              <p className="text-xs text-slate-300 mt-1 font-mono-num">
                {totalCopies} volume cetak &amp; digital
              </p>
            </div>
            <div className="p-5">
              <p className="font-display text-2xl font-bold text-white">
                3 / 7 / 14 Hari
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Durasi peminjaman fleksibel &amp; perpanjangan
              </p>
            </div>
            <div className="p-5">
              <p className="font-display text-2xl font-bold text-white">
                Email H-1
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Pengingat jatuh tempo real-time otomatis
              </p>
            </div>
            <div className="p-5">
              <p className="font-display text-2xl font-bold text-white">
                CSV &amp; PDF
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Pelaporan sirkulasi &amp; dashboard interaktif
              </p>
            </div>
          </div>

          <div>
            <div className="max-w-2xl mb-6">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-[#0c182c]">
                Layanan Peminjaman &amp; Manajemen Perpustakaan Manga
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Seluruh fitur peminjaman manga online, dashboard Admin dan Member, manajemen
                koleksi, serta pelaporan otomatis dapat diakses langsung tanpa harus login terlebih
                dahulu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-[#ff7a00] font-mono-num">01</p>
                  <h3 className="text-lg font-semibold text-[#0c182c] mt-2">
                    Layanan Peminjaman Manga Online &amp; Tankōbon
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Pinjam manga digital untuk dibaca seketika atau pesan edisi cetak di rak
                    perpustakaan dengan pilihan durasi 3, 7, atau 14 hari serta pembaruan stok
                    otomatis.
                  </p>
                </div>
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pembaruan stok otomatis</span>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace('catalog')}
                    className="font-semibold text-[#ea580c] hover:text-[#0c182c] transition-colors"
                  >
                    Buka Menu Peminjaman →
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-[#ff7a00] font-mono-num">02</p>
                  <h3 className="text-lg font-semibold text-[#0c182c] mt-2">
                    Pengingat Jatuh Tempo Email Real-Time
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Deteksi otomatis peminjaman manga yang hampir jatuh tempo atau terlambat dengan
                    notifikasi email langsung ke anggota dan log pengiriman.
                  </p>
                </div>
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pantau antrean email</span>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace('loans')}
                    className="font-semibold text-[#ea580c] hover:text-[#0c182c] transition-colors"
                  >
                    Lihat Sirkulasi →
                  </button>
                </div>
              </div>

              <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-[#ff7a00] font-mono-num">03</p>
                  <h3 className="text-lg font-semibold text-[#0c182c] mt-2">
                    Manajemen Koleksi &amp; Pelaporan Otomatis
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Kelola penambahan volume manga baru, edit stok rak, dan terbitkan laporan
                    sirkulasi harian hingga bulanan dalam format CSV dan cetak PDF.
                  </p>
                </div>
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">CRUD koleksi &amp; ekspor CSV/PDF</span>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace('reports')}
                    className="font-semibold text-[#ea580c] hover:text-[#0c182c] transition-colors"
                  >
                    Buka Laporan →
                  </button>
                </div>
              </div>

              <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-[#ff7a00] font-mono-num">04</p>
                  <h3 className="text-lg font-semibold text-[#0c182c] mt-2">
                    Dashboard Interaktif Admin &amp; Member Real-Time
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Pantau statistik peminjaman manga 7 hari terakhir, grafik genre terpopuler
                    (Shonen, Action, Fantasy, Seinen), dan arus aktivitas transaksi secara live.
                  </p>
                </div>
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tersedia mode Admin &amp; Member</span>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace('dashboard')}
                    className="font-semibold text-[#ea580c] hover:text-[#0c182c] transition-colors"
                  >
                    Buka Dashboard →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#08111f] border-t border-white/10 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="font-display text-base font-bold uppercase tracking-wide text-white">
            ToyaLibrary · Perpustakaan Digital Manga
          </span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onEnterWorkspace('dashboard')}
              className="hover:text-[#ff7a00] transition-colors"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('catalog')}
              className="hover:text-[#ff7a00] transition-colors"
            >
              Katalog Manga
            </button>
            {!isSignedIn && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="hover:text-[#ff7a00] transition-colors"
              >
                Masuk Akun
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* QUICK ONLINE BORROW MODAL ON LANDING PAGE */}
      {borrowModalBook && (
        <div
          className="fixed inset-0 z-50 bg-[#08111f]/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="landing-borrow-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0c182c] text-white">
              <h3 id="landing-borrow-title" className="text-base font-semibold">
                Layanan Peminjaman Manga Online
              </h3>
              <button
                type="button"
                onClick={() => setBorrowModalBook(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-md"
                aria-label="Tutup dialog peminjaman"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex gap-4">
                <BookCover
                  title={borrowModalBook.title}
                  author={borrowModalBook.author}
                  category={borrowModalBook.category}
                  coverUrl={borrowModalBook.coverUrl}
                  className="w-20 h-28 rounded-lg shrink-0 border border-slate-200"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#ea580c]">
                    {borrowModalBook.category} · {borrowModalBook.format}
                  </p>
                  <h4 className="font-display text-lg font-bold uppercase text-[#0c182c] mt-0.5 leading-snug">
                    {borrowModalBook.title}
                  </h4>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Mangaka: {borrowModalBook.author}
                  </p>
                  <p className="text-xs font-mono-num text-slate-500 mt-1.5">
                    ISBN {borrowModalBook.isbn} · {borrowModalBook.shelfLocation}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Metode Peminjaman
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBorrowNoteMode('digital')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      borrowNoteMode === 'digital'
                        ? 'border-[#ff7a00] bg-orange-50 text-[#0c182c]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Manga Digital (E-Manga)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBorrowNoteMode('fisik')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      borrowNoteMode === 'fisik'
                        ? 'border-[#ff7a00] bg-orange-50 text-[#0c182c]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tankōbon Cetak (Ambil Rak)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Durasi Masa Pinjam
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 7, 14].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`py-2.5 px-3 text-sm font-semibold rounded-lg border transition-colors ${
                        durationDays === days
                          ? 'border-[#ff7a00] bg-orange-50 text-[#0c182c]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {days} Hari
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#ea580c]" />
                    Batas Pengembalian
                  </span>
                  <span className="font-semibold text-slate-950">{duePreviewDate}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Email Pengingat Jatuh Tempo</span>
                  <span className="font-mono-num text-slate-900">
                    {isSignedIn ? userEmail : 'Aktif setelah masuk Google'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBorrowModalBook(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              {isSignedIn ? (
                <button
                  type="button"
                  disabled={submittingBorrow}
                  onClick={handleConfirmQuickBorrow}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#ff7a00] hover:bg-[#e56d00] rounded-lg disabled:opacity-60 transition-colors"
                >
                  {submittingBorrow ? 'Memproses...' : 'Konfirmasi Pinjam'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmQuickBorrow}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#0c182c] hover:bg-[#172b4d] rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4 text-[#ff7a00]" />
                  <span>Masuk Google untuk Pinjam</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
