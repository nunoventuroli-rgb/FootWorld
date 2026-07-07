"use client";

import { useState } from "react";
import { CareerState, TeamT, PlayerT } from "@/lib/types";
import { standings } from "@/lib/utils";
import { overall } from "@/lib/engine";
import { Shirt } from "@/components/Shirt";

export function ChampionScreen({
  state,
  careerId,
  onNewSeason,
}: {
  state: CareerState;
  careerId: number;
  onNewSeason: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const table = standings(state.teams.filter((t) => t.id > 0));
  const champ = table[0];
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const myPos = table.findIndex((t) => t.id === me?.id) + 1;

  const players = state.players.filter((p) => p.teamId > 0);
  const topScorer = best(players, (p) => p.gols);
  const topAssist = best(players, (p) => p.assists);
  const topGK = best(players.filter((p) => p.position === "GOL"), (p) => p.cleanSheets);
  const mvp = best(players, (p) => p.gols * 3 + p.assists * 2 + overall(p) / 10);

  const teamOf = (p?: PlayerT) => (p ? state.teams.find((t) => t.id === p.teamId) : undefined);

  async function novaTemporada() {
    setBusy(true);
    await fetch(`/api/careers/${careerId}/newseason`, { method: "POST" });
    onNewSeason();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="card p-6 max-w-lg w-full animate-in my-8">
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🏆</div>
          <div className="text-xs uppercase tracking-widest text-amber-400">Campeão da {state.career.leagueName}</div>
          {champ && (
            <div className="flex items-center justify-center gap-3 mt-2">
              <Shirt cor1={champ.cor1} cor2={champ.cor2} padrao={champ.padrao} size={40} badge={champ.badge} sigla={champ.sigla} />
              <span className="text-2xl font-black">{champ.name}</span>
            </div>
          )}
          <div className="mt-3 text-slate-300 text-sm">
            Seu time <b>{me?.name}</b> terminou em <b className={myPos <= state.career.boardTarget ? "text-emerald-400" : "text-amber-400"}>{myPos}º</b>
            {" "}(meta: Top {state.career.boardTarget})
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <Award icon="⭐" title="Craque do Campeonato" player={mvp} team={teamOf(mvp)} extra={mvp ? `${overall(mvp)} OVR` : ""} />
          <Award icon="⚽" title="Artilheiro" player={topScorer} team={teamOf(topScorer)} extra={topScorer ? `${topScorer.gols} gols` : ""} />
          <Award icon="🅰️" title="Garçom" player={topAssist} team={teamOf(topAssist)} extra={topAssist ? `${topAssist.assists} assist.` : ""} />
          <Award icon="🧤" title="Melhor Goleiro" player={topGK} team={teamOf(topGK)} extra={topGK ? `${topGK.cleanSheets} CS` : ""} />
        </div>

        <button onClick={novaTemporada} disabled={busy} className="btn-primary w-full py-3">
          {busy ? "Preparando temporada..." : "▶ Iniciar Nova Temporada"}
        </button>
      </div>
    </div>
  );
}

function Award({ icon, title, player, team, extra }: { icon: string; title: string; player?: PlayerT; team?: TeamT; extra: string }) {
  return (
    <div className="rounded-2xl p-3 bg-white/[0.04] border border-white/10">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 flex items-center gap-1"><span>{icon}</span>{title}</div>
      {player ? (
        <>
          <div className="flex items-center gap-2 mt-1">
            {player.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photo} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : team ? (
              <Shirt cor1={team.cor1} cor2={team.cor2} padrao={team.padrao} size={20} badge={team.badge} sigla={team.sigla} />
            ) : null}
            <span className="font-bold text-sm truncate">{player.name}</span>
          </div>
          <div className="text-xs text-emerald-400 mt-0.5">{extra}{team ? ` · ${team.sigla}` : ""}</div>
        </>
      ) : (
        <div className="text-slate-500 text-sm mt-1">—</div>
      )}
    </div>
  );
}

function best(list: PlayerT[], score: (p: PlayerT) => number): PlayerT | undefined {
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => score(b) - score(a))[0];
}
