"use client";

import { CareerState, TeamT } from "@/lib/types";
import { seasonLabel } from "@/lib/season";

type Trophy = { name: string; season: number; type: string };

const TYPE_ICON: Record<string, string> = { liga: "🏆", copa: "🥇", estadual: "🎖️", mundo: "🌍" };

export function Trofeus({ state }: { state: CareerState }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  let trophies: Trophy[] = [];
  try { trophies = JSON.parse(state.career.trophies || "[]"); } catch { trophies = []; }

  const byType: Record<string, Trophy[]> = {};
  for (const t of trophies) (byType[t.type] ||= []).push(t);

  const total = trophies.length;

  return (
    <div className="space-y-4">
      <div className="card p-6 text-center">
        <div className="text-5xl mb-2">🏆</div>
        <h2 className="text-2xl font-black">Sala de Troféus</h2>
        <p className="text-slate-400 text-sm mt-1">{me.name} · {total} {total === 1 ? "título" : "títulos"}</p>
      </div>

      {total === 0 ? (
        <div className="card p-8 text-center text-slate-400">
          Você ainda não conquistou nenhum título. Vá em busca de glórias! 🏅
        </div>
      ) : (
        <div className="grid gap-4">
          {["liga", "copa", "estadual", "mundo"].filter((t) => byType[t]?.length).map((type) => (
            <div key={type} className="card p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span>{TYPE_ICON[type] ?? "🏅"}</span>
                {type === "liga" ? "Ligas" : type === "copa" ? "Copas" : type === "estadual" ? "Estaduais" : "Mundiais"}
                <span className="text-slate-500 text-sm">({byType[type].length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {byType[type].map((tr, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-3 border border-white/10">
                    <span className="text-2xl">{TYPE_ICON[type] ?? "🏅"}</span>
                    <div>
                      <div className="font-bold">{tr.name}</div>
                      <div className="text-xs text-amber-400">
                        Temporada {seasonLabel(state.career.baseYear, tr.season, state.career.seasonFormat)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
