"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shirt } from "@/components/Shirt";
import { formatMoney } from "@/lib/engine";
import { PatchData, PatchTeamDef } from "@/lib/data";

type CareerRow = {
  id: number;
  coachName: string;
  teamName: string;
  season: number;
  currentRound: number;
  updatedAt: string;
  team: { cor1: string; cor2: string; padrao: string; badge: string } | null;
};

type PatchRow = {
  id: number;
  name: string;
  author: string;
  isDefault: boolean;
  data: PatchData;
};

export default function Home() {
  const router = useRouter();
  const [careers, setCareers] = useState<CareerRow[]>([]);
  const [patches, setPatches] = useState<PatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [coach, setCoach] = useState("");
  const [coachAge, setCoachAge] = useState(45);
  const [coachNation, setCoachNation] = useState("Brasil");
  const [patchId, setPatchId] = useState<number | null>(null);
  const [leagueIdx, setLeagueIdx] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadData() {
    setLoading(true);
    const [cr, pt] = await Promise.all([
      fetch("/api/careers").then((r) => r.json()).catch(() => ({ careers: [] })),
      fetch("/api/patches").then((r) => r.json()).catch(() => ({ patches: [] })),
    ]);
    setCareers(cr.careers ?? []);
    const pats: PatchRow[] = pt.patches ?? [];
    setPatches(pats);
    if (pats.length) setPatchId((prev) => prev ?? pats[0].id);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = patches.find((p) => p.id === patchId);
  const leagues = patch?.data.leagues ?? [];
  const league = leagues[leagueIdx];
  const teams: PatchTeamDef[] = league?.teams ?? [];

  useEffect(() => {
    if (teams.length && !teams.some((t) => t.name === teamName)) setTeamName(teams[0].name);
  }, [teams, teamName]);

  async function createGame() {
    if (!patch || teams.length < 2) return;
    setCreating(true);
    const res = await fetch("/api/careers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachName: coach || "Técnico", coachAge, coachNation, teamName, patchId: patch.id, leagueIndex: leagueIdx }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.id) router.push(`/career/${data.id}`);
  }

  async function del(id: number) {
    if (!confirm("Excluir este jogo salvo?")) return;
    await fetch(`/api/careers/${id}`, { method: "DELETE" });
    loadData();
  }

  const selected = teams.find((t) => t.name === teamName);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      {/* Hero */}
      <header className="w-full max-w-5xl flex flex-col items-center text-center mb-10 animate-in">
        <div className="inline-flex items-center gap-2 chip bg-white/5 border border-white/10 px-3 py-1 text-xs text-slate-300 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          Football Manager Simulator
        </div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight">
          Worldfoot <span className="grad-text">Manager</span>
        </h1>
        <p className="text-slate-400 mt-4 max-w-xl">
          Comande seu clube: ligas com divisões, táticas, treinamento, olheiros pelo mundo,
          mercado de transferências ao vivo e editor de patches.
        </p>
      </header>

      <div className="w-full max-w-3xl grid gap-5">
        {/* New game / actions */}
        <section className="card p-6 animate-in" style={{ animationDelay: "60ms" }}>
          {!showNew ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowNew(true)}
                className="group card-hover card !rounded-2xl p-6 flex flex-col items-start text-left"
              >
                <span className="text-3xl">⚽</span>
                <span className="text-lg font-bold mt-3">Novo Jogo</span>
                <span className="text-sm text-slate-400 mt-1">Crie uma nova carreira e escolha seu clube.</span>
                <span className="mt-4 text-emerald-400 text-sm font-semibold group-hover:translate-x-1 transition">Começar →</span>
              </button>
              <Link
                href="/patches"
                className="group card-hover card !rounded-2xl p-6 flex flex-col items-start text-left"
              >
                <span className="text-3xl">🛠️</span>
                <span className="text-lg font-bold mt-3">Editor de Patches</span>
                <span className="text-sm text-slate-400 mt-1">Crie ligas, times e camisas personalizadas.</span>
                <span className="mt-4 text-sky-400 text-sm font-semibold group-hover:translate-x-1 transition">Abrir editor →</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Nova Carreira</h2>
                <button onClick={() => setShowNew(false)} className="text-slate-400 hover:text-white text-sm">✕ Fechar</button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Nome do técnico</label>
                  <input
                    value={coach}
                    onChange={(e) => setCoach(e.target.value)}
                    placeholder="Ex: José Mourinho"
                    className="field w-full mt-1.5 px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Patch</label>
                  <select
                    value={patchId ?? ""}
                    onChange={(e) => { setPatchId(Number(e.target.value)); setLeagueIdx(0); }}
                    className="field w-full mt-1.5 px-3 py-2.5"
                  >
                    {patches.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Idade do técnico</label>
                  <input
                    type="number" min={25} max={80}
                    value={coachAge}
                    onChange={(e) => setCoachAge(Number(e.target.value))}
                    className="field w-full mt-1.5 px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Nacionalidade</label>
                  <select
                    value={coachNation}
                    onChange={(e) => setCoachNation(e.target.value)}
                    className="field w-full mt-1.5 px-3 py-2.5"
                  >
                    {["Brasil", "Argentina", "Inglaterra", "Espanha", "Itália", "Alemanha", "França", "Portugal"].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-slate-400">Competição</label>
                <select
                  value={leagueIdx}
                  onChange={(e) => setLeagueIdx(Number(e.target.value))}
                  className="field w-full mt-1.5 px-3 py-2.5"
                >
                  {leagues.map((l, i) => <option key={i} value={i}>{l.name} ({l.teams.length} times)</option>)}
                  {leagues.length === 0 && <option>— nenhuma competição —</option>}
                </select>
              </div>

              {teams.length < 2 ? (
                <p className="text-sm text-amber-400">
                  Esta competição não tem times suficientes. Adicione times no{" "}
                  <Link href="/patches" className="underline">Editor de Patches</Link>.
                </p>
              ) : (
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-400">Escolha seu clube</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto pr-1">
                    {teams.map((t) => {
                      const active = teamName === t.name;
                      return (
                        <button
                          key={t.name}
                          onClick={() => setTeamName(t.name)}
                          className={`flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition border ${
                            active
                              ? "bg-emerald-500/15 border-emerald-400/70 shadow-[0_0_0_1px_rgba(34,224,138,0.3)]"
                              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07]"
                          }`}
                        >
                          <Shirt cor1={t.cor1} cor2={t.cor2} padrao={t.padrao} size={28} sigla={t.sigla} />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{t.name}</div>
                            <div className="text-[10px] text-amber-400">{"★".repeat(t.reputation)}<span className="text-slate-500"> · Nv {t.nivel}</span></div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected && (
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 p-3">
                  <Shirt cor1={selected.cor1} cor2={selected.cor2} padrao={selected.padrao} size={44} sigla={selected.sigla} />
                  <div>
                    <div className="font-bold">{selected.name}</div>
                    <div className="text-xs text-slate-400">Nível {selected.nivel} · Reputação <span className="text-amber-400">{"★".repeat(selected.reputation)}</span></div>
                  </div>
                </div>
              )}

              <button
                onClick={createGame}
                disabled={creating || teams.length < 2}
                className="btn-primary w-full py-3.5 text-base"
              >
                {creating ? "Criando temporada..." : "Começar Carreira"}
              </button>
            </div>
          )}
        </section>

        {/* Continue */}
        <section className="card p-6 animate-in" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Continuar</h2>
            <span className="text-xs text-slate-500">{careers.length} carreira(s)</span>
          </div>
          {loading ? (
            <p className="text-slate-400 text-sm">Carregando...</p>
          ) : careers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <div className="text-3xl mb-2">🗂️</div>
              Nenhum jogo salvo ainda. Crie uma nova carreira!
            </div>
          ) : (
            <div className="space-y-2">
              {careers.map((c) => (
                <div key={c.id} className="group flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-xl p-3 transition">
                  {c.team && <Shirt cor1={c.team.cor1} cor2={c.team.cor2} padrao={c.team.padrao} size={36} badge={c.team.badge} sigla={c.teamName?.slice(0,3)} />}
                  <button className="flex-1 text-left" onClick={() => router.push(`/career/${c.id}`)}>
                    <div className="font-semibold">{c.teamName}</div>
                    <div className="text-xs text-slate-400">Téc. {c.coachName} · Temporada {c.season} · Rodada {c.currentRound}</div>
                  </button>
                  <button
                    onClick={() => router.push(`/career/${c.id}`)}
                    className="btn-primary px-4 py-1.5 text-sm opacity-0 group-hover:opacity-100 transition"
                  >
                    Jogar
                  </button>
                  <button onClick={() => del(c.id)} className="text-slate-500 hover:text-red-400 text-sm px-2">Excluir</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="text-slate-600 text-xs mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>💰 {formatMoney(82000000)} orçamento</span>
        <span className="text-slate-700">•</span>
        <span>🔁 mercado ao vivo</span>
        <span className="text-slate-700">•</span>
        <span>🔍 olheiros no mundo</span>
        <span className="text-slate-700">•</span>
        <span>🛠️ editor de patches</span>
      </footer>
    </div>
  );
}
