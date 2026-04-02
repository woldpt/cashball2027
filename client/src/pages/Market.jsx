import { Search, Gavel, HandCoins, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { socket } from '../socket';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Market() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState(localStorage.getItem('activeRoom'));
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMarket();
    
    socket.on('market_update', fetchMarket);
    return () => {
      socket.off('market_update', fetchMarket);
    }
  }, []);

  const fetchMarket = async () => {
    try {
      const res = await fetch(`${API_URL}/api/market?roomId=${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTransfers(data.transfers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (transferId, price) => {
    if (!confirm(`Comprar imediatamente por €${price.toLocaleString()}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/market/buy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomId, transferId })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBid = async (transferId, minBid) => {
    const bidAmountStr = prompt(`Licitação Mínima Restante: €${minBid.toLocaleString()}.\nQual o valor que queres licitar?`, Math.floor(minBid * 1.05).toString());
    if (!bidAmountStr) return;
    const bidAmount = parseInt(bidAmountStr);
    
    try {
      const res = await fetch(`${API_URL}/api/market/bid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomId, transferId, bidAmount })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center">
            Mercado Em Directo
            <span className="ml-3 relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Todas as transações são registadas em tempo real.</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Procurar jogador..." 
            className="w-full pl-9 pr-4 py-2 bg-[#0d1117] border border-slate-700 rounded-lg text-sm text-slate-200 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 animate-pulse">
           A carregar bilheteira...
        </div>
      ) : transfers.length === 0 ? (
        <div className="text-center py-20 bg-[#161b22]/50 border border-slate-800/50 rounded-xl text-slate-500">
           Nenhum jogador listado no mercado actualmente.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {transfers.map(t => (
            <div key={t.id} className="bg-[#161b22] border border-slate-800 rounded-xl p-5 hover:border-emerald-900 transition-colors flex justify-between items-center group relative overflow-hidden">
              {/* Highlight flash if ends soon */}
              {t.listing_type === 'AUCTION' && t.auction_ends_at && (new Date(t.auction_ends_at).getTime() - Date.now() < 15000) && (
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"></div>
              )}

              <div className="z-10">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-slate-200 text-lg">{t.player_name}</span>
                  <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">{t.position}</span>
                  <span className="text-slate-500 text-xs">- Qualidade: <span className="font-mono text-emerald-400 font-bold">{t.quality}</span></span>
                  {t.craque === 1 && (
                    <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 text-[10px] w-4 h-4 rounded-full" title="Craque Mundial">★</span>
                  )}
                </div>
                <div className="text-sm text-slate-400 flex items-center">
                  Clube: {t.seller_club_name} 
                  <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                </div>
              </div>
              
              <div className="text-right z-10 shrink-0 ml-4">
                <div className="text-xl font-mono font-bold text-slate-200 mb-2">
                  €{Math.max(t.current_highest_bid, t.asking_price).toLocaleString()}
                </div>
                
                {t.listing_type === 'AUCTION' ? (
                  <button 
                    onClick={() => handleBid(t.id, Math.max(t.current_highest_bid, t.asking_price))}
                    className="w-full flex justify-center items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-amber-950 px-4 py-2 rounded-lg text-sm font-bold transition-transform hover:scale-105 shadow-lg shadow-amber-900/20"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Licitar</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleBuy(t.id, t.asking_price)}
                    className="w-full flex justify-center items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-transform hover:scale-105 shadow-lg shadow-emerald-900/20"
                  >
                    <HandCoins className="w-4 h-4" />
                    <span>Comprar</span>
                  </button>
                )}
                
                {t.listing_type === 'AUCTION' && t.highest_bidder_club_name && (
                  <div className="text-[10px] text-emerald-500 font-bold mt-2 truncate max-w-[120px]">
                    {t.highest_bidder_club_name} lidera
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
