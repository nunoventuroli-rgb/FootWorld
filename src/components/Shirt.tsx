"use client";

/**
 * Antigamente desenhava a camisa; agora representa o ESCUDO do time.
 * - Se houver `badge` (imagem), mostra a imagem.
 * - Senão, gera um escudo circular com as cores e a sigla do time.
 * Mantém as props antigas (cor1, cor2, padrao, size, badge) para compatibilidade,
 * e aceita `sigla` opcional para exibir as iniciais.
 */
export function Shirt({
  cor1,
  cor2,
  size = 28,
  badge,
  sigla,
}: {
  cor1: string;
  cor2: string;
  padrao?: string;
  size?: number;
  badge?: string;
  sigla?: string;
}) {
  if (badge) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={badge}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
        className="inline-block shrink-0"
      />
    );
  }
  const letters = (sigla || "").slice(0, 3).toUpperCase();
  const fontSize = Math.max(7, Math.round(size * (letters.length >= 3 ? 0.32 : 0.42)));
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 rounded-full font-black leading-none select-none"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${cor1}, ${shade(cor1, -20)})`,
        color: cor2,
        border: `1.5px solid ${cor2}`,
        fontSize,
        boxShadow: "inset 0 -2px 6px rgba(0,0,0,0.35)",
      }}
    >
      {letters}
    </span>
  );
}

function shade(hex: string, percent: number): string {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, r + Math.round((255 * percent) / 100)));
  g = Math.max(0, Math.min(255, g + Math.round((255 * percent) / 100)));
  b = Math.max(0, Math.min(255, b + Math.round((255 * percent) / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
