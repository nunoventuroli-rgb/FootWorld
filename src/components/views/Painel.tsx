"use client";

import { CareerState, TeamT, PlayerT } from "@/lib/types";
import { overall, marketValue, formatMoney, MORALE_LABEL } from "@/lib/engine";
import { StandingsTable } from "@/components/StandingsTable";
import { Pitch } from "@/components/Pitch";
import { Shirt } from "@/components/Shirt";
import { standings } from "@/lib/utils";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg px-3 py-2 flex justify-between items-center">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function Highlight({ title, player, tag }: { title: string; player?: PlayerT; tag: string }) {
  if (!player) return null;
  return (
    <div className="bg-slate-800/60 rounded-lg p-2 flex items-center gap-2">
      <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center font-black text-emerald-400 text-sm">
        {overall(player)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase text-slate-500">{title}</div>
        <div className="text-sm font-semibold truncate">{player.name}</div>
      </div>
      <div className="text-xs text-slate-400">{tag}</div>
    </div>
  );
}

export function Painel({ state }: { state: CareerState }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const myPlayers = state.players.filter((p) => p.teamId === me.id);
  const starters = myPlayers.filter((p) => p.isStarter);

  const sorted = [...myPlayers].sort((a, b) => overall(b) - overall(a));
  const best = sorted[0];
  const potential = [...myPlayers]
    .filter((p) => p.idade <= 23)
    .sort((a, b) => overall(b) - overall(a))[0];
  const topScorer = [...myPlayers].sort((a, b) => b.gols - a.gols)[0];

  const avgOvr = myPlayers.length
    ? Math.round(myPlayers.reduce((s, p) => s + overall(p), 0) / myPlayers.length)
    : 0;
  const avgAge = myPlayers.length
    ? Math.round(myPlayers.reduce((s, p) => s + p.idade, 0) / myPlayers.length)
    : 0;
  const totalValue = myPlayers.reduce((s, p) => s + marketValue(p), 0);

  const myDivTeams = state.teams.filter((t) => t.id > 0 && t.division === me.division);
  const myPos = standings(myDivTeams).findIndex((t) => t.id === me.id) + 1;

  const lastMatches = state.matches
    .filter((m) => m.played && (m.homeTeamId === me.id || m.awayTeamId === me.id))
    .sort((a, b) => b.round - a.round)
    .slice(0, 5);

  const teamName = (id: number) => state.teams.find((t) => t.id === id)?.sigla ?? "";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_340px] gap-4">
      {/* left column */}
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            {state.career.coachPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.career.coachPhoto} alt="" className="w-12 h-12 rounded-full object-cover border border-white/15" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
                <Shirt cor1={me.cor1} cor2={me.cor2} padrao={me.padrao} size={36} badge={me.badge} sigla={me.sigla} />
              </div>
            )}
            <div>
              <div className="text-xs text-slate-400">Treinador</div>
              <div className="font-bold text-lg">{state.career.coachName}</div>
              <div className="text-xs text-yellow-400">{"★".repeat(me.reputation)}</div>
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-2">
          <h3 className="text-sm font-bold text-slate-300 mb-1">Destaques</h3>
          <Highlight title="Melhor jogador" player={best} tag={best?.position} />
          <Highlight title="Maior potencial" player={potential} tag={`${potential?.idade} anos`} />
          <Highlight title="Artilheiro" player={topScorer} tag={`${topScorer?.gols ?? 0} gols`} />
        </div>
      </div>

      {/* center - formation + info */}
      <div className="space-y-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">{me.name}</h3>
            <span className="text-sm text-slate-400">Formação {me.formation}</span>
          </div>
          <div className="max-w-sm mx-auto">
            <Pitch formation={me.formation} starters={starters} />
          </div>
        </div>
      </div>

      {/* right - info + table */}
      <div className="space-y-4">
        <div className="card p-4 space-y-2">
          <h3 className="text-sm font-bold text-slate-300 mb-1">Elenco</h3>
          <StatCard label="Jogadores" value={`${myPlayers.length}`} />
          <StatCard label="Nível médio" value={`${avgOvr}`} />
          <StatCard label="Idade média" value={`${avgAge}`} />
          <StatCard label="Valor total" value={`$${formatMoney(totalValue)}`} />
          <StatCard label="Saldo em caixa" value={`$${formatMoney(me.saldo)}`} />
          <StatCard label="Moral do elenco" value={MORALE_LABEL(me.morale)} />
          <StatCard label="Posição na liga" value={`${myPos}º`} />
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-bold text-slate-300 mb-2">{state.career.leagueName}</h3>
          <StandingsTable teams={myDivTeams} myTeamId={me.id} compact topDivision={me.division === 1} />
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-bold text-slate-300 mb-2">Últimos jogos</h3>
          {lastMatches.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum jogo disputado ainda.</p>
          ) : (
            <div className="space-y-1">
              {lastMatches.map((m) => {
                const home = m.homeTeamId === me.id;
                const gf = home ? m.homeGoals : m.awayGoals;
                const ga = home ? m.awayGoals : m.homeGoals;
                const opp = home ? m.awayTeamId : m.homeTeamId;
                const res = gf > ga ? "V" : gf === ga ? "E" : "D";
                const color = res === "V" ? "bg-emerald-500" : res === "E" ? "bg-slate-500" : "bg-red-500";
                return (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <span className={`${color} w-5 h-5 rounded text-center text-xs font-bold leading-5`}>{res}</span>
                    <span className="text-slate-400 text-xs">R{m.round}</span>
                    <span className="flex-1">
                      {home ? "vs" : "@"} {teamName(opp)}
                    </span>
                    <span className="font-bold">{gf}-{ga}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
