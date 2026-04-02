import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Tactics() {
  const [formation, setFormation] = useState("4-4-2");
  const [style, setStyle] = useState("EQUILIBRADO");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [startingEleven, setStartingEleven] = useState([]);
  const [subs, setSubs] = useState([]);

  // Fetch players from API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const roomId = localStorage.getItem("activeRoom");
        const token = localStorage.getItem("token");

        if (!roomId) return;

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
          throw new Error("Falha ao carregar jogadores");
        }

        const data = await res.json();
        setPlayers(data.players || []);
      } catch (err) {
        console.error("Erro:", err);
      } finally {
        setLoadingPlayers(false);
      }
    };

    fetchPlayers();
  }, []);

  const toggleStartingEleven = (playerId) => {
    if (startingEleven.includes(playerId)) {
      setStartingEleven(startingEleven.filter((id) => id !== playerId));
    } else {
      if (startingEleven.length < 11) {
        setStartingEleven([...startingEleven, playerId]);
      }
    }
  };

  const toggleSubs = (playerId) => {
    if (subs.includes(playerId)) {
      setSubs(subs.filter((id) => id !== playerId));
    } else {
      if (subs.length < 5) {
        setSubs([...subs, playerId]);
      }
    }
  };

  const canSelectStarters = startingEleven.length < 11;
  const canSelectSubs = subs.length < 5;

  const handleSave = async () => {
    if (startingEleven.length !== 11) {
      setMessage("❌ Deve selecionar 11 titulares");
      return;
    }

    setLoading(true);
    setMessage("");
    const roomId = localStorage.getItem("activeRoom");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_URL}/api/tactics/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: parseInt(roomId),
          formation,
          style,
          starting_eleven: startingEleven,
          subs: subs,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ " + data.message);
      } else {
        setMessage("❌ " + (data.error || "Erro ao submeter"));
      }
    } catch {
      setMessage("❌ Falha de conexão ao servidor");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlayers) {
    return <div className="text-slate-400">Carregando jogadores...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-slate-800 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            Formação e Táctica
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Defina o 11 titular e suplentes para o próximo jogo
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading || startingEleven.length !== 11}
          className="flex items-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/20"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Submeter Táctica
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${message.startsWith("✅") ? "bg-emerald-900/30 border border-emerald-500/30 text-emerald-400" : "bg-red-900/30 border border-red-500/30 text-red-400"}`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Formation & Style Dropdowns */}
        <div>
          <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">
                Instruções Colectivas
              </h3>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Formação
              </label>
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
              <label className="block text-sm text-slate-300 mb-1">
                Estilo de Jogo
              </label>
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

        {/* Middle & Right: Player Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Titulares */}
          <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-emerald-400 mb-3">
              Titulares ({startingEleven.length}/11)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players
                .filter((p) => !subs.includes(p.id))
                .map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-700/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={startingEleven.includes(p.id)}
                      onChange={() => toggleStartingEleven(p.id)}
                      disabled={
                        !canSelectStarters && !startingEleven.includes(p.id)
                      }
                      className="w-4 h-4 rounded border-slate-600 cursor-pointer"
                    />
                    <span className="ml-3 text-sm text-slate-300 flex-1">
                      {p.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
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
                    <span className="ml-2 text-xs text-slate-500 font-mono">
                      Q:{p.quality}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          {/* Suplentes */}
          <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">
              Suplentes ({subs.length}/5)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players
                .filter((p) => !startingEleven.includes(p.id))
                .map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-700/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={subs.includes(p.id)}
                      onChange={() => toggleSubs(p.id)}
                      disabled={!canSelectSubs && !subs.includes(p.id)}
                      className="w-4 h-4 rounded border-slate-600 cursor-pointer"
                    />
                    <span className="ml-3 text-sm text-slate-300 flex-1">
                      {p.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
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
                    <span className="ml-2 text-xs text-slate-500 font-mono">
                      Q:{p.quality}
                    </span>
                  </label>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
