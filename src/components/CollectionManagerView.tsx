import { useMemo, useState } from 'react';
import { Database, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import {
  addBook,
  deleteBook,
  seedInitialLibrary,
  updateBook,
  type BookFormInput,
} from '../services/libraryService';
import {
  BOOK_CATEGORIES,
  BOOK_FORMATS,
  type Book,
  type BookCategory,
  type BookFormat,
} from '../types/library';

interface CollectionManagerViewProps {
  books: Book[];
  actorId: string;
  actorName: string;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_FORM: BookFormInput = {
  title: '',
  author: '',
  isbn: '',
  category: 'Teknologi',
  publisher: '',
  year: 2026,
  synopsis: '',
  coverUrl: '',
  format: 'Cetak & Digital',
  shelfLocation: 'Rak A-01 · Lantai 1',
  totalCopies: 5,
  availableCopies: 5,
};

export function CollectionManagerView({
  books,
  actorId,
  actorName,
  onNotify,
}: CollectionManagerViewProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState<BookFormInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }, [books, search]);

  function openCreateModal() {
    setEditingBook(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(book: Book) {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publisher: book.publisher,
      year: book.year,
      synopsis: book.synopsis,
      coverUrl: book.coverUrl,
      format: book.format,
      shelfLocation: book.shelfLocation,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim() || !form.isbn.trim()) {
      onNotify('Judul, penulis, dan ISBN wajib diisi.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingBook) {
        await updateBook(editingBook.id, form, actorId, actorName);
        onNotify(`Koleksi "${form.title}" berhasil diperbarui.`, 'success');
      } else {
        await addBook(form, actorId, actorName);
        onNotify(`Koleksi baru "${form.title}" ditambahkan ke katalog.`, 'success');
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan buku.';
      onNotify(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(book: Book) {
    try {
      await deleteBook(book.id);
      onNotify(`Buku "${book.title}" dihapus dari koleksi.`, 'success');
      setConfirmDeleteId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus buku.';
      onNotify(msg, 'error');
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const count = await seedInitialLibrary(actorId, actorName);
      if (count > 0) {
        onNotify(`${count} buku koleksi dasar berhasil ditambahkan.`, 'success');
      } else {
        onNotify('Semua koleksi dasar sudah tersedia di database.', 'success');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengisi koleksi awal.';
      onNotify(msg, 'error');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter koleksi berdasarkan judul, penulis, ISBN..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={seeding}
            onClick={handleSeed}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Database className="w-4 h-4 text-slate-500" />
            <span>{seeding ? 'Mengisi...' : 'Isi Koleksi Dasar'}</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Buku</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-3 px-4">Judul & Penulis</th>
                <th className="py-3 px-4">ISBN</th>
                <th className="py-3 px-4">Kategori · Format</th>
                <th className="py-3 px-4">Lokasi Rak</th>
                <th className="py-3 px-4 text-right">Tersedia / Total</th>
                <th className="py-3 px-4 text-right">Dipinjam</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-slate-500">
                    Belum ada koleksi buku. Klik "Isi Koleksi Dasar" atau "Tambah Buku" untuk memulai.
                  </td>
                </tr>
              ) : (
                filtered.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-900 truncate">{book.title}</p>
                      <p className="text-xs text-slate-500 truncate">{book.author}</p>
                    </td>
                    <td className="py-3 px-4 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                      {book.isbn}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {book.category} · {book.format}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {book.shelfLocation}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-xs whitespace-nowrap">
                      <span
                        className={
                          book.availableCopies > 0
                            ? 'text-emerald-700 font-medium'
                            : 'text-red-700 font-medium'
                        }
                      >
                        {book.availableCopies}
                      </span>
                      <span className="text-slate-400"> / {book.totalCopies}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-xs text-slate-700">
                      {book.borrowCount}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {confirmDeleteId === book.id ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(book)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                          >
                            Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(book)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 rounded-md hover:bg-slate-100"
                            aria-label={`Edit ${book.title}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(book.id)}
                            className="p-1.5 text-slate-500 hover:text-red-700 rounded-md hover:bg-slate-100"
                            aria-label={`Hapus ${book.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="text-base font-semibold text-slate-900">
                {editingBook ? 'Sunting Koleksi Buku' : 'Tambah Koleksi Buku Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Judul Buku
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Penulis
                  </label>
                  <input
                    type="text"
                    required
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    required
                    value={form.isbn}
                    onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as BookCategory })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                  >
                    {BOOK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Format Koleksi
                  </label>
                  <select
                    value={form.format}
                    onChange={(e) =>
                      setForm({ ...form, format: e.target.value as BookFormat })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-700"
                  >
                    {BOOK_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Penerbit
                  </label>
                  <input
                    type="text"
                    required
                    value={form.publisher}
                    onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tahun Terbit
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    required
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lokasi Rak / Repositori
                  </label>
                  <input
                    type="text"
                    required
                    value={form.shelfLocation}
                    onChange={(e) => setForm({ ...form, shelfLocation: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Total Stok
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      required
                      value={form.totalCopies}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setForm({
                          ...form,
                          totalCopies: val,
                          availableCopies: Math.min(form.availableCopies, val),
                        });
                      }}
                      className="w-full px-3 py-2 text-sm font-mono-num border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tersedia
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={form.totalCopies}
                      required
                      value={form.availableCopies}
                      onChange={(e) =>
                        setForm({ ...form, availableCopies: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm font-mono-num border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sinopsis Ringkas
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={form.synopsis}
                    onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-700"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : editingBook ? 'Simpan Perubahan' : 'Simpan Buku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
