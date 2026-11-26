import { Timestamp } from 'firebase/firestore';
import { SEED_BOOKS } from './seedCatalog';
import type {
  Activity,
  AutomatedReport,
  Book,
  EmailNotification,
  Loan,
  UserPublic,
} from '../types/library';

const now = Date.now();
const DAY = 86400000;
const HOUR = 3600000;

export const GUEST_BOOKS: Book[] = SEED_BOOKS.map((b, idx) => ({
  ...b,
  createdAt: Timestamp.fromMillis(now - (30 - idx) * DAY),
  updatedAt: Timestamp.fromMillis(now - idx * HOUR),
}));

export const GUEST_MEMBERS: UserPublic[] = [
  {
    uid: 'guest_admin_demo',
    displayName: 'Fathoya (Admin Pustaka)',
    role: 'admin',
    activeLoanCount: 1,
    totalBorrowedCount: 14,
    joinedAt: Timestamp.fromMillis(now - 90 * DAY),
    updatedAt: Timestamp.fromMillis(now - 2 * HOUR),
  },
  {
    uid: 'guest_member_1',
    displayName: 'Dimas Pratama',
    role: 'member',
    activeLoanCount: 2,
    totalBorrowedCount: 9,
    joinedAt: Timestamp.fromMillis(now - 45 * DAY),
    updatedAt: Timestamp.fromMillis(now - 5 * HOUR),
  },
  {
    uid: 'guest_member_2',
    displayName: 'Sari Wulandari',
    role: 'member',
    activeLoanCount: 1,
    totalBorrowedCount: 7,
    joinedAt: Timestamp.fromMillis(now - 28 * DAY),
    updatedAt: Timestamp.fromMillis(now - 1 * DAY),
  },
];

export const GUEST_LOANS: Loan[] = [
  {
    id: 'ln_preview_1',
    bookId: 'bk_arsitektur_sistem',
    bookTitle: 'Geometri & Arsitektur Sistem Terdistribusi',
    bookIsbn: '978-602-441-102-8',
    bookCategory: 'Teknologi',
    memberId: 'guest_preview_user',
    memberName: 'Pengunjung Tamu',
    memberEmail: 'tamu@toyalibrary.id',
    status: 'borrowed',
    borrowedAt: Timestamp.fromMillis(now - 5 * DAY),
    dueDate: Timestamp.fromMillis(now + 1 * DAY),
    renewalCount: 0,
    reminderSentCount: 1,
    lastReminderAt: Timestamp.fromMillis(now - 3 * HOUR),
    updatedAt: Timestamp.fromMillis(now - 3 * HOUR),
  },
  {
    id: 'ln_preview_2',
    bookId: 'bk_kosmologi_sains',
    bookTitle: 'Atlas Kosmologi & Mekanika Benda Langit',
    bookIsbn: '978-602-441-309-1',
    bookCategory: 'Sains',
    memberId: 'guest_member_1',
    memberName: 'Dimas Pratama',
    memberEmail: 'dimas.pratama@contoh.id',
    status: 'overdue',
    borrowedAt: Timestamp.fromMillis(now - 9 * DAY),
    dueDate: Timestamp.fromMillis(now - 2 * DAY),
    renewalCount: 0,
    reminderSentCount: 2,
    lastReminderAt: Timestamp.fromMillis(now - 6 * HOUR),
    updatedAt: Timestamp.fromMillis(now - 6 * HOUR),
  },
  {
    id: 'ln_preview_3',
    bookId: 'bk_desain_tipografi',
    bookTitle: 'Ruang, Bentuk & Grid Tipografi Modern',
    bookIsbn: '978-602-441-522-4',
    bookCategory: 'Desain',
    memberId: 'guest_member_2',
    memberName: 'Sari Wulandari',
    memberEmail: 'sari.wulandari@contoh.id',
    status: 'borrowed',
    borrowedAt: Timestamp.fromMillis(now - 2 * DAY),
    dueDate: Timestamp.fromMillis(now + 5 * DAY),
    renewalCount: 1,
    reminderSentCount: 0,
    updatedAt: Timestamp.fromMillis(now - 1 * DAY),
  },
  {
    id: 'ln_preview_4',
    bookId: 'bk_sastra_nusantara',
    bookTitle: 'Kronik Kepulauan: Antologi Sastra Maritim',
    bookIsbn: '978-602-441-214-8',
    bookCategory: 'Sastra',
    memberId: 'guest_preview_user',
    memberName: 'Pengunjung Tamu',
    memberEmail: 'tamu@toyalibrary.id',
    status: 'returned',
    borrowedAt: Timestamp.fromMillis(now - 12 * DAY),
    dueDate: Timestamp.fromMillis(now - 5 * DAY),
    returnedAt: Timestamp.fromMillis(now - 6 * DAY),
    renewalCount: 0,
    reminderSentCount: 0,
    updatedAt: Timestamp.fromMillis(now - 6 * DAY),
  },
  {
    id: 'ln_preview_5',
    bookId: 'bk_ekonomi_digital',
    bookTitle: 'Ekonomi Platform & Tata Kelola Bisnis Berkelanjutan',
    bookIsbn: '978-602-441-630-6',
    bookCategory: 'Bisnis',
    memberId: 'guest_member_1',
    memberName: 'Dimas Pratama',
    memberEmail: 'dimas.pratama@contoh.id',
    status: 'returned',
    borrowedAt: Timestamp.fromMillis(now - 4 * DAY),
    dueDate: Timestamp.fromMillis(now + 3 * DAY),
    returnedAt: Timestamp.fromMillis(now - 1 * DAY),
    renewalCount: 0,
    reminderSentCount: 0,
    updatedAt: Timestamp.fromMillis(now - 1 * DAY),
  },
];

export const GUEST_ACTIVITIES: Activity[] = [
  {
    id: 'act_prev_1',
    actorId: 'guest_preview_user',
    actorName: 'Pengunjung Tamu',
    actionType: 'reminder',
    bookId: 'bk_arsitektur_sistem',
    bookTitle: 'Geometri & Arsitektur Sistem Terdistribusi',
    description:
      'Email pengingat jatuh tempo dikirim ke Pengunjung Tamu untuk "Geometri & Arsitektur Sistem Terdistribusi"',
    createdAt: Timestamp.fromMillis(now - 3 * HOUR),
  },
  {
    id: 'act_prev_2',
    actorId: 'guest_member_1',
    actorName: 'Dimas Pratama',
    actionType: 'return',
    bookId: 'bk_ekonomi_digital',
    bookTitle: 'Ekonomi Platform & Tata Kelola Bisnis Berkelanjutan',
    description:
      'Dimas Pratama mengembalikan "Ekonomi Platform & Tata Kelola Bisnis Berkelanjutan"',
    createdAt: Timestamp.fromMillis(now - 1 * DAY),
  },
  {
    id: 'act_prev_3',
    actorId: 'guest_member_2',
    actorName: 'Sari Wulandari',
    actionType: 'renew',
    bookId: 'bk_desain_tipografi',
    bookTitle: 'Ruang, Bentuk & Grid Tipografi Modern',
    description:
      'Sari Wulandari memperpanjang masa pinjam "Ruang, Bentuk & Grid Tipografi Modern" (+3 hari)',
    createdAt: Timestamp.fromMillis(now - 1 * DAY - 2 * HOUR),
  },
  {
    id: 'act_prev_4',
    actorId: 'guest_preview_user',
    actorName: 'Pengunjung Tamu',
    actionType: 'borrow',
    bookId: 'bk_arsitektur_sistem',
    bookTitle: 'Geometri & Arsitektur Sistem Terdistribusi',
    description:
      'Pengunjung Tamu meminjam "Geometri & Arsitektur Sistem Terdistribusi" selama 7 hari',
    createdAt: Timestamp.fromMillis(now - 5 * DAY),
  },
];

export const GUEST_NOTIFICATIONS: EmailNotification[] = [
  {
    id: 'mail_prev_1',
    loanId: 'ln_preview_1',
    recipientId: 'guest_preview_user',
    recipientName: 'Pengunjung Tamu',
    recipientEmail: 'tamu@toyalibrary.id',
    bookTitle: 'Geometri & Arsitektur Sistem Terdistribusi',
    dueDate: Timestamp.fromMillis(now + 1 * DAY),
    subject:
      '[ToyaLibrary] Pengingat Jatuh Tempo Peminjaman: Geometri & Arsitektur Sistem Terdistribusi',
    bodyPreview:
      'Halo Pengunjung Tamu,\n\nBuku "Geometri & Arsitektur Sistem Terdistribusi" akan jatuh tempo dalam 1 hari. Silakan lakukan pengembalian atau perpanjangan melalui Portal Member ToyaLibrary.',
    deliveryMode: 'simulated',
    status: 'simulated',
    triggerType: 'auto_realtime',
    sentAt: Timestamp.fromMillis(now - 3 * HOUR),
  },
  {
    id: 'mail_prev_2',
    loanId: 'ln_preview_2',
    recipientId: 'guest_member_1',
    recipientName: 'Dimas Pratama',
    recipientEmail: 'dimas.pratama@contoh.id',
    bookTitle: 'Atlas Kosmologi & Mekanika Benda Langit',
    dueDate: Timestamp.fromMillis(now - 2 * DAY),
    subject:
      '[ToyaLibrary] Pengingat Keterlambatan Pengembalian: Atlas Kosmologi & Mekanika Benda Langit',
    bodyPreview:
      'Halo Dimas Pratama,\n\nBuku "Atlas Kosmologi & Mekanika Benda Langit" telah melewati batas pengembalian selama 2 hari. Mohon segera kembalikan buku tersebut ke perpustakaan.',
    deliveryMode: 'simulated',
    status: 'simulated',
    triggerType: 'manual',
    sentAt: Timestamp.fromMillis(now - 6 * HOUR),
  },
];

export const GUEST_REPORTS: AutomatedReport[] = [
  {
    id: 'rep_prev_1',
    title: 'Laporan Sirkulasi Mingguan · Pratinjau Otomatis',
    period: 'mingguan',
    generatedBy: 'guest_admin_demo',
    generatedByName: 'Fathoya (Admin Pustaka)',
    totalBooks: GUEST_BOOKS.length,
    totalCopies: GUEST_BOOKS.reduce((s, b) => s + b.totalCopies, 0),
    activeLoans: 3,
    overdueLoans: 1,
    returnedLoans: 2,
    remindersSent: 2,
    topCategory: 'Desain',
    summaryText:
      'Ringkasan otomatis (mingguan): tercatat 8 judul buku (49 eksemplar). Saat ini terdapat 3 peminjaman aktif dengan 1 keterlambatan dan 2 transaksi selesai. Kategori paling diminati adalah Desain, dengan total 2 notifikasi pengingat email telah diproses.',
    createdAt: Timestamp.fromMillis(now - 4 * HOUR),
  },
];
