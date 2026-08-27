import React, { useEffect, useState } from 'react'
import { FileText, ShieldAlert, Sparkles, CheckCircle2, ShieldCheck, Scale, Cpu, Search } from 'lucide-react'
import { ScalesOfJusticeWatermark, StatutoryMSMEDBadge, IndianContractActBadge, ConstitutionSealStamp } from './LegalMotifs'

interface LaserScanViewerProps {
  documentName?: string
  stage?: number
  onComplete?: () => void
}

export const LaserScanViewer: React.FC<LaserScanViewerProps> = ({
  documentName = 'Commercial_Vendor_Agreement.pdf',
  stage = 0,
}) => {
  const [clauseCount, setClauseCount] = useState(6)
  const [highlightedClauses, setHighlightedClauses] = useState<number[]>([1])

  useEffect(() => {
    const timer = setInterval(() => {
      setClauseCount((prev) => (prev < 42 ? prev + Math.floor(Math.random() * 4) + 2 : 42))
    }, 350)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (stage >= 1) setHighlightedClauses([1, 2])
    if (stage >= 2) setHighlightedClauses([1, 2, 3])
    if (stage >= 3) setHighlightedClauses([1, 2, 3, 4])
  }, [stage])

  const stageDescriptions = [
    'Parsing PDF text stream & identifying clause boundaries...',
    'Scanning for Section 15/16 MSMED 45-day payment statutory caps...',
    'Evaluating uncapped indemnity & Indian Contract Act 1872 liability...',
    'Synthesizing 1-click balanced legal redlines & arbitration remedies...',
    'Finalizing statutory compliance scorecard & risk summary...',
    'Audit complete! Preparing executive legal briefing...',
  ]

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Top Scanning HUD Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#121216]/95 border border-violet-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(124,58,237,0.25)]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="absolute w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <b className="text-sm font-bold text-white tracking-tight">
                Scanning Indian Statutory Laws...
              </b>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Extracted <span className="text-emerald-400 font-bold">{Math.min(42, clauseCount)}</span> Clauses • OCR Parser Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <StatutoryMSMEDBadge variant="compact" />
          <div className="hidden sm:flex">
            <ConstitutionSealStamp title="MSMED ENGINE" subtitle="SECTION 15 SCAN" />
          </div>
        </div>
      </div>

      {/* Main Document Preview Window with Laser Scanning Line */}
      <div className="laser-preview-frame relative p-5 sm:p-7 rounded-2xl bg-[#0e0e12]/95 border border-white/15 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Background Watermark */}
        <ScalesOfJusticeWatermark className="w-[450px] h-[450px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />

        {/* Dynamic Continuous Laser Scan Line */}
        <div className="absolute inset-x-0 z-30 pointer-events-none animate-laser-scan">
          {/* Laser Glow Beam */}
          <div className="h-[2.5px] w-full bg-gradient-to-r from-transparent via-cyan-400 via-violet-400 to-transparent shadow-[0_0_15px_#7c3aed,0_0_30px_#22d3ee]" />
          {/* Subtle Ambient Light Trail */}
          <div className="h-16 w-full bg-gradient-to-b from-violet-500/15 via-cyan-500/5 to-transparent pointer-events-none" />
          {/* Laser Head Points */}
          <div className="absolute -top-1 left-2 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
          <div className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-violet-300 shadow-[0_0_8px_#7c3aed]" />
        </div>

        {/* Document Header Bar */}
        <div className="relative z-10 flex items-center justify-between pb-3.5 mb-4 border-b border-white/10 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <b className="text-white block font-sans text-xs truncate max-w-[220px] sm:max-w-xs">{documentName}</b>
              <span className="text-[10px] text-slate-500">Document Length: 12 Pages • High-Resolution OCR</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
              <Cpu className="w-3 h-3 text-cyan-400 animate-spin" /> Neural OCR
            </span>
          </div>
        </div>

        {/* Simulated Document Clauses Body with OCR Shimmer & Tag Highlights */}
        <div className="relative z-10 space-y-4 text-xs font-mono">
          {/* Clause 1: Payment Terms (MSMED Flagged) */}
          <div
            className={`p-3.5 rounded-xl border transition-all duration-300 ${
              highlightedClauses.includes(1)
                ? 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <b className="text-slate-200 text-xs font-sans flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" /> Clause 4.2 — Invoicing & Settlement Schedule
              </b>
              {highlightedClauses.includes(1) && (
                <span className="ocr-tag-typewriter px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  MSMED Section 15 Violation
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              "Buyer agrees to process vendor invoices within <span className="text-rose-400 font-bold underline decoration-rose-500">ninety (90) calendar days</span> following receipt of statement of work..."
            </p>
            {highlightedClauses.includes(1) && (
              <div className="ocr-tag-typewriter mt-2 pt-2 border-t border-rose-500/25 flex items-center justify-between text-[10px] text-rose-300">
                <span>⚠ Statutory Limit: 45 Days max under MSMED Act 2006</span>
                <span className="text-emerald-400 font-bold">1-Click Redline Ready ✓</span>
              </div>
            )}
          </div>

          {/* Clause 2: Indemnity & Liabilities (Uncapped Damages Flagged) */}
          <div
            className={`p-3.5 rounded-xl border transition-all duration-300 ${
              highlightedClauses.includes(2)
                ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <b className="text-slate-200 text-xs font-sans flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Clause 9.1 — Limitation of Liability & Indemnification
              </b>
              {highlightedClauses.includes(2) && (
                <span className="ocr-tag-typewriter px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Uncapped Consequential Damages
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              "Vendor shall indemnify Buyer against <span className="text-amber-300 font-bold underline decoration-amber-400">all direct, indirect, special, and consequential losses</span> without monetary limitation..."
            </p>
            {highlightedClauses.includes(2) && (
              <div className="ocr-tag-typewriter mt-2 pt-2 border-t border-amber-500/25 flex items-center justify-between text-[10px] text-amber-300">
                <span>⚠ Section 73 Indian Contract Act 1872: Remote damages invalid</span>
                <span className="text-emerald-400 font-bold">Fee Cap Redline Suggested ✓</span>
              </div>
            )}
          </div>

          {/* Clause 3: Dispute Resolution & Arbitration (MSMED Council Verified) */}
          <div
            className={`p-3.5 rounded-xl border transition-all duration-300 ${
              highlightedClauses.includes(3)
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <b className="text-slate-200 text-xs font-sans flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Clause 13.4 — Arbitration & MSME Conciliation
              </b>
              {highlightedClauses.includes(3) && (
                <span className="ocr-tag-typewriter px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  MSMED Council Protected
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              "Any dispute arising shall be referred to statutory conciliation under the Micro and Small Enterprises Facilitation Council (MSEFC)..."
            </p>
          </div>

          {/* Skeleton Shimmering Clause Extraction Line */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="h-3 w-3/4 ocr-skeleton-shimmer rounded" />
            <div className="h-2.5 w-full ocr-skeleton-shimmer rounded" />
            <div className="h-2.5 w-5/6 ocr-skeleton-shimmer rounded" />
          </div>
        </div>
      </div>

      {/* Real-time Progress Bar & Stage Description */}
      <div className="p-5 rounded-2xl bg-[#121216]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-spin" />
            {stageDescriptions[stage] || stageDescriptions[0]}
          </span>
          <b className="text-emerald-400 font-bold">{Math.min(100, Math.round(((stage + 1) / 6) * 100))}%</b>
        </div>

        {/* Glowing Progress Track */}
        <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-[1px] border border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(124,58,237,0.7)]"
            style={{ width: `${Math.min(100, ((stage + 1) / 6) * 100)}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Target Jurisdiction: <b>Supreme Court / MSMED India</b></span>
          <span className="text-violet-400 font-mono">AI Verification Hash: #MSME-2026-AUDIT</span>
        </div>
      </div>
    </div>
  )
}
