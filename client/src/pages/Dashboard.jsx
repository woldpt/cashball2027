import { Trophy, TrendingUp, Wallet, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const clubName = "A Aguardar Servidor...";
  const balance = "A Calcular €";
  const nextMatch = "Contra S.C. Farense";
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 tracking-tight">{clubName}</h2>
          <p className="text-slate-400 mt-1">Bem-vindo, Treinador.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2">
            <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" />
            Estado de Forma
          </div>
          <div className="text-2xl font-bold text-slate-200">Em Alta</div>
          <p className="text-xs text-slate-500 mt-1">Moral: 85%</p>
        </div>
        
        <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2">
            <Wallet className="w-4 h-4 mr-2 text-emerald-400" />
            Balanço Financeiro
          </div>
          <div className="text-2xl font-bold text-slate-200">{balance}</div>
        </div>

        <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2">
            <Trophy className="w-4 h-4 mr-2 text-emerald-400" />
            Próximo Jogo
          </div>
          <div className="text-lg font-bold text-slate-200 truncate">{nextMatch}</div>
          <p className="text-xs text-slate-500 mt-1">Campeonato de Portugal (Div 4)</p>
        </div>
      </div>

      <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center text-amber-400/90 text-sm font-semibold mb-4 border-b border-slate-800 pb-2">
          <ShieldAlert className="w-4 h-4 mr-2" />
          Avisos do Sistema
        </div>
        <ul className="text-sm text-slate-400 space-y-2">
          <li>- A sua táctica para a próxima jornada ainda não foi submetida.</li>
        </ul>
      </div>
    </div>
  );
}
