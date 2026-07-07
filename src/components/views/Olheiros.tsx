"use client";

import { useState } from "react";
import { CareerState, TeamT } from "@/lib/types";
import { overall, marketValue, formatMoney } from "@/lib/engine";
import { POS_COLOR, ovrColor } from "@/lib/utils";
import { SCOUTED_TEAM_ID } from "@/lib/pools";

const SCOUTS = [
  { type: "base", label: "Olheiro de Base", desc: "Jovens de 15-18 anos, nível baixo mas alto potencial.", cost: 500_000, icon: "🌱" },
  { type: "nacional", label: "Olheiro Nacional", desc: "Jogadores de 18-24 anos, prontos para o elenco.", cost: 2_000_000, icon: "🔍" },
  { type: "internacional", label: "Olheiro Internacional", desc: "Craques de 20-29 anos, caros mas de altíssimo nível.", cost: 6_000_000, icon: "🌎" },
];

export function Olheiros({ state, onChanged, careerId }: { state: CareerState; onChanged: () => void; careerId: number }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const scouted = state.players.filter((p) => p.teamId === SCOUTED_TEAM_ID).sort((a, b) => b.potential - a.potential);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function scout(type: string) {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/careers/${careerId}/scouts`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.error ? `⚠️ ${data.error}` : `✅ Olheiro trouxe ${data.found} jogador(es)!`);
    onChanged();
  }
  async function sign(playerId: number) {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/careers/${careerId}/transfers`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "signScout", playerId }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(data.error ? `⚠️ ${data.error}` : `✅ Contratado por $${formatMoney(data.price)}!`);
    onChanged();
  }
  async function clearList() {
    await fetch(`/api/careers/${careerId}/scouts`, { method: "DELETE" });
    onChanged();
  }

  const fee = (p: (typeof scouted)[number]) => Math.max(200_000, Math.round(marketValue(p) * 0.6));

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Departamento de Olheiros</h2>
          <div className="text-sm">Caixa: <b className="text-emerald-400">${formatMoney(me.saldo)}</b></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {SCOUTS.map((s) => (
            <div key={s.type} className="bg-slate-800/60 rounded-xl p-4 flex flex-col">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="font-bold">{s.label}</div>
              <div className="text-xs text-slate-400 flex-1 mt-1">{s.desc}</div>
              <div className="text-sm text-emerald-400 font-bold mt-3">${formatMoney(s.cost)}</div>
              <button disabled={busy || me.saldo < s.cost} onClick={() => scout(s.type)}
                className="mt-2 btn-primary py-2 rounded-lg text-sm">
                Enviar Olheiro
              </button>
            </div>
          ))}
        </div>
        {msg && <div className="mt-3 text-sm">{msg}</div>}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Jogadores Observados ({scouted.length})</h3>
          {scouted.length > 0 && <button onClick={clearList} className="text-slate-400 hover:text-white text-xs">Limpar lista</button>}
        </div>
        {scouted.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum jogador observado ainda. Envie um olheiro acima.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-white/10">
                  <th className="text-left py-2 pl-2">Pos</th>
                  <th className="text-left">Jogador</th>
                  <th className="text-center">Idade</th>
                  <th className="text-center">OVR</th>
                  <th className="text-center">Potencial</th>
                  <th className="text-right">Custo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scouted.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-1.5 pl-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[p.position] ?? ""}`}>{p.position}</span></td>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-center text-slate-400">{p.idade}</td>
                    <td className={`text-center font-bold ${ovrColor(overall(p))}`}>{overall(p)}</td>
                    <td className={`text-center font-bold ${ovrColor(p.potential)}`}>{p.potential}</td>
                    <td className="text-right text-slate-300">${formatMoney(fee(p))}</td>
                    <td className="text-right pr-2">
                      <button disabled={busy || me.saldo < fee(p)} onClick={() => sign(p.id)}
                        className="btn-primary px-3 py-1 rounded-lg text-xs">
                        Contratar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
