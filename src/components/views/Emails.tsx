"use client";

import { useState } from "react";
import { CareerState, EmailT } from "@/lib/types";
import { formatMoney } from "@/lib/engine";

const TYPE_META: Record<string, { icon: string; label: string }> = {
  welcome: { icon: "👋", label: "Boas-vindas" },
  offer: { icon: "💸", label: "Proposta" },
  market: { icon: "🔁", label: "Mercado" },
  info: { icon: "ℹ️", label: "Aviso" },
};

export function Emails({ state, onChanged, careerId }: { state: CareerState; onChanged: () => void; careerId: number }) {
  const emails = state.emails ?? [];
  const [open, setOpen] = useState<EmailT | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function post(action: string, emailId?: number) {
    setBusy(true); setMsg("");
    const res = await fetch(`/api/careers/${careerId}/emails`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, emailId }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) setMsg(`⚠️ ${data.error}`);
    else if (action === "acceptOffer") { setMsg(`✅ Venda concluída por $${formatMoney(data.amount)}!`); setOpen(null); }
    else if (action === "rejectOffer") { setMsg("Proposta recusada."); setOpen(null); }
    onChanged();
  }

  function openEmail(e: EmailT) {
    setOpen(e);
    if (!e.read) post("markRead", e.id);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Caixa de Entrada</h2>
          {emails.some((e) => !e.read) && (
            <button onClick={() => post("markAllRead")} className="text-xs text-slate-400 hover:text-white">Marcar tudo lido</button>
          )}
        </div>
        <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
          {emails.length === 0 && <p className="text-slate-500 text-sm">Sem mensagens.</p>}
          {emails.map((e) => {
            const meta = TYPE_META[e.type] ?? TYPE_META.info;
            return (
              <button key={e.id} onClick={() => openEmail(e)}
                className={`w-full text-left rounded-lg px-3 py-2 flex items-start gap-2 transition ${
                  open?.id === e.id ? "bg-emerald-500/15 ring-1 ring-emerald-500/40" : e.read ? "bg-slate-800/40 hover:bg-slate-800" : "bg-slate-800 hover:bg-slate-700"
                }`}>
                <span className="text-lg">{meta.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm truncate ${e.read ? "text-slate-300" : "font-semibold"}`}>{e.subject}</div>
                  <div className="text-[10px] text-slate-500">
                    {meta.label} · Rodada {e.round}
                    {e.type === "offer" && e.offerStatus === "pending" && <span className="text-yellow-400 ml-1">• pendente</span>}
                  </div>
                </div>
                {!e.read && <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-6">
        {msg && <div className="mb-3 text-sm">{msg}</div>}
        {!open ? (
          <p className="text-slate-500 text-center py-16">Selecione uma mensagem para ler.</p>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-1">{open.subject}</h2>
            <div className="text-xs text-slate-500 mb-4">Rodada {open.round}</div>
            <p className="text-slate-200 leading-relaxed whitespace-pre-line">{open.body}</p>

            {open.type === "offer" && open.offerStatus === "pending" && (
              <div className="mt-6 flex gap-3">
                <button disabled={busy} onClick={() => post("acceptOffer", open.id)}
                  className="btn-primary px-5 py-2 rounded-lg">
                  Aceitar (${formatMoney(open.offerAmount ?? 0)})
                </button>
                <button disabled={busy} onClick={() => post("rejectOffer", open.id)}
                  className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg">Recusar</button>
              </div>
            )}
            {open.type === "offer" && open.offerStatus !== "pending" && (
              <div className="mt-6 text-sm text-slate-400">
                Status da proposta: <b className="text-slate-200">{open.offerStatus === "accepted" ? "Aceita" : open.offerStatus === "rejected" ? "Recusada" : open.offerStatus}</b>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
