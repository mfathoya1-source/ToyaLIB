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
    displayName: 'Fathoya (Kurator Manga)',
    role: 'admin',
    activeLoanCount: 1,
    totalBorrowedCount: 18,
    joinedAt: Timestamp.fromMillis(now - 90 * DAY),
    updatedAt: Timestamp.fromMillis(now - 2 * HOUR),
  },
  {
    uid: 'guest_member_1',
    displayName: 'Dimas Pratama',
    role: 'member',
    activeLoanCount: 2,
    totalBorrowedCount: 11,
    joinedAt: Timestamp.fromMillis(now - 45 * DAY),
    updatedAt: Timestamp.fromMillis(now - 5 * HOUR),
  },
  {
    uid: 'guest_member_2',
    displayName: 'Sari Wulandari',
    role: 'member',
    activeLoanCount: 1,
    totalBorrowedCount: 9,
    joinedAt: Timestamp.fromMillis(now - 28 * DAY),
    updatedAt: Timestamp.fromMillis(now - 1 * DAY),
  },
];

export const GUEST_LOANS: Loan[] = [
  {
    id: 'ln_preview_1',
    bookId: 'manga_naruto_01',
    bookTitle: 'Naruto: Shippuden Vol. 01 — Kebangkitan Shinobi',
    bookIsbn: '978-408-873-842-0',
    bookCategory: 'Shonen',
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
    bookId: 'manga_jujutsu_01',
    bookTitle: 'Jujutsu Kaisen Vol. 01 — Ryomen Sukuna',
    bookIsbn: '978-408-881-516-9',
    bookCategory: 'Action',
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
    bookId: 'manga_spy_family_01',
    bookTitle: 'Spy x Family Vol. 01 — Operasi Strix',
    bookIsbn: '978-408-882-011-8',
    bookCategory: 'Slice of Life',
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
    bookId: 'manga_frieren_01',
    bookTitle: 'Frieren: Beyond Journey’s End Vol. 01',
    bookIsbn: '978-409-850-180-9',
    bookCategory: 'Fantasy',
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
    bookId: 'manga_chainsaw_01',
    bookTitle: 'Chainsaw Man Vol. 01 — Anjing & Gergaji',
    bookIsbn: '978-408-881-780-4',
    bookCategory: 'Seinen',
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
    bookId: 'manga_naruto_01',
    bookTitle: 'Naruto: Shippuden Vol. 01 — Kebangkitan Shinobi',
    description:
      'Email pengingat jatuh tempo dikirim ke Pengunjung Tamu untuk manga "Naruto: Shippuden Vol. 01"',
    createdAt: Timestamp.fromMillis(now - 3 * HOUR),
  },
  {
    id: 'act_prev_2',
    actorId: 'guest_member_1',
    actorName: 'Dimas Pratama',
    actionType: 'return',
    bookId: 'manga_chainsaw_01',
    bookTitle: 'Chainsaw Man Vol. 01 — Anjing & Gergaji',
    description:
      'Dimas Pratama mengembalikan manga "Chainsaw Man Vol. 01 — Anjing & Gergaji"',
    createdAt: Timestamp.fromMillis(now - 1 * DAY),
  },
  {
    id: 'act_prev_3',
    actorId: 'guest_member_2',
    actorName: 'Sari Wulandari',
    actionType: 'renew',
    bookId: 'manga_spy_family_01',
    bookTitle: 'Spy x Family Vol. 01 — Operasi Strix',
    description:
      'Sari Wulandari memperpanjang masa pinjam "Spy x Family Vol. 01" (+3 hari)',
    createdAt: Timestamp.fromMillis(now - 1 * DAY - 2 * HOUR),
  },
  {
    id: 'act_prev_4',
    actorId: 'guest_preview_user',
    actorName: 'Pengunjung Tamu',
    actionType: 'borrow',
    bookId: 'manga_naruto_01',
    bookTitle: 'Naruto: Shippuden Vol. 01 — Kebangkitan Shinobi',
    description:
      'Pengunjung Tamu meminjam "Naruto: Shippuden Vol. 01 — Kebangkitan Shinobi" selama 7 hari',
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
    bookTitle: 'Naruto: Shippuden Vol. 01 — Kebangkitan Shinobi',
    dueDate: Timestamp.fromMillis(now + 1 * DAY),
    subject:
      '[ToyaLibrary] Pengingat Jatuh Tempo Peminjaman: Naruto: Shippuden Vol. 01',
    bodyPreview:
      'Halo Pengunjung Tamu,\n\nManga "Naruto: Shippuden Vol. 01 — Kebangkitan Shinobi" akan jatuh tempo dalam 1 hari. Silakan lakukan pengembalian atau perpanjangan melalui Portal Member ToyaLibrary.',
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
    bookTitle: 'Jujutsu Kaisen Vol. 01 — Ryomen Sukuna',
    dueDate: Timestamp.fromMillis(now - 2 * DAY),
    subject:
      '[ToyaLibrary] Pengingat Keterlambatan Pengembalian: Jujutsu Kaisen Vol. 01',
    bodyPreview:
      'Halo Dimas Pratama,\n\nManga "Jujutsu Kaisen Vol. 01 — Ryomen Sukuna" telah melewati batas pengembalian selama 2 hari. Mohon segera kembalikan manga tersebut ke perpustakaan.',
    deliveryMode: 'simulated',
    status: 'simulated',
    triggerType: 'manual',
    sentAt: Timestamp.fromMillis(now - 6 * HOUR),
  },
];

export const GUEST_REPORTS: AutomatedReport[] = [
  {
    id: 'rep_prev_1',
    title: 'Laporan Sirkulasi Manga Mingguan · Pratinjau Otomatis',
    period: 'mingguan',
    generatedBy: 'guest_admin_demo',
    generatedByName: 'Fathoya (Kurator Manga)',
    totalBooks: GUEST_BOOKS.length,
    totalCopies: GUEST_BOOKS.reduce((s, b) => s + b.totalCopies, 0),
    activeLoans: 3,
    overdueLoans: 1,
    returnedLoans: 2,
    remindersSent: 2,
    topCategory: 'Shonen',
    summaryText:
      'Ringkasan otomatis (mingguan): tercatat 8 judul koleksi manga Jepang (59 volume cetak & digital). Saat ini terdapat 3 peminjaman aktif dengan 1 keterlambatan dan 2 transaksi selesai. Genre paling diminati adalah Shonen, dengan total 2 notifikasi pengingat email telah diproses.',
    createdAt: Timestamp.fromMillis(now - 4 * HOUR),
  },
];
