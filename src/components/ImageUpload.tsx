"use client";

import { useRef, useState } from "react";

/**
 * Botão de upload que reduz a imagem para um data URL pequeno (base64)
 * e devolve via onChange. Ideal para escudos, fotos de jogadores, etc.
 */
export function ImageUpload({
  value,
  onChange,
  size = 64,
  round = false,
  label = "Imagem",
  max = 160,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
  size?: number;
  round?: boolean;
  label?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const dataUrl = await downscale(file, max);
      onChange(dataUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ width: size, height: size }}
        className={`relative overflow-hidden border-2 border-dashed border-white/20 hover:border-emerald-400/60 bg-white/[0.04] flex items-center justify-center transition shrink-0 ${
          round ? "rounded-full" : "rounded-xl"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-slate-500 text-xl">＋</span>
        )}
        {busy && <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs">...</span>}
      </button>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">{label}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-ghost px-2.5 py-1 text-xs">
            Enviar
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-red-400 hover:text-red-300 text-xs px-1">
              Remover
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function downscale(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
