"use client";

import { CareerState, MatchT, TeamT } from "@/lib/types";
import type { MatchStats } from "@/lib/engine";
import { Shirt } from "./Shirt";

export function MatchDetail({
  match,
  state,
  onClose,
}: {
  match: MatchT;
  state: CareerState;
  onClose: () => void;
}) {
  const team = (id: number) => state.teams.find((t) => t.id === id) as TeamT;
  const h = team(match.homeTeamId);
  const a = team(match.awayTeamId);

  let stats: MatchStats | null = null;
  try { stats = match.stats ? (JSON.parse(match.stats) as MatchStats) : null; } catch { stats = null; }

  let scorers: { home: { name: string }[]; away: { name: string }[] } = { home: [], away: [] };
  try { if (match.scorers) scorers = JSON.parse(match.scorers); } catch { /* ignore */ }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* placar */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex flex-col items-center gap-1">
              <Shirt cor1={h.cor1} cor2={h.cor2} padrao={h.padrao} size={40} badge={h.badge} sigla={h.sigla} />
              <span className="text-sm font-bold text-center">{h.name}</span>
            </div>
            <div className="px-4 text-center">
              <div className="text-3xl font-black tabular-nums">{match.homeGoals} - {match.awayGoals}</div>
              <div className="text-[10px] uppercase text-slate-500">Encerrado</div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <Shirt cor1={a.cor1} cor2={a.cor2} padrao={a.padrao} size={40} badge={a.badge} sigla={a.sigla} />
              <span className="text-sm font-bold text-center">{a.name}</span>
            </div>
          </div>
          {(scorers.home.length > 0 || scorers.away.length > 0) && (
            <div className="flex justify-between text-xs text-slate-400 mt-3">
              <div className="flex-1">{scorers.home.map((s, i) => <div key={i}>⚽ {s.name}</div>)}</div>
              <div className="flex-1 text-right">{scorers.away.map((s, i) => <div key={i}>{s.name} ⚽</div>)}</div>
            </div>
          )}
        </div>

        {!stats ? (
          <div className="p-6 text-center text-slate-400 text-sm">Sem estatísticas detalhadas para esta partida.</div>
        ) : (
          <div className="p-5 space-y-4">
            {/* barras de estatística */}
            <div className="space-y-2.5">
              <StatBar label="Posse de bola" home={stats.possHome} away={stats.possAway} suffix="%" />
              <StatBar label="Gols esperados (xG)" home={stats.xgHome} away={stats.xgAway} decimals />
              <StatBar label="Finalizações" home={stats.shotsHome} away={stats.shotsAway} />
              <StatBar label="No alvo" home={stats.onTargetHome} away={stats.onTargetAway} />
              <StatBar label="Escanteios" home={stats.cornersHome} away={stats.cornersAway} />
              <StatBar label="Faltas" home={stats.foulsHome} away={stats.foulsAway} />
              <StatBar label="Passes certos" home={stats.passesHome} away={stats.passesAway} />
            </div>

            {/* eventos do jogo */}
            {stats.events.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Momentos do jogo</div>
                <div className="space-y-1">
                  {stats.events.map((ev, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm ${ev.team === "away" ? "flex-row-reverse text-right" : ""}`}>
                      <span className="text-xs text-slate-500 w-8">{ev.minute}'</span>
                      <span className={ev.type === "goal" ? "font-semibold text-emerald-400" : "text-slate-400"}>
                        {ev.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} className="btn-ghost w-full rounded-none py-3">Fechar</button>
      </div>
    </div>
  );
}

function StatBar({ label, home, away, suffix = "", decimals = false }: { label: string; home: number; away: number; suffix?: string; decimals?: boolean }) {
  const total = home + away || 1;
  const hPct = Math.round((home / total) * 100);
  const fmt = (v: number) => (decimals ? v.toFixed(2) : `${v}${suffix}`);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={`font-bold ${home >= away ? "text-white" : "text-slate-400"}`}>{fmt(home)}</span>
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold ${away >= home ? "text-white" : "text-slate-400"}`}>{fmt(away)}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="bg-emerald-500 rounded-l" style={{ width: `${hPct}%` }} />
        <div className="bg-sky-500 rounded-r" style={{ width: `${100 - hPct}%` }} />
      </div>
    </div>
  );
}
