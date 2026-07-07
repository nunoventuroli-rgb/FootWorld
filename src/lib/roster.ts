import { overall } from "./engine";
import { slotsForFormation } from "./engine";

export type RosterPlayer = {
  id: number;
  position: string;
  ataque: number;
  meio: number;
  defesa: number;
};

// Assign best players to formation slots. Returns map playerId -> slotIndex (0..10)
export function autoPickStarters(players: RosterPlayer[], formation: string): Map<number, number> {
  const slots = slotsForFormation(formation);
  const assignment = new Map<number, number>();
  const used = new Set<number>();

  const byOverall = (a: RosterPlayer, b: RosterPlayer) => overall(b) - overall(a);

  slots.forEach((slot, slotIndex) => {
    // prefer exact position match
    let pool = players.filter((p) => !used.has(p.id) && p.position === slot.pos);
    if (pool.length === 0) {
      // relaxed match for compatible positions
      const compat: Record<string, string[]> = {
        GOL: ["GOL"],
        ZAG: ["ZAG", "LAT", "VOL"],
        LAT: ["LAT", "ZAG", "VOL"],
        VOL: ["VOL", "MEI", "ZAG"],
        MEI: ["MEI", "VOL", "ATA"],
        ATA: ["ATA", "MEI"],
      };
      const allowed = compat[slot.pos] ?? [];
      pool = players.filter((p) => !used.has(p.id) && allowed.includes(p.position));
    }
    if (pool.length === 0) {
      pool = players.filter((p) => !used.has(p.id));
    }
    pool.sort(byOverall);
    const chosen = pool[0];
    if (chosen) {
      used.add(chosen.id);
      assignment.set(chosen.id, slotIndex);
    }
  });

  return assignment;
}
