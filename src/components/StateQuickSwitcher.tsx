"use client";

import { useRouter } from "next/navigation";

interface StateOption {
  slug: string;
  name: string;
  abbr: string;
}

interface StateQuickSwitcherProps {
  currentSlug: string;
  states: StateOption[];
  basePath?: string;
}

export default function StateQuickSwitcher({
  currentSlug,
  states,
  basePath = "/ev-charging-cost",
}: StateQuickSwitcherProps) {
  const router = useRouter();
  const sorted = [...states].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="state-quick-switch"
        className="text-xs font-medium text-slate-500 whitespace-nowrap"
      >
        Jump to state:
      </label>
      <select
        id="state-quick-switch"
        value={currentSlug}
        onChange={(e) => {
          const nextSlug = e.target.value;
          if (nextSlug && nextSlug !== currentSlug) {
            router.push(`${basePath}/${nextSlug}`);
          }
        }}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
      >
        {sorted.map((st) => (
          <option key={st.slug} value={st.slug}>
            {st.name} ({st.abbr})
          </option>
        ))}
      </select>
    </div>
  );
}

