import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

interface ReminderPayload {
  loanId?: string;
  recipientEmail?: string;
  recipientName?: string;
  bookTitle?: string;
  dueDateLabel?: string;
  daysRemaining?: number;
  triggerType?: 'manual' | 'auto_realtime';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', smtpConfigured: isSmtpConfigured() });
  });

  app.get('/api/notifications/smtp-status', (_req, res) => {
    res.json({
      configured: isSmtpConfigured(),
      provider: isSmtpConfigured() ? process.env.SMTP_HOST : 'Mode Pratinjau Real-Time',
    });
  });

  app.post('/api/notifications/send-reminder', async (req, res) => {
    const body = (req.body || {}) as ReminderPayload;
    const recipientEmail = typeof body.recipientEmail === 'string' ? body.recipientEmail.trim() : '';
    const recipientName = typeof body.recipientName === 'string' ? body.recipientName.trim() : 'Anggota PustakaNusa';
    const bookTitle = typeof body.bookTitle === 'string' ? body.bookTitle.trim() : 'Koleksi Buku';
    const dueDateLabel = typeof body.dueDateLabel === 'string' ? body.dueDateLabel.trim() : '-';
    const daysRemaining = typeof body.daysRemaining === 'number' ? body.daysRemaining : 0;
    const loanId = typeof body.loanId === 'string' ? body.loanId.trim() : '';

    if (!recipientEmail || !recipientEmail.includes('@') || recipientEmail.length > 200) {
      res.status(400).json({ error: 'Alamat email penerima tidak valid.' });
      return;
    }

    const isOverdue = daysRemaining < 0;
    const urgencyLabel = isOverdue
      ? `TERLAMBAT ${Math.abs(daysRemaining)} HARI`
      : daysRemaining === 0
      ? 'JATUH TEMPO HARI INI'
      : `JATUH TEMPO DALAM ${daysRemaining} HARI`;

    const subject = isOverdue
      ? `[PustakaNusa] Pengingat Keterlambatan Pengembalian: ${bookTitle}`
      : `[PustakaNusa] Pengingat Jatuh Tempo Peminjaman: ${bookTitle}`;

    const plainText = [
      `Halo ${recipientName},`,
      '',
      `Ini adalah notifikasi otomatis real-time dari PustakaNusa terkait peminjaman buku Anda:`,
      `- Judul Buku : ${bookTitle}`,
      `- Batas Kembali : ${dueDateLabel}`,
      `- Status Waktu : ${urgencyLabel}`,
      loanId ? `- ID Transaksi : ${loanId}` : '',
      '',
      isOverdue
        ? 'Mohon segera melakukan pengembalian buku melalui Portal Member PustakaNusa atau meja sirkulasi untuk menghindari denda keterlambatan.'
        : 'Silakan kembalikan atau perpanjang masa pinjam melalui Portal Member PustakaNusa sebelum batas waktu berakhir.',
      '',
      'Salam literasi,',
      'Tim Sirkulasi PustakaNusa',
    ]
      .filter(Boolean)
      .join('\n');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p style="font-size: 13px; color: #1d4ed8; font-weight: 600; margin: 0 0 8px;">PustakaNusa · Pengingat Sirkulasi Real-Time</p>
        <h2 style="font-size: 18px; margin: 0 0 16px;">${escapeHtml(urgencyLabel)}</h2>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">Halo <strong>${escapeHtml(recipientName)}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">Peminjaman buku berikut mendekati atau telah melewati batas pengembalian:</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Judul Buku</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(bookTitle)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Batas Kembali</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(dueDateLabel)}</td></tr>
          <tr><td style="padding: 8px; color: #64748b;">Status</td><td style="padding: 8px; font-weight: 600; color: ${isOverdue ? '#b91c1c' : '#b45309'};">${escapeHtml(urgencyLabel)}</td></tr>
        </table>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">Silakan lakukan pengembalian atau perpanjangan langsung melalui dasbor Member PustakaNusa.</p>
      </div>
    `;

    if (isSmtpConfigured()) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT || 587) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: recipientEmail,
          subject,
          text: plainText,
          html: htmlContent,
        });

        res.json({
          ok: true,
          deliveryMode: 'smtp',
          status: 'sent',
          subject,
          bodyPreview: plainText.slice(0, 1450),
          messageId: info.messageId,
        });
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'SMTP error';
        res.status(502).json({
          ok: false,
          deliveryMode: 'smtp',
          status: 'failed',
          subject,
          bodyPreview: plainText.slice(0, 1450),
          error: message,
        });
        return;
      }
    }

    // Real-time dispatch log fallback when external SMTP env is not supplied
    res.json({
      ok: true,
      deliveryMode: 'simulated',
      status: 'simulated',
      subject,
      bodyPreview: plainText.slice(0, 1450),
      messageId: `sim_${Date.now()}`,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PustakaNusa server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PustakaNusa server:', err);
  process.exit(1);
});
