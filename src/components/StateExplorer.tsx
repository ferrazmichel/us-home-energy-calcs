"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { UsRegion } from "@/data/usStatesEnergy";
import { formatUsd } from "@/lib/calculators";
import type { StateRankedSummary } from "@/lib/stateRankings";

interface StateExplorerProps {
  states: StateRankedSummary[];
}

type RegionFilter = "All" | UsRegion;
type SortOption = "alpha" | "cheapest" | "savings";

const REGIONS: RegionFilter[] = ["All", "Northeast", "Midwest", "South", "West"];

export default function StateExplorer({ states }: StateExplorerProps) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("alpha");

  const filteredStates = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = states.filter((item) => {
      if (region !== "All" && item.profile.region !== region) {
        return false;
      }
      if (!q) return true;
      return (
        item.profile.name.toLowerCase().includes(q) ||
        item.profile.abbr.toLowerCase().includes(q)
      );
    });

    if (sortBy === "cheapest") {
      return [...filtered].sort((a, b) => a.electricityRank - b.electricityRank);
    }
    if (sortBy === "savings") {
      return [...filtered].sort((a, b) => a.savingsRank - b.savingsRank);
    }
    return filtered;
  }, [states, query, region, sortBy]);

  const hasFilters = query.trim() !== "" || region !== "All" || sortBy !== "alpha";

  return (
    <div>
      {/* Filter Controls */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <label htmlFor="state-search" className="sr-only">
            Search US state
          </label>
          <input
            id="state-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search state (e.g., California, TX)..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 sm:max-w-xs"
          />

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by US region">
            {REGIONS.map((item) => {
              const active = region === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRegion(item)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <label htmlFor="state-sort" className="text-xs font-medium text-slate-500">
            Sort:
          </label>
          <select
            id="state-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="alpha">A–Z</option>
            <option value="cheapest">Lowest ¢/kWh</option>
            <option value="savings">Highest Annual Savings</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-800">{filteredStates.length}</strong> of{" "}
          {states.length} jurisdictions
        </span>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setRegion("All");
              setSortBy("alpha");
            }}
            className="font-semibold text-emerald-700 hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredStates.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          No matching US states found for &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredStates.map((item) => {
            const savings = item.baseline.annualSavingsVsGas;
            const savingsPositive = savings >= 0;
            return (
              <Link
                key={item.profile.slug}
                href={`/ev-charging-cost/${item.profile.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-emerald-500 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-semibold text-slate-900 group-hover:text-emerald-700">
                    {item.profile.name}
                  </span>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                    {item.profile.abbr}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {item.profile.electricityCentsPerKwh.toFixed(1)}¢/kWh · $
                  {item.profile.gasPricePerGallon.toFixed(2)}/gal
                </p>
                <p
                  className={`mt-1 text-[11px] font-semibold ${
                    savingsPositive ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {savingsPositive ? "+" : "-"}
                  {formatUsd(Math.abs(savings))}/yr vs. gas
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

