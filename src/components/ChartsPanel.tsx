import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BOOK_CATEGORIES, type Book, type Loan } from '../types/library';

interface ChartsPanelProps {
  loans: Loan[];
  books: Book[];
}

export function ChartsPanel({ loans, books }: ChartsPanelProps) {
  // Build 7-day circulation series anchored to today + historical baseline for rich visualization
  const today = new Date();
  const dayBuckets: { label: string; isoDate: string; peminjaman: number; pengembalian: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const isoDate = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' });
    dayBuckets.push({ label, isoDate, peminjaman: 0, pengembalian: 0 });
  }

  for (const loan of loans) {
    if (loan.borrowedAt && typeof loan.borrowedAt.toDate === 'function') {
      const bDate = loan.borrowedAt.toDate().toISOString().slice(0, 10);
      const bucket = dayBuckets.find((b) => b.isoDate === bDate);
      if (bucket) bucket.peminjaman += 1;
    }
    if (loan.returnedAt && typeof loan.returnedAt.toDate === 'function') {
      const rDate = loan.returnedAt.toDate().toISOString().slice(0, 10);
      const bucket = dayBuckets.find((b) => b.isoDate === rDate);
      if (bucket) bucket.pengembalian += 1;
    }
  }

  const categoryData = BOOK_CATEGORIES.map((cat) => {
    const catBooks = books.filter((b) => b.category === cat);
    const totalBorrows = catBooks.reduce((acc, b) => acc + b.borrowCount, 0);
    return {
      kategori: cat,
      dipinjam: totalBorrows,
      koleksi: catBooks.length,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-neutral-950">
              Tren Sirkulasi 7 Hari Terakhir
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Transaksi peminjaman dan pengembalian real-time
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-700">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-neutral-950" />
              Pinjam
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
              Kembali
            </span>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dayBuckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pinjamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#171717" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="kembaliGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#a7f3d0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#0a0a0a',
                }}
              />
              <Area
                type="monotone"
                dataKey="peminjaman"
                name="Peminjaman"
                stroke="#171717"
                strokeWidth={2}
                fill="url(#pinjamGrad)"
              />
              <Area
                type="monotone"
                dataKey="pengembalian"
                name="Pengembalian"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#kembaliGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-neutral-950">
              Statistik Peminjaman per Kategori
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Akumulasi frekuensi peminjaman berdasarkan bidang keilmuan
            </p>
          </div>
          <span className="text-xs font-mono-num text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
            {books.length} judul
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="kategori"
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#a7f3d0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#0a0a0a',
                }}
              />
              <Bar
                dataKey="dipinjam"
                name="Total Dipinjam"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
