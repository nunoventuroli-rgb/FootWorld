"use client";

import { PlayerT, TeamT } from "@/lib/types";
import { overall } from "@/lib/engine";
import { fifaAttrs, ATTR_LABELS, attrColor, attrBarColor } from "@/lib/attributes";
import { ovrColor, POS_COLOR } from "@/lib/utils";
import { POS_LABEL } from "@/lib/names";
import { fmtMoney } from "@/lib/currency";
import { marketValue } from "@/lib/engine";
import { Shirt } from "./Shirt";

export function PlayerCard({
  player,
  team,
  currency,
  onClose,
  hidden = false,
}: {
  player: PlayerT;
  team?: TeamT;
  currency: string;
  onClose: () => void;
  hidden?: boolean;
}) {
  const ovr = overall(player);
  const attrs = fifaAttrs(player);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header estilo card FIFA */}
        <div
          className="p-5 flex items-center gap-4"
          style={{ background: `linear-gradient(135deg, ${team?.cor1 ?? "#1e293b"}, rgba(0,0,0,0.6))` }}
        >
          <div className="w-20 h-20 rounded-xl bg-black/30 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
            {player.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-black ${hidden ? "text-white" : ovrColor(ovr)}`}>{hidden ? "?" : ovr}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${POS_COLOR[player.position] ?? ""}`}>{player.position}</span>
            </div>
            <div className="text-lg font-bold truncate">{player.name}</div>
            <div className="text-xs text-emerald-300 font-semibold">{POS_LABEL[player.position] ?? player.position}</div>
            <div className="text-xs text-white/70 flex items-center gap-1.5">
              {team && <Shirt cor1={team.cor1} cor2={team.cor2} padrao={team.padrao} size={14} badge={team.badge} sigla={team.sigla} />}
              {team?.name} · {player.idade} anos
            </div>
          </div>
        </div>

        {/* Atributos FIFA */}
        <div className="p-5">
          {hidden ? (
            <div className="text-center text-slate-400 py-6 text-sm">
              🔍 Atributos desconhecidos.<br />Espione o clube para revelar.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
              {ATTR_LABELS.map(({ key, label }) => {
                const v = attrs[key];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-slate-400">{label}</span>
                      <span className={`font-bold ${attrColor(v)}`}>{v}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full ${attrBarColor(v)}`} style={{ width: `${v}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!hidden && (
            <div className="grid grid-cols-3 gap-2 mt-5 text-center">
              <Mini label="Potencial" value={String(player.potential)} color={ovrColor(player.potential)} />
              <Mini label="Valor" value={fmtMoney(marketValue(player), currency)} />
              <Mini label="Moral" value={`${player.morale}`} color={player.morale >= 70 ? "text-emerald-400" : player.morale >= 45 ? "text-yellow-400" : "text-red-400"} />
              <Mini label="Gols" value={`${player.gols}`} />
              <Mini label="Assist." value={`${player.assists}`} />
              <Mini label="Jogos" value={`${player.jogos}`} />
            </div>
          )}
        </div>

        <button onClick={onClose} className="btn-ghost w-full rounded-none py-3">Fechar</button>
      </div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white/[0.04] rounded-lg py-1.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-sm font-bold ${color ?? "text-white"}`}>{value}</div>
    </div>
  );
}
