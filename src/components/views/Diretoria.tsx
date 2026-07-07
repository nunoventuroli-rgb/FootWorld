"use client";

import { useEffect, useState } from "react";
import { CareerState, TeamT } from "@/lib/types";
import { standings } from "@/lib/utils";
import { fmtMoney } from "@/lib/currency";
import { Shirt } from "@/components/Shirt";

type SponsorOffer = { name: string; perSeason: number; morale: number; tag: string };

export function Diretoria({ state, careerId, onChanged }: { state: CareerState; careerId: number; onChanged: () => void }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const c = state.career;
  const cur = c.currency || "EUR";

  const myDivTeams = state.teams.filter((t) => t.id > 0 && t.division === me.division);
  const pos = standings(myDivTeams).findIndex((t) => t.id === me.id) + 1;

  const mood = c.boardMood ?? 70;
  const moodLabel = mood >= 75 ? "Excelente" : mood >= 55 ? "Boa" : mood >= 35 ? "Estável" : "Ruim";
  const moodColor = mood >= 75 ? "text-emerald-400" : mood >= 55 ? "text-lime-400" : mood >= 35 ? "text-amber-400" : "text-red-400";
  const moodBar = mood >= 75 ? "bg-emerald-400" : mood >= 55 ? "bg-lime-400" : mood >= 35 ? "bg-amber-400" : "bg-red-500";

  const target = c.boardTarget ?? 10;
  const onTrack = pos > 0 && pos <= target;
  const risk = mood < 30;

  return (
    <div className="grid gap-4 max-w-2xl">
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Shirt cor1={me.cor1} cor2={me.cor2} padrao={me.padrao} size={40} badge={me.badge} sigla={me.sigla} />
          <div>
            <h2 className="text-xl font-bold">Diretoria — {me.name}</h2>
            <div className="text-xs text-slate-400">Téc. {c.coachName} · Temporada {c.season}</div>
          </div>
        </div>

        {/* Humor da diretoria */}
        <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-300">Confiança da diretoria</span>
            <span className={`font-black text-lg ${moodColor}`}>{moodLabel}</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full ${moodBar} transition-all`} style={{ width: `${mood}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Ruim</span><span>Estável</span><span>Boa</span><span>Excelente</span>
          </div>
          {risk && (
            <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              ⚠️ Você está por um fio! Melhore os resultados ou pode ser demitido.
            </div>
          )}
        </div>

        {/* Objetivo */}
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10">
            <div className="text-xs text-slate-400">Meta na liga</div>
            <div className="text-2xl font-black">Top {target}º</div>
          </div>
          <div className={`rounded-2xl p-4 border ${onTrack ? "bg-emerald-500/10 border-emerald-400/30" : "bg-amber-500/10 border-amber-400/30"}`}>
            <div className="text-xs text-slate-400">Posição atual</div>
            <div className={`text-2xl font-black ${onTrack ? "text-emerald-400" : "text-amber-400"}`}>
              {pos > 0 ? `${pos}º` : "—"} {onTrack ? "✓" : ""}
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-400">
          {onTrack
            ? "👍 Você está cumprindo a expectativa da diretoria. Continue assim!"
            : "📉 Você está abaixo da meta. A diretoria espera melhora até o fim da temporada."}
        </p>
      </div>

      {/* Patrocínio */}
      <SponsorPanel state={state} careerId={careerId} onChanged={onChanged} />
    </div>
  );
}

function SponsorPanel({ state, careerId, onChanged }: { state: CareerState; careerId: number; onChanged: () => void }) {
  const c = state.career;
  const cur = c.currency || "EUR";
  const [offers, setOffers] = useState<SponsorOffer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/careers/${careerId}/sponsors`).then((r) => r.json()).then((d) => setOffers(d.offers ?? [])).catch(() => {});
  }, [careerId]);

  async function accept(o: SponsorOffer) {
    setBusy(true); setMsg("");
    const r = await fetch(`/api/careers/${careerId}/sponsors`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: o.name, perSeason: o.perSeason, morale: o.morale }),
    });
    const d = await r.json();
    setBusy(false);
    setMsg(d.error ? `⚠️ ${d.error}` : `✅ Acordo fechado com ${o.name}!`);
    onChanged();
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2">💼 Patrocínio</h3>
      {c.sponsorName ? (
        <div className="rounded-2xl p-4 bg-gradient-to-br from-sky-500/15 to-sky-500/5 border border-sky-400/20 mb-4">
          <div className="text-xs text-slate-400">Patrocinador atual</div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-black text-sky-300">{c.sponsorName}</div>
            <div className="text-sm text-slate-300 text-right">
              +{fmtMoney(c.sponsorPerRound, cur)}/rodada<br />
              <span className="text-emerald-400">+{c.sponsorMorale} moral</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400 mb-3">Sem patrocinador. Escolha uma oferta abaixo.</p>
      )}

      {msg && <div className="text-sm mb-3">{msg}</div>}

      <div className="text-xs text-slate-400 mb-2">Ofertas disponíveis (escolha uma):</div>
      <div className="grid sm:grid-cols-3 gap-3">
        {(offers ?? []).map((o, i) => (
          <div key={i} className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 flex flex-col">
            <div className="font-bold text-sky-300">{o.name}</div>
            <div className="text-[10px] uppercase text-slate-500 mb-2">{o.tag}</div>
            <div className="text-sm text-slate-300">{fmtMoney(o.perSeason, cur)}/ano</div>
            <div className="text-xs text-emerald-400 mb-3">+{o.morale} moral</div>
            <button disabled={busy} onClick={() => accept(o)} className="btn-primary mt-auto py-2 rounded-lg text-sm">
              Fechar acordo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
