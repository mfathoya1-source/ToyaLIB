import { useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  AlertCircle,
  BookCopy,
  BookOpenCheck,
  Mail,
  Send,
  Users,
} from 'lucide-react';
import {
  formatDateId,
  formatDateTimeId,
  getLoanDaysRemaining,
  sendDueReminderEmail,
} from '../services/libraryService';
import type {
  Activity,
  Book,
  EmailNotification,
  Loan,
  UserPublic,
} from '../types/library';
import { ChartsPanel } from './ChartsPanel';

interface AdminDashboardViewProps {
  books: Book[];
  loans: Loan[];
  activities: Activity[];
  notifications: EmailNotification[];
  members: UserPublic[];
  actorId: string;
  actorName: string;
  onNavigate: (tab: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function AdminDashboardView({
  books,
  loans,
  activities,
  notifications,
  members,
  actorId,
  actorName,
  onNavigate,
  onNotify,
}: AdminDashboardViewProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((s, b) => s + b.totalCopies, 0);
    const availableCopies = books.reduce((s, b) => s + b.availableCopies, 0);
    const activeLoans = loans.filter((l) => l.status !== 'returned');
    const urgentLoans = activeLoans.filter((l) => getLoanDaysRemaining(l) <= 2);
    const overdueLoans = activeLoans.filter((l) => getLoanDaysRemaining(l) < 0);

    return {
      totalTitles,
      totalCopies,
      availableCopies,
      activeCount: activeLoans.length,
      urgentLoans,
      overdueCount: overdueLoans.length,
      memberCount: members.length,
      emailsSent: notifications.length,
    };
  }, [books, loans, members, notifications]);

  async function handleQuickReminder(loan: Loan) {
    setSendingId(loan.id);
    try {
      await sendDueReminderEmail({
        loan,
        actorId,
        actorName,
        triggerType: 'manual',
      });
      onNotify(`Pengingat jatuh tempo dikirim ke ${loan.memberEmail}.`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pengingat.';
      onNotify(msg, 'error');
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Koleksi Perpustakaan</span>
            <BookCopy className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 font-mono-num mt-2">
            {stats.totalTitles}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono-num">
            {stats.availableCopies} dari {stats.totalCopies} eksemplar tersedia
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Peminjaman Aktif</span>
            <BookOpenCheck className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 font-mono-num mt-2">
            {stats.activeCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Transaksi sedang berjalan secara real-time
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Jatuh Tempo & Terlambat</span>
            <AlertCircle
              className={`w-4 h-4 ${
                stats.overdueCount > 0 ? 'text-red-600' : 'text-amber-600'
              }`}
            />
          </div>
          <p className="text-2xl font-semibold text-slate-900 font-mono-num mt-2">
            {stats.urgentLoans.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono-num">
            {stats.overdueCount} melewati tenggat · {stats.emailsSent} email terkirim
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Anggota Terdaftar</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 font-mono-num mt-2">
            {stats.memberCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Akun aktif PustakaNusa
          </p>
        </div>
      </div>

      <ChartsPanel loans={loans} books={books} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Antrean Pengingat Jatuh Tempo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Peminjaman aktif dengan tenggat kurang dari atau sama dengan 2 hari
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('loans')}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              Kelola Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.urgentLoans.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Seluruh peminjaman berada dalam tenggat waktu normal.
              </div>
            ) : (
              stats.urgentLoans.slice(0, 6).map((loan) => {
                const days = getLoanDaysRemaining(loan);
                const isOverdue = days < 0;

                return (
                  <div
                    key={loan.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {loan.bookTitle}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {loan.memberName} ({loan.memberEmail}) · Batas {formatDateId(loan.dueDate)}
                      </p>
                      <p
                        className={`text-xs font-medium mt-0.5 ${
                          isOverdue ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        {isOverdue
                          ? `Terlambat ${Math.abs(days)} hari`
                          : days === 0
                          ? 'Jatuh tempo hari ini'
                          : `Sisa ${days} hari`}{' '}
                        · Terkirim {loan.reminderSentCount}x
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={sendingId === loan.id}
                      onClick={() => handleQuickReminder(loan)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors shrink-0 whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingId === loan.id ? 'Mengirim...' : 'Kirim Email'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-blue-700" />
              <h3 className="text-base font-semibold text-slate-900">
                Aktivitas Transaksi Real-Time
              </h3>
            </div>
            <span className="text-xs font-mono-num text-slate-500">Live</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Belum ada aktivitas transaksi tercatat.
              </div>
            ) : (
              activities.slice(0, 12).map((act, idx) => (
                <div key={act.id || idx} className="px-5 py-3 text-xs">
                  <p className="text-slate-900 font-medium leading-snug">
                    {act.description}
                  </p>
                  <p className="text-slate-500 font-mono-num mt-1">
                    {formatDateTimeId(act.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Direktori Anggota & Aktivitas Pinjaman
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantauan ringkas anggota aktif dan total buku yang telah dipinjam
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono-num">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {notifications.length} email pengingat tercatat
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-2.5 px-4">Nama Anggota</th>
                <th className="py-2.5 px-4">Peran</th>
                <th className="py-2.5 px-4 text-right">Sedang Dipinjam</th>
                <th className="py-2.5 px-4 text-right">Total Riwayat Pinjam</th>
                <th className="py-2.5 px-4 text-right">Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {members.map((m) => (
                <tr key={m.uid} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {m.displayName}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    {m.role === 'admin' ? 'Administrator' : 'Member'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num text-xs text-slate-900">
                    {m.activeLoanCount}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num text-xs text-slate-700">
                    {m.totalBorrowedCount}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num text-xs text-slate-500">
                    {formatDateId(m.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
