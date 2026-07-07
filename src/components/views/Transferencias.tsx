"use client";

import { useState } from "react";
import { CareerState, TeamT, PlayerT } from "@/lib/types";
import { overall, marketValue } from "@/lib/engine";
import { POS_COLOR, ovrColor } from "@/lib/utils";
import { Shirt } from "@/components/Shirt";
import { fmtMoney } from "@/lib/currency";

const POS_FILTERS = ["Todas", "GOL", "ZAG", "LAT", "VOL", "MEI", "ATA"];

export function Transferencias({
  state,
  onChanged,
  careerId,
}: {
  state: CareerState;
  onChanged: () => void;
  careerId: number;
}) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const cur = state.career.currency;
  const [tab, setTab] = useState<"mercado" | "livres" | "meu">("mercado");
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("Todas");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const teamName = (id: number) => state.teams.find((t) => t.id === id);
  const [negoc, setNegoc] = useState<PlayerT | null>(null);

  async function act(action: string, playerId: number, price?: number) {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/careers/${careerId}/transfers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, playerId, price }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) setMsg(`⚠️ ${data.error}`);
    else if (action === "buy") setMsg(`✅ Contratado por ${fmtMoney(data.price, cur)}!`);
    else if (action === "loanIn") setMsg(`✅ Contratado por empréstimo (taxa ${fmtMoney(data.price, cur)})!`);
    else if (action === "returnLoan") setMsg("✅ Jogador devolvido ao clube dono.");
    else if (action === "sell") setMsg(`✅ Vendido por ${fmtMoney(data.value, cur)}!`);
    else if (action === "sign") setMsg("✅ Agente livre contratado sem custo!");
    else if (action === "release") setMsg("✅ Jogador dispensado (vira agente livre).");
    else setMsg("✅ Feito!");
    onChanged();
  }

  // Envia uma oferta com valor customizado. Retorna dados p/ o modal (aceita/recusa/contraproposta).
  async function sendOffer(playerId: number, amount: number) {
    const res = await fetch(`/api/careers/${careerId}/transfers`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "offer", playerId, amount }),
    });
    const data = await res.json();
    if (data.ok) { onChanged(); }
    return data as { ok?: boolean; rejected?: boolean; counter?: number; error?: string; price?: number };
  }

  const buyPrice = (p: PlayerT) =>
    p.transferListed && p.askingPrice > 0 ? p.askingPrice : Math.round(marketValue(p) * 1.3);

  function applyFilters(list: PlayerT[]) {
    let r = list;
    if (posFilter !== "Todas") r = r.filter((p) => p.position === posFilter);
    if (search.trim()) r = r.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return r;
  }

  let market = applyFilters(state.players.filter((p) => p.teamId !== me.id && p.teamId !== 0));
  market.sort((a, b) => {
    if (a.transferListed !== b.transferListed) return a.transferListed ? -1 : 1;
    return overall(b) - overall(a);
  });
  market = market.slice(0, 60);

  const freeAgents = applyFilters(state.players.filter((p) => p.teamId === 0)).sort(
    (a, b) => overall(b) - overall(a)
  );

  const myPlayers = state.players
    .filter((p) => p.teamId === me.id)
    .sort((a, b) => overall(b) - overall(a));

  const TabBtn = ({ k, label, badge }: { k: typeof tab; label: string; badge?: number }) => (
    <button
      onClick={() => setTab(k)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
        tab === k ? "bg-emerald-500 text-slate-900" : "bg-slate-800 hover:bg-slate-700"
      }`}
    >
      {label}
      {badge !== undefined && (
        <span className={`text-[10px] px-1.5 rounded-full ${tab === k ? "bg-slate-900/20" : "bg-white/10"}`}>{badge}</span>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <TabBtn k="mercado" label="Mercado" />
          <TabBtn k="livres" label="Agentes Livres" badge={freeAgents.length} />
          <TabBtn k="meu" label="Meu Elenco" badge={myPlayers.length} />
        </div>
        <div className="text-sm">Caixa: <b className="text-emerald-400">{fmtMoney(me.saldo, cur)}</b></div>
      </div>

      {msg && <div className="bg-slate-800/80 rounded-lg px-4 py-2 text-sm">{msg}</div>}

      {(tab === "mercado" || tab === "livres") && (
        <div className="card p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              placeholder="Buscar jogador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 rounded-lg px-3 py-2 text-sm outline-none flex-1 min-w-40"
            />
            <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)} className="bg-slate-800 rounded-lg px-3 py-2 text-sm">
              {POS_FILTERS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          {tab === "livres" && (
            <p className="text-xs text-slate-500 mb-2">
              🆓 Agentes livres não pertencem a nenhum clube — contrate de graça (só ocupa vaga no elenco).
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-white/10">
                  <th className="text-left py-2 pl-2">Pos</th>
                  <th className="text-left">Jogador</th>
                  {tab === "mercado" && <th className="text-left">Clube</th>}
                  <th className="text-center">OVR</th>
                  <th className="text-center">Idade</th>
                  <th className="text-right">{tab === "livres" ? "Valor" : "Preço"}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(tab === "mercado" ? market : freeAgents).map((p) => {
                  const club = teamName(p.teamId);
                  const price = buyPrice(p);
                  return (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-1.5 pl-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[p.position] ?? ""}`}>{p.position}</span>
                      </td>
                      <td className="font-medium">
                        {p.transferListed && <span className="text-yellow-400 mr-1" title="Listado">◆</span>}
                        {p.name}
                      </td>
                      {tab === "mercado" && (
                        <td className="text-slate-400">
                          <div className="flex items-center gap-1">
                            {club && <Shirt cor1={club.cor1} cor2={club.cor2} padrao={club.padrao} size={16} badge={club.badge} sigla={club.sigla} />}
                            <span className="text-xs">{club?.sigla}</span>
                          </div>
                        </td>
                      )}
                      <td className={`text-center font-bold ${ovrColor(overall(p))}`}>{overall(p)}</td>
                      <td className="text-center text-slate-400">{p.idade}</td>
                      <td className="text-right text-slate-300">
                        {tab === "livres" ? fmtMoney(marketValue(p), cur) : fmtMoney(price, cur)}
                      </td>
                      <td className="text-right pr-2">
                        {tab === "livres" ? (
                          <button
                            disabled={busy}
                            onClick={() => act("sign", p.id)}
                            className="btn-primary px-3 py-1 rounded-lg text-xs"
                          >
                            Contratar Grátis
                          </button>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <button
                              disabled={busy}
                              onClick={() => act("loanIn", p.id)}
                              className="btn-ghost px-2 py-1 text-xs"
                              title="Pegar por empréstimo (taxa baixa, por 1 temporada)"
                            >
                              Emprestar
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => setNegoc(p)}
                              className="btn-primary px-3 py-1 rounded-lg text-xs"
                            >
                              Negociar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(tab === "mercado" ? market : freeAgents).length === 0 && (
                  <tr><td colSpan={7} className="text-center text-slate-500 py-6">Nenhum jogador encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "meu" && (
        <div className="card p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-white/10">
                  <th className="text-left py-2 pl-2">Pos</th>
                  <th className="text-left">Jogador</th>
                  <th className="text-center">OVR</th>
                  <th className="text-center">Idade</th>
                  <th className="text-right">Valor</th>
                  <th className="text-center">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {myPlayers.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-1.5 pl-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[p.position] ?? ""}`}>{p.position}</span>
                    </td>
                    <td className="font-medium">{p.name}</td>
                    <td className={`text-center font-bold ${ovrColor(overall(p))}`}>{overall(p)}</td>
                    <td className="text-center text-slate-400">{p.idade}</td>
                    <td className="text-right text-slate-300">{fmtMoney(marketValue(p), cur)}</td>
                    <td className="text-center text-xs">
                      {p.loanFrom > 0 ? <span className="text-sky-400">Emprestado</span> : p.transferListed ? <span className="text-yellow-400">Listado</span> : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="text-right pr-2 space-x-1 whitespace-nowrap">
                      {p.loanFrom > 0 ? (
                        <button disabled={busy} onClick={() => act("returnLoan", p.id)} className="bg-sky-600/70 hover:bg-sky-600 px-2 py-1 rounded-lg text-xs">Devolver</button>
                      ) : (
                        <>
                          {p.transferListed ? (
                            <button disabled={busy} onClick={() => act("unlist", p.id)} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-lg text-xs">Retirar</button>
                          ) : (
                            <button disabled={busy} onClick={() => act("list", p.id)} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-lg text-xs">Listar</button>
                          )}
                          <button disabled={busy} onClick={() => act("sell", p.id)} className="bg-red-500/80 hover:bg-red-500 px-2 py-1 rounded-lg text-xs font-semibold">Vender</button>
                          <button disabled={busy} onClick={() => act("release", p.id)} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-lg text-xs">Dispensar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {negoc && (
        <NegociarModal
          player={negoc}
          club={teamName(negoc.teamId)}
          cur={cur}
          saldo={me.saldo}
          onClose={() => setNegoc(null)}
          onSend={sendOffer}
        />
      )}
    </div>
  );
}

function NegociarModal({
  player, club, cur, saldo, onClose, onSend,
}: {
  player: PlayerT;
  club?: TeamT;
  cur: string;
  saldo: number;
  onClose: () => void;
  onSend: (playerId: number, amount: number) => Promise<{ ok?: boolean; rejected?: boolean; counter?: number; error?: string; price?: number }>;
}) {
  const value = marketValue(player);
  const [amount, setAmount] = useState(Math.round(value * 1.1));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [done, setDone] = useState(false);

  async function submit() {
    if (amount > saldo) { setFeedback("⚠️ Você não tem caixa para essa oferta."); return; }
    setBusy(true); setFeedback("");
    const r = await onSend(player.id, amount);
    setBusy(false);
    if (r.ok) { setFeedback(`✅ Proposta aceita! ${player.name} é seu por ${fmtMoney(r.price ?? amount, cur)}.`); setDone(true); }
    else if (r.rejected && r.counter) { setFeedback(`❌ Recusado. O ${club?.name ?? "clube"} pede ~${fmtMoney(r.counter, cur)}.`); if (r.counter <= saldo) setAmount(r.counter); }
    else setFeedback(`⚠️ ${r.error ?? "Recusado."}`);
  }

  const pct = Math.round((amount / Math.max(1, value)) * 100);
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">Negociar</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          {club && <Shirt cor1={club.cor1} cor2={club.cor2} padrao={club.padrao} size={28} badge={club.badge} sigla={club.sigla} />}
          <div>
            <div className="font-semibold">{player.name}</div>
            <div className="text-xs text-slate-400">{player.position} · {overall(player)} OVR · {player.idade} anos · {club?.name}</div>
          </div>
        </div>
        <div className="text-sm text-slate-300 mb-1">Valor de mercado: <b>{fmtMoney(value, cur)}</b></div>
        <label className="text-xs text-slate-400">Sua oferta ({pct}% do valor)</label>
        <input
          type="range" min={Math.round(value * 0.5)} max={Math.round(value * 2.5)} step={Math.max(50_000, Math.round(value * 0.02))}
          value={amount} onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full my-2 accent-emerald-500"
        />
        <input
          type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
          className="field w-full px-3 py-2 text-sm mb-1"
        />
        <div className="text-xs text-slate-500 mb-3">Seu caixa: {fmtMoney(saldo, cur)}</div>
        {feedback && <div className="text-sm mb-3">{feedback}</div>}
        {!done ? (
          <button disabled={busy} onClick={submit} className="btn-primary w-full py-2.5 rounded-lg">
            {busy ? "Enviando..." : `Oferecer ${fmtMoney(amount, cur)}`}
          </button>
        ) : (
          <button onClick={onClose} className="btn-ghost w-full py-2.5 rounded-lg">Fechar</button>
        )}
      </div>
    </div>
  );
}
