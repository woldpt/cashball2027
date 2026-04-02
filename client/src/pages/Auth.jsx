import { useState } from 'react';

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
    <div className="bg-background text-on-background font-body selection:bg-primary selection:text-on-primary">
      {/* Background Layering */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 tactical-pattern"></div>
        <div className="absolute inset-0 pitch-glow"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background"></div>
        
        {/* Soft hero image background */}
        <div className="absolute inset-0 opacity-10 bg-cover bg-center mix-blend-screen pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA6qtRbu4lK6mEZRDChj2y9qn1uxGsR6G0seR3WQTPcosDz_Qquof0PicL6IzyZvgsn6jHfiOwx1jayOg5YRB-O0wpETWTiGnwQA8-5oomd-7d5PplONnwrzTlOBDHamHfTpHpuU2fvgZaCrCsvuc8d5RB0ysc5VtgXECFW-H6szrM9bEV263PEaYsVtNxYuvP9665hWoryzJ4gituyYXuQralUH3WKUskTQDqFxjYOfqiXUSJhJVpN5a6pylF9oNi8Wb0KiZ1llCj-')" }}></div>
      </div>

      {/* Main Content Canvas */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Branding Header */}
        <header className="mb-12 text-center">
          <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-tighter text-tertiary mb-2 text-shadow-sm">
            CASHBALL 2027
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="h-[1px] w-12 bg-outline-variant/30"></span>
            <p className="font-label text-primary tracking-[0.3em] uppercase text-xs font-bold">Elite Management Simulation</p>
            <span className="h-[1px] w-12 bg-outline-variant/30"></span>
          </div>
        </header>

        {/* Login Form Box */}
        <div className="w-full max-w-md bg-surface-container-high/90 border border-outline-variant/15 text-on-surface rounded-md shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Subtle top decoration */}
          <div className="h-1 w-full bg-primary absolute top-0 left-0"></div>
          
          <div className="p-8">
            <div className="flex gap-2 p-1 bg-surface-container-low rounded-md border border-outline-variant/10 mb-8">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${isLogin ? 'bg-primary text-on-primary shadow-sm scale-1' : 'text-on-surface-variant hover:text-on-surface active:scale-95'}`}
              >
                MANAGER LOGIN
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${!isLogin ? 'bg-primary text-on-primary shadow-sm scale-1' : 'text-on-surface-variant hover:text-on-surface active:scale-95'}`}
              >
                NEW SIGNUP
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5 focus-within:text-primary transition-colors">
                    NOME DE UTILIZADOR
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-sm">person</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-9 pr-3 py-3 border border-outline-variant/30 rounded-md bg-surface-container text-on-surface placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all font-medium"
                      placeholder="Identificação do treinador"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5 focus-within:text-primary transition-colors">
                    PASSWORD
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-sm">lock</span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-9 pr-3 py-3 border border-outline-variant/30 rounded-md bg-surface-container text-on-surface placeholder-on-surface-variant/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-error-container/20 border-l-2 border-error text-error p-3 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-md text-xs font-black uppercase tracking-[0.2em] bg-primary text-on-primary hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 group border-b-2 border-[#6ba488]"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                ) : isLogin ? (
                  <>
                    <span className="material-symbols-outlined mr-2 text-[16px]">login</span>
                    ACESSAR CARREIRA
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2 text-[16px]">badge</span>
                    CRIAR IDENTIDADE
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Global Bottom Branding */}
        <footer className="mt-12 flex flex-col items-center gap-2 opacity-50">
          <p className="font-headline font-bold text-[10px] tracking-[0.4em] uppercase text-on-surface">CASHBALL SOFTWARE</p>
          <p className="text-[8px] font-medium text-outline uppercase tracking-wider">© 2026-2027 TACTICAL EDITORIAL. ALL RIGHTS RESERVED.</p>
        </footer>
      </main>
    </div>
  );
}
