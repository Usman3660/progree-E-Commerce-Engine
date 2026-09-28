import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Truck, CheckCircle2 } from 'lucide-react';

export default function HeroBanner({ onExploreCatalog }) {
  return (
    <div className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-[#090d18] to-[#070a12]">
      {/* Subtle Glow */}
      <div className="absolute top-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl space-y-5">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>High Performance Hardware & Cybernetic Gear</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Next-Generation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">
              Neural & Cybernetic Hardware
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Discover cutting-edge neural processors, bionic manipulators, quantum computation cores, and tactical cyberware with instant stock reservation.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onExploreCatalog}
              className="btn-primary py-2.5 px-5"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/60 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-Time Stock Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Secure Checkout Sandbox</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Sub-Orbital Express Delivery</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
