"use client";

import { PlayerT } from "@/lib/types";
import { slotsForFormation, overall } from "@/lib/engine";
import { ovrColor } from "@/lib/utils";

export function Pitch({
  formation,
  starters,
  onSlotClick,
  selectedPlayerId,
}: {
  formation: string;
  starters: PlayerT[];
  onSlotClick?: (slotIndex: number, player: PlayerT | null) => void;
  selectedPlayerId?: number | null;
}) {
  const slots = slotsForFormation(formation);
  const bySlot = new Map<number, PlayerT>();
  starters.forEach((p) => {
    if (p.slotIndex >= 0) bySlot.set(p.slotIndex, p);
  });

  return (
    <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden pitch-bg border border-white/10">
      {/* field markings */}
      <div className="absolute inset-3 border-2 border-white/25 rounded" />
      <div className="absolute left-3 right-3 top-1/2 h-0.5 bg-white/25" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/25 rounded-full" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-32 h-16 border-2 border-white/25 border-b-0" />
      <div className="absolute left-1/2 -translate-x-1/2 top-3 w-32 h-16 border-2 border-white/25 border-t-0" />

      {slots.map((slot, idx) => {
        const player = bySlot.get(idx) ?? null;
        const selected = player && player.id === selectedPlayerId;
        return (
          <button
            key={idx}
            onClick={() => onSlotClick?.(idx, player)}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group ${
              onSlotClick ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <div
              className={`relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 overflow-hidden ${
                selected ? "border-yellow-300 scale-110" : "border-white/60"
              } bg-slate-900/90`}
            >
              {player ? (
                player.photo ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={player.photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute -bottom-0.5 -right-0.5 bg-slate-900 rounded-full px-1 text-[9px] font-black border border-white/30" style={{ lineHeight: "1.1" }}>
                      <span className={ovrColor(overall(player))}>{overall(player)}</span>
                    </span>
                  </>
                ) : (
                  <span className={ovrColor(overall(player))}>{overall(player)}</span>
                )
              ) : (
                <span className="text-slate-500">+</span>
              )}
            </div>
            <div className="mt-0.5 px-1 rounded bg-slate-900/80 text-[9px] font-semibold max-w-[70px] truncate">
              {player ? player.name.split(" ").slice(-1)[0] : slot.pos}
            </div>
          </button>
        );
      })}
    </div>
  );
}
