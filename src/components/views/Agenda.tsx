"use client";

import { useState } from "react";
import { CareerState, TeamT, MatchT } from "@/lib/types";
import { Shirt } from "@/components/Shirt";
import { CupData, faseNome } from "@/lib/cup";
import { MatchDetail } from "@/components/MatchDetail";

export function Agenda({ state }: { state: CareerState }) {
  const [detail, setDetail] = useState<MatchT | null>(null);
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const team = (id: number) => state.teams.find((t) => t.id === id) as TeamT;
  const cur = state.career.currentRound;

  // copa: descobrir em que rodada cada fase acontece
  let cup: CupData | null = null;
  try { cup = state.career.cupData ? (JSON.parse(state.career.cupData) as CupData) : null; } catch { cup = null; }
  const cupByRound = new Map<number, { stage: string; tie?: CupData["rounds"][number][number] }>();
  if (cup) {
    cup.playAt.forEach((rnd, i) => {
      const ties = cup!.rounds[i] ?? [];
      const myTie = ties.find((t) => t.home === me.id || t.away === me.id);
      cupByRound.set(rnd, { stage: faseNome((ties.length || 1) * 2), tie: myTie });
    });
  }

  // agenda do meu time: 1 linha por rodada
  const total = state.totalRounds;
  const rows: { round: number; comp: string; oppId: number | null; home: boolean; played: boolean; gf?: number; ga?: number; extra?: string }[] = [];
  for (let r = 1; r <= total; r++) {
    const m = state.matches.find((x) => x.round === r && (x.homeTeamId === me.id || x.awayTeamId === me.id));
    if (m) {
      const home = m.homeTeamId === me.id;
      rows.push({
        round: r, comp: state.career.leagueName, oppId: home ? m.awayTeamId : m.homeTeamId,
        home, played: m.played,
        gf: home ? m.homeGoals : m.awayGoals, ga: home ? m.awayGoals : m.homeGoals,
      });
    }
    const c = cupByRound.get(r);
    if (c) {
      const tie = c.tie;
      const oppId = tie ? (tie.home === me.id ? tie.away : tie.home) : null;
      rows.push({
        round: r, comp: `🏆 ${cup?.name ?? "Copa"} · ${c.stage}`,
        oppId, home: tie ? tie.home === me.id : true, played: tie ? tie.played : false,
        gf: tie ? (tie.home === me.id ? tie.homeGoals : tie.awayGoals) : undefined,
        ga: tie ? (tie.home === me.id ? tie.awayGoals : tie.homeGoals) : undefined,
        extra: tie ? undefined : "Fora da copa",
      });
    }
  }

  const [selRound, setSelRound] = useState(Math.min(cur + 1, total) || 1);
  // mostra só os jogos da MINHA divisão nesta rodada (não misturar as ligas do mundo)
  const roundMatches = state.matches.filter((m) => {
    if (m.round !== selRound) return false;
    const h = state.teams.find((t) => t.id === m.homeTeamId);
    return h && h.division === me.division;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
      {/* Calendário da temporada */}
      <div className="card p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">📅 Calendário — {me.name}</h3>
        <div className="space-y-1 max-h-[620px] overflow-y-auto pr-1">
          {rows.map((row, i) => {
            const opp = row.oppId ? team(row.oppId) : null;
            const isNext = !row.played && row.round > cur;
            const res = row.played && row.gf != null
              ? (row.gf > (row.ga ?? 0) ? "V" : row.gf === row.ga ? "E" : "D") : "";
            const resColor = res === "V" ? "bg-emerald-500" : res === "E" ? "bg-slate-500" : res === "D" ? "bg-red-500" : "bg-white/10";
            return (
              <button
                key={i}
                onClick={() => setSelRound(row.round)}
                className={`w-full text-left rounded-xl px-3 py-2 transition ${
                  selRound === row.round ? "bg-emerald-500/10 ring-1 ring-emerald-500/40" : "bg-white/[0.03] hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                  <span>{row.comp.includes("Copa") ? row.comp : `Rodada ${row.round} · ${row.comp}`}</span>
                  {isNext && <span className="text-emerald-400">Próximo</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-5">{row.home ? "🏠" : "✈️"}</span>
                  {opp ? <Shirt cor1={opp.cor1} cor2={opp.cor2} padrao={opp.padrao} size={18} badge={opp.badge} sigla={opp.sigla} /> : null}
                  <span className="flex-1 text-sm truncate">{opp ? opp.name : row.extra ?? "A definir"}</span>
                  {row.played && row.gf != null ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-bold tabular-nums">{row.gf}-{row.ga}</span>
                      <span className={`${resColor} w-5 h-5 rounded text-center text-[10px] font-bold leading-5 text-white`}>{res}</span>
                    </span>
                  ) : <span className="text-xs text-slate-500">—</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Jogos da rodada selecionada (toda a liga) */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setSelRound((r) => Math.max(1, r - 1))} className="btn-ghost px-3 py-1.5">‹</button>
          <h3 className="font-bold">Rodada {selRound} · {state.career.leagueName}</h3>
          <button onClick={() => setSelRound((r) => Math.min(total, r + 1))} className="btn-ghost px-3 py-1.5">›</button>
        </div>
        <div className="space-y-1.5">
          {roundMatches.map((m) => {
            const h = team(m.homeTeamId), a = team(m.awayTeamId);
            const mine = m.homeTeamId === me.id || m.awayTeamId === me.id;
            const hasDetail = m.played && !!m.stats;
            return (
              <div
                key={m.id}
                onClick={() => hasDetail && setDetail(m)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 ${mine ? "bg-emerald-500/10 ring-1 ring-emerald-500/40" : "bg-white/[0.03]"} ${hasDetail ? "cursor-pointer hover:bg-emerald-500/20" : ""}`}
                title={hasDetail ? "Ver estatísticas da partida" : ""}
              >
                <div className="flex-1 flex items-center justify-end gap-2 text-right">
                  <span className="text-sm truncate">{h.name}</span>
                  <Shirt cor1={h.cor1} cor2={h.cor2} padrao={h.padrao} size={20} badge={h.badge} sigla={h.sigla} />
                </div>
                <div className="w-16 text-center font-bold">
                  {m.played ? `${m.homeGoals} - ${m.awayGoals}` : <span className="text-slate-500 text-xs">vs</span>}
                  {hasDetail && <div className="text-[9px] text-emerald-400 font-normal">ver stats</div>}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <Shirt cor1={a.cor1} cor2={a.cor2} padrao={a.padrao} size={20} badge={a.badge} sigla={a.sigla} />
                  <span className="text-sm truncate">{a.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {detail && <MatchDetail match={detail} state={state} onClose={() => setDetail(null)} />}
    </div>
  );
}
