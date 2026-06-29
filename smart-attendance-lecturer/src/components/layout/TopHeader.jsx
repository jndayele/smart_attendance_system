import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '../../context/AppContext';
import { Menu, GraduationCap } from 'lucide-react';
import MobileDrawer from './MobileDrawer';

export default function TopHeader() {
  const { config } = useAppConfig();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="h-16 flex items-center px-4 xl:px-6 border-b sticky top-0 z-30"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>

        {/* Mobile: hamburger */}
        <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg"
          style={{ color: 'var(--text-secondary)' }}>
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile center: shortCode */}
        <div className="md:hidden flex-1 flex items-center justify-center gap-2">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="" className="w-6 h-6 rounded" />
          ) : (
            <GraduationCap className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          )}
          <span className="text-base font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)' }}>
            {config.shortCode}
          </span>
        </div>

        <div className="hidden md:block flex-1" />
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}