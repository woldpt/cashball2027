import { useState } from 'react';
import { LogIn, Key, PlusCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Lobby({ onLogin }) {
  const [isJoin, setIsJoin] = useState(true);
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isJoin ? '/api/rooms/join' : '/api/rooms/create';
      const body = isJoin ? { username, roomCode } : { username };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro na comunicação com o servidor');
      }

      // Success
      onLogin(data.roomCode || roomCode, data.managerId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#161b22]/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 transition-all duration-300 hover:shadow-emerald-900/20">
        
        <div className="p-8 pb-4 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight mb-2">
            CashBall <span className="text-slate-500 font-normal text-xl ml-1">26/27</span>
          </h1>
          <p className="text-slate-400 text-sm">O futuro da pura gestão táctica e financeira</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          <div className="flex bg-[#0d1117] p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsJoin(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isJoin ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Entrar em Sala
            </button>
            <button
              type="button"
              onClick={() => { setIsJoin(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isJoin ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Criar Nova
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Nome do Treinador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LogIn className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg leading-5 bg-[#0d1117] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                  placeholder="Nome do Treinador..."
                />
              </div>
            </div>

            {isJoin && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Código da Sala
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required={isJoin}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg leading-5 bg-[#0d1117] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm uppercase tracking-widest font-mono font-bold transition-all"
                    placeholder="EX: ABCDEF"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-md text-sm text-center animate-in fade-in slide-in-from-bottom-2">
               {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-[#0d1117] bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-[#0d1117] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-[#0d1117] border-t-transparent rounded-full animate-spin"></div>
            ) : isJoin ? (
              <>
                Confirmar Entrada
                <LogIn className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </>
            ) : (
              <>
                Gerar Sala
                <PlusCircle className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:rotate-90 transition-all" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
