import React from 'react'

/**
 * 1. Background Watermark: Scales of Justice (Insaaf ki Taraju) + Ashoka Chakra Motif
 */
export const ScalesOfJusticeWatermark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`absolute pointer-events-none select-none overflow-hidden ${className}`}
    style={{ zIndex: 0 }}
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 500 500"
      className="w-full h-full text-violet-500/15 dark:text-violet-400/10 transition-opacity duration-300"
      fill="none"
      stroke="currentColor"
    >
      <defs>
        <radialGradient id="watermarkGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.1" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="goldVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Central Ambient Glow */}
      <circle cx="250" cy="250" r="220" fill="url(#watermarkGlow)" stroke="none" />

      {/* Outer Ornamental Constitution Border Ring */}
      <circle cx="250" cy="250" r="230" stroke="url(#goldVioletGrad)" strokeWidth="1.5" strokeDasharray="6 4" />
      <circle cx="250" cy="250" r="220" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="250" cy="250" r="208" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />

      {/* Ashoka Chakra 24-Spoke Radial Mandala */}
      <g transform="translate(250, 250)">
        <circle cx="0" cy="0" r="46" stroke="url(#goldVioletGrad)" strokeWidth="2" fill="none" />
        <circle cx="0" cy="0" r="10" fill="currentColor" opacity="0.4" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2="0"
            y2="-46"
            stroke="currentColor"
            strokeWidth="1.2"
            transform={`rotate(${i * 15})`}
            opacity="0.6"
          />
        ))}
      </g>

      {/* Scales of Justice Central Pillar & Finial */}
      <path
        d="M250 55 L250 445 M240 70 L260 70 M230 435 L270 435 M220 445 L280 445"
        stroke="url(#goldVioletGrad)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Pillar Decorative Base */}
      <path
        d="M235 390 L265 390 L275 435 L225 435 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.05"
      />
      <circle cx="250" cy="65" r="9" fill="url(#goldVioletGrad)" />

      {/* Main Balance Beam */}
      <path
        d="M100 130 Q 250 100 400 130"
        stroke="url(#goldVioletGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M100 130 L100 142 M400 130 L400 142"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Left Pan Chains & Bowl */}
      <g>
        <line x1="100" y1="140" x2="60" y2="230" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="100" y1="140" x2="100" y2="230" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="100" y1="140" x2="140" y2="230" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <path
          d="M50 230 Q 100 270 150 230 Z"
          stroke="url(#goldVioletGrad)"
          strokeWidth="2.5"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <line x1="50" y1="230" x2="150" y2="230" stroke="currentColor" strokeWidth="1.5" />
      </g>

      {/* Right Pan Chains & Bowl */}
      <g>
        <line x1="400" y1="140" x2="360" y2="230" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="400" y1="140" x2="400" y2="230" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="400" y1="140" x2="440" y2="230" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <path
          d="M350 230 Q 400 270 450 230 Z"
          stroke="url(#goldVioletGrad)"
          strokeWidth="2.5"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <line x1="350" y1="230" x2="450" y2="230" stroke="currentColor" strokeWidth="1.5" />
      </g>

      {/* Legal Latin / Sanskrit Scroll Motto Inscription Accent */}
      <path
        d="M170 465 Q 250 455 330 465"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <text
        x="250"
        y="482"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        fontFamily="serif"
        letterSpacing="3"
        opacity="0.6"
      >
        SATYAMEVA JAYATE • MSMED 2006
      </text>
    </svg>
  </div>
)

/**
 * 2. Legal Ledger / Constitution Book Illustration Icon
 */
export const LegalLedgerIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
    <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-[0_0_12px_rgba(124,58,237,0.5)]" fill="none">
      <defs>
        <linearGradient id="ledgerCover" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="50%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Book Back / Pages Shadow */}
      <rect x="7" y="5" width="34" height="38" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      <path d="M41 9 L44 11 L44 39 L41 41 Z" fill="#e2e8f0" opacity="0.3" />
      <line x1="41" y1="13" x2="43" y2="14" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="41" y1="18" x2="43" y2="19" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="41" y1="23" x2="43" y2="24" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="41" y1="28" x2="43" y2="29" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="41" y1="33" x2="43" y2="34" stroke="#94a3b8" strokeWidth="0.8" />

      {/* Ledger Main Front Cover */}
      <rect x="5" y="5" width="35" height="38" rx="4" fill="url(#ledgerCover)" stroke="url(#goldTrim)" strokeWidth="1.5" />

      {/* Spine Binding */}
      <rect x="5" y="5" width="7" height="38" rx="2" fill="#311042" stroke="url(#goldTrim)" strokeWidth="1" />
      <line x1="6" y1="11" x2="11" y2="11" stroke="url(#goldTrim)" strokeWidth="1.2" />
      <line x1="6" y1="24" x2="11" y2="24" stroke="url(#goldTrim)" strokeWidth="1.2" />
      <line x1="6" y1="37" x2="11" y2="37" stroke="url(#goldTrim)" strokeWidth="1.2" />

      {/* Gold Ornamental Constitution Filigree Corners */}
      <path d="M16 9 L21 9 M16 9 L16 14" stroke="url(#goldTrim)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M36 9 L31 9 M36 9 L36 14" stroke="url(#goldTrim)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 39 L21 39 M16 39 L16 34" stroke="url(#goldTrim)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M36 39 L31 39 M36 39 L36 34" stroke="url(#goldTrim)" strokeWidth="1.2" strokeLinecap="round" />

      {/* Central Ashoka / Scales of Justice Emblem Seal */}
      <circle cx="26" cy="24" r="7.5" fill="none" stroke="url(#goldTrim)" strokeWidth="1.2" />
      <circle cx="26" cy="24" r="5" fill="#f59e0b" fillOpacity="0.15" stroke="url(#goldTrim)" strokeWidth="0.8" strokeDasharray="2 1.5" />
      <path d="M26 19 L26 29 M22.5 22 L29.5 22" stroke="url(#goldTrim)" strokeWidth="1" strokeLinecap="round" />
      <path d="M21.5 24 Q 23.5 26 25.5 24 Z M26.5 24 Q 28.5 26 30.5 24 Z" fill="url(#goldTrim)" />

      {/* Bookmark Ribbon */}
      <path d="M22 5 L22 14 L24.5 12 L27 14 L27 5 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />
    </svg>
  </div>
)

/**
 * 3. High-Tech Glassmorphism Legal Stamps / Badges
 */
export const StatutoryMSMEDBadge: React.FC<{ variant?: 'compact' | 'expanded' }> = ({ variant = 'compact' }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e0e12]/90 border border-violet-500/40 text-violet-200 text-xs font-semibold backdrop-blur-md shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:border-violet-400 hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all">
    <div className="w-5 h-5 rounded-full bg-violet-600/30 border border-violet-400/50 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-violet-300" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" strokeDasharray="3 2" />
        <path d="M12 3v18M3 12h18" strokeWidth="1" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    </div>
    <div className="flex flex-col text-left leading-tight">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-300">
        Statutory MSMED Compliance Engine
      </span>
      {variant === 'expanded' && (
        <span className="text-[9px] text-slate-400 font-mono">
          Section 15 & 16 (45-Day Overdue Audit Active)
        </span>
      )}
    </div>
  </div>
)

export const IndianContractActBadge: React.FC<{ variant?: 'compact' | 'expanded' }> = ({ variant = 'compact' }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d140e]/90 border border-emerald-500/40 text-emerald-200 text-xs font-semibold backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all">
    <div className="w-5 h-5 rounded-full bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L4 7v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V7l-8-5z" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className="flex flex-col text-left leading-tight">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
        Indian Contract Act 1872 Verified
      </span>
      {variant === 'expanded' && (
        <span className="text-[9px] text-slate-400 font-mono">
          Section 73 & 74 Damages & Liability Standard
        </span>
      )}
    </div>
  </div>
)

export const ConstitutionSealStamp: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'CONSTITUTION OF INDIA',
  subtitle = 'STATUTORY JURISDICTION',
}) => (
  <div className="relative inline-flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-gradient-to-r from-violet-950/40 via-[#121218]/90 to-amber-950/30 border border-amber-500/30 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:border-amber-400/60 transition-all">
    {/* Ashoka Wheel Seal */}
    <div className="relative w-7 h-7 rounded-full bg-amber-500/10 border border-amber-400/60 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-300 animate-[spin_30s_linear_infinite]" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="12"
            y1="12"
            x2="12"
            y2="2"
            stroke="currentColor"
            strokeWidth="1"
            transform={`rotate(${i * 30} 12 12)`}
          />
        ))}
      </svg>
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 font-serif">
        {title}
      </span>
      <span className="text-[9px] font-mono tracking-widest text-amber-400/80 uppercase">
        {subtitle}
      </span>
    </div>
  </div>
)

/**
 * 4. Artistic Indian Legal Empty State & Upload Zone Banner
 */
export const IndianLegalEmptyBanner: React.FC<{
  title?: string
  subtitle?: string
  actionButton?: React.ReactNode
}> = ({
  title = 'No Contracts Found in Indian Legal Repository',
  subtitle = 'Upload commercial, vendor, or MSMED agreements to begin automated statutory risk auditing and Section 15 compliance checks.',
  actionButton,
}) => (
  <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center bg-gradient-to-b from-[#14141c]/90 via-[#0e0e13]/95 to-[#09090b] border border-white/10 shadow-2xl backdrop-blur-2xl my-4">
    {/* Background Watermark */}
    <ScalesOfJusticeWatermark className="w-[360px] h-[360px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25" />

    <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
      {/* Ornate Indian Legal Badge / Emblem */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-amber-500/20 border border-violet-400/40 flex items-center justify-center mb-5 shadow-[0_0_35px_rgba(124,58,237,0.4)]">
        <LegalLedgerIcon className="w-10 h-10" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest mb-3">
        <span>✦</span> STATUTORY AUDIT READY
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2 font-serif">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
        {subtitle}
      </p>

      {/* Compliance Pillars Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
        <StatutoryMSMEDBadge variant="compact" />
        <IndianContractActBadge variant="compact" />
      </div>

      {actionButton && <div className="mt-1">{actionButton}</div>}
    </div>
  </div>
)
