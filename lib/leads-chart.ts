export type LeadPoint = {
  qtd: number;
  created_at: string;
};

/** Sparkline / gráfico SVG puro (sem lib extra). */
export function buildSparklinePath(
  points: LeadPoint[],
  width: number,
  height: number,
  padding = 2,
): { line: string; area: string; last: LeadPoint | null } {
  if (points.length === 0) {
    return { line: "", area: "", last: null };
  }

  const values = points.map((p) => p.qtd);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? padding + innerW / 2
        : padding + (index / (points.length - 1)) * innerW;
    const y = padding + innerH - ((point.qtd - min) / range) * innerH;
    return { x, y };
  });

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");

  const first = coords[0]!;
  const lastCoord = coords[coords.length - 1]!;
  const area = `${line} L${lastCoord.x.toFixed(2)} ${(padding + innerH).toFixed(2)} L${first.x.toFixed(2)} ${(padding + innerH).toFixed(2)} Z`;

  return { line, area, last: points[points.length - 1] ?? null };
}
