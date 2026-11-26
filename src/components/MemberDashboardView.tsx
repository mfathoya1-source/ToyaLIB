import { useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  Mail,
  RotateCcw,
} from 'lucide-react';
import {
  formatDateId,
  formatDateTimeId,
  getLoanDaysRemaining,
  renewLoan,
  returnBook,
  updateEmailReminderPreference,
} from '../services/libraryService';
import type {
  Activity,
  Book,
  EmailNotification,
  Loan,
  UserPrivate,
} from '../types/library';
import { ChartsPanel } from './ChartsPanel';

interface MemberDashboardViewProps {
  books: Book[];
  userLoans: Loan[];
  activities: Activity[];
  userNotifications: EmailNotification[];
  userPrivate: UserPrivate | null;
  actorId: string;
  actorName: string;
  isGuest?: boolean;
  onRequireAuth?: () => void;
  onNavigate: (tab: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function MemberDashboardView({
  books,
  userLoans,
  activities,
  userNotifications,
  userPrivate,
  actorId,
  actorName,
  isGuest = false,
  onRequireAuth,
  onNavigate,
  onNotify,
}: MemberDashboardViewProps) {
  const [busyLoanId, setBusyLoanId] = useState<string | null>(null);
  const [togglingPref, setTogglingPref] = useState(false);

  const summary = useMemo(() => {
    const active = userLoans.filter((l) => l.status !== 'returned');
    const dueSoon = active.filter((l) => getLoanDaysRemaining(l) <= 2);
    const overdue = active.filter((l) => getLoanDaysRemaining(l) < 0);
    const returned = userLoans.filter((l) => l.status === 'returned');

    return {
      active,
      dueSoon,
      overdue,
      returned,
      total: userLoans.length,
    };
  }, [userLoans]);

  async function handleReturn(loan: Loan) {
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
    setBusyLoanId(loan.id);
    try {
      await returnBook({ loan, actorId, actorName });
      onNotify(`Buku "${loan.bookTitle}" berhasil dikembalikan.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengembalikan buku.';
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

  async function handleToggleReminderPref() {
    if (isGuest || !userPrivate) {
      onRequireAuth?.();
      return;
    }
    setTogglingPref(true);
    try {
      const next = !userPrivate.emailRemindersEnabled;
      await updateEmailReminderPreference(actorId, next);
      onNotify(
        next
          ? 'Pengingat email jatuh tempo otomatis diaktifkan.'
          : 'Pengingat email jatuh tempo otomatis dinonaktifkan.',
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui preferensi.';
      onNotify(msg, 'error');
    } finally {
      setTogglingPref(false);
    }
  }

  return (
    <div className="space-y-6">
      {summary.dueSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-neutral-950">
                Pengingat Jatuh Tempo Aktif ({summary.dueSoon.length} buku)
              </h3>
              <p className="text-xs text-neutral-700 mt-0.5">
                {summary.overdue.length > 0
                  ? `${summary.overdue.length} buku telah melewati batas waktu. Segera lakukan pengembalian.`
                  : 'Beberapa buku mendekati batas waktu pengembalian dalam 48 jam ke depan.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('loans')}
            className="px-3.5 py-2 text-xs font-medium text-neutral-950 bg-white border border-amber-300 rounded-lg hover:bg-amber-100/60 transition-colors whitespace-nowrap shrink-0"
          >
            Tinjau Pinjaman
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-900/80">
            <span>Sedang Dipinjam</span>
            <BookOpen className="w-4 h-4 text-emerald-800" />
          </div>
          <p className="text-2xl font-semibold text-neutral-950 font-mono-num mt-2">
            {summary.active.length}
          </p>
          <p className="text-xs text-emerald-900/75 mt-1">
            Buku aktif di akun Anda
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>Segera Jatuh Tempo</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-semibold text-neutral-950 font-mono-num mt-2">
            {summary.dueSoon.length}
          </p>
          <p className="text-xs text-neutral-500 mt-1 font-mono-num">
            {summary.overdue.length} terlambat
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>Selesai Dikembalikan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-semibold text-neutral-950 font-mono-num mt-2">
            {summary.returned.length}
          </p>
          <p className="text-xs text-neutral-500 mt-1 font-mono-num">
            Total {summary.total} transaksi
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>Notifikasi Email</span>
            <Bell className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-neutral-950">
              {userPrivate?.emailRemindersEnabled ? 'Aktif Real-Time' : 'Nonaktif'}
            </span>
            <button
              type="button"
              disabled={togglingPref || !userPrivate}
              onClick={handleToggleReminderPref}
              className="px-2.5 py-1 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
            >
              {userPrivate?.emailRemindersEnabled ? 'Matikan' : 'Aktifkan'}
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-1 truncate">
            {userPrivate?.email || '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-950">
                Pinjaman Aktif Anda
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Pantau tenggat waktu, perpanjang masa pinjam, atau kembalikan buku secara instan
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="text-xs font-semibold text-emerald-800 hover:text-neutral-950 whitespace-nowrap transition-colors"
            >
              Jelajahi Katalog
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {summary.active.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-neutral-950">
                  Belum ada buku yang sedang dipinjam
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Pilih buku dari katalog online untuk memulai peminjaman digital atau cetak.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="mt-4 px-4 py-2 text-xs font-medium text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Pinjam Buku Sekarang
                </button>
              </div>
            ) : (
              summary.active.map((loan) => {
                const days = getLoanDaysRemaining(loan);
                const isOverdue = days < 0;
                const isDueSoon = days >= 0 && days <= 2;
                const isBusy = busyLoanId === loan.id;

                return (
                  <div
                    key={loan.id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-neutral-950 truncate">
                        {loan.bookTitle}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5 font-mono-num">
                        {loan.bookCategory} · Pinjam {formatDateId(loan.borrowedAt)} · Batas{' '}
                        {formatDateId(loan.dueDate)}
                      </p>
                      <p
                        className={`text-xs font-medium mt-1 ${
                          isOverdue
                            ? 'text-red-700'
                            : isDueSoon
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {isOverdue
                          ? `Terlambat ${Math.abs(days)} hari`
                          : days === 0
                          ? 'Jatuh tempo hari ini'
                          : `Sisa waktu ${days} hari`}{' '}
                        · Perpanjangan {loan.renewalCount}/2
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {loan.renewalCount < 2 && !isOverdue && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRenew(loan)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>+3 Hari</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReturn(loan)}
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        Kembalikan
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-700" />
                <h3 className="text-base font-semibold text-neutral-950">
                  Kotak Masuk Pengingat Email
                </h3>
              </div>
              <span className="text-xs font-mono-num text-neutral-500">
                {userNotifications.length}
              </span>
            </div>

            <div className="divide-y divide-neutral-100 max-h-56 overflow-y-auto">
              {userNotifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  Belum ada email pengingat jatuh tempo yang masuk.
                </div>
              ) : (
                userNotifications.slice(0, 6).map((mail, idx) => (
                  <div key={mail.id || idx} className="px-5 py-3 text-xs">
                    <p className="font-medium text-neutral-950 truncate">{mail.subject}</p>
                    <p className="text-neutral-500 mt-0.5 line-clamp-2">
                      {mail.bodyPreview}
                    </p>
                    <p className="text-neutral-400 font-mono-num mt-1">
                      {formatDateTimeId(mail.sentAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-emerald-700" />
                <h3 className="text-base font-semibold text-neutral-950">
                  Aktivitas Perpustakaan Terkini
                </h3>
              </div>
            </div>
            <div className="divide-y divide-neutral-100 max-h-56 overflow-y-auto">
              {activities.slice(0, 6).map((act, idx) => (
                <div key={act.id || idx} className="px-5 py-3 text-xs">
                  <p className="text-neutral-900">{act.description}</p>
                  <p className="text-neutral-400 font-mono-num mt-0.5">
                    {formatDateTimeId(act.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ChartsPanel loans={userLoans} books={books} />
    </div>
  );
}
