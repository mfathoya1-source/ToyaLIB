import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import type { BookCategory } from '../types/library';

interface BookCoverProps {
  title: string;
  author: string;
  category: BookCategory | string;
  coverUrl?: string;
  variant?: 'cover' | 'scene';
  className?: string;
}

interface SeriesTheme {
  jpTitle: string;
  badge: string;
  bgGradient: string;
  accent: string;
  secondary: string;
  motif: 'naruto' | 'jujutsu' | 'spy' | 'chainsaw' | 'frieren' | 'kimetsu' | 'onepiece' | 'shojo';
}

function resolveSeriesTheme(title: string, category: string): SeriesTheme {
  const lower = title.toLowerCase();
  if (lower.includes('naruto')) {
    return {
      jpTitle: 'ナルト 疾風伝',
      badge: 'SHONEN · VOL. 01',
      bgGradient: 'from-[#101c33] via-[#1c2b4a] to-[#ff7a00]',
      accent: '#ff7a00',
      secondary: '#fde047',
      motif: 'naruto',
    };
  }
  if (lower.includes('jujutsu')) {
    return {
      jpTitle: '呪術廻戦',
      badge: 'ACTION · VOL. 01',
      bgGradient: 'from-[#090d1a] via-[#172554] to-[#0284c7]',
      accent: '#38bdf8',
      secondary: '#e11d48',
      motif: 'jujutsu',
    };
  }
  if (lower.includes('spy')) {
    return {
      jpTitle: 'スパイファミリー',
      badge: 'SLICE OF LIFE · VOL. 01',
      bgGradient: 'from-[#112926] via-[#1b433a] to-[#fb7185]',
      accent: '#fb7185',
      secondary: '#fef08a',
      motif: 'spy',
    };
  }
  if (lower.includes('chainsaw')) {
    return {
      jpTitle: 'チェンソーマン',
      badge: 'SEINEN · VOL. 01',
      bgGradient: 'from-[#11131a] via-[#3b0d14] to-[#ea580c]',
      accent: '#ef4444',
      secondary: '#f97316',
      motif: 'chainsaw',
    };
  }
  if (lower.includes('frieren')) {
    return {
      jpTitle: '葬送のフリーレン',
      badge: 'FANTASY · VOL. 01',
      bgGradient: 'from-[#0c1b2a] via-[#1b3a4b] to-[#34d399]',
      accent: '#6ee7b7',
      secondary: '#e0f2fe',
      motif: 'frieren',
    };
  }
  if (lower.includes('kimetsu') || lower.includes('demon slayer')) {
    return {
      jpTitle: '鬼滅の刃',
      badge: 'ACTION · E-MANGA',
      bgGradient: 'from-[#08171c] via-[#134e4a] to-[#06b6d4]',
      accent: '#22d3ee',
      secondary: '#f97316',
      motif: 'kimetsu',
    };
  }
  if (lower.includes('one piece')) {
    return {
      jpTitle: 'ワンピース',
      badge: 'SHONEN · VOL. 01',
      bgGradient: 'from-[#0c1c3a] via-[#1d4ed8] to-[#f59e0b]',
      accent: '#fbbf24',
      secondary: '#ef4444',
      motif: 'onepiece',
    };
  }
  if (lower.includes('ao haru') || category === 'Shojo') {
    return {
      jpTitle: 'アオハライド',
      badge: 'SHOJO · E-MANGA',
      bgGradient: 'from-[#19233c] via-[#314b7e] to-[#f472b6]',
      accent: '#f9a8d4',
      secondary: '#bae6fd',
      motif: 'shojo',
    };
  }

  return {
    jpTitle: '日本の漫画',
    badge: `${category.toUpperCase()} · MANGA`,
    bgGradient: 'from-[#0c182c] via-[#172b4d] to-[#ea580c]',
    accent: '#ff7a00',
    secondary: '#93c5fd',
    motif: 'naruto',
  };
}

function SeriesArtwork({ theme }: { theme: SeriesTheme }) {
  switch (theme.motif) {
    case 'naruto':
      return (
        <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
          <circle cx="220" cy="95" r="76" fill="#eef8fc" fillOpacity="0.9" />
          <path d="M168 180 L205 112 L244 180 Z" fill="#091324" opacity="0.88" />
          <path d="M202 84 C202 72 222 72 222 84 C222 96 206 102 198 112 L238 112" stroke="#ff7a00" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="212" cy="84" r="14" stroke="#ff7a00" strokeWidth="3.5" fill="none" />
          <circle cx="212" cy="84" r="4" fill="#ff7a00" />
          <path d="M30 205 Q120 140 295 190" stroke="#ff7a00" strokeWidth="2.5" strokeOpacity="0.65" fill="none" />
        </svg>
      );
    case 'jujutsu':
      return (
        <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
          <circle cx="170" cy="110" r="68" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 6" fill="none" opacity="0.7" />
          <circle cx="170" cy="110" r="46" stroke="#e11d48" strokeWidth="2.5" fill="none" opacity="0.8" />
          <circle cx="170" cy="110" r="24" fill="#0f172a" stroke="#7dd3fc" strokeWidth="2" />
          <path d="M75 55 L265 165 M265 55 L75 165" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );
    case 'spy':
      return (
        <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
          <rect x="145" y="42" width="110" height="135" rx="8" fill="#fef3c7" fillOpacity="0.16" stroke="#fde047" strokeOpacity="0.45" />
          <polygon points="200,72 208,94 232,94 212,108 220,130 200,116 180,130 188,108 168,94 192,94" fill="#fb7185" fillOpacity="0.85" />
          <circle cx="95" cy="130" r="42" fill="#34d399" fillOpacity="0.22" />
        </svg>
      );
    case 'chainsaw':
      return (
        <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
          <path d="M40 175 L275 45" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" opacity="0.85" />
          <path d="M60 190 L295 60" stroke="#f97316" strokeWidth="4" strokeDasharray="10 8" opacity="0.9" />
          <polygon points="180,45 198,105 260,115 205,148 218,200 170,162 115,188 135,135 90,98 148,96" fill="#ffffff" fillOpacity="0.12" />
        </svg>
      );
    case 'frieren':
      return (
        <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
          <circle cx="210" cy="88" r="52" fill="#d1fae5" fillOpacity="0.25" />
          <path d="M210 30 L216 82 L268 88 L216 94 L210 146 L204 94 L152 88 L204 82 Z" fill="#6ee7b7" fillOpacity="0.85" />
          <circle cx="95" cy="70" r="3" fill="#ffffff" />
          <circle cx="125" cy="140" r="2.5" fill="#a7f3d0" />
          <circle cx="260" cy="152" r="3" fill="#ffffff" />
        </svg>
      );
    case 'kimetsu':
      return (
        <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
          <path d="M20 155 Q95 95 165 145 T305 115" stroke="#22d3ee" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M10 178 Q95 125 175 168 T315 145" stroke="#67e8f9" strokeWidth="3.5" fill="none" opacity="0.7" />
          <circle cx="230" cy="74" r="34" fill="#f97316" fillOpacity="0.3" stroke="#fdba74" strokeWidth="1.5" />
        </svg>
      );
    case 'onepiece':
      return (
        <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
          <circle cx="190" cy="105" r="58" fill="#fbbf24" fillOpacity="0.28" />
          <ellipse cx="190" cy="116" rx="74" ry="18" fill="#fde047" fillOpacity="0.85" />
          <path d="M142 114 C146 76 234 76 238 114 Z" fill="#f59e0b" />
          <path d="M143 108 H237" stroke="#dc2626" strokeWidth="7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
          <circle cx="215" cy="95" r="58" fill="#f9a8d4" fillOpacity="0.28" />
          <circle cx="130" cy="135" r="42" fill="#bae6fd" fillOpacity="0.22" />
          <path d="M40 165 Q160 115 290 155" stroke="#f9a8d4" strokeWidth="2.5" fill="none" opacity="0.75" />
        </svg>
      );
  }
}

export function BookCover({
  title,
  author,
  category,
  coverUrl,
  variant = 'cover',
  className = '',
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  if (coverUrl && !failed) {
    return (
      <div className={`relative overflow-hidden bg-[#0c182c] ${className}`}>
        <img
          src={coverUrl}
          alt={`Sampul manga ${title} karya ${author}`}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  const theme = resolveSeriesTheme(title, category);

  if (variant === 'scene') {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${theme.bgGradient} text-white select-none ${className}`}
      >
        {/* Subtle manga halftone dot grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
          }}
        />
        <div className="absolute inset-0">
          <SeriesArtwork theme={theme} />
        </div>
        <div className="relative z-10 h-full p-4 flex flex-col justify-between bg-gradient-to-t from-[#060d19]/95 via-[#060d19]/30 to-transparent">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono-num tracking-wider text-white/85 uppercase">
              {theme.jpTitle}
            </span>
            <span
              className="text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: theme.accent }}
            >
              {category}
            </span>
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-wide uppercase text-white leading-tight line-clamp-1">
              {title.split('—')[0].trim()}
            </p>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">{author}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${theme.bgGradient} text-white p-4 flex flex-col justify-between select-none ${className}`}
    >
      {/* Manga screentone pattern */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '9px 9px',
        }}
      />
      <div className="absolute inset-0 opacity-85">
        <SeriesArtwork theme={theme} />
      </div>

      {/* Top Manga Masthead */}
      <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-200 border-b border-white/20 pb-2">
        <span className="truncate font-mono-num font-semibold tracking-wider uppercase">
          {theme.badge}
        </span>
        <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
      </div>

      {/* Center Japanese + Display Title */}
      <div className="relative z-10 my-auto py-3">
        <p
          className="text-[11px] font-semibold tracking-widest mb-1.5"
          style={{ color: theme.accent }}
        >
          {theme.jpTitle}
        </p>
        <p className="font-display font-bold text-xl uppercase tracking-tight leading-[1.08] line-clamp-3 text-white drop-shadow-sm">
          {title}
        </p>
      </div>

      {/* Bottom Mangaka Footer */}
      <div className="relative z-10 pt-2 border-t border-white/20 flex items-center justify-between gap-2">
        <p className="text-[11px] text-slate-200 truncate">{author}</p>
        <span className="text-[10px] font-mono-num text-white/75 shrink-0">JP</span>
      </div>
    </div>
  );
}
