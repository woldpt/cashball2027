import { Outlet, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { socket } from '../socket';
import LiveMatch from './LiveMatch';

export default function DashboardLayout({ onLogout }) {
  const [liveOverlay, setLiveOverlay] = useState(false);
  const roomId = localStorage.getItem('activeRoom');
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const handleMatchPrep = () => setLiveOverlay(true);
    socket.on('match_prep_started', handleMatchPrep);
    return () => socket.off('match_prep_started', handleMatchPrep);
  }, []);

  const navItems = [
    { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { to: "/plantel", icon: "groups", label: "Squad" },
    { to: "/tactica", icon: "strategy", label: "Tactics" },
    { to: "/mercado", icon: "search", label: "Scouting" },
    { to: "/competicoes", icon: "leaderboard", label: "League", disabled: true },
    { to: "/financas", icon: "payments", label: "Finances", disabled: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {liveOverlay && (
        <LiveMatch 
          roomId={roomId} 
          token={token} 
          onMatchEnd={() => setLiveOverlay(false)} 
        />
      )}
      
      {/* SideNavBar */}
      <aside className="hidden md:flex flex-col h-full w-64 bg-[#1C1B1B] mr-[0.5rem] py-6 gap-2">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <img 
              alt="Manager Portrait" 
              className="w-10 h-10 rounded-md object-cover bg-surface-container-highest" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZfbD3TYrjaTnZ5c2KllSdIdK0mje5aEHkpGI5nYQzSXtY7GxULBV1-6S9I7omKq1no6Ta54fYjx8FX-ByYpBw3q8LNO1wVPHd7SyO-jO8dMlypgMhgivKD8eBdO1V8ZZLgjpGuVNYBAodCc6b63pSVRm2hZAL4U9hv-0aCMFkRzpRWjz2AiAD-6ugF6jdkZdY-ME5pRpFomibJtLsaQPIWqPcDFvSpzIR7Htfeto0TixFCbkoPhv6b6_kbNrMe8KkGyoUIb916xNQ"
            />
            <div className="flex flex-col">
              <span className="font-headline text-lg font-bold text-[#95D4B3]">{user.username || 'Manager'}</span>
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Elite Manager</span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.disabled ? "Brevemente" : ""}
              className={({ isActive }) => `
                px-4 py-3 flex items-center gap-3 transition-transform 
                ${item.disabled 
                  ? 'opacity-40 cursor-not-allowed grayscale text-[#E5E2E1]/70' 
                  : isActive 
                    ? 'bg-[#201F1F] text-[#E9C349] rounded-md border-l-4 border-[#95D4B3] active:translate-x-1' 
                    : 'text-[#E5E2E1]/70 hover:bg-[#201F1F] hover:text-[#95D4B3] transition-all'
                }
              `}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-6">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-error rounded-lg hover:bg-error-container/20 transition-colors group mb-4"
          >
             <span className="material-symbols-outlined mr-3 text-error">logout</span>
             Sair da Sala
          </button>
          
          <div className="bg-surface-container rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Sala Ativa</span>
              <span className="text-[10px] font-headline text-tertiary">{localStorage.getItem('roomCode')}</span>
            </div>
            <div className="w-full bg-surface-bright h-1 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[100%]"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 pitch-glow pointer-events-none"></div>

        {/* TopAppBar */}
        <header className="sticky top-0 z-50 bg-[#1C1B1B] mb-[0.5rem] flex justify-between items-center w-full px-6 h-16 shrink-0 border-b border-[#131313]/50">
          <div className="flex items-center gap-8">
            <span className="text-xl font-black text-[#E9C349] tracking-tighter font-headline uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              CASHBALL
            </span>
            <nav className="hidden lg:flex items-center gap-6">
               {/* Contextual navigation could be shown here depending on the page */}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-surface-container px-4 py-1.5 rounded-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[#E9C349] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <span className="font-headline font-bold text-sm tracking-tight text-[#95D4B3]">£42.5M</span>
            </div>
            <button className="bg-primary text-on-primary font-headline font-bold uppercase tracking-tighter px-6 py-2 rounded-md hover:bg-opacity-90 active:scale-95 transition-all text-sm shadow-[0_0_15px_rgba(149,212,179,0.3)]">
              Next Match
            </button>
          </div>
        </header>

        {/* Outlet wrapper for routes */}
        <div className="relative z-10 w-full h-fit">
          <Outlet />
        </div>
        
        {/* Bottom Navigation (Mobile Only) */}
        <nav className="md:hidden sticky bottom-0 w-full bg-surface/80 backdrop-blur-xl flex justify-around py-3 px-6 z-50 border-t border-outline-variant/10">
          {navItems.map((item) => (
             <NavLink
               key={item.to}
               to={item.to}
               onClick={(e) => item.disabled && e.preventDefault()}
               className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-[#E9C349]' : 'text-on-surface/60'} ${item.disabled ? 'opacity-40' : ''}`}
             >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
             </NavLink>
          ))}
        </nav>
      </main>
    </div>
  );
}
