"use client";

import { useState } from "react";
import { CareerState, TeamT, PlayerT } from "@/lib/types";
import { overall } from "@/lib/engine";
import { POS_COLOR, ovrColor } from "@/lib/utils";
import { Shirt } from "@/components/Shirt";

type Cat = "gols" | "assist" | "goleiro" | "jogos" | "overall" | "jovens";

const CATS: { key: Cat; label: string; icon: string }[] = [
  { key: "gols", label: "Artilharia", icon: "⚽" },
  { key: "assist", label: "Garçom", icon: "🅰️" },
  { key: "goleiro", label: "Melhor Goleiro", icon: "🧤" },
  { key: "jogos", label: "Mais jogos", icon: "🎽" },
  { key: "overall", label: "Melhores (OVR)", icon: "⭐" },
  { key: "jovens", label: "Promessas", icon: "🌱" },
];

type WorldLeague = { division: number; name: string; pais: string };

export function Estatisticas({ state }: { state: CareerState }) {
  const [cat, setCat] = useState<Cat>("gols");
  const myId = state.career.controlledTeamId;
  const me = state.teams.find((t) => t.id === myId);
  const teamById = (id: number) => state.teams.find((t) => t.id === id);

  let worldLeagues: WorldLeague[] = [];
  try { worldLeagues = JSON.parse(state.career.worldLeagues || "[]"); } catch { worldLeagues = []; }

  // divisões da minha liga (1, 2...) + ligas do mundo
  const myDivs = Array.from(new Set(state.teams.filter((t) => t.id > 0 && t.division < 90).map((t) => t.division))).sort((a, b) => a - b);
  const divName = (d: number) => (d === 1 ? "Série A" : d === 2 ? "Série B" : `Divisão ${d}`);

  // competição selecionada (por divisão). default = minha divisão
  const [comp, setComp] = useState<number>(me?.division ?? 1);

  // jogadores da competição escolhida
  const teamIdsInComp = new Set(state.teams.filter((t) => t.id > 0 && t.division === comp).map((t) => t.id));
  const players = state.players.filter((p) => teamIdsInComp.has(p.teamId));

  let list: PlayerT[] = [];
  if (cat === "gols") list = [...players].filter((p) => p.gols > 0).sort((a, b) => b.gols - a.gols || overall(b) - overall(a));
  else if (cat === "assist") list = [...players].filter((p) => p.assists > 0).sort((a, b) => b.assists - a.assists || overall(b) - overall(a));
  else if (cat === "goleiro") list = [...players].filter((p) => p.position === "GOL" && p.jogos > 0).sort((a, b) => b.cleanSheets - a.cleanSheets || overall(b) - overall(a));
  else if (cat === "jogos") list = [...players].filter((p) => p.jogos > 0).sort((a, b) => b.jogos - a.jogos);
  else if (cat === "overall") list = [...players].sort((a, b) => overall(b) - overall(a));
  else list = [...players].filter((p) => p.idade <= 21).sort((a, b) => (b.potential - overall(b)) - (a.potential - overall(a)) || b.potential - a.potential);

  list = list.slice(0, 40);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h2 className="text-xl font-bold flex items-center gap-2 mr-2"><span>📈</span> Estatísticas</h2>
        <select value={comp} onChange={(e) => setComp(Number(e.target.value))} className="field px-3 py-1.5 text-sm">
          <optgroup label={`⭐ ${state.career.leagueName}`}>
            {myDivs.map((d) => <option key={d} value={d}>{divName(d)}{me?.division === d ? " (você)" : ""}</option>)}
          </optgroup>
          {worldLeagues.length > 0 && (
            <optgroup label="🌍 Outras ligas">
              {worldLeagues.map((w) => <option key={w.division} value={w.division}>{w.name}</option>)}
            </optgroup>
          )}
        </select>
      </div>
      <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl flex-wrap mb-4">
        {CATS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${cat === c.key ? "bg-emerald-500 text-slate-900" : "text-slate-300 hover:bg-white/5"}`}
          >
            <span className="mr-1">{c.icon}</span>{c.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">Ainda sem dados. Jogue algumas rodadas!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-white/10">
                <th className="text-left py-2 w-8">#</th>
                <th className="text-left">Jogador</th>
                <th className="text-left">Clube</th>
                <th className="w-12 text-center">Pos</th>
                <th className="w-14 text-center">OVR</th>
                {cat === "jovens" && <th className="w-14 text-center">POT</th>}
                <th className="w-16 text-center">
                  {cat === "gols" ? "Gols" : cat === "assist" ? "Assist." : cat === "goleiro" ? "CS" : cat === "jogos" ? "Jogos" : cat === "jovens" ? "Idade" : "OVR"}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((p, i) => {
                const t = teamById(p.teamId);
                const mine = p.teamId === myId;
                const destaque =
                  cat === "gols" ? p.gols : cat === "assist" ? p.assists : cat === "goleiro" ? p.cleanSheets : cat === "jogos" ? p.jogos : cat === "jovens" ? p.idade : overall(p);
                return (
                  <tr key={p.id} className={`border-b border-white/5 ${mine ? "bg-emerald-500/10" : "hover:bg-white/5"}`}>
                    <td className="py-2 text-slate-500">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {p.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[9px] text-slate-500">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {t && <Shirt cor1={t.cor1} cor2={t.cor2} padrao={t.padrao} size={16} badge={t.badge} sigla={t.sigla} />}
                        <span className="text-slate-400 text-xs">{t?.sigla}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[p.position] ?? ""}`}>{p.position}</span>
                    </td>
                    <td className={`text-center font-bold ${ovrColor(overall(p))}`}>{overall(p)}</td>
                    {cat === "jovens" && <td className={`text-center font-bold ${ovrColor(p.potential)}`}>{p.potential}</td>}
                    <td className="text-center font-black text-emerald-400">{destaque}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
