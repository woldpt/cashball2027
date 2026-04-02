import { useState, useEffect, useCallback } from "react";
import { Play, Clock, CheckCircle } from "lucide-react";

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
    const interval = setInterval(fetchMatches, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const formatWeek = (week) => {
    if (week <= 14) return `Jornada ${week} (Liga)`;
    return `Ronda ${week - 14} (Taça)`;
  };

  const getStatusColor = (status) => {
    if (status === "COMPLETED")
      return "bg-emerald-900/20 border-emerald-500/30 text-emerald-400";
    if (status === "LIVE")
      return "bg-red-900/20 border-red-500/30 text-red-400";
    return "bg-slate-800/20 border-slate-500/30 text-slate-400";
  };

  const getStatusIcon = (status) => {
    if (status === "COMPLETED") return <CheckCircle className="w-4 h-4" />;
    if (status === "LIVE") return <Play className="w-4 h-4 animate-pulse" />;
    return <Clock className="w-4 h-4" />;
  };

  if (loading)
    return <div className="text-slate-400">Carregando calendário...</div>;

  const groupedByWeek = {};
  matches.forEach((m) => {
    const week = m.week;
    if (!groupedByWeek[week]) groupedByWeek[week] = [];
    groupedByWeek[week].push(m);
  });

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-slate-100">
          Calendário da Época
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {matches.length} jogo(s) programado(s)
        </p>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedByWeek)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((week) => (
            <div key={week} className="space-y-2">
              <h3 className="text-md font-semibold text-emerald-400 uppercase tracking-widest text-xs px-4">
                {formatWeek(parseInt(week))}
              </h3>

              <div className="space-y-2">
                {groupedByWeek[week].map((match) => (
                  <div
                    key={match.id}
                    className={`bg-[#161b22] border rounded-lg p-4 transition-all ${
                      match.status === "COMPLETED"
                        ? "border-emerald-900/50"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left: Teams & Score */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4">
                          {/* Home Team */}
                          <div className="text-right flex-1">
                            <p className="text-sm font-semibold text-slate-200 truncate">
                              {match.home_club_name}
                            </p>
                            {match.status === "COMPLETED" && (
                              <p className="text-2xl font-bold text-emerald-400">
                                {match.home_score}
                              </p>
                            )}
                          </div>

                          {/* Divider / Score */}
                          <div className="px-4 text-center">
                            {match.status === "COMPLETED" ? (
                              <p className="text-2xl font-bold text-slate-500">
                                {match.home_score} - {match.away_score}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 font-mono">
                                vs
                              </p>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-200 truncate">
                              {match.away_club_name}
                            </p>
                            {match.status === "COMPLETED" && (
                              <p className="text-2xl font-bold text-slate-400">
                                {match.away_score}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Badge */}
                      <div
                        className={`ml-4 px-3 py-1 rounded-lg border flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${getStatusColor(match.status)}`}
                      >
                        {getStatusIcon(match.status)}
                        {match.status === "COMPLETED"
                          ? "Terminado"
                          : match.status === "LIVE"
                            ? "Ao Vivo"
                            : "Agendado"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
