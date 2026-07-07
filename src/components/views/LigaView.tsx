"use client";

import { useMemo, useState } from "react";
import { CareerState, TeamT } from "@/lib/types";
import { StandingsTable } from "@/components/StandingsTable";

type WorldLeague = { division: number; name: string; pais: string };

export function LigaView({ state }: { state: CareerState }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const divisions = Array.from(new Set(state.teams.filter((t) => t.id > 0 && t.division < 90).map((t) => t.division))).sort((a, b) => a - b);
  const divName = (d: number) => (d === 1 ? "Série A" : d === 2 ? "Série B" : `Divisão ${d}`);

  const worldLeagues: WorldLeague[] = useMemo(() => {
    try { return JSON.parse(state.career.worldLeagues || "[]"); } catch { return []; }
  }, [state.career.worldLeagues]);

  // opções: minha divisão(ões) + ligas do mundo
  const [view, setView] = useState<string>("d" + (me?.division ?? 1));

  const selectedWorld = view.startsWith("w") ? worldLeagues.find((w) => "w" + w.division === view) : null;
  const selectedDiv = view.startsWith("d") ? Number(view.slice(1)) : null;

  const teamsShown = selectedWorld
    ? state.teams.filter((t) => t.id > 0 && t.division === selectedWorld.division)
    : state.teams.filter((t) => t.id > 0 && t.division === (selectedDiv ?? 1));

  // só a 1ª divisão do país dá vaga continental (ligas do mundo são a 1ª de cada país)
  const isTopDivision = selectedWorld ? true : (selectedDiv ?? 1) === 1;

  return (
    <div className="card p-5 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-bold flex items-center gap-2">🏆 Competições</h2>
        <select value={view} onChange={(e) => setView(e.target.value)} className="field px-3 py-1.5 text-sm">
          <optgroup label={`⭐ ${state.career.leagueName}`}>
            {divisions.map((d) => (
              <option key={d} value={"d" + d}>{divName(d)}{me?.division === d ? " (você)" : ""}</option>
            ))}
          </optgroup>
          {worldLeagues.length > 0 && (
            <optgroup label="🌍 Outras ligas do mundo">
              {worldLeagues.map((w) => (
                <option key={w.division} value={"w" + w.division}>{w.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <StandingsTable teams={teamsShown} myTeamId={me?.id ?? -1} showLegend topDivision={isTopDivision} />
    </div>
  );
}
