"use client";

import { useState } from "react";
import { CareerState, TeamT } from "@/lib/types";
import { overall, MORALE_COLOR } from "@/lib/engine";
import { sortByPos, POS_COLOR, ovrColor } from "@/lib/utils";
import { POS_LABEL } from "@/lib/names";

const TEAM_FOCUS = [
  { v: "geral", l: "Geral" },
  { v: "ataque", l: "Ataque" },
  { v: "meio", l: "Meio-campo" },
  { v: "defesa", l: "Defesa" },
];
const INTENSITY = [
  { v: "leve", l: "Leve" },
  { v: "normal", l: "Normal" },
  { v: "intenso", l: "Intenso" },
];
const PLAYER_FOCUS = ["auto", "ataque", "meio", "defesa"];

function Seg({ value, options, onChange }: { value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 bg-slate-800 rounded-lg p-1">
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${value === o.v ? "bg-emerald-500 text-slate-900" : "text-slate-300 hover:bg-white/5"}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function Treinamento({ state, onChanged, careerId }: { state: CareerState; onChanged: () => void; careerId: number }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const players = sortByPos(state.players.filter((p) => p.teamId === me.id));

  const [focus, setFocus] = useState(me.trainingFocus);
  const [intensity, setIntensity] = useState(me.trainingIntensity);
  const [msg, setMsg] = useState("");

  async function saveTeam(next: { trainingFocus?: string; trainingIntensity?: string }) {
    await fetch(`/api/careers/${careerId}/training`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next),
    });
    setMsg("Configuração de treino salva!");
    onChanged();
  }
  async function savePlayer(playerId: number, playerFocus: string) {
    await fetch(`/api/careers/${careerId}/training`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId, playerFocus }),
    });
    onChanged();
  }
  async function intensive(playerId: number) {
    const r = await fetch(`/api/careers/${careerId}/training`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "intensive", playerId }),
    });
    const d = await r.json();
    setMsg(d.error ? `⚠️ ${d.error}` : `✅ Estágio concluído: +${d.gain} ${d.attr}!`);
    onChanged();
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="text-lg font-bold mb-1">Treinamento da Equipe</h2>
        <p className="text-xs text-slate-500 mb-4">O foco e a intensidade afetam a evolução dos atributos a cada rodada. Jovens evoluem mais rápido; intensidade alta acelera, mas cuidado com veteranos.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-400 mb-1">Foco coletivo</div>
            <Seg value={focus} options={TEAM_FOCUS} onChange={(v) => { setFocus(v); saveTeam({ trainingFocus: v }); }} />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Intensidade</div>
            <Seg value={intensity} options={INTENSITY} onChange={(v) => { setIntensity(v); saveTeam({ trainingIntensity: v }); }} />
          </div>
        </div>
        {msg && <p className="text-emerald-400 text-sm mt-3">{msg}</p>}
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-bold mb-3">Treino Individual</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-white/10">
                <th className="text-left py-2 pl-2">Pos</th>
                <th className="text-left">Jogador</th>
                <th className="text-center">Idade</th>
                <th className="text-center">OVR</th>
                <th className="text-center">Potencial</th>
                <th className="text-center">Moral</th>
                <th className="text-left pl-4">Foco individual</th>
                <th className="text-center">Estágio</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const ovr = overall(p);
                const room = p.potential - ovr;
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-1.5 pl-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[p.position] ?? ""}`} title={POS_LABEL[p.position]}>{p.position}</span></td>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-center text-slate-400">{p.idade}</td>
                    <td className={`text-center font-bold ${ovrColor(ovr)}`}>{ovr}</td>
                    <td className="text-center">
                      <span className={ovrColor(p.potential)}>{p.potential}</span>
                      {room > 0 && <span className="text-emerald-400 text-xs ml-1">+{room}</span>}
                    </td>
                    <td className={`text-center ${MORALE_COLOR(p.morale)}`}>●</td>
                    <td className="pl-4">
                      <select value={p.trainingFocus} onChange={(e) => savePlayer(p.id, e.target.value)} className="bg-slate-800 rounded-lg px-2 py-1 text-xs outline-none">
                        {PLAYER_FOCUS.map((f) => <option key={f} value={f}>{f === "auto" ? "Automático" : f}</option>)}
                      </select>
                    </td>
                    <td className="text-center">
                      <button
                        disabled={room <= 0}
                        onClick={() => intensive(p.id)}
                        title="Estágio intensivo (pago): evolui o jogador na hora"
                        className="btn-primary px-2 py-1 rounded text-[10px] disabled:opacity-30"
                      >
                        ⚡ Intensivo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
