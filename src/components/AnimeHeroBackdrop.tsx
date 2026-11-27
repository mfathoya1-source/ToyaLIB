interface AnimeHeroBackdropProps {
  accentHex?: string;
}

export function AnimeHeroBackdrop({ accentHex = '#ff7a00' }: AnimeHeroBackdropProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-[#08111f]">
      {/* Base midnight sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 24%, #f4fbff 0%, #dbeefa 24%, #82a7c9 44%, #182b49 66%, #08111f 100%)',
        }}
      />

      {/* Left readability mist so dark hero typography always maintains > 7:1 contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 56% 68% at 22% 36%, rgba(244, 250, 255, 0.92) 0%, rgba(226, 240, 252, 0.68) 45%, rgba(226, 240, 252, 0) 78%)',
        }}
      />

      {/* Giant Luminous Moon & Shinobi Silhouette Scene */}
      <svg
        viewBox="0 0 1440 820"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="fullMoonGlow" cx="50%" cy="38%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="55%" stopColor="#edf7fd" stopOpacity="0.92" />
            <stop offset="82%" stopColor="#cfe7f6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1b3254" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="slideAura" cx="52%" cy="46%" r="36%">
            <stop offset="0%" stopColor={accentHex} stopOpacity="0.12" />
            <stop offset="100%" stopColor={accentHex} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cloudBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e1e36" stopOpacity="0" />
            <stop offset="52%" stopColor="#0a1629" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#060d19" stopOpacity="0.98" />
          </linearGradient>
          <filter id="moonBlur">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="cloudBlur">
            <feGaussianBlur stdDeviation="24" />
          </filter>
        </defs>

        {/* Full Moon */}
        <circle cx="725" cy="310" r="355" fill="url(#fullMoonGlow)" />
        <circle
          cx="725"
          cy="310"
          r="285"
          fill="#f8fcff"
          fillOpacity="0.86"
        />
        {/* Subtle moon surface craters */}
        <g fill="#cde3f2" fillOpacity="0.34" filter="url(#moonBlur)">
          <ellipse cx="630" cy="230" rx="58" ry="38" />
          <ellipse cx="810" cy="195" rx="74" ry="44" />
          <ellipse cx="775" cy="360" rx="88" ry="48" />
          <ellipse cx="600" cy="370" rx="46" ry="34" />
        </g>

        {/* Slide subtle aura */}
        <circle cx="725" cy="360" r="340" fill="url(#slideAura)" />

        {/* Atmospheric swirling storm clouds */}
        <g filter="url(#cloudBlur)" opacity="0.72">
          <ellipse cx="220" cy="640" rx="340" ry="130" fill="#0b1a30" />
          <ellipse cx="1220" cy="620" rx="360" ry="145" fill="#0b1a30" />
          <ellipse cx="440" cy="700" rx="280" ry="110" fill="#132948" />
          <ellipse cx="990" cy="690" rx="310" ry="120" fill="#112440" />
          <ellipse cx="140" cy="340" rx="220" ry="90" fill="#9ebad4" opacity="0.35" />
          <ellipse cx="1300" cy="310" rx="240" ry="95" fill="#7c9ebd" opacity="0.32" />
        </g>

        {/* Spire / Tower Roof Pillar */}
        <path
          d="M652 820 L662 560 L640 538 L666 520 L768 520 L794 538 L772 560 L782 820 Z"
          fill="#050b16"
        />
        {/* Distant rooftop silhouette on bottom-right */}
        <path
          d="M1040 820 L1046 720 L1035 712 L1068 712 L1060 720 L1066 820 Z"
          fill="#040912"
          opacity="0.9"
        />

        {/* Silhouetted Shinobi crouched atop spire */}
        <g fill="#040811">
          {/* Flowing headband ribbons */}
          <path d="M686 300 Q610 315 552 368 Q610 342 688 314 Z" />
          <path d="M684 308 Q630 336 588 386 Q638 352 690 318 Z" />
          {/* Katana sheath behind back */}
          <path d="M622 252 L636 244 L735 398 L722 406 Z" />
          {/* Head & tousled hair spikes */}
          <path d="M686 286 C684 260 704 246 726 248 C744 250 758 264 762 284 C770 288 766 298 758 302 C754 318 742 328 724 328 C702 328 688 312 686 286 Z" />
          <path d="M686 274 L670 264 L688 266 L678 250 L698 258 L704 240 L718 254 L734 240 L740 256 L760 252 L752 268 L770 274 L754 282 Z" />
          {/* Crouched cloak & shoulders */}
          <path d="M694 322 C664 334 646 364 642 404 C640 426 654 446 672 454 L662 496 C660 512 670 524 688 524 L746 524 C766 524 778 510 774 492 L764 452 C792 444 824 448 846 472 C850 442 826 410 792 396 C782 362 764 334 740 322 Z" />
          {/* Kneeling legs & boots silhouette */}
          <path d="M652 464 C632 466 618 486 626 508 C634 526 658 530 682 522 L704 526 L700 470 Z" />
          <path d="M744 468 L740 526 L772 522 C796 522 812 508 806 488 C798 468 770 462 744 468 Z" />
        </g>

        {/* Piercing twin shinobi eyes */}
        <g fill="#ffffff">
          <ellipse cx="716" cy="292" rx="3.4" ry="1.8" />
          <ellipse cx="734" cy="292" rx="3.4" ry="1.8" />
        </g>

        {/* Bottom stormy vignette overlay */}
        <rect x="0" y="450" width="1440" height="370" fill="url(#cloudBottom)" />
      </svg>
    </div>
  );
}
