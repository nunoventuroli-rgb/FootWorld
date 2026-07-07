"use client";

import { TeamT } from "@/lib/types";
import { standings, saldoGols } from "@/lib/utils";
import { Shirt } from "./Shirt";
import { continentalFor } from "@/lib/continental";

export function StandingsTable({
  teams,
  myTeamId,
  compact = false,
  showLegend = false,
  topDivision = true,
}: {
  teams: TeamT[];
  myTeamId: number;
  compact?: boolean;
  showLegend?: boolean;
  topDivision?: boolean; // só a 1ª divisão dá vaga continental
}) {
  const table = standings(teams.filter((t) => t.id > 0));

  // competição continental conforme o país da liga (Champions na Europa,
  // Libertadores na América do Sul, etc.) — só vale para a 1ª divisão
  const pais = table[0]?.pais;
  const cont = topDivision ? continentalFor(pais) : null;
  const primarySlots = cont?.primarySlots ?? 0;
  const secStart = primarySlots + 1;
  const secEnd = primarySlots + (cont?.secondarySlots ?? 0);

  function zoneFor(pos: number): { color: string; border: string } {
    if (cont && pos <= primarySlots) return { color: cont.primaryColor, border: `2px solid ${cont.primaryColor}` };
    if (cont?.secondary && pos >= secStart && pos <= secEnd) return { color: cont.secondaryColor!, border: `2px solid ${cont.secondaryColor}` };
    if (pos > table.length - 4) return { color: "#ef4444", border: "2px solid #ef4444" };
    return { color: "", border: "2px solid transparent" };
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-white/10">
              <th className="text-left py-2 pl-2 w-8">#</th>
              <th className="text-left">Clube</th>
              <th className="w-8 text-center">P</th>
              <th className="w-8 text-center">J</th>
              {!compact && <th className="w-8 text-center">V</th>}
              {!compact && <th className="w-8 text-center">E</th>}
              {!compact && <th className="w-8 text-center">D</th>}
              {!compact && <th className="w-10 text-center">GP</th>}
              {!compact && <th className="w-10 text-center">GC</th>}
              <th className="w-10 text-center">SG</th>
            </tr>
          </thead>
          <tbody>
            {table.map((t, i) => {
              const pos = i + 1;
              const z = zoneFor(pos);
              return (
                <tr
                  key={t.id}
                  style={{ borderLeft: z.border }}
                  className={`${t.id === myTeamId ? "bg-emerald-500/10 font-semibold" : "hover:bg-white/5"}`}
                >
                  <td className="py-1.5 pl-2 text-slate-400">{pos}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Shirt cor1={t.cor1} cor2={t.cor2} padrao={t.padrao} size={20} badge={t.badge} sigla={t.sigla} />
                      <span className="truncate">{compact ? t.sigla : t.name}</span>
                    </div>
                  </td>
                  <td className="text-center font-bold">{t.pontos}</td>
                  <td className="text-center text-slate-400">{t.jogos}</td>
                  {!compact && <td className="text-center text-slate-400">{t.vitorias}</td>}
                  {!compact && <td className="text-center text-slate-400">{t.empates}</td>}
                  {!compact && <td className="text-center text-slate-400">{t.derrotas}</td>}
                  {!compact && <td className="text-center text-slate-400">{t.golsPro}</td>}
                  {!compact && <td className="text-center text-slate-400">{t.golsContra}</td>}
                  <td className="text-center text-slate-400">{saldoGols(t)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-400">
          {cont && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: cont.primaryColor }} />
              {cont.primary} (G{primarySlots})
            </span>
          )}
          {cont?.secondary && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: cont.secondaryColor }} />
              {cont.secondary}
            </span>
          )}
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Rebaixamento</span>
          {!cont && <span className="text-slate-500">Sem vaga continental para esta divisão</span>}
        </div>
      )}
    </div>
  );
}
