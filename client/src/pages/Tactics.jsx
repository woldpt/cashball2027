import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Tactics() {
  const [formation, setFormation] = useState('4-4-2');
  const [style, setStyle] = useState('EQUILIBRADO');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    const roomId = localStorage.getItem('activeRoom');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/tactics/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: parseInt(roomId),
          formation,
          style,
          starting_eleven: [],
          subs: []
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ ' + data.message);
      } else {
        setMessage('❌ ' + (data.error || 'Erro ao submeter'));
      }
    } catch (err) {
      setMessage('❌ Falha de conexão ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-800 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Formação e Táctica</h2>
          <p className="text-sm text-slate-400 mt-1">Defina o 11 titular para o próximo jogo</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="flex items-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/20"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Submeter Táctica
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.startsWith('✅') ? 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-400' : 'bg-red-900/30 border border-red-500/30 text-red-400'}`}>
          {message}
        </div>
      )}

      <div className="flex gap-6 relative">
        {/* Dropdowns Menu */}
        <div className="w-64 space-y-6 flex-shrink-0">
          <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Instruções Colectivas</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Formação</label>
                <select 
                  className="w-full bg-[#0d1117] border border-slate-700 text-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                  value={formation}
                  onChange={(e) => setFormation(e.target.value)}
                >
                  <option value="4-2-4">4-2-4 (Avassalador)</option>
                  <option value="3-4-3">3-4-3 (Ofensivo)</option>
                  <option value="4-3-3">4-3-3 (Ofensivo)</option>
                  <option value="4-4-2">4-4-2 (Clássico)</option>
                  <option value="4-5-1">4-5-1 (Catenaccio)</option>
                  <option value="5-3-2">5-3-2 (Autocarro)</option>
                  <option value="5-4-1">5-4-1 (Ferrolho)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Estilo de Jogo</label>
                <select 
                  className="w-full bg-[#0d1117] border border-slate-700 text-slate-200 rounded-lg p-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option value="DEFENSIVO">Defensivo</option>
                  <option value="EQUILIBRADO">Equilibrado</option>
                  <option value="OFENSIVO">Ofensivo</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Field Visualizer */}
        <div className="flex-1 bg-green-900/10 border border-emerald-900/30 rounded-xl relative overflow-hidden flex flex-col justify-center items-center min-h-[400px]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJyZ2JhKDIyLCAyNywgMzQsIDAuNikiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTggMEwwIDhaIiBzdHJva2U9InJnYmEoMTYsIDE4NSwgMTI5LCAwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+Cjwvc3ZnPg==')] opacity-50"></div>
          <p className="text-emerald-500/50 font-mono text-xl z-10 font-bold mix-blend-screen">[ CAMPO TÁCTICO: {formation} ]</p>
        </div>
      </div>
    </div>
  );
}
