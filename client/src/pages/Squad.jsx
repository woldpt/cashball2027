import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Squad() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSquad = async () => {
      try {
        const roomId = localStorage.getItem("activeRoom");
        const token = localStorage.getItem("token");

        if (!roomId) {
          setError("Sem sala ativa");
          return;
        }

        const res = await fetch(
          `${API_URL}/api/tactics/squad?roomId=${roomId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error("Falha ao carregar plantel");
        }

        const data = await res.json();
        setPlayers(data.players || []);
      } catch (err) {
        setError(err.message || "Erro ao carregar plantel");
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSquad();
  }, []);

  if (loading)
    return <div className="text-slate-400">Carregando plantel...</div>;
  if (error) return <div className="text-red-400">❌ {error}</div>;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-slate-100">
          Visão Geral do Plantel
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Totais: {players.length} de 24
        </p>
      </div>

      <div className="bg-[#161b22] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0d1117]/80 border-b border-slate-800 text-slate-500 uppercase tracking-widest text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4 text-center">Posição</th>
                <th className="px-6 py-4 text-center">Qualidade</th>
                <th className="px-6 py-4 text-center">Agress.</th>
                <th className="px-6 py-4 text-right">Salário (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {players.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-emerald-900/10 hover:shadow-[inset_2px_0_0_rgba(16,185,129,1)] transition-colors group"
                >
                  <td className="px-6 py-3 font-medium text-slate-300">
                    {p.name}
                    {p.craque && (
                      <span
                        className="ml-2 inline-flex items-center justify-center bg-blue-500/10 text-blue-400 text-[10px] w-4 h-4 rounded-full"
                        title="Craque"
                      >
                        ★
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider 
                      ${
                        p.position === "GR"
                          ? "bg-orange-500/20 text-orange-400"
                          : p.position === "DEF"
                            ? "bg-indigo-500/20 text-indigo-400"
                            : p.position === "MED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {p.position}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center font-mono">
                    <div className="flex items-center justify-center">
                      <span className="w-6 inline-block text-right">
                        {p.quality}
                      </span>
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full ml-3 overflow-hidden">
                        <div
                          className="h-full bg-slate-500 group-hover:bg-emerald-400 transition-colors"
                          style={{ width: `${(p.quality / 50) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center text-slate-400">
                    {p.aggressiveness}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-slate-300">
                    €{p.salary.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
