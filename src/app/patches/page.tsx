"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Shirt } from "@/components/Shirt";
import { PADROES, PatchData, PatchLeague, PatchTeamDef, PatchPlayerDef, PosKey, CONTINENTES, FORMATOS_TEMPORADA } from "@/lib/data";
import { genPatchSquad, genPatchPlayer, patchPlayerOverall } from "@/lib/patchGen";
import { ImageUpload } from "@/components/ImageUpload";

type PatchRow = {
  id: number;
  name: string;
  author: string;
  isDefault: boolean;
  data: PatchData;
};

const POS_LIST: PosKey[] = ["GOL", "ZAG", "LAT", "VOL", "MEI", "ATA"];
const POS_COLOR: Record<string, string> = {
  GOL: "bg-amber-500/20 text-amber-300",
  ZAG: "bg-sky-500/20 text-sky-300",
  LAT: "bg-cyan-500/20 text-cyan-300",
  VOL: "bg-teal-500/20 text-teal-300",
  MEI: "bg-emerald-500/20 text-emerald-300",
  ATA: "bg-rose-500/20 text-rose-300",
};

const emptyTeam = (): PatchTeamDef => ({
  name: "",
  sigla: "",
  cor1: "#1E88E5",
  cor2: "#FFFFFF",
  padrao: "solido",
  nivel: 70,
  reputation: 3,
  pais: "",
  estadio: "",
  saldoM: 40,
  players: [],
});

export default function PatchesPage() {
  const [patches, setPatches] = useState<PatchRow[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [draft, setDraft] = useState<PatchRow | null>(null);
  const [leagueIdx, setLeagueIdx] = useState(0);
  const [editingTeam, setEditingTeam] = useState<{ index: number; team: PatchTeamDef } | null>(null);
  const [msg, setMsg] = useState("");
  const [dirty, setDirty] = useState(false);
  const [section, setSection] = useState<"ligas" | "patrocinadores">("ligas");
  const fileRef = useRef<HTMLInputElement>(null);

  // Exporta o patch atual como arquivo .json (para compartilhar com amigos)
  function exportPatch() {
    if (!draft) return;
    const payload = { name: draft.name, author: draft.author, data: draft.data, _worldfootPatch: 1 };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "patch"}.wfpatch.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Importa um patch de um arquivo .json e cria um novo patch com ele
  async function importPatch(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const name = (parsed.name || file.name.replace(/\.json$/, "")) + " (importado)";
      const data = parsed.data && parsed.data.leagues ? parsed.data : parsed;
      const res = await fetch("/api/patches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, author: parsed.author || "", data }),
      });
      const d = await res.json();
      await load();
      const res2 = await fetch("/api/patches");
      const dd = await res2.json();
      const created = (dd.patches as PatchRow[]).find((p) => p.id === d.id);
      if (created) selectPatch(created);
      setMsg("✅ Patch importado com sucesso!");
    } catch {
      setMsg("⚠️ Arquivo inválido.");
    }
  }

  async function load() {
    const res = await fetch("/api/patches");
    const data = await res.json();
    setPatches(data.patches ?? []);
    if (selId === null && data.patches?.length) selectPatch(data.patches[0]);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectPatch(p: PatchRow) {
    setSelId(p.id);
    setDraft(JSON.parse(JSON.stringify(p)));
    setLeagueIdx(0);
    setDirty(false);
    setMsg("");
  }

  async function newPatch() {
    const name = prompt("Nome do novo patch:", "Meu Patch");
    if (!name) return;
    // começa com uma liga vazia pronta para adicionar times
    const data = { leagues: [{ name: "Minha Liga", type: "liga" as const, teams: [], sobe: 0, desce: 2, formatoTemporada: "ano" as const }], sponsors: [] };
    const res = await fetch("/api/patches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, data }),
    });
    const d = await res.json();
    await load();
    const res2 = await fetch("/api/patches");
    const dd = await res2.json();
    const created = (dd.patches as PatchRow[]).find((p) => p.id === d.id);
    if (created) { selectPatch(created); setMsg("✅ Patch criado! Adicione times na liga."); }
  }

  async function deletePatch() {
    if (!draft) return;
    if (draft.isDefault) {
      setMsg("⚠️ Não é possível excluir o patch padrão.");
      return;
    }
    if (!confirm(`Excluir o patch "${draft.name}"?`)) return;
    await fetch(`/api/patches/${draft.id}`, { method: "DELETE" });
    setSelId(null);
    setDraft(null);
    load();
  }

  async function save() {
    if (!draft) return;
    await fetch(`/api/patches/${draft.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.name, author: draft.author, data: draft.data }),
    });
    setDirty(false);
    setMsg("✅ Patch salvo com sucesso!");
    load();
  }

  function mutate(fn: (d: PatchRow) => void) {
    if (!draft) return;
    const copy = JSON.parse(JSON.stringify(draft)) as PatchRow;
    fn(copy);
    setDraft(copy);
    setDirty(true);
  }

  const league: PatchLeague | undefined = draft?.data.leagues[leagueIdx];

  function addLeague(type: "liga" | "copa") {
    const name = prompt(type === "copa" ? "Nome da copa:" : "Nome da liga:");
    if (!name) return;
    mutate((d) => {
      d.data.leagues.push({ name, type, teams: [], sobe: 0, desce: type === "liga" ? 2 : 0 });
    });
    setLeagueIdx(draft ? draft.data.leagues.length : 0);
  }

  function renameLeague() {
    if (!league) return;
    const name = prompt("Novo nome da competição:", league.name);
    if (!name) return;
    mutate((d) => { d.data.leagues[leagueIdx].name = name; });
  }

  function removeLeague() {
    if (!league) return;
    if (!confirm(`Remover a competição "${league.name}"?`)) return;
    mutate((d) => { d.data.leagues.splice(leagueIdx, 1); });
    setLeagueIdx(0);
  }

  function saveTeam(team: PatchTeamDef, index: number) {
    mutate((d) => {
      if (index < 0) d.data.leagues[leagueIdx].teams.push(team);
      else d.data.leagues[leagueIdx].teams[index] = team;
    });
    setEditingTeam(null);
  }

  function removeTeam(index: number) {
    mutate((d) => { d.data.leagues[leagueIdx].teams.splice(index, 1); });
  }

  function duplicateTeam(index: number) {
    mutate((d) => {
      const orig = d.data.leagues[leagueIdx].teams[index];
      const copy = JSON.parse(JSON.stringify(orig)) as PatchTeamDef;
      copy.name = `${orig.name} B`;
      d.data.leagues[leagueIdx].teams.splice(index + 1, 0, copy);
    });
  }

  const totalTeams = (p: PatchRow) => (p.data.leagues ?? []).reduce((s, l) => s + (l.teams?.length ?? 0), 0);

  return (
    <div className="min-h-screen pitch-bg">
      {/* Cabeçalho moderno com ações principais */}
      <header className="glass border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 flex-wrap">
        <Link href="/" className="btn-ghost px-2.5 py-1.5 text-sm">← Menu</Link>
        <div className="mr-auto">
          <h1 className="font-black text-lg leading-tight flex items-center gap-2">🛠️ Editor de Patches</h1>
          <span className="text-[11px] text-slate-500">Crie ligas, copas, times, elencos, camisas e patrocinadores</span>
        </div>
        <button onClick={newPatch} className="btn-primary px-3 py-2 rounded-lg text-sm">+ Novo Patch</button>
        <button onClick={() => fileRef.current?.click()} className="btn-ghost px-3 py-2 rounded-lg text-sm">⬆️ Importar</button>
        <input ref={fileRef} type="file" accept="application/json,.json,.wfpatch" className="hidden" onChange={importPatch} />
      </header>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 max-w-6xl mx-auto">
        {/* lista de patches */}
        <aside className="glass rounded-2xl p-3 border border-white/10 h-fit">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-bold text-sm">Meus Patches</h2>
            <span className="text-[10px] text-slate-500">{patches.length}</span>
          </div>
          <div className="space-y-1.5">
            {patches.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPatch(p)}
                className={`w-full text-left rounded-xl px-3 py-2.5 transition border ${
                  selId === p.id
                    ? "bg-gradient-to-r from-emerald-500/25 to-emerald-500/5 border-emerald-400/40"
                    : "bg-white/[0.03] border-transparent hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.isDefault ? "🌍" : "📦"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {p.data.leagues?.length ?? 0} comp. · {totalTeams(p)} times
                      {p.isDefault && <span className="ml-1 text-emerald-400">padrão</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* editor */}
        <main className="glass rounded-2xl p-4 border border-white/10">
          {!draft ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-3">🛠️</div>
              <p className="font-semibold">Selecione um patch ao lado ou crie um novo</p>
              <p className="text-sm text-slate-500 mt-1">Você pode importar um patch de um amigo com o botão “Importar” acima.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {msg && <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-lg px-3 py-2 text-sm">{msg}</div>}

              {/* barra de ações do patch (topo) */}
              <div className="flex items-center gap-2 flex-wrap bg-white/[0.03] rounded-xl p-2.5">
                <span className="text-2xl">{draft.isDefault ? "🌍" : "📦"}</span>
                <div className="mr-auto">
                  <div className="font-bold">{draft.name || "(sem nome)"}</div>
                  <div className="text-[11px] text-slate-500">por {draft.author || "anônimo"} · {draft.data.leagues.length} competições</div>
                </div>
                <button onClick={save} disabled={!dirty} className="btn-primary px-4 py-1.5 rounded-lg text-sm disabled:opacity-40">
                  {dirty ? "💾 Salvar" : "✓ Salvo"}
                </button>
                <button onClick={exportPatch} className="btn-ghost px-3 py-1.5 rounded-lg text-sm" title="Baixar arquivo para compartilhar">⬇️ Exportar</button>
                {!draft.isDefault && (
                  <button onClick={deletePatch} className="bg-red-500/70 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm">🗑️</button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Nome do patch</label>
                  <input value={draft.name} onChange={(e) => mutate((d) => { d.name = e.target.value; })} className="field w-full mt-1 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Autor</label>
                  <input value={draft.author} onChange={(e) => mutate((d) => { d.author = e.target.value; })} className="field w-full mt-1 px-3 py-2 text-sm" />
                </div>
              </div>

              {/* seções do editor */}
              <div className="flex gap-1 bg-white/[0.04] p-1 rounded-xl w-fit">
                <button onClick={() => setSection("ligas")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${section === "ligas" ? "bg-emerald-500 text-slate-900" : "text-slate-300"}`}>🏆 Ligas & Times</button>
                <button onClick={() => setSection("patrocinadores")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${section === "patrocinadores" ? "bg-emerald-500 text-slate-900" : "text-slate-300"}`}>💼 Patrocinadores</button>
              </div>

              {section === "patrocinadores" && (
                <SponsorEditor draft={draft} mutate={mutate} />
              )}

              {section === "ligas" && <>
              {/* leagues */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Competição:</span>
                <select value={leagueIdx} onChange={(e) => setLeagueIdx(Number(e.target.value))} className="field px-3 py-1.5 text-sm">
                  {draft.data.leagues.map((l, i) => (
                    <option key={i} value={i}>{l.type === "copa" ? "🏆 " : "📊 "}{l.name} ({l.teams.length})</option>
                  ))}
                  {draft.data.leagues.length === 0 && <option>— nenhuma —</option>}
                </select>
                <button onClick={() => addLeague("liga")} className="btn-ghost px-2.5 py-1.5 text-xs">+ Liga</button>
                <button onClick={() => addLeague("copa")} className="btn-ghost px-2.5 py-1.5 text-xs">+ Copa</button>
                {league && <button onClick={renameLeague} className="btn-ghost px-2.5 py-1.5 text-xs">Renomear</button>}
                {league && <button onClick={removeLeague} className="bg-red-500/80 hover:bg-red-500 px-2.5 py-1.5 rounded-lg text-xs">Remover</button>}
              </div>

              {/* league config */}
              {league && league.type === "liga" && (
                <div className="flex flex-wrap items-center gap-4 bg-white/[0.03] rounded-lg px-3 py-2">
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    Sobem
                    <input type="number" min={0} max={6} value={league.sobe ?? 0}
                      onChange={(e) => mutate((d) => { d.data.leagues[leagueIdx].sobe = Number(e.target.value); })}
                      className="field w-16 px-2 py-1 text-sm" />
                  </label>
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    Descem
                    <input type="number" min={0} max={6} value={league.desce ?? 0}
                      onChange={(e) => mutate((d) => { d.data.leagues[leagueIdx].desce = Number(e.target.value); })}
                      className="field w-16 px-2 py-1 text-sm" />
                  </label>
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    Divisão inferior
                    <select value={league.divBelow ?? -1}
                      onChange={(e) => mutate((d) => { d.data.leagues[leagueIdx].divBelow = Number(e.target.value); })}
                      className="field px-2 py-1 text-sm">
                      <option value={-1}>— nenhuma —</option>
                      {draft.data.leagues.map((l, i) => (
                        l.type === "liga" && i !== leagueIdx ? <option key={i} value={i}>{l.name}</option> : null
                      ))}
                    </select>
                  </label>
                  <span className="text-[10px] text-slate-500">Times que descem vão para a divisão inferior (e os que sobem de lá tomam o lugar).</span>
                </div>
              )}

              {/* config extra da liga: país, continente, formato de temporada */}
              {league && league.type === "liga" && (
                <div className="flex flex-wrap items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2">
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    País
                    <input value={league.pais ?? ""} onChange={(e) => mutate((d) => { d.data.leagues[leagueIdx].pais = e.target.value; })}
                      placeholder="Ex: Brasil" className="field w-28 px-2 py-1 text-sm" />
                  </label>
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    Continente
                    <select value={league.continente ?? ""} onChange={(e) => mutate((d) => { d.data.leagues[leagueIdx].continente = e.target.value; })} className="field px-2 py-1 text-sm">
                      <option value="">—</option>
                      {CONTINENTES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    Temporada
                    <select value={league.formatoTemporada ?? "ano"} onChange={(e) => mutate((d) => { d.data.leagues[leagueIdx].formatoTemporada = e.target.value as "ano" | "cruzado"; })} className="field px-2 py-1 text-sm">
                      {FORMATOS_TEMPORADA.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
                    </select>
                  </label>
                </div>
              )}

              {/* config da copa: pré-temporada (estadual) */}
              {league && league.type === "copa" && (
                <div className="flex flex-wrap items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2">
                  <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!league.preseason}
                      onChange={(e) => mutate((d) => { d.data.leagues[leagueIdx].preseason = e.target.checked; })}
                      className="accent-emerald-500 w-4 h-4" />
                    Torneio de pré-temporada (estadual — jogado antes da liga)
                  </label>
                  <label className="text-xs text-slate-400 flex items-center gap-2">
                    País
                    <input value={league.pais ?? ""} onChange={(e) => mutate((d) => { d.data.leagues[leagueIdx].pais = e.target.value; })}
                      placeholder="Ex: Brasil" className="field w-28 px-2 py-1 text-sm" />
                  </label>
                </div>
              )}

              {/* teams grid */}
              {league && (
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <h3 className="font-bold text-sm">Times de {league.name}</h3>
                    <div className="flex gap-2 items-center">
                      {league.type === "copa" && draft.data.leagues.length > 1 && (
                        <select
                          className="field px-2 py-1 text-xs"
                          value=""
                          onChange={(e) => {
                            const idx = Number(e.target.value);
                            if (Number.isNaN(idx)) return;
                            mutate((d) => {
                              const src = d.data.leagues[idx];
                              const existing = new Set(d.data.leagues[leagueIdx].teams.map((x) => x.name));
                              for (const tm of src.teams) if (!existing.has(tm.name)) d.data.leagues[leagueIdx].teams.push(JSON.parse(JSON.stringify(tm)));
                            });
                          }}
                        >
                          <option value="">Importar times de...</option>
                          {draft.data.leagues.map((l, i) => (i !== leagueIdx ? <option key={i} value={i}>{l.name} ({l.teams.length})</option> : null))}
                        </select>
                      )}
                      <button onClick={() => setEditingTeam({ index: -1, team: emptyTeam() })} className="btn-primary px-3 py-1.5 rounded-lg text-xs">
                        + Adicionar Time
                      </button>
                    </div>
                  </div>
                  {league.teams.length < 2 && (
                    <p className="text-xs text-yellow-400 mb-2">⚠️ A competição precisa de pelo menos 2 times para jogar.</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {league.teams.map((t, i) => (
                      <div key={i} className="bg-white/[0.04] rounded-lg p-2.5 flex items-center gap-2">
                        <Shirt cor1={t.cor1} cor2={t.cor2} padrao={t.padrao} size={32} badge={t.badge} sigla={t.sigla} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">{t.name || "(sem nome)"}</div>
                          <div className="text-[10px] text-slate-400">
                            {t.sigla} · Nv {t.nivel} · {"★".repeat(t.reputation)}
                            {t.players && t.players.length > 0 && <span className="text-emerald-400"> · {t.players.length} jog.</span>}
                          </div>
                        </div>
                        <div className="flex gap-1.5 text-xs">
                          <button onClick={() => setEditingTeam({ index: i, team: JSON.parse(JSON.stringify(t)) })} className="text-sky-400 hover:text-sky-300">Editar</button>
                          <button onClick={() => duplicateTeam(i)} className="text-slate-400 hover:text-white">Duplicar</button>
                          <button onClick={() => removeTeam(i)} className="text-red-400 hover:text-red-300">Excluir</button>
                        </div>
                      </div>
                     ))}
                   </div>
                 </div>
               )}
              </>}

              <div className="flex items-center gap-3 pt-3 border-t border-white/10 flex-wrap">
                <button onClick={save} disabled={!dirty} className="btn-primary px-5 py-2 rounded-lg">
                  {dirty ? "💾 Salvar alterações" : "✓ Tudo salvo"}
                </button>
                <span className="text-xs text-slate-500">
                  💡 Dica: use <b>Exportar</b> (no topo) para baixar o arquivo <code>.wfpatch.json</code> e enviar para amigos. Eles usam <b>Importar</b> para jogar com o seu patch.
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {editingTeam && (
        <TeamEditorModal
          team={editingTeam.team}
          onCancel={() => setEditingTeam(null)}
          onSave={(t) => saveTeam(t, editingTeam.index)}
        />
      )}
    </div>
  );
}

function TeamEditorModal({
  team,
  onSave,
  onCancel,
}: {
  team: PatchTeamDef;
  onSave: (t: PatchTeamDef) => void;
  onCancel: () => void;
}) {
  const [t, setT] = useState<PatchTeamDef>({ ...team, players: team.players ?? [] });
  const [tab, setTab] = useState<"clube" | "elenco">("clube");
  const set = (k: keyof PatchTeamDef, v: string | number) => setT((p) => ({ ...p, [k]: v }));
  const players = t.players ?? [];

  function setPlayers(next: PatchPlayerDef[]) {
    setT((p) => ({ ...p, players: next }));
  }
  function gerarElenco() {
    setPlayers(genPatchSquad(t.nivel));
  }
  function addPlayer() {
    setPlayers([...players, genPatchPlayer("MEI", t.nivel)]);
  }
  function updatePlayer(i: number, patch: Partial<PatchPlayerDef>) {
    const next = players.slice();
    next[i] = { ...next[i], ...patch };
    setPlayers(next);
  }
  function removePlayer(i: number) {
    setPlayers(players.filter((_, idx) => idx !== i));
  }

  const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="card p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Editar Time</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <div className="flex gap-2 mb-4 bg-white/[0.04] p-1 rounded-xl w-fit">
          <button onClick={() => setTab("clube")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${tab === "clube" ? "bg-emerald-500 text-slate-900" : "text-slate-300"}`}>Clube</button>
          <button onClick={() => setTab("elenco")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${tab === "elenco" ? "bg-emerald-500 text-slate-900" : "text-slate-300"}`}>
            Elenco {players.length > 0 && <span className="opacity-70">({players.length})</span>}
          </button>
        </div>

        {tab === "clube" ? (
          <>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white/[0.04] rounded-xl p-3">
                  <Shirt cor1={t.cor1} cor2={t.cor2} padrao={t.padrao} size={80} badge={t.badge} sigla={t.sigla} />
                </div>
                <ImageUpload value={t.badge ?? ""} onChange={(v) => set("badge", v)} label="Escudo" size={56} />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-xs text-slate-400">Nome</label>
                  <input value={t.name} onChange={(e) => set("name", e.target.value)} className="field w-full mt-0.5 px-2 py-1.5 text-sm" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400">Sigla</label>
                    <input value={t.sigla} maxLength={4} onChange={(e) => set("sigla", e.target.value.toUpperCase())} className="field w-full mt-0.5 px-2 py-1.5 text-sm" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-slate-400">Nível</label>
                    <input type="number" min={30} max={99} value={t.nivel} onChange={(e) => set("nivel", Number(e.target.value))} className="field w-full mt-0.5 px-2 py-1.5 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-slate-400">País</label>
                <input value={t.pais ?? ""} onChange={(e) => set("pais", e.target.value)} placeholder="Ex: Brasil" className="field w-full mt-0.5 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Estádio</label>
                <input value={t.estadio ?? ""} onChange={(e) => set("estadio", e.target.value)} placeholder="Ex: Arena Central" className="field w-full mt-0.5 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Orçamento (milhões €)</label>
                <input type="number" min={0} max={2000} value={t.saldoM ?? 40} onChange={(e) => set("saldoM", Number(e.target.value))} className="field w-full mt-0.5 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Reputação (1-5)</label>
                <input type="number" min={1} max={5} value={t.reputation} onChange={(e) => set("reputation", Number(e.target.value))} className="field w-full mt-0.5 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Cor principal</label>
                <input type="color" value={t.cor1} onChange={(e) => set("cor1", e.target.value)} className="w-full h-9 mt-0.5 bg-transparent rounded-lg cursor-pointer" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Cor secundária</label>
                <input type="color" value={t.cor2} onChange={(e) => set("cor2", e.target.value)} className="w-full h-9 mt-0.5 bg-transparent rounded-lg cursor-pointer" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400">Padrão da camisa (fundo do escudo gerado)</label>
                <select value={t.padrao} onChange={(e) => set("padrao", e.target.value)} className="field w-full mt-0.5 px-2 py-1.5 text-sm">
                  {PADROES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Patrocinador</label>
                <input value={t.sponsorName ?? ""} onChange={(e) => set("sponsorName", e.target.value)} placeholder="Ex: TurboBank" className="field w-full mt-0.5 px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Patrocínio (milhões €/ano)</label>
                <input type="number" min={0} max={500} value={t.sponsorM ?? 0} onChange={(e) => set("sponsorM", Number(e.target.value))} className="field w-full mt-0.5 px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <ImageUpload value={t.sponsorLogo ?? ""} onChange={(v) => set("sponsorLogo", v)} label="Logo do patrocinador" size={48} />
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button onClick={gerarElenco} className="btn-primary px-3 py-1.5 rounded-lg text-xs">⚡ Gerar elenco (nível {t.nivel})</button>
              <button onClick={addPlayer} className="btn-ghost px-3 py-1.5 text-xs">+ Jogador</button>
              {players.length > 0 && <button onClick={() => setPlayers([])} className="text-red-400 hover:text-red-300 text-xs px-2">Limpar</button>}
              <span className="text-[10px] text-slate-500 ml-auto">
                {players.length < 11 ? "Mín. 11 para usar elenco próprio (senão gera aleatório)" : `${players.length} jogadores`}
              </span>
            </div>
            {players.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-10">
                Sem elenco definido — o jogo gera jogadores automaticamente.<br />
                Clique em <b>Gerar elenco</b> para criar e depois editar cada um.
              </div>
            ) : (
              <div className="space-y-1 max-h-[46vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-[34px_52px_1fr_44px_44px_44px_40px_40px_28px] gap-1 text-[10px] text-slate-500 px-1">
                  <span></span><span>Pos</span><span>Nome</span><span className="text-center">ATA</span><span className="text-center">MEI</span>
                  <span className="text-center">DEF</span><span className="text-center">Idade</span><span className="text-center">OVR</span><span></span>
                </div>
                {players.map((p, i) => (
                  <div key={i} className="grid grid-cols-[34px_52px_1fr_44px_44px_44px_40px_40px_28px] gap-1 items-center">
                    <PlayerPhoto value={p.photo ?? ""} onChange={(v) => updatePlayer(i, { photo: v })} />
                    <select value={p.position} onChange={(e) => updatePlayer(i, { position: e.target.value as PosKey })} className={`rounded px-1 py-1 text-[10px] font-bold outline-none ${POS_COLOR[p.position]}`}>
                      {POS_LIST.map((pos) => <option key={pos} value={pos} className="bg-slate-800 text-white">{pos}</option>)}
                    </select>
                    <input value={p.name} onChange={(e) => updatePlayer(i, { name: e.target.value })} className="field px-2 py-1 text-xs" />
                    <input type="number" min={30} max={99} value={p.ataque} onChange={(e) => updatePlayer(i, { ataque: clampN(Number(e.target.value), 30, 99) })} className="field px-1 py-1 text-xs text-center" />
                    <input type="number" min={30} max={99} value={p.meio} onChange={(e) => updatePlayer(i, { meio: clampN(Number(e.target.value), 30, 99) })} className="field px-1 py-1 text-xs text-center" />
                    <input type="number" min={30} max={99} value={p.defesa} onChange={(e) => updatePlayer(i, { defesa: clampN(Number(e.target.value), 30, 99) })} className="field px-1 py-1 text-xs text-center" />
                    <input type="number" min={15} max={42} value={p.idade} onChange={(e) => updatePlayer(i, { idade: clampN(Number(e.target.value), 15, 42) })} className="field px-1 py-1 text-xs text-center" />
                    <span className="text-center text-xs font-bold text-emerald-400">{patchPlayerOverall(p)}</span>
                    <button onClick={() => removePlayer(i)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={() => {
              if (!t.name.trim()) return;
              onSave({
                ...t,
                sigla: t.sigla || t.name.slice(0, 3).toUpperCase(),
                nivel: Math.max(30, Math.min(99, t.nivel)),
                reputation: Math.max(1, Math.min(5, t.reputation)),
              });
            }}
            className="flex-1 btn-primary py-2.5 rounded-lg"
          >
            Salvar Time
          </button>
          <button onClick={onCancel} className="px-5 btn-ghost rounded-lg">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// Avatar compacto com upload de foto para a linha do jogador no editor
function PlayerPhoto({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  async function handle(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 96;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("no ctx"));
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    onChange(dataUrl);
  }
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-white/[0.04] flex items-center justify-center shrink-0"
      title="Foto do jogador"
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-slate-500 text-xs">＋</span>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
    </button>
  );
}

// ---- Editor de patrocinadores (seção própria dentro do patch) ----
function SponsorEditor({ draft, mutate }: { draft: PatchRow; mutate: (fn: (d: PatchRow) => void) => void }) {
  const sponsors = draft.data.sponsors ?? [];
  function add() {
    mutate((d) => {
      d.data.sponsors = [...(d.data.sponsors ?? []), { name: "Novo Patrocinador", valorM: 10, morale: 3, logo: "", continente: "" }];
    });
  }
  function upd(i: number, patch: Partial<NonNullable<PatchData["sponsors"]>[number]>) {
    mutate((d) => {
      const arr = [...(d.data.sponsors ?? [])];
      arr[i] = { ...arr[i], ...patch };
      d.data.sponsors = arr;
    });
  }
  function del(i: number) {
    mutate((d) => { d.data.sponsors = (d.data.sponsors ?? []).filter((_, idx) => idx !== i); });
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Patrocinadores do patch</h3>
        <button onClick={add} className="btn-primary px-3 py-1.5 rounded-lg text-xs">+ Adicionar Patrocinador</button>
      </div>
      {sponsors.length === 0 && <p className="text-xs text-slate-500 mb-2">Nenhum patrocinador. Adicione com nome, valor e imagem — eles aparecem nas ofertas de patrocínio da carreira.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sponsors.map((s, i) => (
          <div key={i} className="bg-white/[0.04] rounded-xl p-3 flex gap-3">
            <ImageUpload value={s.logo ?? ""} onChange={(v) => upd(i, { logo: v })} label="Logo" size={52} />
            <div className="flex-1 space-y-1.5">
              <input value={s.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="Nome" className="field w-full px-2 py-1.5 text-sm" />
              <div className="flex gap-2">
                <label className="text-[10px] text-slate-400 flex-1">Valor (M€/ano)
                  <input type="number" min={0} max={500} value={s.valorM} onChange={(e) => upd(i, { valorM: Number(e.target.value) })} className="field w-full px-2 py-1 text-sm" />
                </label>
                <label className="text-[10px] text-slate-400 w-20">Moral
                  <input type="number" min={0} max={10} value={s.morale} onChange={(e) => upd(i, { morale: Number(e.target.value) })} className="field w-full px-2 py-1 text-sm" />
                </label>
              </div>
              <button onClick={() => del(i)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
