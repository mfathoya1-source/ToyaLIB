import { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Mail,
  RotateCcw,
  Search,
  Send,
} from 'lucide-react';
import {
  createDemoDueLoan,
  formatDateId,
  formatDateTimeId,
  getLoanDaysRemaining,
  renewLoan,
  returnBook,
  sendDueReminderEmail,
} from '../services/libraryService';
import type { Book, EmailNotification, Loan } from '../types/library';

interface LoansAndRemindersViewProps {
  loans: Loan[];
  books: Book[];
  notifications: EmailNotification[];
  isAdmin: boolean;
  actorId: string;
  actorName: string;
  actorEmail: string;
  smtpConfigured: boolean;
  externalSearch?: string;
  isGuest?: boolean;
  onRequireAuth?: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

type LoanFilter = 'semua' | 'aktif' | 'segera' | 'terlambat' | 'selesai';

export function LoansAndRemindersView({
  loans,
  books,
  notifications,
  isAdmin,
  actorId,
  actorName,
  actorEmail,
  smtpConfigured,
  externalSearch = '',
  isGuest = false,
  onRequireAuth,
  onNotify,
}: LoansAndRemindersViewProps) {
  const [filter, setFilter] = useState<LoanFilter>('semua');
  const [search, setSearch] = useState(externalSearch);
  const [busyLoanId, setBusyLoanId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [expandedMailId, setExpandedMailId] = useState<string | null>(null);

  useEffect(() => {
    if (externalSearch !== undefined) {
      setSearch(externalSearch);
    }
  }, [externalSearch]);

  const dueSoonOrOverdueLoans = useMemo(() => {
    return loans.filter((l) => {
      if (l.status === 'returned') return false;
      const days = getLoanDaysRemaining(l);
      return days <= 2;
    });
  }, [loans]);

  const filteredLoans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loans.filter((l) => {
      const days = getLoanDaysRemaining(l);
      if (filter === 'aktif' && l.status === 'returned') return false;
      if (filter === 'segera' && (l.status === 'returned' || days < 0 || days > 2))
        return false;
      if (filter === 'terlambat' && (l.status === 'returned' || days >= 0)) return false;
      if (filter === 'selesai' && l.status !== 'returned') return false;

      if (!q) return true;
      return (
        l.bookTitle.toLowerCase().includes(q) ||
        l.memberName.toLowerCase().includes(q) ||
        l.memberEmail.toLowerCase().includes(q)
      );
    });
  }, [loans, filter, search]);

  async function handleReturn(loan: Loan) {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    setBusyLoanId(loan.id);
    try {
      await returnBook({ loan, actorId, actorName });
      onNotify(`Manga "${loan.bookTitle}" telah dikembalikan.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengembalikan manga.';
      onNotify(msg, 'error');
    } finally {
      setBusyLoanId(null);
    }
  }

  async function handleRenew(loan: Loan) {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    setBusyLoanId(loan.id);
    try {
      await renewLoan({ loan, actorId, actorName });
      onNotify(`Masa pinjam "${loan.bookTitle}" diperpanjang +3 hari.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memperpanjang pinjaman.';
      onNotify(msg, 'error');
    } finally {
      setBusyLoanId(null);
    }
  }

  async function handleSendReminder(loan: Loan) {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    setBusyLoanId(loan.id);
    try {
      const res = await sendDueReminderEmail({
        loan,
        actorId,
        actorName,
        triggerType: 'manual',
      });
      onNotify(
        `Email pengingat jatuh tempo ke ${loan.memberEmail} (${
          res.deliveryMode === 'smtp' ? 'Terkirim via SMTP' : 'Tercatat Real-Time'
        }).`,
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pengingat email.';
      onNotify(msg, 'error');
    } finally {
      setBusyLoanId(null);
    }
  }

  async function handleBulkReminder() {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    if (dueSoonOrOverdueLoans.length === 0) {
      onNotify('Tidak ada peminjaman yang mendekati jatuh tempo atau terlambat.', 'error');
      return;
    }
    setBulkSending(true);
    let sent = 0;
    try {
      for (const loan of dueSoonOrOverdueLoans) {
        await sendDueReminderEmail({
          loan,
          actorId,
          actorName,
          triggerType: 'manual',
        });
        sent++;
      }
      onNotify(`Pengingat email massal dikirim untuk ${sent} transaksi jatuh tempo.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sebagian pengingat gagal dikirim.';
      onNotify(msg, 'error');
    } finally {
      setBulkSending(false);
    }
  }

  async function handleSimulateOverdue(daysOffset: number) {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    const candidate = books.find((b) => b.availableCopies > 0);
    if (!candidate) {
      onNotify('Tidak ada manga dengan stok tersedia untuk simulasi.', 'error');
      return;
    }
    setSimulating(true);
    try {
      await createDemoDueLoan({
        book: candidate,
        memberId: actorId,
        memberName: actorName,
        memberEmail: actorEmail,
        daysOffset,
      });
      onNotify(
        `Simulasi pinjaman "${candidate.title}" (${
          daysOffset < 0 ? 'terlambat 2 hari' : 'jatuh tempo besok'
        }) dibuat.`,
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat simulasi.';
      onNotify(msg, 'error');
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari transaksi, manga, anggota..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-[#ff7a00]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0c182c] border border-slate-800 rounded-lg overflow-x-auto">
            {(
              [
                ['semua', 'Semua'],
                ['aktif', 'Aktif'],
                ['segera', 'Segera Jatuh Tempo'],
                ['terlambat', 'Terlambat'],
                ['selesai', 'Selesai'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === key
                    ? 'bg-[#ff7a00] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={simulating}
              onClick={() => handleSimulateOverdue(1)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap shrink-0"
            >
              Simulasi Jatuh Tempo (+1h)
            </button>
            <button
              type="button"
              disabled={simulating}
              onClick={() => handleSimulateOverdue(-2)}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap shrink-0"
            >
              Simulasi Terlambat (-2h)
            </button>
            <button
              type="button"
              disabled={bulkSending || dueSoonOrOverdueLoans.length === 0}
              onClick={handleBulkReminder}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#ff7a00] rounded-lg hover:bg-[#e56d00] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <BellRing className="w-3.5 h-3.5 text-white" />
              <span>
                {bulkSending
                  ? 'Mengirim...'
                  : `Kirim Pengingat Massal (${dueSoonOrOverdueLoans.length})`}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-3 px-4">Judul Manga</th>
                <th className="py-3 px-4">Peminjam</th>
                <th className="py-3 px-4">Tgl Pinjam</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Status Sirkulasi</th>
                <th className="py-3 px-4 text-right">Email Terkirim</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-slate-500">
                    Tidak ada transaksi peminjaman pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const days = getLoanDaysRemaining(loan);
                  const isReturned = loan.status === 'returned';
                  const isOverdue = !isReturned && days < 0;
                  const isDueSoon = !isReturned && days >= 0 && days <= 2;
                  const isBusy = busyLoanId === loan.id;

                  return (
                    <tr key={loan.id} className="hover:bg-orange-50/35 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-[#0c182c] truncate">
                          {loan.bookTitle}
                        </p>
                        <p className="text-xs text-slate-500 font-mono-num">
                          {loan.bookCategory} · {loan.bookIsbn}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-[#0c182c]">{loan.memberName}</p>
                        <p className="text-xs text-slate-500">{loan.memberEmail}</p>
                      </td>
                      <td className="py-3 px-4 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                        {formatDateId(loan.borrowedAt)}
                      </td>
                      <td className="py-3 px-4 font-mono-num text-xs text-[#0c182c] whitespace-nowrap">
                        {formatDateId(loan.dueDate)}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {isReturned ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Dikembalikan
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-red-700">
                            <Clock className="w-3.5 h-3.5" />
                            Terlambat {Math.abs(days)} hari
                          </span>
                        ) : isDueSoon ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-[#ea580c]">
                            <Clock className="w-3.5 h-3.5" />
                            {days === 0 ? 'Jatuh tempo hari ini' : `Sisa ${days} hari`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Dipinjam · Sisa {days} hari
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num text-xs text-slate-700">
                        {loan.reminderSentCount}x
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!isReturned && (
                          <div className="inline-flex items-center gap-2">
                            {isAdmin && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleSendReminder(loan)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0c182c] bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors"
                              >
                                <Send className="w-3 h-3 text-[#ea580c]" />
                                <span>Ingatkan</span>
                              </button>
                            )}
                            {loan.renewalCount < 2 && !isOverdue && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleRenew(loan)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-orange-50 transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>+3 Hari</span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleReturn(loan)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-[#0c182c] hover:bg-[#172b4d] rounded-md transition-colors"
                            >
                              Kembalikan
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-[#0c182c]">
              Log Notifikasi Pengingat Email Real-Time
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {smtpConfigured
                ? 'Pengiriman email aktif melalui konfigurasi SMTP server.'
                : 'Mode pratinjau real-time aktif (tambahkan kredensial SMTP di Environment untuk pengiriman inbox eksternal).'}
            </p>
          </div>
          <span className="text-xs font-mono-num text-slate-600">
            {notifications.length} log tercatat
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Belum ada notifikasi pengingat email yang dikirim.
            </div>
          ) : (
            notifications.slice(0, 12).map((mail, idx) => {
              const id = mail.id || `${mail.loanId}_${idx}`;
              const isExpanded = expandedMailId === id;

              return (
                <div key={id} className="px-5 py-3.5 hover:bg-orange-50/35 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-[#0c182c]">
                        <Mail className="w-4 h-4 text-[#ff7a00] shrink-0" />
                        <span className="truncate">{mail.subject}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Kepada: {mail.recipientName} ({mail.recipientEmail}) ·{' '}
                        {mail.triggerType === 'auto_realtime'
                          ? 'Otomatis Real-Time'
                          : 'Kirim Manual'}{' '}
                        · {mail.deliveryMode === 'smtp' ? 'SMTP Terkirim' : 'Simulasi Real-Time'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono-num text-slate-500">
                        {formatDateTimeId(mail.sentAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedMailId(isExpanded ? null : id)}
                        className="text-xs font-semibold text-[#ea580c] hover:text-[#0c182c] whitespace-nowrap"
                      >
                        {isExpanded ? 'Tutup Isi' : 'Lihat Isi Email'}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <pre className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {mail.bodyPreview}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
