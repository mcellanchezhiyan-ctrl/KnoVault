import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layers, Zap } from 'lucide-react';
import UnifiedWorkspace from './pages/UnifiedWorkspace';

function App() {
  return (
    <Router>
      <div
        className="min-h-screen flex flex-col antialiased light-theme-page"
        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        {/* ── Ambient Background Orbs ── */}
        <div
          className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          {/* Top-right soft blue orb */}
          <div
            className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-[0.06]"
            style={{
              background: 'radial-gradient(circle, #4F7BFF 0%, #7E9DFF 40%, transparent 70%)',
              filter: 'blur(90px)',
            }}
          />
          {/* Bottom-left soft blue-green orb */}
          <div
            className="absolute -bottom-60 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.05]"
            style={{
              background: 'radial-gradient(circle, #4F7BFF 0%, #EEF4FF 50%, transparent 70%)',
              filter: 'blur(90px)',
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(79, 123, 255, 0.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* ── Top Navigation Bar ── */}
        <header
          className="sticky top-0 z-40 w-full"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            borderBottom: '1px solid rgba(79, 123, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="Knovault Home">
              <div
                className="h-8.5 w-8.5 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #4F7BFF, #7E9DFF)',
                  boxShadow: '0 4px 12px rgba(79, 123, 255, 0.25)',
                }}
              >
                <span className="text-white text-sm font-black font-mono">k</span>
              </div>

              <span
                className="text-lg font-black tracking-tight"
                style={{ letterSpacing: '-0.02em' }}
              >
                <span className="shimmer-text">Kno</span>
                <span className="text-slate-800">vault</span>
              </span>
            </Link>

            {/* Right side badges */}
            <div className="flex items-center gap-3">
              {/* Workspace label */}
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  background: 'rgba(79, 123, 255, 0.06)',
                  border: '1px solid rgba(79, 123, 255, 0.15)',
                  color: '#4F7BFF',
                }}
              >
                <Layers size={12} />
                <span>Unified Workspace</span>
              </div>

              {/* V2 badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 123, 255, 0.1), rgba(126, 157, 255, 0.1))',
                  border: '1px solid rgba(79, 123, 255, 0.2)',
                  color: '#4F7BFF',
                }}
              >
                <Zap size={11} className="fill-current" />
                v2
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 relative">
          <Routes>
            <Route path="/" element={<UnifiedWorkspace />} />
            <Route path="*" element={<UnifiedWorkspace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
