"use client";

import { useState } from "react";
import { CareerState, TeamT, PlayerT } from "@/lib/types";
import { overall } from "@/lib/engine";
import { sortByPos, POS_COLOR, ovrColor } from "@/lib/utils";
import { Shirt } from "@/components/Shirt";
import { ImageUpload } from "@/components/ImageUpload";
import { PADROES } from "@/lib/data";

export function Personalizar({ state, onChanged, careerId }: { state: CareerState; onChanged: () => void; careerId: number }) {
  const me = state.teams.find((t) => t.id === state.career.controlledTeamId) as TeamT;
  const players = sortByPos(state.players.filter((p) => p.teamId === me.id));
  const [msg, setMsg] = useState("");

  // local drafts
  const [badge, setBadge] = useState(me.badge);
  const [cor1, setCor1] = useState(me.cor1);
  const [cor2, setCor2] = useState(me.cor2);
  const [padrao, setPadrao] = useState(me.padrao);
  const [teamName, setTeamName] = useState(me.name);
  const [coachPhoto, setCoachPhoto] = useState(state.career.coachPhoto);
  const [coachName, setCoachName] = useState(state.career.coachName);
  const [leagueLogo, setLeagueLogo] = useState(state.career.leagueLogo);

  async function post(payload: Record<string, unknown>) {
    const res = await fetch(`/api/careers/${careerId}/customize`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) setMsg(`⚠️ ${data.error}`);
    else setMsg("✅ Salvo!");
    onChanged();
  }

  async function savePlayer(p: PlayerT, photo: string, name: string) {
    await post({ target: "player", playerId: p.id, photo, name });
  }

  return (
    <div className="space-y-4">
      {msg && <div className="card px-4 py-2 text-sm">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Clube */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><span>🛡️</span> Clube</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center overflow-hidden">
              <Shirt cor1={cor1} cor2={cor2} padrao={padrao} size={52} badge={badge} sigla={me.sigla} />
            </div>
            <div className="flex-1">
              <div className="font-bold">{teamName}</div>
              <div className="text-xs text-slate-400">Prévia do escudo/uniforme</div>
            </div>
          </div>
          <ImageUpload value={badge} onChange={setBadge} size={64} label="Escudo do time" />
          <div className="mt-3 space-y-2">
            <div>
              <label className="text-xs text-slate-400">Nome do clube</label>
              <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="field w-full mt-1 px-3 py-2" />
            </div>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 text-xs">Cor 1</span>
                <input type="color" value={cor1} onChange={(e) => setCor1(e.target.value)} className="w-9 h-8 rounded bg-transparent cursor-pointer" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 text-xs">Cor 2</span>
                <input type="color" value={cor2} onChange={(e) => setCor2(e.target.value)} className="w-9 h-8 rounded bg-transparent cursor-pointer" />
              </label>
              <select value={padrao} onChange={(e) => setPadrao(e.target.value)} className="field px-2 py-1 text-sm flex-1">
                {PADROES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={() => post({ target: "team", teamId: me.id, badge, name: teamName, cor1, cor2, padrao })}
            className="btn-primary w-full mt-4 py-2.5"
          >
            Salvar Clube
          </button>
        </div>

        {/* Técnico + Liga */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><span>👔</span> Técnico & Liga</h2>
          <ImageUpload value={coachPhoto} onChange={setCoachPhoto} size={64} round label="Foto do técnico" />
          <div className="mt-3">
            <label className="text-xs text-slate-400">Nome do técnico</label>
            <input value={coachName} onChange={(e) => setCoachName(e.target.value)} className="field w-full mt-1 px-3 py-2" />
          </div>
          <div className="mt-4">
            <ImageUpload value={leagueLogo} onChange={setLeagueLogo} size={64} label="Logo da liga" />
          </div>
          <button
            onClick={() => post({ target: "career", coachPhoto, coachName, leagueLogo })}
            className="btn-primary w-full mt-4 py-2.5"
          >
            Salvar Técnico & Liga
          </button>
        </div>
      </div>

      {/* Jogadores */}
      <div className="card p-5">
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><span>📸</span> Fotos dos Jogadores</h2>
        <p className="text-xs text-slate-500 mb-4">Envie uma foto para cada jogador — ela aparece na bolinha do campo.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((p) => (
            <PlayerPhotoCard key={p.id} player={p} onSave={savePlayer} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerPhotoCard({ player, onSave }: { player: PlayerT; onSave: (p: PlayerT, photo: string, name: string) => void }) {
  const [photo, setPhoto] = useState(player.photo);
  const [name, setName] = useState(player.name);
  const dirty = photo !== player.photo || name !== player.name;
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${POS_COLOR[player.position] ?? ""}`}>{player.position}</span>
        <span className={`text-xs font-bold ${ovrColor(overall(player))}`}>{overall(player)}</span>
      </div>
      <ImageUpload value={photo} onChange={setPhoto} size={56} round label="" />
      <input value={name} onChange={(e) => setName(e.target.value)} className="field w-full mt-2 px-2 py-1.5 text-sm" />
      <button
        disabled={!dirty}
        onClick={() => onSave(player, photo, name)}
        className="btn-primary w-full mt-2 py-1.5 text-xs disabled:opacity-40"
      >
        Salvar
      </button>
    </div>
  );
}
