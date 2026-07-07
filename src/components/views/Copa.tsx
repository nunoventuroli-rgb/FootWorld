"use client";

import { useState } from "react";
import { CareerState, TeamT } from "@/lib/types";
import { CupData, faseNome } from "@/lib/cup";
import { Shirt } from "@/components/Shirt";

export function Copa({ state }: { state: CareerState }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const teamById = (id: number) => state.teams.find((t) => t.id === id);

  const parse = (s: string): CupData | null => { try { return s ? (JSON.parse(s) as CupData) : null; } catch { return null; } };
  const cup = parse(state.career.cupData);
  const stateCup = parse(state.career.stateCup);

  const tabs: { key: string; label: string; cup: CupData }[] = [];
  if (stateCup) tabs.push({ key: "estadual", label: `🎖️ ${stateCup.name}`, cup: stateCup });
  if (cup) tabs.push({ key: "copa", label: `🥇 ${cup.name}`, cup });

  const [tab, setTab] = useState(tabs[0]?.key ?? "");
  const active = tabs.find((t) => t.key === tab)?.cup ?? tabs[0]?.cup;

  if (!active) return <div className="card p-6 text-slate-400">Nenhuma copa nesta carreira.</div>;

  return (
    <div className="card p-5 max-w-4xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${tab === t.key ? "bg-emerald-500 text-slate-900" : "text-slate-300 hover:bg-white/5"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {active.champion && (
          <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 rounded-full px-3 py-1.5">
            <span className="text-amber-400 text-sm font-bold">Campeão:</span>
            {(() => { const c = teamById(active.champion!); return c ? <Shirt cor1={c.cor1} cor2={c.cor2} padrao={c.padrao} size={20} badge={c.badge} sigla={c.sigla} /> : null; })()}
            <span className="text-sm font-bold">{teamById(active.champion)?.name}</span>
          </div>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {active.rounds.map((round, ri) => {
          const stage = ri === active.rounds.length - 1 && active.champion ? "Vencedor" : faseNome(round.length * 2);
          return (
            <div key={ri} className="min-w-[240px] flex-1">
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-2 text-center">{stage}</div>
              <div className="space-y-2">
                {round.map((tie, ti) => {
                  const h = teamById(tie.home);
                  const a = teamById(tie.away);
                  const mine = tie.home === me.id || tie.away === me.id;
                  return (
                    <div key={ti} className={`rounded-xl p-2 border ${mine ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                      <TieRow team={h} goals={tie.played ? tie.homeGoals : null} pen={tie.penHome} winner={tie.winner === tie.home && tie.played} />
                      <TieRow team={a} goals={tie.played ? tie.awayGoals : null} pen={tie.penAway} winner={tie.winner === tie.away && tie.played} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-4">
        {tab === "estadual"
          ? "O Estadual é disputado como pré-temporada (mata-mata nas primeiras rodadas)."
          : "A copa é disputada em mata-mata ao longo da temporada. Empate vai para os pênaltis."}
      </p>
    </div>
  );
}

function TieRow({ team, goals, pen, winner }: { team?: TeamT; goals: number | null; pen?: number; winner: boolean }) {
  if (!team) return <div className="flex items-center gap-2 text-sm text-slate-500 py-0.5">A definir</div>;
  return (
    <div className={`flex items-center gap-2 py-0.5 ${winner ? "font-bold" : "text-slate-300"}`}>
      <Shirt cor1={team.cor1} cor2={team.cor2} padrao={team.padrao} size={18} badge={team.badge} sigla={team.sigla} />
      <span className="flex-1 truncate text-sm">{team.sigla}</span>
      {pen != null && <span className="text-[10px] text-slate-500">({pen})</span>}
      <span className="text-sm tabular-nums w-5 text-right">{goals != null ? goals : "-"}</span>
    </div>
  );
}
