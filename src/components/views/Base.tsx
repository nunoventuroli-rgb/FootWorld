"use client";

import { useState } from "react";
import { CareerState, TeamT } from "@/lib/types";
import { overall } from "@/lib/engine";
import { POS_COLOR, ovrColor } from "@/lib/utils";
import { YOUTH_TEAM_ID } from "@/lib/pools";

export function Base({ state, onChanged, careerId }: { state: CareerState; onChanged: () => void; careerId: number }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const youth = state.players.filter((p) => p.teamId === YOUTH_TEAM_ID).sort((a, b) => b.potential - a.potential);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function promote(playerId: number) {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/careers/${careerId}/transfers`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "promote", playerId }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.error ? `⚠️ ${data.error}` : "✅ Promovido ao elenco principal!");
    onChanged();
  }

  async function trainYouth() {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/careers/${careerId}/training`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "trainYouth" }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.error ? `⚠️ ${data.error}` : `✅ Treino aplicado! ${data.evolved} jovem(ns) evoluíram.`);
    onChanged();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <h2 className="text-lg font-bold">🏫 Categoria de Base — {me.name}</h2>
        {youth.length > 0 && (
          <button disabled={busy} onClick={trainYouth} className="btn-primary px-3 py-1.5 rounded-lg text-sm">
            🏋️ Treinar Base (R$300K)
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-4">Jovens da base evoluem com treino. Promova os talentos para o elenco principal quando estiverem prontos.</p>
      {msg && <div className="mb-3 text-sm">{msg}</div>}
      {youth.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhum jogador na base no momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {youth.map((p) => {
            const ovr = overall(p);
            const room = p.potential - ovr;
            return (
              <div key={p.id} className="bg-slate-800/60 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[p.position] ?? ""}`}>{p.position}</span>
                  <span className="font-semibold flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-slate-400">{p.idade} anos</span>
                </div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <div>OVR <b className={ovrColor(ovr)}>{ovr}</b></div>
                  <div>Pot. <b className={ovrColor(p.potential)}>{p.potential}</b> {room > 0 && <span className="text-emerald-400 text-xs">+{room}</span>}</div>
                </div>
                <button disabled={busy} onClick={() => promote(p.id)}
                  className="mt-3 w-full btn-primary py-2 rounded-lg text-sm">
                  Promover ao Elenco
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
