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
      className="w-full h-full text-violet-600/10 dark:text-violet-400/10 transition-opacity duration-300"
      fill="none"
      stroke="currentColor"
    >
      <defs>
        <radialGradient id="watermarkGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="goldVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.8" />
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
 * 2. High-Tech Glassmorphism Legal Stamps / Badges
 */
export const StatutoryMSMEDBadge: React.FC<{ variant?: 'compact' | 'expanded' }> = ({ variant = 'compact' }) => {
  if (variant === 'compact') return null

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-[#0e0e12]/90 border border-violet-200 dark:border-violet-500/40 text-violet-900 dark:text-violet-200 text-xs font-semibold backdrop-blur-md shadow-sm dark:shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:border-violet-400 hover:shadow-md transition-all">
      <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-600/30 border border-violet-300 dark:border-violet-400/50 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-violet-700 dark:text-violet-300" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" strokeDasharray="3 2" />
          <path d="M12 3v18M3 12h18" strokeWidth="1" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>
      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
        Section 15 & 16 (45-Day Overdue Audit Active)
      </span>
    </div>
  )
}

export const IndianContractActBadge: React.FC<{ variant?: 'compact' | 'expanded' }> = ({ variant = 'compact' }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-[#0d140e]/90 border border-emerald-200 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold backdrop-blur-md shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:shadow-md transition-all">
    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-600/30 border border-emerald-300 dark:border-emerald-400/50 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L4 7v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V7l-8-5z" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    {variant === 'expanded' && (
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
          Section 73 & 74 Damages & Liability Standard
        </span>
      </div>
    )}
  </div>
)

export const ConstitutionSealStamp: React.FC<{ title?: string; subtitle?: string }> = ({ title, subtitle }) => {
  if (!title && !subtitle) return null

  return (
    <div className="relative inline-flex items-center gap-3 p-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 dark:from-violet-950/40 dark:via-[#121218]/90 dark:to-amber-950/30 border border-amber-200/80 dark:border-amber-500/30 backdrop-blur-xl shadow-sm dark:shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:border-amber-400 transition-all">
      <div className="relative w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-400/80 flex items-center justify-center shrink-0 shadow-sm">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-700 dark:text-amber-300 animate-[spin_30s_linear_infinite]" fill="none" stroke="currentColor">
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
        {title && (
          <span className="text-[11px] font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-800 to-amber-600 dark:from-amber-300 dark:via-amber-200 dark:to-yellow-100 font-serif">
            {title}
          </span>
        )}
        {subtitle && (
          <span className="text-[8.5px] font-mono tracking-widest text-amber-700/90 dark:text-amber-400/80 uppercase">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * 3. Artistic Indian Legal Empty State & Upload Zone Banner
 */
export const IndianLegalEmptyBanner: React.FC<{
  title?: string
  subtitle?: string
  actionButton?: React.ReactNode
}> = ({
  title = 'No Contracts Found in Legal Repository',
  subtitle,
  actionButton,
}) => (
  <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center bg-gradient-to-b from-white via-slate-50/80 to-white dark:from-[#14141c]/90 dark:via-[#0e0e13]/95 dark:to-[#09090b] border border-slate-200/80 dark:border-white/10 shadow-lg dark:shadow-2xl backdrop-blur-2xl my-4">
    {/* Background Watermark */}
    <ScalesOfJusticeWatermark className="w-[360px] h-[360px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />

    <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-widest mb-3">
        <span>✦</span> STATUTORY AUDIT READY
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 font-serif">
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          {subtitle}
        </p>
      )}

      {/* Compliance Pillars Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
        <StatutoryMSMEDBadge variant="compact" />
        <IndianContractActBadge variant="compact" />
      </div>

      {actionButton && <div className="mt-1">{actionButton}</div>}
    </div>
  </div>
)
