import { useEffect, useMemo, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {
  BellRing,
  BookCopy,
  BookOpen,
  FileBarChart2,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UserCircle2,
  X,
} from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AutomatedReportsView } from './components/AutomatedReportsView';
import { BookCatalogView } from './components/BookCatalogView';
import { BookCover } from './components/BookCover';
import { CollectionManagerView } from './components/CollectionManagerView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoansAndRemindersView } from './components/LoansAndRemindersView';
import { MemberDashboardView } from './components/MemberDashboardView';
import { SEED_BOOKS } from './data/seedCatalog';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  ensureUserProfile,
  getLoanDaysRemaining,
  seedInitialLibrary,
  sendDueReminderEmail,
} from './services/libraryService';
import type {
  Activity,
  AutomatedReport,
  Book,
  EmailNotification,
  Loan,
  UserPrivate,
  UserPublic,
} from './types/library';

type NavTab = 'dashboard' | 'catalog' | 'collections' | 'loans' | 'reports';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

function PustakaNusaApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const [userPublic, setUserPublic] = useState<UserPublic | null>(null);
  const [userPrivate, setUserPrivate] = useState<UserPrivate | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [members, setMembers] = useState<UserPublic[]>([]);
  const [reports, setReports] = useState<AutomatedReport[]>([]);
  const [booksLoaded, setBooksLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [portalMode, setPortalMode] = useState<'admin' | 'member'>('admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [landingSearch, setLandingSearch] = useState('');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autoSeedAttemptedRef = useRef(false);
  const autoReminderAttemptedRef = useRef<Set<string>>(new Set());

  function notify(text: string, type: 'success' | 'error' = 'success') {
    const id = Date.now();
    setToast({ id, text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  }

  useEffect(() => {
    fetch('/api/notifications/smtp-status')
      .then((res) => res.json())
      .then((data: { configured?: boolean }) => {
        setSmtpConfigured(Boolean(data.configured));
      })
      .catch(() => {
        setSmtpConfigured(false);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (!firebaseUser) {
        setUserPublic(null);
        setUserPrivate(null);
        setProfileReady(false);
        setBooks([]);
        setLoans([]);
        setActivities([]);
        setNotifications([]);
        setMembers([]);
        setReports([]);
        setBooksLoaded(false);
        autoSeedAttemptedRef.current = false;
        return;
      }

      try {
        const { publicProfile, privateProfile } = await ensureUserProfile(firebaseUser);
        setUserPublic(publicProfile);
        setUserPrivate(privateProfile);
        setPortalMode(publicProfile.role === 'admin' ? 'admin' : 'member');
        setProfileReady(true);
      } catch (err) {
        console.error('Profile sync error:', err);
        setProfileReady(true);
      }
    });

    return () => unsub();
  }, []);

  const isActualAdmin = useMemo(() => {
    if (!user) return false;
    const isBootstrap =
      user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() &&
      user.emailVerified;
    return isBootstrap || userPublic?.role === 'admin';
  }, [user, userPublic]);

  const effectiveAdminView = isActualAdmin && portalMode === 'admin';

  // Live Firestore subscriptions
  useEffect(() => {
    if (!authReady || !user || !profileReady) return;

    const unsubs: (() => void)[] = [];

    // 1. User own profile live sync
    unsubs.push(
      onSnapshot(
        doc(db, 'usersPublic', user.uid),
        (snap) => {
          if (snap.exists()) setUserPublic(snap.data() as UserPublic);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `usersPublic/${user.uid}`)
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'usersPrivate', user.uid),
        (snap) => {
          if (snap.exists()) setUserPrivate(snap.data() as UserPrivate);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `usersPrivate/${user.uid}`)
      )
    );

    // 2. Books catalog
    unsubs.push(
      onSnapshot(
        query(collection(db, 'books'), orderBy('title', 'asc')),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as Book);
          setBooks(list);
          setBooksLoaded(true);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'books')
      )
    );

    // 3. Real-time activities
    unsubs.push(
      onSnapshot(
        query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(40)),
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Activity, 'id'>),
          }));
          setActivities(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'activities')
      )
    );

    // 4. Loans (Admin sees all; Member sees own loans sorted in memory to avoid composite index)
    if (isActualAdmin) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'loans'), orderBy('borrowedAt', 'desc')),
          (snap) => {
            setLoans(snap.docs.map((d) => d.data() as Loan));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'loans')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'emailNotifications'), orderBy('sentAt', 'desc'), limit(50)),
          (snap) => {
            setNotifications(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<EmailNotification, 'id'>),
              }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'emailNotifications')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'usersPublic'),
          (snap) => {
            setMembers(snap.docs.map((d) => d.data() as UserPublic));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'usersPublic')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(25)),
          (snap) => {
            setReports(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<AutomatedReport, 'id'>),
              }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
        )
      );
    } else {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'loans'), where('memberId', '==', user.uid)),
          (snap) => {
            const items = snap.docs.map((d) => d.data() as Loan);
            items.sort((a, b) => {
              const am = a.borrowedAt?.toMillis ? a.borrowedAt.toMillis() : 0;
              const bm = b.borrowedAt?.toMillis ? b.borrowedAt.toMillis() : 0;
              return bm - am;
            });
            setLoans(items);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'loans')
        )
      );

      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'emailNotifications'),
            where('recipientId', '==', user.uid)
          ),
          (snap) => {
            const items = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<EmailNotification, 'id'>),
            }));
            items.sort((a, b) => {
              const am = a.sentAt?.toMillis ? a.sentAt.toMillis() : 0;
              const bm = b.sentAt?.toMillis ? b.sentAt.toMillis() : 0;
              return bm - am;
            });
            setNotifications(items);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'emailNotifications')
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, user, profileReady, isActualAdmin]);

  // Seed initial catalog automatically once when Admin sees empty catalog
  useEffect(() => {
    if (
      !authReady ||
      !user ||
      !isActualAdmin ||
      !booksLoaded ||
      books.length > 0 ||
      autoSeedAttemptedRef.current
    ) {
      return;
    }

    autoSeedAttemptedRef.current = true;
    seedInitialLibrary(
      user.uid,
      userPublic?.displayName || user.displayName || 'Administrator'
    )
      .then((count) => {
        if (count > 0) {
          notify(`${count} buku katalog dasar PustakaNusa siap digunakan.`, 'success');
        }
      })
      .catch((err) => {
        console.error('Auto-seed error:', err);
      });
  }, [authReady, user, isActualAdmin, booksLoaded, books.length, userPublic]);

  // Real-time automatic due-date email reminder engine
  useEffect(() => {
    if (!authReady || !user || !profileReady || loans.length === 0) return;
    if (!isActualAdmin && userPrivate?.emailRemindersEnabled === false) return;

    const candidates = loans.filter((loan) => {
      if (loan.status === 'returned') return false;
      if (loan.reminderSentCount > 0) return false;
      if (!isActualAdmin && loan.memberId !== user.uid) return false;
      if (autoReminderAttemptedRef.current.has(loan.id)) return false;
      const days = getLoanDaysRemaining(loan);
      return days <= 1;
    });

    if (candidates.length === 0) return;

    for (const loan of candidates.slice(0, 2)) {
      autoReminderAttemptedRef.current.add(loan.id);
      sendDueReminderEmail({
        loan,
        actorId: user.uid,
        actorName: userPublic?.displayName || user.displayName || 'Sistem Real-Time',
        triggerType: 'auto_realtime',
      })
        .then(() => {
          notify(
            `Pengingat jatuh tempo otomatis dikirim ke ${loan.memberEmail} untuk "${loan.bookTitle}".`,
            'success'
          );
        })
        .catch((err) => {
          console.error('Auto reminder dispatch failed:', err);
        });
    }
  }, [authReady, user, profileReady, loans, isActualAdmin, userPrivate, userPublic]);

  const userLoans = useMemo(() => {
    if (!user) return [];
    return loans.filter((l) => l.memberId === user.uid);
  }, [loans, user]);

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter((n) => n.recipientId === user.uid);
  }, [notifications, user]);

  const globalMatches = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return { books: [] as Book[], loans: [] as Loan[] };
    const matchedBooks = books
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      )
      .slice(0, 4);
    const scopedLoans = effectiveAdminView ? loans : userLoans;
    const matchedLoans = scopedLoans
      .filter(
        (l) =>
          l.bookTitle.toLowerCase().includes(q) ||
          l.memberName.toLowerCase().includes(q) ||
          l.memberEmail.toLowerCase().includes(q)
      )
      .slice(0, 3);
    return { books: matchedBooks, loans: matchedLoans };
  }, [globalSearch, books, loans, userLoans, effectiveAdminView]);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan Google.';
      notify(msg, 'error');
    } finally {
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500">Memuat PustakaNusa...</div>
      </div>
    );
  }

  // Unauthenticated Landing Gate
  if (!user) {
    const qLanding = landingSearch.trim().toLowerCase();
    const previewCovers = (
      qLanding
        ? SEED_BOOKS.filter(
            (b) =>
              b.title.toLowerCase().includes(qLanding) ||
              b.author.toLowerCase().includes(qLanding) ||
              b.category.toLowerCase().includes(qLanding) ||
              b.isbn.toLowerCase().includes(qLanding)
          )
        : SEED_BOOKS
    ).slice(0, 4);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
            <a
              href="#top"
              className="text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
            >
              PustakaNusa
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a
                href="#fitur"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Fitur Utama
              </a>
              <a
                href="#koleksi"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Koleksi Kurasi
              </a>
              <a
                href="#notifikasi"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Pengingat Email
              </a>
            </nav>
            <button
              type="button"
              disabled={signingIn}
              onClick={handleSignIn}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              {signingIn ? 'Menghubungkan...' : 'Masuk dengan Google'}
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium text-blue-700">
                Sistem Perpustakaan Digital & Sirkulasi Real-Time
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 tracking-tight leading-[1.15] text-balance">
                Kelola Koleksi, Peminjaman Online, dan Pengingat Jatuh Tempo Secara Real-Time
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Platform terpadu bagi administrator dan anggota perpustakaan untuk memantau
                statistik peminjaman, menerbitkan laporan sirkulasi otomatis, serta mengirim
                notifikasi email pengingat tenggat secara langsung.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  disabled={signingIn}
                  onClick={handleSignIn}
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors"
                >
                  {signingIn ? 'Menghubungkan Akun...' : 'Masuk ke Portal Perpustakaan'}
                </button>
                <span className="text-xs text-slate-500">
                  Akses otomatis Portal Member & Admin
                </span>
              </div>

              <div
                id="fitur"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200"
              >
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Dashboard Admin & Member
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Sinkronisasi transaksi pinjam-kembali instan dan grafik tren mingguan.
                  </p>
                </div>
                <div id="notifikasi">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Pengingat Email Real-Time
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Deteksi keterlambatan otomatis dan pengiriman notifikasi email ke peminjam.
                  </p>
                </div>
              </div>
            </div>

            <div id="koleksi" className="lg:col-span-6 flex flex-col gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={landingSearch}
                  onChange={(e) => setLandingSearch(e.target.value)}
                  placeholder="Cari koleksi buku, penulis, atau kategori..."
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700"
                />
                {landingSearch && (
                  <button
                    type="button"
                    onClick={() => setLandingSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {previewCovers.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-sm font-medium text-slate-900">
                    Koleksi tidak ditemukan
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Coba kata kunci lain seperti Teknologi, Sastra, Sains, atau Sejarah.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {previewCovers.map((book) => (
                    <div
                      key={book.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                    >
                      <BookCover
                        title={book.title}
                        author={book.author}
                        category={book.category}
                        coverUrl={book.coverUrl}
                        className="aspect-[3/4] w-full"
                      />
                      <div className="p-3">
                        <p className="text-[11px] text-slate-500">
                          {book.category} · {book.format}
                        </p>
                        <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                          {book.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const navItems: { id: NavTab; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] =
    effectiveAdminView
      ? [
          { id: 'dashboard', label: 'Dashboard Admin', icon: LayoutDashboard },
          { id: 'catalog', label: 'Katalog & Pinjam', icon: BookOpen },
          { id: 'collections', label: 'Manajemen Koleksi', icon: BookCopy },
          { id: 'loans', label: 'Sirkulasi & Email', icon: BellRing },
          { id: 'reports', label: 'Laporan Otomatis', icon: FileBarChart2 },
        ]
      : [
          { id: 'dashboard', label: 'Dashboard Member', icon: LayoutDashboard },
          { id: 'catalog', label: 'Katalog & Pinjam', icon: BookOpen },
          { id: 'loans', label: 'Pinjaman & Email', icon: BellRing },
        ];

  const currentTabTitle =
    navItems.find((n) => n.id === activeTab)?.label || 'Dashboard';

  const displayName = userPublic?.displayName || user.displayName || 'Anggota';
  const displayEmail = userPrivate?.email || user.email || '';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0 no-print">
        <div>
          <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-2.5">
            <Library className="w-5 h-5 text-blue-700 shrink-0" />
            <span className="text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap">
              PustakaNusa
            </span>
          </div>

          {isActualAdmin && (
            <div className="px-4 pt-4">
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setPortalMode('admin');
                    setActiveTab('dashboard');
                  }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    portalMode === 'admin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Portal Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPortalMode('member');
                    if (activeTab === 'collections' || activeTab === 'reports') {
                      setActiveTab('dashboard');
                    }
                  }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    portalMode === 'member'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Portal Member
                </button>
              </div>
            </div>
          )}

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            {effectiveAdminView ? (
              <ShieldCheck className="w-8 h-8 text-blue-700 shrink-0" />
            ) : (
              <UserCircle2 className="w-8 h-8 text-slate-400 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col justify-between p-4 z-10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-lg font-display font-bold text-slate-900">
                  PustakaNusa
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isActualAdmin && (
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPortalMode('admin');
                      setActiveTab('dashboard');
                    }}
                    className={`py-1.5 text-xs font-medium rounded-md ${
                      portalMode === 'admin' ? 'bg-white text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    Portal Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPortalMode('member');
                      if (activeTab === 'collections' || activeTab === 'reports') {
                        setActiveTab('dashboard');
                      }
                    }}
                    className={`py-1.5 text-xs font-medium rounded-md ${
                      portalMode === 'member' ? 'bg-white text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    Portal Member
                  </button>
                </div>
              )}

              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg ${
                        activeTab === item.id
                          ? 'bg-blue-50 text-blue-800'
                          : 'text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-6 no-print">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Buka navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
                {effectiveAdminView ? 'Administrator' : 'Member'}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="font-display font-semibold text-slate-900 truncate">
                {currentTabTitle}
              </h1>
            </div>
          </div>

          <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={globalSearch}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && globalSearch.trim()) {
                  setActiveTab('catalog');
                  setSearchFocused(false);
                }
              }}
              placeholder="Cari buku, penulis, ISBN, atau transaksi... (/)"
              className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-colors"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => {
                  setGlobalSearch('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {searchFocused && globalSearch.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                {globalMatches.books.length === 0 && globalMatches.loans.length === 0 ? (
                  <div className="p-4 text-xs text-slate-500 text-center">
                    Tidak ada hasil untuk "{globalSearch}"
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {globalMatches.books.length > 0 && (
                      <div className="p-2">
                        <p className="px-2 py-1 text-[11px] font-medium text-slate-400">
                          Koleksi Buku
                        </p>
                        {globalMatches.books.map((book) => (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => {
                              setGlobalSearch(book.title);
                              setActiveTab('catalog');
                              setSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 truncate">
                                {book.title}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {book.author} · {book.category}
                              </p>
                            </div>
                            <span className="text-[11px] font-mono-num text-emerald-700 shrink-0">
                              {book.availableCopies}/{book.totalCopies}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {globalMatches.loans.length > 0 && (
                      <div className="p-2">
                        <p className="px-2 py-1 text-[11px] font-medium text-slate-400">
                          Transaksi Peminjaman
                        </p>
                        {globalMatches.loans.map((loan) => (
                          <button
                            key={loan.id}
                            type="button"
                            onClick={() => {
                              setGlobalSearch(loan.bookTitle);
                              setActiveTab('loans');
                              setSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 truncate">
                                {loan.bookTitle}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {loan.memberName} · {loan.status === 'returned' ? 'Dikembalikan' : 'Aktif'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
          >
            Pinjam Buku Online
          </button>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {toast && (
            <div
              role="status"
              className={`mb-5 px-4 py-3 rounded-xl border text-sm flex items-center justify-between gap-3 ${
                toast.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs font-medium opacity-70 hover:opacity-100"
              >
                Tutup
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && effectiveAdminView && (
            <AdminDashboardView
              books={books}
              loans={loans}
              activities={activities}
              notifications={notifications}
              members={members}
              actorId={user.uid}
              actorName={displayName}
              onNavigate={(tab) => setActiveTab(tab as NavTab)}
              onNotify={notify}
            />
          )}

          {activeTab === 'dashboard' && !effectiveAdminView && (
            <MemberDashboardView
              books={books}
              userLoans={userLoans}
              activities={activities}
              userNotifications={userNotifications}
              userPrivate={userPrivate}
              actorId={user.uid}
              actorName={displayName}
              onNavigate={(tab) => setActiveTab(tab as NavTab)}
              onNotify={notify}
            />
          )}

          {activeTab === 'catalog' && (
            <BookCatalogView
              books={books}
              userLoans={userLoans}
              userId={user.uid}
              userName={displayName}
              userEmail={displayEmail}
              externalSearch={globalSearch}
              onNotify={notify}
            />
          )}

          {activeTab === 'collections' && effectiveAdminView && (
            <CollectionManagerView
              books={books}
              actorId={user.uid}
              actorName={displayName}
              externalSearch={globalSearch}
              onNotify={notify}
            />
          )}

          {activeTab === 'loans' && (
            <LoansAndRemindersView
              loans={effectiveAdminView ? loans : userLoans}
              books={books}
              notifications={effectiveAdminView ? notifications : userNotifications}
              isAdmin={effectiveAdminView}
              actorId={user.uid}
              actorName={displayName}
              actorEmail={displayEmail}
              smtpConfigured={smtpConfigured}
              externalSearch={globalSearch}
              onNotify={notify}
            />
          )}

          {activeTab === 'reports' && effectiveAdminView && (
            <AutomatedReportsView
              books={books}
              loans={loans}
              notifications={notifications}
              reports={reports}
              actorId={user.uid}
              actorName={displayName}
              onNotify={notify}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PustakaNusaApp />
    </ErrorBoundary>
  );
}
