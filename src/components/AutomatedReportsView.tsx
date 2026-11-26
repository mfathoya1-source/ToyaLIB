import { useState } from 'react';
import { Download, FileBarChart2, Printer, Sparkles } from 'lucide-react';
import {
  formatDateId,
  formatDateTimeId,
  generateAutomatedReport,
  getLoanDaysRemaining,
} from '../services/libraryService';
import type {
  AutomatedReport,
  Book,
  EmailNotification,
  Loan,
  ReportPeriod,
} from '../types/library';

interface AutomatedReportsViewProps {
  books: Book[];
  loans: Loan[];
  notifications: EmailNotification[];
  reports: AutomatedReport[];
  actorId: string;
  actorName: string;
  isGuest?: boolean;
  onRequireAuth?: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function AutomatedReportsView({
  books,
  loans,
  notifications,
  reports,
  actorId,
  actorName,
  isGuest = false,
  onRequireAuth,
  onNotify,
}: AutomatedReportsViewProps) {
  const [period, setPeriod] = useState<ReportPeriod>('mingguan');
  const [generating, setGenerating] = useState(false);

  async function handleGenerateReport() {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    setGenerating(true);
    try {
      await generateAutomatedReport({
        period,
        generatedBy: actorId,
        generatedByName: actorName,
        books,
        loans,
        remindersSent: notifications.length,
      });
      onNotify(`Laporan ${period} otomatis berhasil dibuat dan diarsipkan.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat laporan otomatis.';
      onNotify(msg, 'error');
    } finally {
      setGenerating(false);
    }
  }

  function handleExportCsv() {
    const headers = [
      'ID Transaksi',
      'Judul Buku',
      'ISBN',
      'Kategori',
      'Nama Peminjam',
      'Email Peminjam',
      'Tanggal Pinjam',
      'Jatuh Tempo',
      'Status',
      'Pengingat Terkirim',
    ];

    const rows = loans.map((l) => {
      const days = getLoanDaysRemaining(l);
      const statusLabel =
        l.status === 'returned'
          ? 'Dikembalikan'
          : days < 0
          ? `Terlambat (${Math.abs(days)} hari)`
          : 'Dipinjam';

      return [
        l.id,
        `"${l.bookTitle.replace(/"/g, '""')}"`,
        l.bookIsbn,
        l.bookCategory,
        `"${l.memberName.replace(/"/g, '""')}"`,
        l.memberEmail,
        formatDateId(l.borrowedAt),
        formatDateId(l.dueDate),
        statusLabel,
        String(l.reminderSentCount),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-sirkulasi-toyalibrary-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Berkas CSV sirkulasi berhasil diunduh.', 'success');
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-950">
            Generator Laporan Sirkulasi Otomatis
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Susun rekapitulasi real-time koleksi, transaksi peminjaman, keterlambatan, dan log pengingat email.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 no-print">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-950 focus:outline-none focus:border-emerald-700"
          >
            <option value="harian">Periode Harian</option>
            <option value="mingguan">Periode Mingguan</option>
            <option value="bulanan">Periode Bulanan</option>
            <option value="keterlambatan">Audit Keterlambatan</option>
          </select>

          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateReport}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>{generating ? 'Menyusun...' : 'Terbitkan Laporan'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4 text-emerald-800" />
            <span>Unduh CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-neutral-950">
            Arsip Laporan Terbit Real-Time
          </h4>
          <span className="text-xs font-mono-num text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
            {reports.length} dokumen
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="p-10 text-center">
            <FileBarChart2 className="w-8 h-8 text-emerald-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-950">
              Belum ada laporan yang diterbitkan
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Pilih periode dan klik "Terbitkan Laporan" untuk membuat rekap otomatis pertama.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {reports.map((rep, idx) => (
              <div key={rep.id || idx} className="p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="text-base font-semibold text-neutral-950">{rep.title}</h5>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Disusun oleh {rep.generatedByName} · {formatDateTimeId(rep.createdAt)} ·
                      Kategori Terpopuler: {rep.topCategory}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-neutral-700 leading-relaxed">{rep.summaryText}</p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-3 border-t border-neutral-100 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Total Judul</span>
                    <span className="font-mono-num font-semibold text-neutral-950 text-sm">
                      {rep.totalBooks} ({rep.totalCopies} eks.)
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Pinjaman Aktif</span>
                    <span className="font-mono-num font-semibold text-emerald-800 text-sm">
                      {rep.activeLoans}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Terlambat</span>
                    <span className="font-mono-num font-semibold text-red-700 text-sm">
                      {rep.overdueLoans}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Selesai Kembali</span>
                    <span className="font-mono-num font-semibold text-emerald-700 text-sm">
                      {rep.returnedLoans}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Pengingat Email</span>
                    <span className="font-mono-num font-semibold text-neutral-950 text-sm">
                      {rep.remindersSent}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
