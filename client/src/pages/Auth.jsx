import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro na autenticação');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#0d1117] flex items-center justify-center p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#161b22]/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 transition-all duration-300 hover:shadow-emerald-900/20">
        
        <div className="p-8 pb-4 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight mb-2">
            CashBall <span className="text-slate-500 font-normal text-xl ml-1">26/27</span>
          </h1>
          <p className="text-slate-400 text-sm">Conta Global de Treinador</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          <div className="flex bg-[#0d1117] p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Registar
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Nome de Utilizador
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-3 py-3 border border-slate-700 rounded-lg leading-5 bg-[#0d1117] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm transition-all"
                placeholder="Exemplo: JJorge"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-3 border border-slate-700 rounded-lg leading-5 bg-[#0d1117] text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm transition-all"
                placeholder="*********"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-md text-sm text-center">
               {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-[#0d1117] bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-[#0d1117] transition-all disabled:opacity-50 group"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-[#0d1117] border-t-transparent rounded-full animate-spin"></div>
            ) : isLogin ? (
              <>
                Entrar
                <LogIn className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </>
            ) : (
              <>
                Criar Conta
                <UserPlus className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
