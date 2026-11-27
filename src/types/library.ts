import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member';

export type BookCategory =
  | 'Shonen'
  | 'Seinen'
  | 'Shojo'
  | 'Action'
  | 'Fantasy'
  | 'Slice of Life';

export type BookFormat = 'Cetak & Digital' | 'E-Book' | 'Cetak';

export type LoanStatus = 'borrowed' | 'returned' | 'overdue';

export type ActivityType =
  | 'borrow'
  | 'return'
  | 'renew'
  | 'reminder'
  | 'collection_add'
  | 'collection_update'
  | 'report';

export type ReportPeriod = 'harian' | 'mingguan' | 'bulanan' | 'keterlambatan';

export const BOOK_CATEGORIES: BookCategory[] = [
  'Shonen',
  'Action',
  'Fantasy',
  'Seinen',
  'Slice of Life',
  'Shojo',
];

export const BOOK_FORMATS: BookFormat[] = ['Cetak & Digital', 'E-Book', 'Cetak'];

export const BLUEPRINT_LIMITS = {
  ID_REGEX: /^[a-zA-Z0-9_\-]+$/,
  ID_MAX: 128,
  DISPLAY_NAME_MAX: 100,
  EMAIL_MAX: 200,
  TITLE_MAX: 200,
  AUTHOR_MAX: 140,
  ISBN_MAX: 40,
  PUBLISHER_MAX: 120,
  SYNOPSIS_MAX: 1200,
  COVER_URL_MAX: 400,
  SHELF_MAX: 60,
  DESCRIPTION_MAX: 300,
  SUBJECT_MAX: 200,
  BODY_PREVIEW_MAX: 1500,
  REPORT_TITLE_MAX: 160,
  SUMMARY_MAX: 1000,
} as const;

export interface UserPublic {
  uid: string;
  displayName: string;
  role: UserRole;
  activeLoanCount: number;
  totalBorrowedCount: number;
  joinedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserPrivate {
  uid: string;
  email: string;
  memberCode: string;
  emailRemindersEnabled: boolean;
  updatedAt: Timestamp;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  publisher: string;
  year: number;
  synopsis: string;
  coverUrl: string;
  format: BookFormat;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  borrowCount: number;
  lastLoanId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  bookCategory: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  status: LoanStatus;
  borrowedAt: Timestamp;
  dueDate: Timestamp;
  returnedAt?: Timestamp;
  renewalCount: number;
  reminderSentCount: number;
  lastReminderAt?: Timestamp;
  updatedAt: Timestamp;
}

export interface Activity {
  id?: string;
  actorId: string;
  actorName: string;
  actionType: ActivityType;
  bookId: string;
  bookTitle: string;
  description: string;
  createdAt: Timestamp;
}

export interface EmailNotification {
  id?: string;
  loanId: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  bookTitle: string;
  dueDate: Timestamp;
  subject: string;
  bodyPreview: string;
  deliveryMode: 'smtp' | 'simulated';
  status: 'sent' | 'simulated' | 'failed';
  triggerType: 'manual' | 'auto_realtime';
  sentAt: Timestamp;
}

export interface AutomatedReport {
  id?: string;
  title: string;
  period: ReportPeriod;
  generatedBy: string;
  generatedByName: string;
  totalBooks: number;
  totalCopies: number;
  activeLoans: number;
  overdueLoans: number;
  returnedLoans: number;
  remindersSent: number;
  topCategory: string;
  summaryText: string;
  createdAt: Timestamp;
}
