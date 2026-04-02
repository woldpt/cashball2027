import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const roomId = localStorage.getItem("activeRoom");

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/matches?roomId=${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Falha ao carregar matches");

      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId, token]);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 15000); // Poll every 15s instead of 5s to reduce load
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const pendingMatches = matches.filter(m => m.status === "SCHEDULED" || m.status === "LIVE");
  const completedMatches = matches.filter(m => m.status === "COMPLETED");
  const nextMatch = pendingMatches.length > 0 ? pendingMatches[0] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min w-full">
      {/* Hero Next Match Card (Bento Style) */}
      <section className="md:col-span-8 h-80 relative overflow-hidden rounded-md bg-surface-container-low group">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCS_17wN1Fgc-NAduje8KrzQqh9EQWw4o_MC3k4VY9izAmubTCMyuu4eNwW1JcCVk9laV9wxSy3jzE6Yf71M7_uxyhfloaG8ALrCkYVbNxwl5ydB7DshjpGfKeAJpN_gmUGBpqHQY5VY6SJuOrsk1wNiNaEL2MHE_jglDYWi2QoIxwZ_mIjLZdCQFdU1qzsAtjBZYzwzU029BrelqdR6OubOAaWP3TQ6ODmd6woTUgjveaCp1SOfRfS-a9nXSXcOK-b28-hcmKFYxAC')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
          <div className="flex flex-col">
            <span className="bg-tertiary text-on-tertiary-fixed text-[10px] font-black uppercase tracking-widest px-2 py-0.5 w-fit mb-4">
              {nextMatch?.status === 'LIVE' ? 'EM DIRETO' : 'PRÓXIMO JOGO'}
            </span>
            <h2 className="font-headline text-4xl font-black uppercase tracking-tighter mb-2">
              {nextMatch ? nextMatch.home_club_name : 'No Match'} 
              <span className="text-primary mx-2">vs</span> 
              {nextMatch ? nextMatch.away_club_name : 'Scheduled'}
            </h2>
            <div className="flex items-center gap-4 text-on-surface-variant font-medium">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span> Jornada {nextMatch?.week || "?"}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> Estádio Principal</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Últimos Resultados</p>
              <div className="flex gap-1 justify-center">
                <span className="w-6 h-6 rounded-sm bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold">V</span>
                <span className="w-6 h-6 rounded-sm bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold">V</span>
                <span className="w-6 h-6 rounded-sm bg-surface-bright flex items-center justify-center text-[10px] font-bold text-on-surface">E</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Status Summary Cards (Vertical Stack) */}
      <div className="md:col-span-4 grid grid-cols-1 gap-4">
        {/* Morale Card */}
        <div className="bg-surface-container rounded-md p-6 flex flex-col justify-between border-l-4 border-primary">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-widest mb-1">Moral da Equipa</h3>
              <p className="font-headline text-2xl font-bold tracking-tighter text-on-surface">Excelente</p>
            </div>
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>sentiment_very_satisfied</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span>Bónus de Vitórias</span>
              <span className="text-primary font-bold">+12%</span>
            </div>
            <div className="w-full bg-surface-bright h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[88%]"></div>
            </div>
          </div>
        </div>

        {/* Financial Quick Look */}
        <div className="bg-surface-container rounded-md p-6 flex flex-col justify-between border-l-4 border-tertiary">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xs uppercase font-bold text-on-surface-variant tracking-widest mb-1">Estado Financeiro</h3>
              <p className="font-headline text-2xl font-bold tracking-tighter text-on-surface">Estável</p>
            </div>
            <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-lowest p-3 rounded-md">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant">Despesa Salarial Semanal</span>
            <span className="ml-auto font-headline font-bold text-sm">£1.2M</span>
          </div>
        </div>
      </div>

      {/* League Table (Asymmetric Column) */}
      <section className="md:col-span-5 bg-surface-container rounded-md overflow-hidden flex flex-col h-fit">
        <div className="bg-surface-container-high px-6 py-4 flex items-center justify-between">
          <h3 className="font-headline text-sm font-bold uppercase tracking-tight text-tertiary">Liga (Top 5 Simulado)</h3>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">more_horiz</span>
        </div>
        <div className="flex flex-col p-2">
          {/* Table Headers */}
          <div className="grid grid-cols-12 px-4 py-2 text-[10px] uppercase font-bold text-on-surface-variant border-b border-outline-variant/10">
            <div className="col-span-1">#</div>
            <div className="col-span-7">Clube</div>
            <div className="col-span-2 text-center">J</div>
            <div className="col-span-2 text-right">Pts</div>
          </div>
          {/* Demo Rows */}
          <div className="grid grid-cols-12 px-4 py-3 items-center bg-primary-container/20 rounded-md my-0.5">
            <div className="col-span-1 font-headline font-bold text-primary">1</div>
            <div className="col-span-7 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              A Nossa Equipa
            </div>
            <div className="col-span-2 text-center font-medium">11</div>
            <div className="col-span-2 text-right font-headline font-bold text-primary">28</div>
          </div>
          <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-surface-bright/40 transition-colors rounded-md my-0.5">
            <div className="col-span-1 font-headline font-bold text-on-surface-variant">2</div>
            <div className="col-span-7 font-medium">Manchester Blues</div>
            <div className="col-span-2 text-center font-medium">11</div>
            <div className="col-span-2 text-right font-headline font-bold">25</div>
          </div>
          <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-surface-bright/40 transition-colors rounded-md my-0.5">
            <div className="col-span-1 font-headline font-bold text-on-surface-variant">3</div>
            <div className="col-span-7 font-medium">Mersey Red</div>
            <div className="col-span-2 text-center font-medium">11</div>
            <div className="col-span-2 text-right font-headline font-bold">24</div>
          </div>
          <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-surface-bright/40 transition-colors rounded-md my-0.5">
             <div className="col-span-1 font-headline font-bold text-on-surface-variant">4</div>
             <div className="col-span-7 font-medium">North City</div>
             <div className="col-span-2 text-center font-medium">11</div>
             <div className="col-span-2 text-right font-headline font-bold">22</div>
          </div>
        </div>
      </section>

      {/* Key Players / Squad Health */}
      <section className="md:col-span-7 flex flex-col gap-4">
        <div className="bg-surface-container rounded-md p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-sm font-bold uppercase tracking-tight text-on-surface">Jogadores Chave</h3>
            <button className="text-[10px] uppercase font-bold text-primary hover:underline">Ver Plantel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div className="bg-surface-container-lowest p-3 rounded-md flex items-center gap-3 border-l-2 border-primary">
              <div className="w-10 h-10 bg-surface-bright rounded-md flex items-center justify-center font-headline font-bold text-tertiary">9</div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate">E. Haaland Jr.</span>
                <div className="flex items-center gap-2">
                  <span className="bg-surface-bright text-[8px] font-black px-1.5 py-0.5 rounded-sm">PL</span>
                  <span className="text-[10px] text-primary">Pronto</span>
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <span className="text-[10px] font-bold">Fit: 98%</span>
                <div className="w-12 h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[98%]"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-container-lowest p-3 rounded-md flex items-center gap-3 border-l-2 border-[#E9C349]">
              <div className="w-10 h-10 bg-surface-bright rounded-md flex items-center justify-center font-headline font-bold text-tertiary">10</div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate">M. Ødegaard</span>
                <div className="flex items-center gap-2">
                  <span className="bg-surface-bright text-[8px] font-black px-1.5 py-0.5 rounded-sm">MC</span>
                  <span className="text-[10px] text-tertiary-fixed-dim">Inspirado</span>
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <span className="text-[10px] font-bold">Fit: 94%</span>
                <div className="w-12 h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full w-[94%]"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-surface-container-lowest p-3 rounded-md flex items-center gap-3 border-l-2 border-primary">
              <div className="w-10 h-10 bg-surface-bright rounded-md flex items-center justify-center font-headline font-bold text-tertiary">4</div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate">W. Saliba</span>
                <div className="flex items-center gap-2">
                  <span className="bg-surface-bright text-[8px] font-black px-1.5 py-0.5 rounded-sm">DC</span>
                  <span className="text-[10px] text-primary">Sólido</span>
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <span className="text-[10px] font-bold">Fit: 100%</span>
                <div className="w-12 h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[100%]"></div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-3 rounded-md flex items-center gap-3 border-l-2 border-error">
               <div className="w-10 h-10 bg-surface-bright rounded-md flex items-center justify-center font-headline font-bold text-tertiary">7</div>
               <div className="flex flex-col min-w-0">
                 <span className="text-xs font-bold truncate">B. Saka</span>
                 <div className="flex items-center gap-2">
                   <span className="bg-surface-bright text-[8px] font-black px-1.5 py-0.5 rounded-sm">ED</span>
                   <span className="text-[10px] text-error">Lesão Ligeira</span>
                 </div>
               </div>
               <div className="ml-auto flex flex-col items-end">
                 <span className="text-[10px] font-bold text-error">Fit: 68%</span>
                 <div className="w-12 h-1 bg-surface-container-high rounded-full overflow-hidden">
                   <div className="bg-error h-full w-[68%]"></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Breakdown (Detailed) */}
      <section className="md:col-span-12 lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-low p-6 rounded-md flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Orçamento de Transferências</span>
          <span className="font-headline text-3xl font-black text-primary">£24.8M</span>
          <span className="text-[10px] text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-primary">arrow_upward</span> +5% vendas recentes</span>
        </div>
        <div className="bg-surface-container-low p-6 rounded-md flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Receitas do Estádio</span>
          <span className="font-headline text-3xl font-black text-on-surface">£8.2M</span>
          <span className="text-[10px] text-on-surface-variant">Último Jogo: Lotação Esgotada</span>
        </div>
        <div className="bg-surface-container-low p-6 rounded-md flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Acordos Comerciais</span>
          <span className="font-headline text-3xl font-black text-tertiary">£12.5M</span>
          <span className="text-[10px] text-on-surface-variant">3 Patrocínios Ativos</span>
        </div>
      </section>
    </div>
  );
}
