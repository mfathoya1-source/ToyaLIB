import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import type { BookCategory } from '../types/library';

interface BookCoverProps {
  title: string;
  author: string;
  category: BookCategory | string;
  coverUrl?: string;
  className?: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Teknologi: 'from-neutral-900 via-neutral-950 to-emerald-950',
  Sastra: 'from-emerald-900 via-emerald-950 to-neutral-950',
  Sains: 'from-teal-950 via-neutral-900 to-neutral-950',
  Sejarah: 'from-stone-800 via-neutral-900 to-neutral-950',
  Bisnis: 'from-neutral-800 via-neutral-900 to-emerald-950',
  Desain: 'from-zinc-800 via-neutral-900 to-emerald-950',
};

export function BookCover({
  title,
  author,
  category,
  coverUrl,
  className = '',
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  if (coverUrl && !failed) {
    return (
      <div className={`relative overflow-hidden bg-emerald-50/50 ${className}`}>
        <img
          src={coverUrl}
          alt={`Sampul buku ${title} karya ${author}`}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  const grad = CATEGORY_GRADIENTS[category] || 'from-neutral-900 to-emerald-950';

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${grad} text-white p-4 flex flex-col justify-between select-none ${className}`}
    >
      <div className="flex items-center justify-between text-[11px] text-slate-300 border-b border-white/15 pb-2">
        <span className="truncate font-medium tracking-wide">{category}</span>
        <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-300" />
      </div>
      <div className="my-auto py-3">
        <p className="font-display font-semibold text-sm leading-snug line-clamp-4 text-white">
          {title}
        </p>
      </div>
      <div className="pt-2 border-t border-white/15">
        <p className="text-[11px] text-slate-300 truncate">{author}</p>
      </div>
    </div>
  );
}
