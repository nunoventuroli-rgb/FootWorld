"use client";

import { useState } from "react";
import { CareerState, TeamT } from "@/lib/types";
import { overall, marketValue } from "@/lib/engine";
import { sortByPos, POS_COLOR, ovrColor } from "@/lib/utils";
import { Shirt } from "@/components/Shirt";
import { fmtMoney } from "@/lib/currency";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerT } from "@/lib/types";

export function Elenco({ state, onChanged, careerId }: { state: CareerState; onChanged: () => void; careerId: number }) {
  const myId = state.career.controlledTeamId!;
  const cur = state.career.currency;
  const [teamId, setTeamId] = useState(myId);
  const team = state.teams.find((t) => t.id === teamId) as TeamT;
  const players = sortByPos(state.players.filter((p) => p.teamId === teamId));
  const [sortKey, setSortKey] = useState<"pos" | "ovr" | "idade" | "gols" | "valor">("pos");
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<PlayerT | null>(null);

  let scouted: number[] = [];
  try { scouted = JSON.parse(state.career.scoutedTeams || "[]"); } catch { scouted = []; }
  const isMine = teamId === myId;
  const revealed = isMine || scouted.includes(teamId);

  const sorted = [...players].sort((a, b) => {
    switch (sortKey) {
      case "ovr": return overall(b) - overall(a);
      case "idade": return a.idade - b.idade;
      case "gols": return b.gols - a.gols;
      case "valor": return marketValue(b) - marketValue(a);
      default: return 0;
    }
  });

  async function spy() {
    setBusy(true);
    await fetch(`/api/careers/${careerId}/scouts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "spy", teamId }),
    });
    setBusy(false);
    onChanged();
  }

  const hid = (v: number | string) => (revealed ? v : "?");
  const avgOvr = revealed && players.length ? Math.round(players.reduce((s, p) => s + overall(p), 0) / players.length) : null;
  const avgAge = players.length ? Math.round(players.reduce((s, p) => s + p.idade, 0) / players.length) : null;

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Shirt cor1={team.cor1} cor2={team.cor2} padrao={team.padrao} size={30} badge={team.badge} sigla={team.sigla} />
          <h2 className="text-xl font-bold">{team.name}</h2>
          <span className="text-sm text-slate-400">
            {players.length} jog.{avgOvr !== null ? ` · nível ${avgOvr}` : ""}{avgAge !== null ? ` · idade média ${avgAge}` : ""}
          </span>
        </div>
        <select
          value={teamId}
          onChange={(e) => setTeamId(Number(e.target.value))}
          className="bg-slate-800 rounded-lg px-3 py-2 text-sm outline-none"
        >
          {state.teams.filter((t) => t.id > 0).map((t) => (
            <option key={t.id} value={t.id}>{t.name}{t.id === myId ? " (você)" : ""}</option>
          ))}
        </select>
      </div>

      {!revealed && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-3">
          <div className="text-sm text-sky-200">
            🔍 Você não conhece a qualidade do elenco do <b>{team.name}</b>. Envie um olheiro para revelar os atributos.
          </div>
          <button disabled={busy} onClick={spy} className="btn-primary px-3 py-1.5 rounded-lg text-sm whitespace-nowrap">
            Espionar ({fmtMoney(800_000, cur)})
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-white/10">
              <th className="text-left py-2 pl-2 cursor-pointer" onClick={() => setSortKey("pos")}>Pos</th>
              <th className="text-left">Jogador</th>
              <th className="text-center cursor-pointer" onClick={() => setSortKey("ovr")}>OVR</th>
              <th className="text-center">POT</th>
              <th className="text-center">ATA</th>
              <th className="text-center">MEI</th>
              <th className="text-center">DEF</th>
              <th className="text-center cursor-pointer" onClick={() => setSortKey("idade")}>Idade</th>
              <th className="text-center">Moral</th>
              <th className="text-center cursor-pointer" onClick={() => setSortKey("gols")}>G</th>
              <th className="text-center">A</th>
              <th className="text-right pr-2 cursor-pointer" onClick={() => setSortKey("valor")}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} onClick={() => setCard(p)} className={`border-b border-white/5 hover:bg-white/5 cursor-pointer ${p.isStarter && isMine ? "bg-emerald-500/5" : ""}`}>
                <td className="py-1.5 pl-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[p.position] ?? ""}`}>{p.position}</span>
                </td>
                <td className="font-medium">
                  {p.isStarter && isMine && <span className="text-emerald-400 mr-1">●</span>}
                  {p.loanFrom > 0 && <span className="text-sky-400 mr-1" title="Emprestado">↩</span>}
                  {p.name}
                </td>
                <td className={`text-center font-bold ${revealed ? ovrColor(overall(p)) : "text-slate-500"}`}>{hid(overall(p))}</td>
                <td className="text-center text-slate-400">{hid(p.potential)}</td>
                <td className="text-center text-slate-400">{hid(p.ataque)}</td>
                <td className="text-center text-slate-400">{hid(p.meio)}</td>
                <td className="text-center text-slate-400">{hid(p.defesa)}</td>
                <td className="text-center text-slate-400">{p.idade}</td>
                <td className="text-center">{revealed ? <MoralDot v={p.morale} /> : "?"}</td>
                <td className="text-center">{p.gols}</td>
                <td className="text-center text-slate-400">{p.assists}</td>
                <td className="text-right pr-2 text-slate-300">{revealed ? fmtMoney(marketValue(p), cur) : "?"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-2">Clique num jogador para ver a ficha completa (atributos estilo FIFA).</p>
      {card && <PlayerCard player={card} team={team} currency={cur} onClose={() => setCard(null)} hidden={!revealed} />}
    </div>
  );
}

function MoralDot({ v }: { v: number }) {
  const color = v >= 80 ? "bg-emerald-400" : v >= 60 ? "bg-lime-400" : v >= 40 ? "bg-yellow-400" : "bg-red-400";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} title={`Moral ${v}`} />;
}
