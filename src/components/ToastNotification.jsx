import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastNotification({ toast, onClose }) {
  if (!toast) return null;

  const { message, type = 'success' } = toast;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp font-mono text-xs max-w-sm">
      <div className={`p-4 rounded-xl shadow-2xl backdrop-blur-xl border flex items-start gap-3 ${
        type === 'success' 
          ? 'bg-[#091522]/95 border-cyan-400 text-cyan-200 box-glow-cyan' 
          : type === 'error'
          ? 'bg-[#220911]/95 border-rose-500 text-rose-200 box-glow-magenta'
          : 'bg-[#150922]/95 border-purple-400 text-purple-200'
      }`}>
        <div className="shrink-0 mt-0.5">
          {type === 'success' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
          {type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {type === 'info' && <Info className="w-4 h-4 text-purple-400" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[11px] uppercase tracking-wide text-white">
            {type === 'success' ? 'SYSTEM CONFIRMATION' : type === 'error' ? 'SYSTEM WARNING' : 'TELEMETRY NOTICE'}
          </div>
          <div className="mt-0.5 leading-snug break-words">{message}</div>
        </div>

        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors -mr-1 -mt-1 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
