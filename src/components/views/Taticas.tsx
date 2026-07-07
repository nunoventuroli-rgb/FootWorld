"use client";

import { useState } from "react";
import { CareerState, TeamT, PlayerT } from "@/lib/types";
import { overall, slotsForFormation, MORALE_LABEL, MORALE_COLOR } from "@/lib/engine";
import { FORMATION_KEYS } from "@/lib/data";
import { Pitch } from "@/components/Pitch";
import { POS_COLOR, ovrColor } from "@/lib/utils";

const MENTALITIES = [
  { v: "retranca", l: "Retranca" },
  { v: "defensivo", l: "Defensivo" },
  { v: "equilibrado", l: "Equilibrado" },
  { v: "ofensivo", l: "Ofensivo" },
  { v: "all-out", l: "Todos ao Ataque" },
];
const PRESSINGS = [{ v: "baixo", l: "Baixo" }, { v: "medio", l: "Médio" }, { v: "alto", l: "Alto" }];
const TEMPOS = [{ v: "cadenciado", l: "Cadenciado" }, { v: "normal", l: "Normal" }, { v: "rapido", l: "Rápido" }];

function Segmented({ value, options, onChange }: { value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 bg-slate-800 rounded-lg p-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
            value === o.v ? "bg-emerald-500 text-slate-900" : "text-slate-300 hover:bg-white/5"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function Taticas({ state, onChanged, careerId }: { state: CareerState; onChanged: () => void; careerId: number }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const myPlayers = state.players.filter((p) => p.teamId === me.id);

  const [formation, setFormation] = useState(me.formation);
  const [mentality, setMentality] = useState(me.mentality);
  const [pressing, setPressing] = useState(me.pressing);
  const [tempo, setTempo] = useState(me.tempo);
  const slots = slotsForFormation(formation);

  const initLineup: (number | null)[] = Array(slots.length).fill(null);
  myPlayers.forEach((p) => {
    if (p.isStarter && p.slotIndex >= 0 && p.slotIndex < slots.length) initLineup[p.slotIndex] = p.id;
  });
  const [lineup, setLineup] = useState<(number | null)[]>(initLineup);
  const [selected, setSelected] = useState<{ type: "slot" | "bench"; id: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const playerById = (id: number | null) => myPlayers.find((p) => p.id === id) ?? null;
  const startersList = lineup.map((id) => playerById(id)).filter(Boolean) as PlayerT[];
  const pitchStarters: PlayerT[] = lineup
    .map((id, idx) => { const p = playerById(id); return p ? { ...p, slotIndex: idx } : null; })
    .filter(Boolean) as PlayerT[];
  const benchPlayers = myPlayers.filter((p) => !lineup.includes(p.id));

  const selectedSlotPlayerId = () => (selected?.type === "slot" ? lineup[selected.id] : null);

  function handleSlotClick(slotIndex: number) {
    if (!selected) { setSelected({ type: "slot", id: slotIndex }); return; }
    const next = [...lineup];
    if (selected.type === "slot") { const tmp = next[selected.id]; next[selected.id] = next[slotIndex]; next[slotIndex] = tmp; }
    else next[slotIndex] = selected.id;
    setLineup(next); setSelected(null);
  }
  function handleBenchClick(playerId: number) {
    if (selected?.type === "slot") { const next = [...lineup]; next[selected.id] = playerId; setLineup(next); setSelected(null); }
    else if (selected?.type === "bench" && selected.id === playerId) setSelected(null);
    else setSelected({ type: "bench", id: playerId });
  }
  function changeFormation(f: string) {
    setFormation(f);
    const newSlots = slotsForFormation(f);
    const next: (number | null)[] = Array(newSlots.length).fill(null);
    for (let i = 0; i < newSlots.length; i++) next[i] = lineup[i] ?? null;
    setLineup(next); setSelected(null);
  }

  async function post(extra: Record<string, unknown>) {
    return fetch(`/api/careers/${careerId}/tactics`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: me.id, formation, mentality, pressing, tempo, ...extra }),
    });
  }
  async function autoPick() {
    setSaving(true); await post({}); setSaving(false); setMsg("Escalação automática aplicada!"); onChanged();
  }
  async function save() {
    const starters = lineup.filter((x) => x !== null);
    if (starters.length !== slots.length) { setMsg("Preencha todas as posições antes de salvar."); return; }
    setSaving(true); await post({ starters }); setSaving(false); setMsg("Táticas e escalação salvas!"); onChanged();
  }

  const teamOvr = startersList.length ? Math.round(startersList.reduce((s, p) => s + overall(p), 0) / startersList.length) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <select value={formation} onChange={(e) => changeFormation(e.target.value)} className="bg-slate-800 rounded-lg px-3 py-2 text-sm font-bold outline-none">
              {FORMATION_KEYS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <div className="text-sm">Força XI: <b className={ovrColor(teamOvr)}>{teamOvr}</b></div>
            <div className="text-sm">Moral: <b className={MORALE_COLOR(me.morale)}>{MORALE_LABEL(me.morale)}</b></div>
          </div>
          <div className="flex gap-2">
            <button onClick={autoPick} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm">Auto-escalar</button>
            <button onClick={save} disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div><div className="text-xs text-slate-400 mb-1">Mentalidade</div><Segmented value={mentality} options={MENTALITIES} onChange={setMentality} /></div>
          <div><div className="text-xs text-slate-400 mb-1">Pressão</div><Segmented value={pressing} options={PRESSINGS} onChange={setPressing} /></div>
          <div><div className="text-xs text-slate-400 mb-1">Ritmo</div><Segmented value={tempo} options={TEMPOS} onChange={setTempo} /></div>
        </div>

        {msg && <p className="text-emerald-400 text-sm mb-2">{msg}</p>}
        <p className="text-xs text-slate-500 mb-3">Clique num jogador e depois em outro (ou no banco) para trocar de posição.</p>
        <div className="max-w-md mx-auto">
          <Pitch formation={formation} starters={pitchStarters} onSlotClick={(slotIndex) => handleSlotClick(slotIndex)} selectedPlayerId={selectedSlotPlayerId()} />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold mb-3">Reservas ({benchPlayers.length})</h3>
        <div className="space-y-1 max-h-[620px] overflow-y-auto pr-1">
          {benchPlayers.map((p) => (
            <button key={p.id} onClick={() => handleBenchClick(p.id)}
              className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                selected?.type === "bench" && selected.id === p.id ? "bg-yellow-400/20 ring-1 ring-yellow-300" : "bg-slate-800 hover:bg-slate-700"
              }`}>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[p.position] ?? ""}`}>{p.position}</span>
              <span className="flex-1 truncate">{p.name}</span>
              <span className={`text-xs ${MORALE_COLOR(p.morale)}`}>●</span>
              <span className={`font-bold ${ovrColor(overall(p))}`}>{overall(p)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
