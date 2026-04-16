"use client";

import dynamic from "next/dynamic";

const GaugeComponent = dynamic(() => import("react-gauge-component"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex h-[150px] w-full max-w-[260px] items-end justify-center rounded-lg bg-zinc-100" aria-hidden />
  ),
});

const GRAY = "#E5E7EB";
const RED = "#EF4444";

type ProtectionGaugeProps = {
  level?: number;
};

export function ProtectionGauge({ level = 1 }: ProtectionGaugeProps) {
  const lv = Math.max(1, Math.min(5, level));
  const value = lv * 20;

  return (
    <div className="mx-auto w-full max-w-[280px] [&_svg]:max-h-[160px]">
      <GaugeComponent
        type="semicircle"
        marginInPercent={{ top: 0.14, bottom: 0.02, left: 0.06, right: 0.06 }}
        arc={{
          width: 0.22,
          padding: 0.018,
          cornerRadius: 1,
          subArcs: [
            { length: 0.2, color: lv >= 1 ? RED : GRAY },
            { length: 0.2, color: lv >= 2 ? "#f97316" : GRAY },
            { length: 0.2, color: lv >= 3 ? "#eab308" : GRAY },
            { length: 0.2, color: lv >= 4 ? "#84cc16" : GRAY },
            { length: 0.2, color: lv >= 5 ? "#22c55e" : GRAY },
          ],
        }}
        pointer={{
          type: "needle",
          color: "#171717",
          baseColor: "#171717",
          length: 0.72,
          width: 14,
          animate: true,
          animationDuration: 900,
        }}
        value={value}
        minValue={0}
        maxValue={100}
        labels={{
          valueLabel: { hide: true },
          tickLabels: {
            hideMinMax: true,
            ticks: [],
            defaultTickLineConfig: { hide: true },
            defaultTickValueConfig: { hide: true },
          },
        }}
      />
    </div>
  );
}
