"use client";

import { useMemo, useState } from "react";
import { CareerState, PlayerT } from "@/lib/types";
import { overall } from "@/lib/engine";
import { POS_COLOR, ovrColor } from "@/lib/utils";

type NationTeam = { pais: string; players: PlayerT[]; rating: number };
type WCData = {
  rounds: { a: string; b: string; ga: number; gb: number; winner: string }[][];
  champion: string | null;
  ratings: Record<string, number>;
  myTeam: string;
};

function buildXI(players: PlayerT[]): { xi: PlayerT[]; rating: number } {
  const need: Record<string, number> = { GOL: 1, ZAG: 2, LAT: 2, VOL: 2, MEI: 2, ATA: 2 };
  const byPos: Record<string, PlayerT[]> = {};
  for (const p of players) (byPos[p.position] ||= []).push(p);
  for (const k in byPos) byPos[k].sort((a, b) => overall(b) - overall(a));
  const xi: PlayerT[] = [];
  for (const pos in need) {
    const list = byPos[pos] ?? [];
    for (let i = 0; i < need[pos] && i < list.length; i++) xi.push(list[i]);
  }
  const used = new Set(xi.map((p) => p.id));
  const rest = players.filter((p) => !used.has(p.id)).sort((a, b) => overall(b) - overall(a));
  while (xi.length < 11 && rest.length) xi.push(rest.shift()!);
  const rating = xi.length ? Math.round(xi.reduce((s, p) => s + overall(p), 0) / xi.length) : 0;
  return { xi, rating };
}

const faseNome = (n: number) => ({ 2: "Final", 4: "Semifinal", 8: "Quartas", 16: "Oitavas" }[n] ?? `Fase de ${n}`);

export function Selecao({ state, careerId, onChanged }: { state: CareerState; careerId: number; onChanged: () => void }) {
  const c = state.career;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const nations: NationTeam[] = useMemo(() => {
    const byCountry: Record<string, PlayerT[]> = {};
    for (const p of state.players) {
      if (p.teamId <= 0) continue;
      const team = state.teams.find((t) => t.id === p.teamId);
      const pais = team?.pais || "Sem país";
      (byCountry[pais] ||= []).push(p);
    }
    return Object.entries(byCountry)
      .filter(([pais, ps]) => pais !== "Sem país" && ps.length >= 11)
      .map(([pais, ps]) => { const { xi, rating } = buildXI(ps); return { pais, players: xi, rating }; })
      .sort((a, b) => b.rating - a.rating);
  }, [state]);

  // convites de seleção pendentes na caixa de entrada
  const invites = (state.emails ?? []).filter((e) => e.type === "nationalteam");
  const myNation = c.nationalTeam;
  const myNationData = nations.find((n) => n.pais === myNation);

  let wc: WCData | null = null;
  try { wc = c.worldCup ? (JSON.parse(c.worldCup) as WCData) : null; } catch { wc = null; }

  const teamByPais = (pais: string) => nations.find((n) => n.pais === pais);

  async function call(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true); setMsg("");
    const r = await fetch(`/api/careers/${careerId}/national`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.error) setMsg(`⚠️ ${d.error}`);
    else if (action === "accept") setMsg(`✅ Você agora comanda a seleção de ${d.pais}!`);
    else if (action === "playWorldCup") setMsg(d.champion ? `🏆 Copa do Mundo encerrada! Campeão: ${d.champion}` : "Copa disputada.");
    onChanged();
  }

  const [selInvite, setSelInvite] = useState<string>("");
  const inviteCountries = ["Brasil", "Argentina", "Inglaterra", "Espanha", "Itália", "Alemanha", "França", "Portugal"];

  return (
    <div className="space-y-4">
      {msg && <div className="card px-4 py-2 text-sm">{msg}</div>}

      {/* Comando da seleção */}
      <div className="card p-5">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">🌎 Seleção Nacional</h2>
        {myNation ? (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs text-slate-400">Você comanda</div>
                <div className="text-2xl font-black text-emerald-400">{myNation}</div>
                {myNationData && <div className="text-sm text-slate-400">Força do time: <b className={ovrColor(myNationData.rating)}>{myNationData.rating}</b></div>}
              </div>
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => call("playWorldCup")} className="btn-primary px-4 py-2 rounded-lg text-sm">
                  {wc?.champion ? "Nova Copa do Mundo" : "Disputar Copa do Mundo"}
                </button>
                <button disabled={busy} onClick={() => call("resign")} className="btn-ghost px-3 py-2 rounded-lg text-sm">Renunciar</button>
              </div>
            </div>
            {/* elenco da minha seleção */}
            {myNationData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-4">
                {myNationData.players.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-2 py-1.5 text-sm">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[p.position] ?? ""}`}>{p.position}</span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className={`font-bold ${ovrColor(overall(p))}`}>{overall(p)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : invites.length > 0 ? (
          <div>
            <p className="text-sm text-slate-300 mb-3">📩 Você recebeu convite(s) para comandar uma seleção. Aceite abaixo:</p>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={selInvite} onChange={(e) => setSelInvite(e.target.value)} className="field px-3 py-2 text-sm">
                <option value="">Escolha um país...</option>
                {inviteCountries.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <button disabled={busy || !selInvite} onClick={() => call("accept", { pais: selInvite })} className="btn-primary px-4 py-2 rounded-lg text-sm">
                Aceitar convite
              </button>
            </div>
            <div className="mt-3 space-y-1">
              {invites.slice(0, 3).map((e) => (
                <div key={e.id} className="text-xs text-slate-400">• {e.subject}</div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Você ainda não recebeu convite para comandar uma seleção. Tenha bom desempenho no clube (muitas vitórias) para ser convidado — o convite chega na sua caixa de entrada.
          </p>
        )}
      </div>

      {/* Copa do Mundo */}
      {wc && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">🏆 Copa do Mundo</h3>
            {wc.champion && (
              <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 rounded-full px-3 py-1.5">
                <span>🏆</span>
                <span className="font-black">{wc.champion}{wc.champion === wc.myTeam ? " (VOCÊ!)" : ""}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {wc.rounds.map((round, ri) => (
              <div key={ri} className="min-w-[190px] flex-1">
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-2 text-center">{faseNome(round.length * 2)}</div>
                <div className="space-y-2">
                  {round.map((m, mi) => (
                    <div key={mi} className={`rounded-xl p-2 border text-sm ${m.a === wc!.myTeam || m.b === wc!.myTeam ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                      <Row name={m.a} g={m.ga} win={m.winner === m.a} me={m.a === wc!.myTeam} />
                      <Row name={m.b} g={m.gb} win={m.winner === m.b} me={m.b === wc!.myTeam} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranking de seleções */}
      <div className="card p-5">
        <h3 className="font-bold mb-3">Ranking de Seleções</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {nations.map((n, i) => (
            <div key={n.pais} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${n.pais === myNation ? "bg-emerald-500/10 border border-emerald-400/30" : "bg-white/[0.03]"}`}>
              <span className="text-slate-500 text-sm w-5">{i + 1}</span>
              <span className="flex-1 truncate text-sm">{n.pais}</span>
              <span className={`font-bold ${ovrColor(n.rating)}`}>{n.rating}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ name, g, win, me }: { name: string; g: number; win: boolean; me: boolean }) {
  return (
    <div className={`flex items-center justify-between py-0.5 ${win ? "font-bold" : "text-slate-400"}`}>
      <span className="truncate">{name}{me ? " ●" : ""}</span>
      <span className="tabular-nums">{g}</span>
    </div>
  );
}
