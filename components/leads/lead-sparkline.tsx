"use client";

import { buildSparklinePath, type LeadPoint } from "@/lib/leads-chart";
import { cn } from "@/lib/utils";

export function LeadSparkline({
  points,
  width = 56,
  height = 20,
  className,
}: {
  points: LeadPoint[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (points.length < 2) {
    return (
      <span
        className={cn("inline-block text-[10px] text-muted-foreground", className)}
        aria-hidden
      >
        ···
      </span>
    );
  }

  const { line, area } = buildSparklinePath(points, width, height);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible text-primary", className)}
      aria-hidden
    >
      <path d={area} fill="currentColor" opacity={0.15} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
