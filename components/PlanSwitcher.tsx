"use client";

import { SegmentedToggle } from "./SegmentedToggle";

interface PlanSwitcherProps {
  value: "monthly" | "yearly";
  onChange: (value: "monthly" | "yearly") => void;
}

export function PlanSwitcher({ value, onChange }: PlanSwitcherProps) {
  return (
    <SegmentedToggle
      options={[
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" },
      ]}
      value={value}
      onChange={(v) => onChange(v as "monthly" | "yearly")}
    />
  );
}


