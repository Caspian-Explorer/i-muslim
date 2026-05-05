"use client";

import { Slider } from "@/components/ui/slider";

interface Props {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function AgeRangeField({
  value,
  onChange,
  min = 18,
  max = 99,
  disabled,
}: Props) {
  const [lo, hi] = value;
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-sm tabular-nums">
        <span className="font-medium">{lo}</span>
        <span className="text-muted-foreground">–</span>
        <span className="font-medium">{hi}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        minStepsBetweenThumbs={1}
        value={[lo, hi]}
        disabled={disabled}
        onValueChange={(v) => {
          if (v.length === 2) onChange([v[0]!, v[1]!]);
        }}
      />
    </div>
  );
}
