import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Portal({ user, token, onSelectRoom, onGlobalLogout }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [joinMode, setJoinMode] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/rooms/my-rooms`, {
        headers: { Authorization: `Bearer ${token}` },
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
  }, [token]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/api/rooms/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        fetchRooms();
      } else {
        alert(data.error || "Erro ao criar sala");
      }
    } catch (e) {
      alert("Erro de ligação ao servidor");
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
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomCode: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        fetchRooms();
        setJoinMode(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
      setJoinCode("");
    }
  };

  const handleDeleteRoom = async (e, code) => {
    e.stopPropagation();
    if (!confirm("Eliminar sala permanentemente?")) return;
    try {
      const res = await fetch(`${API_URL}/api/rooms/${code}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
    <div className="bg-background text-on-background font-body selection:bg-primary selection:text-on-primary min-h-screen">
      {/* Background Layering */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 tactical-pattern"></div>
        <div className="absolute inset-0 pitch-glow"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background"></div>
      </div>

      {/* Main Content Canvas */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Branding Header */}
        <header className="mb-12 text-center w-full max-w-6xl flex flex-col md:flex-row items-center justify-between">
          <div className="text-left">
            <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tighter text-tertiary mb-1 text-shadow-sm">
              CASHBALL 2027
            </h1>
            <p className="font-label text-primary tracking-[0.3em] uppercase text-[10px] font-bold">Elite Management Simulation</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3 bg-surface-container px-4 py-2 rounded-md border border-outline-variant/20">
            <span className="material-symbols-outlined text-outline">person</span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider">TREINADOR</span>
              <span className="text-sm font-bold text-on-surface">{user.username}</span>
            </div>
          </div>
        </header>

        {/* Layout Grid: 7/12 and 5/12 Pattern */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Hero & Primary Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Hero Section */}
            <div className="relative h-[300px] md:h-[400px] bg-surface-container rounded-md overflow-hidden group border border-outline-variant/10 shadow-xl">
              <img 
                alt="Cinematic stadium shot" 
                className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105 mix-blend-luminosity" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6qtRbu4lK6mEZRDChj2y9qn1uxGsR6G0seR3WQTPcosDz_Qquof0PicL6IzyZvgsn6jHfiOwx1jayOg5YRB-O0wpETWTiGnwQA8-5oomd-7d5PplONnwrzTlOBDHamHfTpHpuU2fvgZaCrCsvuc8d5RB0ysc5VtgXECFW-H6szrM9bEV263PEaYsVtNxYuvP9665hWoryzJ4gituyYXuQralUH3WKUskTQDqFxjYOfqiXUSJhJVpN5a6pylF9oNi8Wb0KiZ1llCj-"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
              
              <div className="absolute bottom-8 left-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-primary text-on-primary font-headline px-2 py-1 text-sm font-bold uppercase tracking-widest">Portal Oficial</span>
                  <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-wider">v2.0 Build 2027</span>
                </div>
                <h2 className="font-headline text-3xl md:text-4xl text-on-surface font-bold tracking-tight">O TEU LEGADO COMEÇA AQUI</h2>
              </div>
            </div>

            {/* Primary Menu Buttons */}
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={handleCreateRoom}
                disabled={actionLoading}
                className="group relative flex flex-col items-start justify-between p-6 bg-primary text-on-primary rounded-md transition-all active:scale-[0.98] text-left shadow-lg overflow-hidden disabled:opacity-50"
              >
                <div className="absolute -right-4 -top-4 bg-on-primary/10 w-24 h-24 rounded-full blur-xl group-hover:bg-on-primary/20 transition-all"></div>
                <span className="material-symbols-outlined text-4xl mb-4 relative z-10">sports_soccer</span>
                <div className="relative z-10">
                  <p className="font-headline text-2xl font-bold tracking-tighter mb-1">CRIAR SALA</p>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Inicia uma simulação nova</p>
                </div>
              </button>
              
              {!joinMode ? (
                <button 
                  onClick={() => setJoinMode(true)}
                  className="group relative flex flex-col items-start justify-between p-6 bg-surface-container-high border border-outline-variant/15 text-on-surface rounded-md hover:bg-surface-bright transition-all active:scale-[0.98] text-left"
                >
                  <span className="material-symbols-outlined text-4xl mb-4 text-tertiary">group_add</span>
                  <div>
                    <p className="font-headline text-2xl font-bold tracking-tighter mb-1">JUNTAR CÓDIGO</p>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Acede à sala de um amigo</p>
                  </div>
                </button>
              ) : (
                <div className="p-6 bg-surface-container-high border border-primary text-on-surface rounded-md flex flex-col justify-between">
                  <form onSubmit={handleJoinRoom} className="space-y-4 w-full h-full flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                         <p className="font-headline text-xl font-bold tracking-tighter">CÓDIGO DE ACESSO</p>
                         <button type="button" onClick={() => setJoinMode(false)} className="text-outline hover:text-on-surface"><span className="material-symbols-outlined text-sm">close</span></button>
                      </div>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="EX: ABCDEF"
                        maxLength={6}
                        required
                        autoFocus
                        className="w-full bg-surface-container border border-outline-variant/30 text-on-surface rounded-md p-3 text-lg font-mono font-bold uppercase tracking-widest text-center focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading || !joinCode}
                      className="w-full bg-surface-bright hover:bg-primary hover:text-on-primary text-on-surface disabled:opacity-50 font-bold py-2 rounded-sm text-xs tracking-widest uppercase transition-all"
                    >
                      CONFIRMAR O CÓDIGO
                    </button>
                  </form>
                </div>
              )}

              <button 
                onClick={onGlobalLogout}
                className="col-span-1 sm:col-span-2 group relative flex items-center p-4 bg-surface-container-low border border-outline-variant/10 text-outline rounded-md hover:bg-error-container/10 hover:border-error/30 hover:text-error transition-all active:scale-[0.99] text-left"
              >
                <span className="material-symbols-outlined text-2xl mr-4">logout</span>
                <div>
                  <p className="font-headline font-bold text-sm tracking-widest uppercase">SAIR DA CONTA GLOBAL</p>
                </div>
              </button>
            </nav>
          </div>

          {/* Right Column: Load Game & Stats */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Save Game Module */}
            <section className="bg-surface-container-low rounded-md overflow-hidden border border-outline-variant/15 flex flex-col h-[500px]">
              <div className="bg-surface-container-high px-6 py-4 flex justify-between items-center shrink-0 border-b border-outline-variant/10">
                <h3 className="font-headline text-on-surface font-bold tracking-tight text-lg uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  SALAS ACTIVAS
                </h3>
                <span className="material-symbols-outlined text-outline text-sm">cloud_sync</span>
              </div>
              
              <div className="p-2 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin text-tertiary text-4xl">autorenew</span>
                  </div>
                ) : rooms.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-outline opacity-50 p-6 text-center">
                      <span className="material-symbols-outlined text-4xl mb-2">sports_esports</span>
                      <p className="text-xs font-bold uppercase tracking-widest">NENHUMA SALA ENCONTRADA</p>
                      <p className="text-[10px] mt-2">Cria uma nova sala ou junta-te a amigos para começar.</p>
                   </div>
                ) : (
                  rooms.map((room, index) => (
                    <div key={room.id}>
                      <div 
                        onClick={() => onSelectRoom(room.id, room.code, room.manager_id)}
                        className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-surface-bright/50 transition-colors cursor-pointer rounded-sm border border-transparent hover:border-outline-variant/20 relative overflow-hidden"
                      >
                        {/* Hover accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                        
                        <div className="h-12 w-12 shrink-0 bg-surface-container rounded-sm flex items-center justify-center border border-outline-variant/10">
                           <span className="material-symbols-outlined text-outline group-hover:text-tertiary transition-colors">shield</span>
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-8">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-headline text-on-surface font-bold text-base leading-none truncate group-hover:text-primary transition-colors">
                              {room.club_name}
                            </h4>
                            {room.is_founder === 1 && (
                              <span className="text-[8px] bg-tertiary/20 text-tertiary-fixed border border-tertiary/30 px-1 py-0.5 rounded-sm uppercase font-black uppercase" title="Fundador da Sala">FUNDADOR</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] bg-surface-container-lowest px-1.5 py-0.5 rounded-sm text-outline font-bold border border-outline-variant/10">
                              CÓDIGO: {room.code}
                            </span>
                            <span className="text-[10px] text-outline font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">update</span> Activo
                            </span>
                          </div>
                        </div>

                        {/* Action icons */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                           {room.is_founder === 1 && (
                             <button 
                               onClick={(e) => handleDeleteRoom(e, room.code)}
                               className="text-outline opacity-0 group-hover:opacity-100 hover:text-error transition-all p-1"
                               title="Eliminar Sala"
                             >
                               <span className="material-symbols-outlined text-sm">delete</span>
                             </button>
                           )}
                           <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                             <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                           </div>
                        </div>
                      </div>
                      
                      {index < rooms.length - 1 && (
                        <div className="h-[1px] mx-4 bg-outline-variant/10"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
