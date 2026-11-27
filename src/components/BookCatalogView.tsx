import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calendar, CheckCircle2, Search, X } from 'lucide-react';
import { borrowBook } from '../services/libraryService';
import {
  BOOK_CATEGORIES,
  type Book,
  type BookCategory,
  type Loan,
} from '../types/library';
import { BookCover } from './BookCover';

interface BookCatalogViewProps {
  books: Book[];
  userLoans: Loan[];
  userId: string;
  userName: string;
  userEmail: string;
  externalSearch?: string;
  isGuest?: boolean;
  onRequireAuth?: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function BookCatalogView({
  books,
  userLoans,
  userId,
  userName,
  userEmail,
  externalSearch = '',
  isGuest = false,
  onRequireAuth,
  onNotify,
}: BookCatalogViewProps) {
  const [search, setSearch] = useState(externalSearch);
  const [category, setCategory] = useState<'Semua' | BookCategory>('Semua');
  const [availabilityFilter, setAvailabilityFilter] = useState<'semua' | 'tersedia'>('semua');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (externalSearch !== undefined) {
      setSearch(externalSearch);
    }
  }, [externalSearch]);

  const activeBorrowedBookIds = useMemo(() => {
    return new Set(
      userLoans.filter((l) => l.status !== 'returned').map((l) => l.bookId)
    );
  }, [userLoans]);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      if (category !== 'Semua' && b.category !== category) return false;
      if (availabilityFilter === 'tersedia' && b.availableCopies <= 0) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    });
  }, [books, search, category, availabilityFilter]);

  const duePreviewDate = useMemo(() => {
    const d = new Date(Date.now() + durationDays * 86400000);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [durationDays]);

  async function handleBorrowConfirm() {
    if (!selectedBook) return;
    if (isGuest) {
      setSelectedBook(null);
      onRequireAuth?.();
      return;
    }
    setSubmitting(true);
    try {
      await borrowBook({
        book: selectedBook,
        memberId: userId,
        memberName: userName,
        memberEmail: userEmail,
        durationDays,
      });
      onNotify(`Berhasil meminjam manga "${selectedBook.title}" selama ${durationDays} hari.`, 'success');
      setSelectedBook(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses peminjaman.';
      onNotify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul manga, mangaka, atau ISBN..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/20 focus:border-[#ff7a00]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#0c182c] border border-slate-800 rounded-lg overflow-x-auto">
            {(['Semua', ...BOOK_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  category === cat
                    ? 'bg-[#ff7a00] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => setAvailabilityFilter('semua')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                availabilityFilter === 'semua'
                  ? 'bg-[#0c182c] text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Semua Stok
            </button>
            <button
              type="button"
              onClick={() => setAvailabilityFilter('tersedia')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                availabilityFilter === 'tersedia'
                  ? 'bg-[#0c182c] text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Tersedia
            </button>
          </div>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <BookOpen className="w-8 h-8 text-[#ff7a00] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#0c182c]">
            Koleksi manga tidak ditemukan
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Tidak ada judul manga yang sesuai dengan pencarian atau filter genre saat ini.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('Semua');
              setAvailabilityFilter('semua');
            }}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-[#0c182c] hover:bg-[#172b4d] rounded-lg transition-colors"
          >
            Atur Ulang Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            const alreadyBorrowed = activeBorrowedBookIds.has(book.id);

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
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#ea580c] mb-1.5">
                      <span>{book.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{book.format}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{book.year}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-tight text-[#0c182c] leading-snug line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-600 mt-1 truncate">
                      {book.author}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {book.synopsis}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    {isAvailable ? (
                      <span className="font-medium text-emerald-700 font-mono-num">
                        Tersedia {book.availableCopies}/{book.totalCopies}
                      </span>
                    ) : (
                      <span className="font-medium text-red-700">Stok Habis</span>
                    )}
                  </div>

                  {alreadyBorrowed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#ea580c]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sedang Dipinjam
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedBook(book);
                        setDurationDays(7);
                      }}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#ff7a00] text-white hover:bg-[#e56d00] disabled:bg-slate-100 disabled:text-slate-400 transition-colors whitespace-nowrap shrink-0"
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

      {selectedBook && (
        <div
          className="fixed inset-0 z-50 bg-[#08111f]/65 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="borrow-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0c182c] text-white">
              <h3 id="borrow-modal-title" className="text-base font-semibold">
                Konfirmasi Peminjaman Manga Online
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-md"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex gap-4">
                <BookCover
                  title={selectedBook.title}
                  author={selectedBook.author}
                  category={selectedBook.category}
                  coverUrl={selectedBook.coverUrl}
                  className="w-20 h-28 rounded-lg shrink-0 border border-slate-200"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#ea580c]">
                    {selectedBook.category} · {selectedBook.format}
                  </p>
                  <h4 className="font-display text-lg font-bold uppercase text-[#0c182c] mt-0.5 leading-snug">
                    {selectedBook.title}
                  </h4>
                  <p className="text-sm text-slate-600 mt-0.5">{selectedBook.author}</p>
                  <p className="text-xs font-mono-num text-slate-500 mt-2">
                    ISBN {selectedBook.isbn} · {selectedBook.shelfLocation}
                  </p>
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
                  <span className="font-mono-num text-slate-900">{userEmail}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleBorrowConfirm}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#ff7a00] rounded-lg hover:bg-[#e56d00] disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Memproses...' : 'Konfirmasi Peminjaman'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
