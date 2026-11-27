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
  isGuest?: boolean;
  onRequireAuth?: () => void;
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
  isGuest = false,
  onRequireAuth,
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
    if (isGuest) {
      onRequireAuth?.();
      return;
    }
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
            <span>Koleksi Manga Jepang</span>
            <BookCopy className="w-4 h-4 text-[#ff7a00]" />
          </div>
          <p className="font-display text-3xl font-bold text-[#0c182c] font-mono-num mt-2">
            {stats.totalTitles}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono-num">
            {stats.availableCopies} dari {stats.totalCopies} volume tersedia
          </p>
        </div>

        <div className="bg-[#0c182c] border border-slate-800 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span>Peminjaman Aktif</span>
            <BookOpenCheck className="w-4 h-4 text-[#ff7a00]" />
          </div>
          <p className="font-display text-3xl font-bold text-[#ff7a00] font-mono-num mt-2">
            {stats.activeCount}
          </p>
          <p className="text-xs text-slate-300 mt-1">
            Transaksi manga berjalan real-time
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Jatuh Tempo &amp; Terlambat</span>
            <AlertCircle
              className={`w-4 h-4 ${
                stats.overdueCount > 0 ? 'text-red-600' : 'text-[#ff7a00]'
              }`}
            />
          </div>
          <p className="font-display text-3xl font-bold text-[#0c182c] font-mono-num mt-2">
            {stats.urgentLoans.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono-num">
            {stats.overdueCount} melewati tenggat · {stats.emailsSent} email terkirim
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Anggota Terdaftar</span>
            <Users className="w-4 h-4 text-[#0c182c]" />
          </div>
          <p className="font-display text-3xl font-bold text-[#0c182c] font-mono-num mt-2">
            {stats.memberCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Pembaca aktif ToyaLibrary
          </p>
        </div>
      </div>

      <ChartsPanel loans={loans} books={books} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#0c182c]">
                Antrean Pengingat Jatuh Tempo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Peminjaman manga aktif dengan tenggat kurang dari atau sama dengan 2 hari
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('loans')}
              className="text-xs font-semibold text-[#ea580c] hover:text-[#0c182c] whitespace-nowrap transition-colors"
            >
              Kelola Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.urgentLoans.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Seluruh peminjaman manga berada dalam tenggat waktu normal.
              </div>
            ) : (
              stats.urgentLoans.slice(0, 6).map((loan) => {
                const days = getLoanDaysRemaining(loan);
                const isOverdue = days < 0;

                return (
                  <div
                    key={loan.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-orange-50/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0c182c] truncate">
                        {loan.bookTitle}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {loan.memberName} ({loan.memberEmail}) · Batas {formatDateId(loan.dueDate)}
                      </p>
                      <p
                        className={`text-xs font-medium mt-0.5 ${
                          isOverdue ? 'text-red-700' : 'text-[#ea580c]'
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0c182c] bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors shrink-0 whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5 text-[#ea580c]" />
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
              <ActivityIcon className="w-4 h-4 text-[#ff7a00]" />
              <h3 className="text-base font-semibold text-[#0c182c]">
                Aktivitas Transaksi Real-Time
              </h3>
            </div>
            <span className="text-xs font-mono-num font-semibold text-[#ea580c]">Live</span>
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
            <h3 className="text-base font-semibold text-[#0c182c]">
              Direktori Anggota &amp; Aktivitas Pinjaman
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantauan ringkas anggota aktif dan total volume manga yang telah dipinjam
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono-num">
            <Mail className="w-3.5 h-3.5 text-[#ff7a00]" />
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
                <tr key={m.uid} className="hover:bg-orange-50/35">
                  <td className="py-2.5 px-4 font-medium text-[#0c182c]">
                    {m.displayName}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    {m.role === 'admin' ? 'Kurator / Admin' : 'Member'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-num text-xs text-[#0c182c]">
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
