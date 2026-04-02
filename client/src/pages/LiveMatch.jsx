import { Activity, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

// Placeholder view that will only show when a match starts
export default function LiveMatch({ onMatchEnd }) {
  const [events, setEvents] = useState([
    { minute: 15, text: "GOLO! A. Silva inaugura o marcador com um remate fantástico!", team: 'A' },
    { minute: 23, text: "Cartão amarelo para B. Alves por entrada fora de tempo.", team: 'B' },
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col">
      <div className="h-16 border-b border-slate-800 bg-[#161b22] px-8 flex items-center justify-between shadow-lg">
        <div className="flex items-center text-emerald-400 font-bold tracking-widest text-sm uppercase">
          <Activity className="w-5 h-5 mr-3 animate-pulse" />
          Transmissão em Directo
        </div>
        <div className="font-mono text-xl font-bold text-white flex items-center bg-slate-800 px-4 py-1 rounded">
          <Clock className="w-4 h-4 mr-2" />
          45:00
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Scoreboard and Teams */}
        <div className="w-1/3 bg-[#161b22]/50 border-r border-slate-800 flex flex-col p-8 justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-900/5 backdrop-blur-3xl pointer-events-none"></div>

          <div className="text-2xl font-bold text-slate-400 mb-8 z-10">Jornada 12</div>
          
          <div className="flex w-full items-center justify-between z-10">
            <div className="text-center w-2/5">
              <div className="text-4xl font-black text-white">1</div>
              <div className="mt-2 text-sm text-slate-400 font-bold tracking-wide">Trindade FC</div>
            </div>
            
            <div className="text-4xl font-bold text-slate-600">vs</div>
            
            <div className="text-center w-2/5">
              <div className="text-4xl font-black text-white">0</div>
              <div className="mt-2 text-sm text-slate-400 font-bold tracking-wide">Amora FC</div>
            </div>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="w-2/3 p-8 overflow-y-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJyZ2JhKDIyLCAyNywgMzQsIDAuNCkiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTggMEwwIDhaIiBzdHJva2U9InJnYmEoMTYsIDE4NSwgMTI5LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+Cjwvc3ZnPg==')]">
          <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-6">Relatório do Jogo</h3>
          <div className="space-y-4">
            {events.map((e, idx) => (
              <div key={idx} className="bg-[#161b22] border border-slate-800 rounded-lg p-4 flex items-start animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="font-mono text-emerald-500 font-bold w-12 flex-shrink-0">{e.minute}'</div>
                <div className="text-slate-300">{e.text}</div>
              </div>
            ))}
          </div>
          
          <button onClick={onMatchEnd} className="mt-12 text-sm text-slate-500 hover:text-slate-300 underline">
            [Fechar Emissão]
          </button>
        </div>
      </div>
    </div>
  );
}
