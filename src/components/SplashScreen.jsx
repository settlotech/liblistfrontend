import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    // Fast, lightweight transition into workspace
    const timer = setTimeout(() => {
      onFinish();
    }, 600);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      onClick={onFinish}
      className="fixed inset-0 z-50 bg-[#0b1120] text-white flex flex-col items-center justify-center p-6 select-none cursor-pointer transition-opacity duration-300"
    >
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-sm">
        {/* CBA Brand Badge */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300">
          <span className="text-black font-black text-2xl tracking-tighter">CBA</span>
        </div>

        {/* Brand & Repository Title */}
        <div className="space-y-1">
          <h1 className="text-lg font-bold tracking-tight text-white">
            Commonwealth Bank of Australia
          </h1>
          <p className="text-xs text-slate-400">
            LibList Policy & Governance Reference Hub
          </p>
        </div>

        {/* Minimal Spinner */}
        <div className="pt-2 flex items-center gap-2.5 text-xs text-amber-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Loading workspace...</span>
        </div>
      </div>
    </div>
  );
}

