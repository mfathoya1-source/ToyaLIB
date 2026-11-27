import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { SEED_BOOKS } from '../data/seedCatalog';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  BLUEPRINT_LIMITS,
  type AutomatedReport,
  type Book,
  type BookCategory,
  type BookFormat,
  type Loan,
  type ReportPeriod,
  type UserPrivate,
  type UserPublic,
} from '../types/library';

function sanitizeText(value: string, maxLen: number, fallback = ''): string {
  const cleaned = (value || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLen);
}

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

export function getLoanDaysRemaining(loan: Loan, nowMs: number = Date.now()): number {
  const dueMs = loan.dueDate?.toMillis ? loan.dueDate.toMillis() : nowMs;
  const diffMs = dueMs - nowMs;
  return Math.ceil(diffMs / 86400000);
}

export function formatDateId(ts?: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') return '—';
  return ts.toDate().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeId(ts?: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') return '—';
  return ts.toDate().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function ensureUserProfile(firebaseUser: User): Promise<{
  publicProfile: UserPublic;
  privateProfile: UserPrivate;
}> {
  const uid = firebaseUser.uid;
  const isBootstrapAdmin =
    firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() &&
    firebaseUser.emailVerified;

  const pubRef = doc(db, 'usersPublic', uid);
  const privRef = doc(db, 'usersPrivate', uid);
  const adminRef = doc(db, 'admins', uid);

  let pubSnap;
  try {
    pubSnap = await getDoc(pubRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `usersPublic/${uid}`);
  }

  let privSnap;
  try {
    privSnap = await getDoc(privRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `usersPrivate/${uid}`);
  }

  const displayName = sanitizeText(
    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anggota',
    BLUEPRINT_LIMITS.DISPLAY_NAME_MAX,
    'Anggota'
  );
  const email = sanitizeText(
    firebaseUser.email || '',
    BLUEPRINT_LIMITS.EMAIL_MAX,
    'anggota@toyalibrary.id'
  );
  const memberCode = `TL-${uid.slice(0, 6).toUpperCase()}`;

  if (!pubSnap.exists()) {
    try {
      await setDoc(pubRef, {
        uid,
        displayName,
        role: isBootstrapAdmin ? 'admin' : 'member',
        activeLoanCount: 0,
        totalBorrowedCount: 0,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `usersPublic/${uid}`);
    }
  } else if (isBootstrapAdmin && pubSnap.data().role !== 'admin') {
    try {
      await updateDoc(pubRef, {
        role: 'admin',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `usersPublic/${uid}`);
    }
  }

  if (!privSnap.exists()) {
    try {
      await setDoc(privRef, {
        uid,
        email,
        memberCode,
        emailRemindersEnabled: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `usersPrivate/${uid}`);
    }
  }

  if (isBootstrapAdmin) {
    try {
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          email,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${uid}`);
    }
  }

  const finalPub = await getDoc(pubRef);
  const finalPriv = await getDoc(privRef);

  return {
    publicProfile: finalPub.data() as UserPublic,
    privateProfile: finalPriv.data() as UserPrivate,
  };
}

export async function updateEmailReminderPreference(
  uid: string,
  enabled: boolean
): Promise<void> {
  const privRef = doc(db, 'usersPrivate', uid);
  try {
    await updateDoc(privRef, {
      emailRemindersEnabled: enabled,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `usersPrivate/${uid}`);
  }
}

export async function seedInitialLibrary(
  actorId: string,
  actorName: string
): Promise<number> {
  let created = 0;
  const batch = writeBatch(db);

  for (const item of SEED_BOOKS) {
    const bookRef = doc(db, 'books', item.id);
    const snap = await getDoc(bookRef);
    if (!snap.exists()) {
      batch.set(bookRef, {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      created++;
    }
  }

  if (created > 0) {
    const actId = makeSafeId('act');
    batch.set(doc(db, 'activities', actId), {
      actorId,
      actorName: sanitizeText(actorName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Admin'),
      actionType: 'collection_add',
      bookId: 'catalog_seed',
      bookTitle: `${created} Judul Koleksi Awal`,
      description: sanitizeText(
        `${actorName} menginisialisasi ${created} buku katalog dasar ToyaLibrary`,
        BLUEPRINT_LIMITS.DESCRIPTION_MAX
      ),
      createdAt: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'books');
    }
  }

  return created;
}

export interface BookFormInput {
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
}

export async function addBook(
  input: BookFormInput,
  actorId: string,
  actorName: string
): Promise<string> {
  const bookId = makeSafeId('bk');
  const total = Math.max(1, Math.min(500, Math.floor(input.totalCopies)));
  const avail = Math.max(0, Math.min(total, Math.floor(input.availableCopies)));

  const batch = writeBatch(db);
  batch.set(doc(db, 'books', bookId), {
    id: bookId,
    title: sanitizeText(input.title, BLUEPRINT_LIMITS.TITLE_MAX, 'Tanpa Judul'),
    author: sanitizeText(input.author, BLUEPRINT_LIMITS.AUTHOR_MAX, 'Anonim'),
    isbn: sanitizeText(input.isbn, BLUEPRINT_LIMITS.ISBN_MAX, '000-000-000'),
    category: input.category,
    publisher: sanitizeText(input.publisher, BLUEPRINT_LIMITS.PUBLISHER_MAX, 'ToyaLibrary'),
    year: Math.max(1400, Math.min(2100, Math.floor(input.year))),
    synopsis: sanitizeText(input.synopsis, BLUEPRINT_LIMITS.SYNOPSIS_MAX, 'Deskripsi koleksi.'),
    coverUrl: sanitizeText(input.coverUrl, BLUEPRINT_LIMITS.COVER_URL_MAX, ''),
    format: input.format,
    shelfLocation: sanitizeText(input.shelfLocation, BLUEPRINT_LIMITS.SHELF_MAX, 'Rak Umum'),
    totalCopies: total,
    availableCopies: avail,
    borrowCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'activities', makeSafeId('act')), {
    actorId,
    actorName: sanitizeText(actorName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Admin'),
    actionType: 'collection_add',
    bookId,
    bookTitle: sanitizeText(input.title, BLUEPRINT_LIMITS.TITLE_MAX, 'Tanpa Judul'),
    description: sanitizeText(
      `${actorName} menambahkan koleksi baru "${input.title}" (${total} eksemplar)`,
      BLUEPRINT_LIMITS.DESCRIPTION_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `books/${bookId}`);
  }
  return bookId;
}

export async function updateBook(
  bookId: string,
  input: BookFormInput,
  actorId: string,
  actorName: string
): Promise<void> {
  const total = Math.max(1, Math.min(500, Math.floor(input.totalCopies)));
  const avail = Math.max(0, Math.min(total, Math.floor(input.availableCopies)));

  const batch = writeBatch(db);
  batch.update(doc(db, 'books', bookId), {
    title: sanitizeText(input.title, BLUEPRINT_LIMITS.TITLE_MAX, 'Tanpa Judul'),
    author: sanitizeText(input.author, BLUEPRINT_LIMITS.AUTHOR_MAX, 'Anonim'),
    isbn: sanitizeText(input.isbn, BLUEPRINT_LIMITS.ISBN_MAX, '000-000-000'),
    category: input.category,
    publisher: sanitizeText(input.publisher, BLUEPRINT_LIMITS.PUBLISHER_MAX, 'ToyaLibrary'),
    year: Math.max(1400, Math.min(2100, Math.floor(input.year))),
    synopsis: sanitizeText(input.synopsis, BLUEPRINT_LIMITS.SYNOPSIS_MAX, 'Deskripsi koleksi.'),
    coverUrl: sanitizeText(input.coverUrl, BLUEPRINT_LIMITS.COVER_URL_MAX, ''),
    format: input.format,
    shelfLocation: sanitizeText(input.shelfLocation, BLUEPRINT_LIMITS.SHELF_MAX, 'Rak Umum'),
    totalCopies: total,
    availableCopies: avail,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'activities', makeSafeId('act')), {
    actorId,
    actorName: sanitizeText(actorName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Admin'),
    actionType: 'collection_update',
    bookId,
    bookTitle: sanitizeText(input.title, BLUEPRINT_LIMITS.TITLE_MAX, 'Tanpa Judul'),
    description: sanitizeText(
      `${actorName} memperbarui data & stok "${input.title}" (${avail}/${total} tersedia)`,
      BLUEPRINT_LIMITS.DESCRIPTION_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `books/${bookId}`);
  }
}

export async function deleteBook(bookId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'books', bookId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `books/${bookId}`);
  }
}

export async function borrowBook(params: {
  book: Book;
  memberId: string;
  memberName: string;
  memberEmail: string;
  durationDays: number;
}): Promise<string> {
  const { book, memberId, memberName, memberEmail, durationDays } = params;
  const safeDays = Math.max(1, Math.min(21, durationDays));

  const bookRef = doc(db, 'books', book.id);
  const userRef = doc(db, 'usersPublic', memberId);

  const [freshBookSnap, freshUserSnap] = await Promise.all([
    getDoc(bookRef),
    getDoc(userRef),
  ]);

  if (!freshBookSnap.exists()) {
    throw new Error('Buku tidak ditemukan di katalog.');
  }
  const freshBook = freshBookSnap.data() as Book;
  if (freshBook.availableCopies <= 0) {
    throw new Error('Stok eksemplar buku sedang habis dipinjam.');
  }

  const freshUser = freshUserSnap.exists() ? (freshUserSnap.data() as UserPublic) : null;
  const loanId = makeSafeId('ln');
  const dueDate = Timestamp.fromMillis(Date.now() + safeDays * 86400000);

  const batch = writeBatch(db);

  batch.set(doc(db, 'loans', loanId), {
    id: loanId,
    bookId: freshBook.id,
    bookTitle: sanitizeText(freshBook.title, BLUEPRINT_LIMITS.TITLE_MAX),
    bookIsbn: sanitizeText(freshBook.isbn, BLUEPRINT_LIMITS.ISBN_MAX),
    bookCategory: freshBook.category,
    memberId,
    memberName: sanitizeText(memberName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Anggota'),
    memberEmail: sanitizeText(memberEmail, BLUEPRINT_LIMITS.EMAIL_MAX),
    status: 'borrowed',
    borrowedAt: serverTimestamp(),
    dueDate,
    renewalCount: 0,
    reminderSentCount: 0,
    updatedAt: serverTimestamp(),
  });

  batch.update(bookRef, {
    availableCopies: freshBook.availableCopies - 1,
    borrowCount: freshBook.borrowCount + 1,
    lastLoanId: loanId,
    updatedAt: serverTimestamp(),
  });

  if (freshUser) {
    batch.update(userRef, {
      activeLoanCount: freshUser.activeLoanCount + 1,
      totalBorrowedCount: freshUser.totalBorrowedCount + 1,
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(doc(db, 'activities', makeSafeId('act')), {
    actorId: memberId,
    actorName: sanitizeText(memberName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Anggota'),
    actionType: 'borrow',
    bookId: freshBook.id,
    bookTitle: sanitizeText(freshBook.title, BLUEPRINT_LIMITS.TITLE_MAX),
    description: sanitizeText(
      `${memberName} meminjam "${freshBook.title}" selama ${safeDays} hari`,
      BLUEPRINT_LIMITS.DESCRIPTION_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `loans/${loanId}`);
  }
  return loanId;
}

export async function returnBook(params: {
  loan: Loan;
  actorId: string;
  actorName: string;
}): Promise<void> {
  const { loan, actorId, actorName } = params;
  const loanRef = doc(db, 'loans', loan.id);
  const bookRef = doc(db, 'books', loan.bookId);
  const memberRef = doc(db, 'usersPublic', loan.memberId);

  const [bookSnap, memberSnap] = await Promise.all([
    getDoc(bookRef),
    getDoc(memberRef),
  ]);

  const batch = writeBatch(db);

  batch.update(loanRef, {
    status: 'returned',
    returnedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (bookSnap.exists()) {
    const bookData = bookSnap.data() as Book;
    if (bookData.availableCopies < bookData.totalCopies) {
      batch.update(bookRef, {
        availableCopies: bookData.availableCopies + 1,
        lastLoanId: loan.id,
        updatedAt: serverTimestamp(),
      });
    }
  }

  if (memberSnap.exists()) {
    const memberData = memberSnap.data() as UserPublic;
    if (memberData.activeLoanCount > 0) {
      batch.update(memberRef, {
        activeLoanCount: memberData.activeLoanCount - 1,
        totalBorrowedCount: memberData.totalBorrowedCount,
        updatedAt: serverTimestamp(),
      });
    }
  }

  batch.set(doc(db, 'activities', makeSafeId('act')), {
    actorId,
    actorName: sanitizeText(actorName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Anggota'),
    actionType: 'return',
    bookId: loan.bookId,
    bookTitle: sanitizeText(loan.bookTitle, BLUEPRINT_LIMITS.TITLE_MAX),
    description: sanitizeText(
      `${actorName} mengembalikan "${loan.bookTitle}"`,
      BLUEPRINT_LIMITS.DESCRIPTION_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `loans/${loan.id}`);
  }
}

export async function renewLoan(params: {
  loan: Loan;
  actorId: string;
  actorName: string;
}): Promise<void> {
  const { loan, actorId, actorName } = params;
  if (loan.renewalCount >= 2) {
    throw new Error('Batas maksimal perpanjangan (2 kali) telah tercapai.');
  }

  const newDueDate = Timestamp.fromMillis(loan.dueDate.toMillis() + 3 * 86400000);
  const batch = writeBatch(db);

  batch.update(doc(db, 'loans', loan.id), {
    dueDate: newDueDate,
    renewalCount: loan.renewalCount + 1,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'activities', makeSafeId('act')), {
    actorId,
    actorName: sanitizeText(actorName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Anggota'),
    actionType: 'renew',
    bookId: loan.bookId,
    bookTitle: sanitizeText(loan.bookTitle, BLUEPRINT_LIMITS.TITLE_MAX),
    description: sanitizeText(
      `${actorName} memperpanjang masa pinjam "${loan.bookTitle}" (+3 hari)`,
      BLUEPRINT_LIMITS.DESCRIPTION_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `loans/${loan.id}`);
  }
}

export async function createDemoDueLoan(params: {
  book: Book;
  memberId: string;
  memberName: string;
  memberEmail: string;
  daysOffset: number;
}): Promise<string> {
  const { book, memberId, memberName, memberEmail, daysOffset } = params;
  const bookRef = doc(db, 'books', book.id);
  const userRef = doc(db, 'usersPublic', memberId);

  const [bookSnap, userSnap] = await Promise.all([getDoc(bookRef), getDoc(userRef)]);
  if (!bookSnap.exists()) throw new Error('Buku tidak ditemukan.');
  const freshBook = bookSnap.data() as Book;
  if (freshBook.availableCopies <= 0) throw new Error('Stok buku habis.');

  const loanId = makeSafeId('ln_sim');
  const dueDate = Timestamp.fromMillis(Date.now() + daysOffset * 86400000);
  const status = daysOffset < 0 ? 'overdue' : 'borrowed';

  const batch = writeBatch(db);
  batch.set(doc(db, 'loans', loanId), {
    id: loanId,
    bookId: freshBook.id,
    bookTitle: sanitizeText(freshBook.title, BLUEPRINT_LIMITS.TITLE_MAX),
    bookIsbn: sanitizeText(freshBook.isbn, BLUEPRINT_LIMITS.ISBN_MAX),
    bookCategory: freshBook.category,
    memberId,
    memberName: sanitizeText(memberName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX),
    memberEmail: sanitizeText(memberEmail, BLUEPRINT_LIMITS.EMAIL_MAX),
    status,
    borrowedAt: serverTimestamp(),
    dueDate,
    renewalCount: 0,
    reminderSentCount: 0,
    updatedAt: serverTimestamp(),
  });

  batch.update(bookRef, {
    availableCopies: freshBook.availableCopies - 1,
    borrowCount: freshBook.borrowCount + 1,
    lastLoanId: loanId,
    updatedAt: serverTimestamp(),
  });

  if (userSnap.exists()) {
    const userData = userSnap.data() as UserPublic;
    batch.update(userRef, {
      activeLoanCount: userData.activeLoanCount + 1,
      totalBorrowedCount: userData.totalBorrowedCount + 1,
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(doc(db, 'activities', makeSafeId('act')), {
    actorId: memberId,
    actorName: sanitizeText(memberName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX),
    actionType: 'borrow',
    bookId: freshBook.id,
    bookTitle: sanitizeText(freshBook.title, BLUEPRINT_LIMITS.TITLE_MAX),
    description: sanitizeText(
      `Simulasi transaksi ${daysOffset < 0 ? 'terlambat' : 'hampir jatuh tempo'} untuk "${freshBook.title}"`,
      BLUEPRINT_LIMITS.DESCRIPTION_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `loans/${loanId}`);
  }
  return loanId;
}

export async function sendDueReminderEmail(params: {
  loan: Loan;
  actorId: string;
  actorName: string;
  triggerType: 'manual' | 'auto_realtime';
}): Promise<{ deliveryMode: 'smtp' | 'simulated'; status: 'sent' | 'simulated' | 'failed'; subject: string }> {
  const { loan, actorId, actorName, triggerType } = params;
  const daysRemaining = getLoanDaysRemaining(loan);
  const dueDateLabel = formatDateId(loan.dueDate);

  const response = await fetch('/api/notifications/send-reminder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loanId: loan.id,
      recipientEmail: loan.memberEmail,
      recipientName: loan.memberName,
      bookTitle: loan.bookTitle,
      dueDateLabel,
      daysRemaining,
      triggerType,
    }),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    deliveryMode?: 'smtp' | 'simulated';
    status?: 'sent' | 'simulated' | 'failed';
    subject?: string;
    bodyPreview?: string;
  };

  const deliveryMode = payload.deliveryMode || 'simulated';
  const status = payload.status || (response.ok ? 'simulated' : 'failed');
  const subject = sanitizeText(
    payload.subject || `[ToyaLibrary] Pengingat Jatuh Tempo: ${loan.bookTitle}`,
    BLUEPRINT_LIMITS.SUBJECT_MAX
  );
  const bodyPreview = sanitizeText(
    payload.bodyPreview || `Pengingat batas pengembalian buku ${loan.bookTitle} (${dueDateLabel}).`,
    BLUEPRINT_LIMITS.BODY_PREVIEW_MAX
  );

  const notifId = makeSafeId('mail');
  const loanRef = doc(db, 'loans', loan.id);
  const freshLoanSnap = await getDoc(loanRef);
  const currentReminderCount = freshLoanSnap.exists()
    ? (freshLoanSnap.data() as Loan).reminderSentCount || 0
    : loan.reminderSentCount || 0;

  const batch = writeBatch(db);

  batch.set(doc(db, 'emailNotifications', notifId), {
    loanId: loan.id,
    recipientId: loan.memberId,
    recipientName: sanitizeText(loan.memberName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX),
    recipientEmail: sanitizeText(loan.memberEmail, BLUEPRINT_LIMITS.EMAIL_MAX),
    bookTitle: sanitizeText(loan.bookTitle, BLUEPRINT_LIMITS.TITLE_MAX),
    dueDate: loan.dueDate,
    subject,
    bodyPreview,
    deliveryMode,
    status,
    triggerType,
    sentAt: serverTimestamp(),
  });

  if (freshLoanSnap.exists() && (freshLoanSnap.data() as Loan).status !== 'returned') {
    batch.update(loanRef, {
      reminderSentCount: currentReminderCount + 1,
      lastReminderAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(doc(db, 'activities', makeSafeId('act')), {
    actorId,
    actorName: sanitizeText(actorName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Sistem'),
    actionType: 'reminder',
    bookId: loan.bookId,
    bookTitle: sanitizeText(loan.bookTitle, BLUEPRINT_LIMITS.TITLE_MAX),
    description: sanitizeText(
      `Email pengingat jatuh tempo dikirim ke ${loan.memberName} untuk "${loan.bookTitle}"`,
      BLUEPRINT_LIMITS.DESCRIPTION_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `emailNotifications/${notifId}`);
  }

  return { deliveryMode, status, subject };
}

export async function generateAutomatedReport(params: {
  period: ReportPeriod;
  generatedBy: string;
  generatedByName: string;
  books: Book[];
  loans: Loan[];
  remindersSent: number;
}): Promise<string> {
  const { period, generatedBy, generatedByName, books, loans, remindersSent } = params;
  const nowMs = Date.now();

  const totalBooks = books.length;
  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const activeLoansList = loans.filter((l) => l.status !== 'returned');
  const overdueLoansList = activeLoansList.filter(
    (l) => l.status === 'overdue' || getLoanDaysRemaining(l, nowMs) < 0
  );
  const returnedLoans = loans.filter((l) => l.status === 'returned').length;

  const categoryCounts: Record<string, number> = {};
  for (const loan of loans) {
    categoryCounts[loan.bookCategory] = (categoryCounts[loan.bookCategory] || 0) + 1;
  }
  let topCategory = 'Shonen';
  let maxCat = -1;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCat) {
      maxCat = count;
      topCategory = cat;
    }
  }
  if (maxCat <= 0 && books.length > 0) {
    topCategory = books[0].category;
  }

  const periodLabels: Record<ReportPeriod, string> = {
    harian: 'Laporan Sirkulasi Harian',
    mingguan: 'Laporan Sirkulasi Mingguan',
    bulanan: 'Laporan Sirkulasi Bulanan',
    keterlambatan: 'Audit Keterlambatan & Pengingat Email',
  };

  const dateTag = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const title = sanitizeText(
    `${periodLabels[period]} · ${dateTag}`,
    BLUEPRINT_LIMITS.REPORT_TITLE_MAX
  );

  const summaryText = sanitizeText(
    `Ringkasan otomatis (${period}): tercatat ${totalBooks} judul buku (${totalCopies} eksemplar). ` +
      `Saat ini terdapat ${activeLoansList.length} peminjaman aktif dengan ${overdueLoansList.length} keterlambatan ` +
      `dan ${returnedLoans} transaksi selesai. Kategori paling diminati adalah ${topCategory}, dengan total ` +
      `${remindersSent} notifikasi pengingat email telah diproses.`,
    BLUEPRINT_LIMITS.SUMMARY_MAX
  );

  const reportId = makeSafeId('rep');
  const batch = writeBatch(db);

  batch.set(doc(db, 'reports', reportId), {
    title,
    period,
    generatedBy,
    generatedByName: sanitizeText(generatedByName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Admin'),
    totalBooks,
    totalCopies,
    activeLoans: activeLoansList.length,
    overdueLoans: overdueLoansList.length,
    returnedLoans,
    remindersSent,
    topCategory,
    summaryText,
    createdAt: serverTimestamp(),
  } satisfies Omit<AutomatedReport, 'id' | 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> });

  batch.set(doc(db, 'activities', makeSafeId('act')), {
    actorId: generatedBy,
    actorName: sanitizeText(generatedByName, BLUEPRINT_LIMITS.DISPLAY_NAME_MAX, 'Admin'),
    actionType: 'report',
    bookId: reportId,
    bookTitle: title,
    description: sanitizeText(
      `${generatedByName} menerbitkan ${title}`,
      BLUEPRINT_LIMITS.DESCRIPTION_MAX
    ),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}`);
  }

  return reportId;
}
