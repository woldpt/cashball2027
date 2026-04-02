import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCog, BadgeEuro, Trophy, CalendarDays, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { socket } from '../socket';
import LiveMatch from './LiveMatch';

export default function DashboardLayout({ onLogout }) {
  const [liveOverlay, setLiveOverlay] = useState(false);
  const roomId = localStorage.getItem('activeRoom');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const handleMatchPrep = () => setLiveOverlay(true);
    socket.on('match_prep_started', handleMatchPrep);
    return () => socket.off('match_prep_started', handleMatchPrep);
  }, []);
  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Resumo" },
    { to: "/plantel", icon: Users, label: "Plantel" },
    { to: "/tactica", icon: UserCog, label: "Formação & Táctica" },
    { to: "/mercado", icon: BadgeEuro, label: "Mercado Transf." },
    { to: "/competicoes", icon: Trophy, label: "Competições", disabled: true },
    { to: "/financas", icon: CalendarDays, label: "Finanças", disabled: true },
  ];

  return (
    <div className="flex h-screen bg-[#0d1117] text-slate-300 font-mono overflow-hidden">
      {liveOverlay && (
        <LiveMatch 
          roomId={roomId} 
          token={token} 
          onMatchEnd={() => setLiveOverlay(false)} 
        />
      )}
      
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-[#161b22] border-r border-slate-800 shrink-0 relative z-20">
        <div className="flex items-center h-16 px-6 border-b border-slate-800 bg-[#0d1117]/50">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
            CashBall
          </h1>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 mb-4">Gestão</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.disabled ? "Brevemente" : ""}
              className={({ isActive }) => `
                group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all
                ${item.disabled 
                  ? 'opacity-40 cursor-not-allowed grayscale' 
                  : isActive 
                    ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/20 shadow-[inset_4px_0_0_rgba(16,185,129,1)]' 
                    : 'text-slate-400 hover:bg-[#0d1117] hover:text-slate-200 hover:border hover:border-slate-800 border border-transparent'
                }
              `}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${item.disabled ? '' : 'group-hover:scale-110'} transition-transform duration-200`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-800 bg-[#0d1117]/30">
          <div className="bg-[#0d1117] rounded-lg p-3 border border-slate-800 mb-3 shadow-inner">
            <div className="text-xs text-slate-500 mb-1 flex justify-between">
              <span>SALA</span>
              <span className="font-bold text-slate-300">{localStorage.getItem('roomCode')}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-900/20 transition-colors group border border-transparent hover:border-red-900/50"
          >
            <LogOut className="mr-3 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Sair da Sala
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMGQxMTE3Ij48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMTYxYjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] bg-repeat">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117]/95 via-[#0d1117]/80 to-[#161b22]/90 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 overflow-y-auto w-full p-8">
            <div className="max-w-6xl mx-auto backdrop-blur-sm bg-[#161b22]/40 border border-slate-800/80 rounded-2xl shadow-xl p-8 min-h-[calc(100vh-4rem)] relative">
              {/* Outlet renders the current route's component */}
              <Outlet />
            </div>
          </div>
      </main>
    </div>
  );
}
