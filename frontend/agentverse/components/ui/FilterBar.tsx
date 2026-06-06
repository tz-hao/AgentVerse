'use client';

import { useState } from 'react';

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterOption[];
  onApply: (values: Record<string, string>) => void;
  onReset: () => void;
}

export default function FilterBar({ filters, onApply, onReset }: FilterBarProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-iron-dark/50 border border-metal-silver/20 rounded-xl p-4 flex flex-wrap items-end gap-4">
      {filters.map((f) => (
        <div key={f.key} className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-metal-silver/50 font-semibold">{f.label}</label>
          <select
            value={values[f.key] || ''}
            onChange={(e) => handleChange(f.key, e.target.value)}
            className="bg-deep-space border border-metal-silver/30 rounded-lg px-3 py-2 text-sm text-metal-silver focus:border-iron-red focus:outline-none transition min-w-[140px]"
          >
            <option value="">全部</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      ))}
      <div className="flex gap-2 ml-auto">
        <button
          onClick={() => { setValues({}); onReset(); }}
          className="px-4 py-2 rounded-lg border border-metal-silver/30 text-metal-silver/60 text-sm hover:text-white hover:border-metal-silver transition"
        >
          <i className="fas fa-rotate-left mr-1.5" /> 重置
        </button>
        <button
          onClick={() => onApply(values)}
          className="px-4 py-2 rounded-lg bg-iron-red text-white text-sm font-semibold hover:shadow-[0_0_12px_rgba(230,46,46,0.5)] transition"
        >
          <i className="fas fa-filter mr-1.5" /> 筛选
        </button>
      </div>
    </div>
  );
}
