import React from 'react';
import { Info } from 'lucide-react';

export default function VerificationCodeDisplay({ code }) {
  const chars = code.split('');

  return (
    <div className="rounded-[10px] border p-5" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Verification Code</h3>
        <div className="group relative">
          <Info className="w-3.5 h-3.5 cursor-help" style={{ color: 'var(--text-muted)' }} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-lg text-xs hidden group-hover:block z-10 border"
            style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
            Announce this code verbally to students. Only those physically present will know it.
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 xl:gap-3">
        {chars.map((char, i) => (
          <div key={i} className="w-11 h-14 xl:w-14 xl:h-16 rounded-lg border-2 flex items-center justify-center text-xl xl:text-2xl font-bold font-mono"
            style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', backgroundColor: 'rgba(245,158,11,0.06)' }}>
            {char}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-center mt-3" style={{ color: 'var(--text-muted)' }}>
        Students must enter this before scanning
      </p>
    </div>
  );
}