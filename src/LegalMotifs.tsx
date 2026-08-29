import React from 'react'

/**
 * High-Tech Glassmorphism Legal Stamps / Badges
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
 * Artistic Indian Legal Empty State & Upload Zone Banner
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
