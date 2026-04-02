import { Search, Gavel, HandCoins } from 'lucide-react';

export default function Market() {
  const players = [
    { id: 10, name: "Gyökeres", position: "ATA", quality: 48, club: "Sporting CP", price: 20000000, type: "AUCTION", expires: "10s" },
    { id: 11, name: "Di María", position: "MED", quality: 45, club: "Benfica", price: 5000000, type: "LIST", expires: null },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Mercado de Transferências</h2>
          <p className="text-sm text-slate-400 mt-1">Compre, venda e participe em leilões ao vivo</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Procurar jogador..." 
            className="pl-9 pr-4 py-2 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-200 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {players.map(p => (
          <div key={p.id} className="bg-[#161b22] border border-slate-800 rounded-xl p-5 hover:border-emerald-900 transition-colors flex justify-between items-center group">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-bold text-slate-200 text-lg">{p.name}</span>
                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">{p.position}</span>
                <span className="text-slate-500 text-xs">- Qualidade: <span className="font-mono text-emerald-400">{p.quality}</span></span>
              </div>
              <p className="text-sm text-slate-400">Clube: {p.club}</p>
            </div>
            
            <div className="text-right">
              <div className="text-xl font-mono font-bold text-slate-200 mb-2">€{p.price.toLocaleString()}</div>
              {p.type === 'AUCTION' ? (
                <button className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-amber-950 px-4 py-2 rounded-lg text-sm font-bold transition-transform hover:scale-105 shadow-lg shadow-amber-900/20">
                  <Gavel className="w-4 h-4" />
                  <span>Licitar ({p.expires})</span>
                </button>
              ) : (
                <button className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform hover:scale-105 shadow-lg shadow-emerald-900/20">
                  <HandCoins className="w-4 h-4" />
                  <span>Comprar Já</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
