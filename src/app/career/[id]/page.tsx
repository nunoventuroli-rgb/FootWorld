"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { CareerState, TeamT } from "@/lib/types";
import { formatMoney, MORALE_LABEL, MORALE_COLOR } from "@/lib/engine";
import { fmtMoney, CURRENCIES } from "@/lib/currency";
import { seasonLabel } from "@/lib/season";
import { standings } from "@/lib/utils";
import { Shirt } from "@/components/Shirt";
import { MatchDetail } from "@/components/MatchDetail";
import { StandingsTable } from "@/components/StandingsTable";
import { LigaView } from "@/components/views/LigaView";
import { Painel } from "@/components/views/Painel";
import { Elenco } from "@/components/views/Elenco";
import { Taticas } from "@/components/views/Taticas";
import { Treinamento } from "@/components/views/Treinamento";
import { Transferencias } from "@/components/views/Transferencias";
import { Olheiros } from "@/components/views/Olheiros";
import { Base } from "@/components/views/Base";
import { Emails } from "@/components/views/Emails";
import { Agenda } from "@/components/views/Agenda";
import { Personalizar } from "@/components/views/Personalizar";
import { Copa } from "@/components/views/Copa";
import { Estatisticas } from "@/components/views/Estatisticas";
import { Trofeus } from "@/components/views/Trofeus";
import { Diretoria } from "@/components/views/Diretoria";
import { Selecao } from "@/components/views/Selecao";
import { ChampionScreen } from "@/components/ChampionScreen";

const TABS = [
  { key: "painel", label: "Painel", icon: "🏠" },
  { key: "elenco", label: "Elenco", icon: "👥" },
  { key: "taticas", label: "Táticas", icon: "📋" },
  { key: "treinamento", label: "Treinamento", icon: "🏋️" },
  { key: "transferencias", label: "Transferências", icon: "🔁" },
  { key: "olheiros", label: "Olheiros", icon: "🔍" },
  { key: "base", label: "Base", icon: "🏫" },
  { key: "personalizar", label: "Personalizar", icon: "🎨" },
  { key: "emails", label: "E-mails", icon: "✉️" },
  { key: "financas", label: "Finanças", icon: "💰" },
  { key: "diretoria", label: "Diretoria", icon: "🏛️" },
  { key: "competicoes", label: "Liga", icon: "🏆" },
  { key: "copa", label: "Copa", icon: "🥇" },
  { key: "selecao", label: "Seleção", icon: "🌎" },
  { key: "trofeus", label: "Troféus", icon: "🏆" },
  { key: "estatisticas", label: "Estatísticas", icon: "📈" },
  { key: "agenda", label: "Agenda", icon: "📅" },
];

type SimResult = { round: number; homeId: number; awayId: number; homeGoals: number; awayGoals: number };

export default function CareerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const careerId = Number(id);
  const [state, setState] = useState<CareerState | null>(null);
  const [tab, setTab] = useState("painel");
  const [simming, setSimming] = useState(false);
  const [modal, setModal] = useState<SimResult[] | null>(null);
  const [matchDetailId, setMatchDetailId] = useState<number | null>(null);
  const [saveFlash, setSaveFlash] = useState(false);
  const [champDismissed, setChampDismissed] = useState(false);

  async function load() {
    const res = await fetch(`/api/careers/${careerId}`);
    const data = await res.json();
    if (data.career) setState(data);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerId]);

  // reabilita a tela de campeão quando uma nova temporada está em andamento
  useEffect(() => {
    if (state && state.career.currentRound < state.totalRounds) setChampDismissed(false);
  }, [state]);

  async function simulate(toEnd: boolean) {
    setSimming(true);
    const res = await fetch(`/api/careers/${careerId}/simulate`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toEnd }),
    });
    const data = await res.json();
    setSimming(false);
    if (data.results && state) {
      const lastRound = data.playedRounds?.[data.playedRounds.length - 1];
      const myDiv = state.teams.find((t) => t.id === state.career.controlledTeamId)?.division;
      // só jogos da MINHA divisão nesta rodada (não misturar as ligas do mundo)
      const shown: SimResult[] = (data.results as SimResult[]).filter((r) => {
        if (r.round !== lastRound) return false;
        const h = state.teams.find((t) => t.id === r.homeId);
        return h && h.division === myDiv;
      });
      setModal(shown.length ? shown : null);
    }
    await load();
  }

  // "Save" — the game auto-persists to the DB on every action, so this simply confirms & touches the record.
  async function saveGame() {
    await fetch(`/api/careers/${careerId}/simulate`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toEnd: false, saveOnly: true }),
    }).catch(() => {});
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
  }

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-emerald-400 animate-spin" />
        Carregando carreira...
      </div>
    );
  }

  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const myDivTeams = state.teams.filter((t) => t.id > 0 && t.division === me.division);
  const myPos = standings(myDivTeams).findIndex((t) => t.id === me.id) + 1;
  const nextMatch = state.matches
    .filter((m) => !m.played && (m.homeTeamId === me.id || m.awayTeamId === me.id))
    .sort((a, b) => a.round - b.round)[0];
  const nextOpp = nextMatch
    ? state.teams.find((t) => t.id === (nextMatch.homeTeamId === me.id ? nextMatch.awayTeamId : nextMatch.homeTeamId))
    : null;
  const seasonOver = state.career.currentRound >= state.totalRounds;
  const teamById = (tid: number) => state.teams.find((t) => t.id === tid) as TeamT;
  const unread = (state.emails ?? []).filter((e) => !e.read).length;
  const pendingOffers = (state.emails ?? []).filter((e) => e.type === "offer" && e.offerStatus === "pending").length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* top bar */}
      <header className="glass border-b border-white/10 px-4 py-2.5 flex items-center gap-3 flex-wrap sticky top-0 z-20">
        <Link href="/" className="btn-ghost px-2.5 py-1.5 text-sm">← Menu</Link>
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center overflow-hidden">
          <Shirt cor1={me.cor1} cor2={me.cor2} padrao={me.padrao} size={30} badge={me.badge} sigla={me.sigla} />
        </div>
        <div className="mr-auto">
          <div className="font-bold leading-tight">{me.name}</div>
          <div className="text-xs text-slate-400">Téc. {state.career.coachName} · <span className="text-amber-400">{myPos}º</span> · Temporada {seasonLabel(state.career.baseYear, state.career.season, state.career.seasonFormat)}</div>
        </div>
        <Stat label="Moral" value={<span className={MORALE_COLOR(me.morale)}>{MORALE_LABEL(me.morale)}</span>} />
        <div className="hidden sm:block w-px h-8 bg-white/10" />
        <Stat label="Caixa" value={<span className="text-emerald-400">{fmtMoney(me.saldo, state.career.currency)}</span>} />
        <div className="hidden sm:block w-px h-8 bg-white/10" />
        <Stat label="Rodada" value={`${state.career.currentRound}/${state.totalRounds}`} />
        {nextOpp && !seasonOver && (
          <div className="hidden md:flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Próximo</span>
            <Shirt cor1={nextOpp.cor1} cor2={nextOpp.cor2} padrao={nextOpp.padrao} size={18} badge={nextOpp.badge} sigla={nextOpp.sigla} />
            <span className="text-sm font-semibold">{nextOpp.sigla}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={saveGame} className="btn-ghost px-3 py-2 text-sm font-semibold">
            {saveFlash ? "✓ Salvo" : "💾 Salvar"}
          </button>
          <button onClick={() => simulate(false)} disabled={simming || seasonOver}
            className="btn-primary px-4 py-2 text-sm">
            {simming ? "..." : "▶ Avançar"}
          </button>
          <button onClick={() => simulate(true)} disabled={simming || seasonOver}
            className="btn-ghost px-3 py-2 text-sm font-semibold disabled:opacity-40">⏭ Fim</button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* sidebar */}
        <nav className="w-16 lg:w-56 glass border-r border-white/10 p-2 lg:p-3 flex flex-col gap-1 shrink-0">
          {TABS.map((t) => {
            const badge = t.key === "emails" ? unread : 0;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-3 rounded-xl px-2 lg:px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-emerald-500/25 to-emerald-500/5 text-emerald-300 border border-emerald-400/30"
                    : "text-slate-300 hover:bg-white/5 border border-transparent"
                }`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-emerald-400" />}
                <span className="text-lg" title={t.label}>{t.icon}</span>
                <span className="hidden lg:inline">{t.label}</span>
                {/* no mobile (sidebar estreita) mostra a inicial do nome para não confundir */}
                <span className="lg:hidden text-[9px] font-bold uppercase absolute bottom-0.5 left-0 right-0 text-center text-slate-400 leading-none">{t.label.slice(0, 4)}</span>
                {badge > 0 && (
                  <span className="absolute right-1 lg:static lg:ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* content */}
        <main className="flex-1 p-3 md:p-5 overflow-x-hidden animate-in">
          {seasonOver && (
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/40 rounded-2xl px-5 py-3.5 mb-4 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <span>Temporada encerrada! Campeão: <b>{standings(myDivTeams)[0]?.name}</b> — você terminou em <b className="text-amber-400">{myPos}º</b>.</span>
            </div>
          )}
          {pendingOffers > 0 && tab !== "emails" && (
            <button onClick={() => setTab("emails")} className="w-full text-left bg-gradient-to-r from-sky-500/20 to-sky-500/5 border border-sky-500/40 rounded-2xl px-5 py-3 mb-4 text-sm hover:from-sky-500/30 transition flex items-center gap-2">
              <span className="text-lg">💸</span>
              Você tem <b>{pendingOffers}</b> proposta(s) pendente(s) por seus jogadores. Ver na caixa de entrada →
            </button>
          )}
          {tab === "painel" && <Painel state={state} />}
          {tab === "elenco" && <Elenco state={state} onChanged={load} careerId={careerId} />}
          {tab === "taticas" && <Taticas state={state} onChanged={load} careerId={careerId} />}
          {tab === "treinamento" && <Treinamento state={state} onChanged={load} careerId={careerId} />}
          {tab === "transferencias" && <Transferencias state={state} onChanged={load} careerId={careerId} />}
          {tab === "olheiros" && <Olheiros state={state} onChanged={load} careerId={careerId} />}
          {tab === "base" && <Base state={state} onChanged={load} careerId={careerId} />}
          {tab === "personalizar" && <Personalizar state={state} onChanged={load} careerId={careerId} />}
          {tab === "emails" && <Emails state={state} onChanged={load} careerId={careerId} />}
          {tab === "agenda" && <Agenda state={state} />}
          {tab === "competicoes" && <LigaView state={state} />}
          {tab === "copa" && <Copa state={state} />}
          {tab === "selecao" && <Selecao state={state} careerId={careerId} onChanged={load} />}
          {tab === "diretoria" && <Diretoria state={state} careerId={careerId} onChanged={load} />}
          {tab === "trofeus" && <Trofeus state={state} />}
          {tab === "estatisticas" && <Estatisticas state={state} />}
          {tab === "financas" && <Financas state={state} me={me} careerId={careerId} onChanged={load} />}
        </main>
      </div>

      {seasonOver && !champDismissed && (
        <ChampionScreen
          state={state}
          careerId={careerId}
          onNewSeason={async () => { setChampDismissed(true); await load(); }}
        />
      )}

      {modal && (() => {
        const round = modal[0]?.round;
        const myResult = modal.find((r) => r.homeId === me.id || r.awayId === me.id);
        const others = modal.filter((r) => r !== myResult);
        const myMatch = state.matches.find((m) => m.round === round && (m.homeTeamId === me.id || m.awayTeamId === me.id));
        const h = myResult ? teamById(myResult.homeId) : null;
        const a = myResult ? teamById(myResult.awayId) : null;
        const resultTag = myResult
          ? ((myResult.homeId === me.id ? myResult.homeGoals > myResult.awayGoals : myResult.awayGoals > myResult.homeGoals)
              ? { txt: "VITÓRIA", cls: "text-emerald-400" }
              : myResult.homeGoals === myResult.awayGoals
              ? { txt: "EMPATE", cls: "text-slate-300" }
              : { txt: "DERROTA", cls: "text-red-400" })
          : null;
        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
            <div className="card p-5 max-w-md w-full animate-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2"><span>📋</span> Rodada {round}</h3>
                <span className="text-xs text-slate-500">{state.career.leagueName}</span>
              </div>

              {/* Card grande do MEU jogo */}
              {myResult && h && a && (
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-400/30 p-4 mb-4">
                  {resultTag && <div className={`text-center text-xs font-black tracking-widest mb-2 ${resultTag.cls}`}>{resultTag.txt}</div>}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <Shirt cor1={h.cor1} cor2={h.cor2} padrao={h.padrao} size={40} badge={h.badge} sigla={h.sigla} />
                      <span className="text-xs font-semibold text-center truncate w-full">{h.name}</span>
                    </div>
                    <div className="px-3 text-3xl font-black tabular-nums">{myResult.homeGoals} - {myResult.awayGoals}</div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <Shirt cor1={a.cor1} cor2={a.cor2} padrao={a.padrao} size={40} badge={a.badge} sigla={a.sigla} />
                      <span className="text-xs font-semibold text-center truncate w-full">{a.name}</span>
                    </div>
                  </div>
                  {myMatch?.stats && (
                    <button
                      onClick={() => { setMatchDetailId(myMatch.id); setModal(null); }}
                      className="btn-ghost w-full mt-3 py-1.5 text-xs"
                    >
                      📊 Ver estatísticas da partida
                    </button>
                  )}
                </div>
              )}

              {/* Outros jogos da minha liga */}
              {others.length > 0 && (
                <>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Outros jogos da rodada</div>
                  <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                    {others.map((r, i) => {
                      const oh = teamById(r.homeId); const oa = teamById(r.awayId);
                      return (
                        <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-white/[0.03]">
                          <span className="flex-1 text-right truncate">{oh?.name}</span>
                          <span className="font-bold w-12 text-center tabular-nums">{r.homeGoals}-{r.awayGoals}</span>
                          <span className="flex-1 truncate">{oa?.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <button onClick={() => setModal(null)} className="btn-primary mt-4 w-full py-2.5">Continuar</button>
            </div>
          </div>
        );
      })()}

      {matchDetailId != null && (() => {
        const m = state.matches.find((x) => x.id === matchDetailId);
        return m ? <MatchDetail match={m} state={state} onClose={() => setMatchDetailId(null)} /> : null;
      })()}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="hidden sm:flex flex-col text-right">
      <span className="uppercase text-[10px] tracking-wide text-slate-500">{label}</span>
      <span className="text-white font-bold text-sm">{value}</span>
    </div>
  );
}

function Financas({ state, me, careerId, onChanged }: { state: CareerState; me: TeamT; careerId: number; onChanged: () => void }) {
  const myPlayers = state.players.filter((p) => p.teamId === me.id);
  const salaryEst = myPlayers.reduce((s, p) => s + Math.round((p.ataque + p.meio + p.defesa) * 500), 0);
  const c = state.career;
  const cur = c.currency || "EUR";
  const money = (v: number) => fmtMoney(v, cur);
  const moodLabel = c.boardMood >= 75 ? "Excelente" : c.boardMood >= 55 ? "Boa" : c.boardMood >= 35 ? "Estável" : "Ruim";
  const moodColor = c.boardMood >= 75 ? "text-emerald-400" : c.boardMood >= 55 ? "text-lime-400" : c.boardMood >= 35 ? "text-amber-400" : "text-red-400";
  const moodBar = c.boardMood >= 75 ? "bg-emerald-400" : c.boardMood >= 55 ? "bg-lime-400" : c.boardMood >= 35 ? "bg-amber-400" : "bg-red-500";
  const ord = (n: number) => `${n}º`;

  async function setCurrency(code: string) {
    await fetch(`/api/careers/${careerId}/customize`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "career", currency: code }),
    });
    onChanged();
  }

  return (
    <div className="grid gap-4 max-w-2xl">
      {/* Diretoria + Patrocinador */}
      <div className="card p-5">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span>🏛️</span> Diretoria & Patrocínio</h2>
        <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-300">Situação da diretoria</span>
            <span className={`font-black ${moodColor}`}>{moodLabel}</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full ${moodBar} transition-all`} style={{ width: `${c.boardMood}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Ruim</span><span>Estável</span><span>Boa</span><span>Excelente</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Meta na liga: terminar em <b className="text-white">Top {ord(c.boardTarget)}</b></div>
        </div>
        {c.sponsorName && (
          <div className="rounded-2xl p-4 bg-gradient-to-br from-sky-500/15 to-sky-500/5 border border-sky-400/20">
            <div className="text-xs text-slate-400">Patrocinador master</div>
            <div className="flex items-center justify-between">
              <div className="text-xl font-black text-sky-300">{c.sponsorName}</div>
              <div className="text-sm text-slate-300">+{money(c.sponsorPerRound)}/rodada · +{c.sponsorMorale} moral</div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-xl font-bold flex items-center gap-2"><span>💰</span> Finanças — {me.name}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Moeda:</span>
            <select value={cur} onChange={(e) => setCurrency(e.target.value)} className="field px-2 py-1 text-sm">
              {Object.values(CURRENCIES).map((x) => <option key={x.code} value={x.code}>{x.code} ({x.symbol})</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-400/20">
            <div className="text-xs text-slate-400">Caixa disponível</div>
            <div className="text-2xl font-black text-emerald-400">{money(me.saldo)}</div>
          </div>
          <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10">
            <div className="text-xs text-slate-400">Folha salarial (est.)</div>
            <div className="text-2xl font-black">{money(salaryEst)}</div>
          </div>
          <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10">
            <div className="text-xs text-slate-400">Jogadores</div>
            <div className="text-2xl font-black">{myPlayers.length}</div>
          </div>
          <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10">
            <div className="text-xs text-slate-400">Reputação</div>
            <div className="text-2xl font-black text-amber-400">{"★".repeat(me.reputation)}</div>
          </div>
        </div>
        {(me.estadio || me.pais) && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm border-t border-white/10 pt-3">
            {me.estadio && <div className="text-slate-400">🏟️ Estádio: <span className="text-white font-semibold">{me.estadio}</span></div>}
            {me.pais && <div className="text-slate-400">🌍 País: <span className="text-white font-semibold">{me.pais}</span></div>}
          </div>
        )}
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="text-xs text-slate-400 mb-2">💱 Caixa em outras moedas</div>
          <div className="flex flex-wrap gap-2">
            {Object.values(CURRENCIES).filter((x) => x.code !== cur).map((x) => (
              <span key={x.code} className="text-xs bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1">
                {x.code}: <b className="text-slate-200">{fmtMoney(me.saldo, x.code)}</b>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
