import { Activity, Clock, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import { socket } from '../socket';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function LiveMatch({ onMatchEnd, roomId, token }) {
  const [minute, setMinute] = useState(0);
  const [events, setEvents] = useState([]);
  const [isHalftime, setIsHalftime] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sub UI
  const [formation, setFormation] = useState('4-4-2');
  const [style, setStyle] = useState('OFENSIVO');

  useEffect(() => {
    const handleTick = (data) => {
      setMinute(data.minute);
      if (data.events && data.events.length > 0) {
        setEvents(prev => [...data.events, ...prev]);
      }
    };
    
    const handleHalftime = (data) => {
      setIsHalftime(true);
      // Hide modal automatically after duration
      setTimeout(() => setIsHalftime(false), data.duration * 1000);
    };
    
    const handleEnd = () => {
       // Match is over. Show exit button after 5 seconds
       setTimeout(() => onMatchEnd(), 5000);
    };

    socket.on('match_tick', handleTick);
    socket.on('halftime', handleHalftime);
    socket.on('match_ended', handleEnd);

    return () => {
      socket.off('match_tick', handleTick);
      socket.off('halftime', handleHalftime);
      socket.off('match_ended', handleEnd);
    };
  }, [onMatchEnd]);

  const handleSub = async () => {
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/api/tactics/substitute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ roomId, formation, style })
      });
      setIsHalftime(false); // close modal visually
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col">
      {isHalftime && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-[#161b22] border border-amber-500/50 rounded-xl p-8 max-w-md w-full shadow-2xl shadow-amber-900/20 text-center animate-in zoom-in-95 duration-300">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-black text-white mb-2">INTERVALO</h2>
              <p className="text-slate-400 text-sm mb-6">Tens 30 segundos para reagir às desvantagens da 1ª parte!</p>
              
              <div className="space-y-4 text-left mb-8">
                 <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Mudar Formação</label>
                    <select value={formation} onChange={e=>setFormation(e.target.value)} className="w-full bg-[#0d1117] border border-slate-700 text-slate-200 rounded p-2">
                       <option value="4-3-3">4-3-3 (Ofensivo)</option>
                       <option value="4-4-2">4-4-2 (Equilibrado)</option>
                       <option value="5-4-1">5-4-1 (Defensivo)</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Mentalidade</label>
                    <select value={style} onChange={e=>setStyle(e.target.value)} className="w-full bg-[#0d1117] border border-slate-700 text-slate-200 rounded p-2">
                       <option value="OFENSIVO">Ataque Total</option>
                       <option value="EQUILIBRADO">Normal</option>
                       <option value="DEFENSIVO">Segurar Resultado</option>
                    </select>
                 </div>
              </div>
              <button disabled={submitting} onClick={handleSub} className="w-full bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold py-3 rounded shadow-lg uppercase tracking-wider transition-transform hover:scale-105">
                 Aplicar Táctica
              </button>
           </div>
        </div>
      )}

      <div className="h-16 border-b border-slate-800 bg-[#161b22] px-8 flex items-center justify-between shadow-lg relative z-40">
        <div className="flex items-center text-emerald-400 font-bold tracking-widest text-sm uppercase">
          <Activity className="w-5 h-5 mr-3 animate-pulse" />
          Transmissão em Directo
        </div>
        <div className="font-mono text-xl font-bold text-white flex items-center bg-slate-800 px-4 py-1 rounded">
          <Clock className="w-4 h-4 mr-2" />
          {minute}:00
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative z-40">
        <div className="w-1/3 bg-[#161b22]/50 border-r border-slate-800 flex flex-col p-8 justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-900/5 backdrop-blur-3xl pointer-events-none"></div>
          <div className="text-2xl font-bold text-slate-400 mb-8 z-10">CashBall Engine</div>
          <div className="text-center z-10 text-emerald-500 animate-pulse font-mono tracking-widest uppercase text-sm mt-4">
             {minute === 45 && !isHalftime ? '(Aguardando 2ª Parte)' : 'Partida Decorrer'}
          </div>
        </div>

        <div className="w-2/3 p-8 overflow-y-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJyZ2JhKDIyLCAyNywgMzQsIDAuNCkiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTggMEwwIDhaIiBzdHJva2U9InJnYmEoMTYsIDE4NSwgMTI5LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+Cjwvc3ZnPg==')]">
          <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-6 sticky top-0 bg-[#0d1117] py-2">Relatório do Jogo</h3>
          <div className="space-y-4 pb-20">
             {events.length === 0 && <div className="text-slate-600 font-mono text-sm">A aguardar apito inicial...</div>}
            {events.map((e, idx) => (
              <div key={idx} className={`bg-[#161b22] border rounded-lg p-4 flex items-start animate-in slide-in-from-right-4 fade-in duration-300 ${e.type === 'GOAL' ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : e.type === 'RED_CARD' ? 'border-red-500/50' : 'border-slate-800'}`}>
                <div className={`font-mono font-bold w-12 flex-shrink-0 ${e.type === 'GOAL' ? 'text-amber-500' : 'text-emerald-500'}`}>{e.minute}'</div>
                <div className="text-slate-300 font-medium">
                  {e.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
