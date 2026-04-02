import { useState, useEffect } from 'react';
import { LogOut, Plus, LogIn, Trash2, ShieldAlert } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Portal({ user, token, onSelectRoom, onGlobalLogout }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/rooms/my-rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        fetchRooms();
      } else {
        alert(data.error || 'Erro ao criar sala');
      }
    } catch (e) {
      alert('Erro de ligação ao servidor');
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: joinCode })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else fetchRooms();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
      setJoinCode('');
    }
  };

  const handleDeleteRoom = async (code) => {
    if (!confirm('Eliminar sala permanentemente?')) return;
    try {
      const res = await fetch(`${API_URL}/api/rooms/${code}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchRooms();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center bg-[#161b22] p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Portal CashBall</h1>
            <p className="text-slate-400 text-sm mt-1">Sessão iniciada como <strong className="text-emerald-500">{user.username}</strong></p>
          </div>
          <button 
            onClick={onGlobalLogout}
            className="flex items-center text-slate-400 hover:text-red-400 transition-colors text-sm font-semibold"
          >
            Sair da Conta <LogOut className="w-4 h-4 ml-2" />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center">
              As Minhas Salas 
              <span className="ml-3 bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">{rooms.length} Activas</span>
            </h2>
            
            {loading ? (
              <div className="p-10 text-center text-slate-500 animate-pulse border border-slate-800/50 rounded-xl bg-[#161b22]/50">
                A carregar salas...
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-10 text-center text-slate-500 border border-slate-800/50 rounded-xl bg-[#161b22]/50">
                Não estás em nenhuma sala. Cria uma nova ou junta-te com código!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rooms.map(room => (
                  <div key={room.id} className="group bg-[#161b22] border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-lg relative overflow-hidden">
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-xs text-slate-500">CÓDIGO: <strong className="text-slate-300">{room.code}</strong></span>
                        <span className="bg-emerald-900/30 text-emerald-400 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded">Activa</span>
                      </div>
                      <div className="text-xl font-black text-slate-200">{room.club_name}</div>
                      <div className="text-xs text-slate-400 mt-1">Treinador Principal {room.is_founder ? '(Fundador)' : ''}</div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => onSelectRoom(room.id, room.code, room.manager_id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-emerald-950 font-bold py-2 rounded-lg text-sm transition-colors text-center"
                      >
                        Continuar Jogo
                      </button>
                      
                      {room.is_founder === 1 && (
                        <button 
                          onClick={() => handleDeleteRoom(room.code)}
                          className="px-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-transparent hover:border-red-500/30 rounded-lg transition-colors flex items-center justify-center"
                          title="Eliminar Sala Permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Pane */}
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-slate-200 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-emerald-500" /> Nova Simulação
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Gera uma sala isolada e recebe um código para convidar até 7 amigos.</p>
              <button 
                onClick={handleCreateRoom}
                disabled={actionLoading}
                className="w-full bg-[#0d1117] hover:bg-slate-800 text-emerald-400 border border-emerald-900/50 hover:border-emerald-500 transition-all font-bold py-3 rounded-lg text-sm"
              >
                Gerar Sala Nova
              </button>
            </div>

            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-slate-200 mb-4 flex items-center">
                <LogIn className="w-5 h-5 mr-2 text-cyan-500" /> Juntar com Código
              </h3>
              <form onSubmit={handleJoinRoom} className="space-y-3">
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="EX: ABCDEF" 
                  maxLength={6}
                  required
                  className="w-full bg-[#0d1117] border border-slate-700 text-slate-200 rounded-lg p-3 text-sm font-mono font-bold uppercase tracking-widest text-center focus:border-cyan-500 focus:outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={actionLoading || !joinCode}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-cyan-950 disabled:opacity-50 font-bold py-3 rounded-lg text-sm transition-all"
                >
                  Entrar na Sala
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
