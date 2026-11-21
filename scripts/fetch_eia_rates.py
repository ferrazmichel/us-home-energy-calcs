"""Fetch latest US state residential electricity prices from the official EIA API v2.

Usage:
    1. Optional: Register for a free API key at https://www.eia.gov/opendata/register.php
       and set EIA_API_KEY in your shell or .env file (falls back to DEMO_KEY).
    2. Run to inspect JSON only:
         python3 scripts/fetch_eia_rates.py
    3. Or fetch and update src/data/usStatesEnergy.ts directly:
         python3 scripts/fetch_eia_rates.py --apply
"""

from __future__ import annotations

import argparse
import json
import os
import re
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

EIA_RETAIL_SALES_ENDPOINT = "https://api.eia.gov/v2/electricity/retail-sales/data/"
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_FILE = SCRIPT_DIR / "eia_latest_residential_rates.json"
TS_DATA_FILE = PROJECT_ROOT / "src" / "data" / "usStatesEnergy.ts"

US_STATES_AND_DC = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
    "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
    "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX",
    "UT", "VT", "VA", "WA", "WV", "WI", "WY",
}


def build_ssl_context() -> ssl.SSLContext:
    """Create SSL context using certifi CA bundle when available."""
    try:
        import certifi  # type: ignore import-not-found

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def load_api_key() -> tuple[str, bool]:
    """Read EIA_API_KEY from env or .env, falling back to DEMO_KEY."""
    env_key = os.getenv("EIA_API_KEY", "").strip()
    if env_key:
        return env_key, False

    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            k, v = stripped.split("=", 1)
            if k.strip() == "EIA_API_KEY":
                cleaned = v.strip().strip('"').strip("'")
                if cleaned:
                    return cleaned, False

    return "DEMO_KEY", True


def fetch_latest_residential_rates(api_key: str) -> dict[str, dict[str, object]]:
    """Query EIA API v2 for the latest monthly residential electricity price (cents/kWh)."""
    params = [
        ("api_key", api_key),
        ("frequency", "monthly"),
        ("data[0]", "price"),
        ("facets[sectorid][]", "RES"),
        ("sort[0][column]", "period"),
        ("sort[0][direction]", "desc"),
        ("offset", "0"),
        ("length", "500"),
    ]
    url = f"{EIA_RETAIL_SALES_ENDPOINT}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})

    with urllib.request.urlopen(req, timeout=30, context=build_ssl_context()) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    rows = payload.get("response", {}).get("data", [])
    latest_by_state: dict[str, dict[str, object]] = {}

    for row in rows:
        state_id = str(row.get("stateid") or "").upper()
        if state_id not in US_STATES_AND_DC and state_id != "US":
            continue
        if state_id in latest_by_state:
            continue
        price = row.get("price")
        if price is None:
            continue
        latest_by_state[state_id] = {
            "period": row.get("period"),
            "state": state_id,
            "stateDescription": row.get("stateDescription"),
            "cents_per_kwh": round(float(price), 2),
        }

    return latest_by_state


def apply_rates_to_typescript(
    rates: dict[str, dict[str, object]], ts_path: Path = TS_DATA_FILE
) -> tuple[int, str]:
    """Update electricityCentsPerKwh and DATA_METADATA in src/data/usStatesEnergy.ts."""
    expected_codes = US_STATES_AND_DC | {"US"}
    missing = sorted(expected_codes - set(rates.keys()))
    if missing:
        raise ValueError(f"Missing EIA rates for: {', '.join(missing)}")

    latest_period = str(rates["US"].get("period") or max(str(v["period"]) for v in rates.values()))
    content = ts_path.read_text(encoding="utf-8")

    content, meta_label_subs = re.subn(
        r'(sourceLabel:\s*)"[^"]+"',
        rf'\1"U.S. EIA Official Retail Electricity Data ({latest_period}) & DOE/AFDC Benchmarks"',
        content,
        count=1,
    )
    content, meta_ver_subs = re.subn(
        r'(baselineVersion:\s*)"[^"]+"',
        rf'\1"{latest_period}-EIA-v2"',
        content,
        count=1,
    )
    if meta_label_subs != 1 or meta_ver_subs != 1:
        raise RuntimeError("Could not update DATA_METADATA fields in usStatesEnergy.ts")

    updated_codes: set[str] = set()

    def replace_rate(match: re.Match[str]) -> str:
        prefix, abbr, _old_val, suffix = match.groups()
        if abbr not in rates:
            return match.group(0)
        new_rate = round(float(rates[abbr]["cents_per_kwh"]), 2)
        updated_codes.add(abbr)
        return f"{prefix}{new_rate}{suffix}"

    pattern = re.compile(
        r'(abbr:\s*"([A-Z]{2})",[^}]*?electricityCentsPerKwh:\s*)([0-9.]+)(,)',
        re.DOTALL,
    )
    content = pattern.sub(replace_rate, content)

    if updated_codes != expected_codes:
        still_missing = sorted(expected_codes - updated_codes)
        raise RuntimeError(
            f"Expected 52 updates in usStatesEnergy.ts, got {len(updated_codes)}. Missing: {still_missing}"
        )

    ts_path.write_text(content, encoding="utf-8")
    return len(updated_codes), latest_period


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fetch latest residential electricity rates from U.S. EIA API v2."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Also patch src/data/usStatesEnergy.ts with the fetched rates.",
    )
    args = parser.parse_args()

    api_key, is_demo = load_api_key()
    if is_demo:
        print("Notice: EIA_API_KEY not set; using api.data.gov DEMO_KEY.")

    try:
        rates = fetch_latest_residential_rates(api_key)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:400]
        print(f"HTTP error from EIA API ({exc.code}): {body}", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"Network error calling EIA API: {exc}", file=sys.stderr)
        return 1

    OUTPUT_FILE.write_text(
        json.dumps(rates, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    print(f"Saved {len(rates)} state/national residential rate records to {OUTPUT_FILE}")

    if args.apply:
        try:
            updated_count, period = apply_rates_to_typescript(rates)
        except (RuntimeError, ValueError) as exc:
            print(f"Error updating {TS_DATA_FILE}: {exc}", file=sys.stderr)
            return 1
        print(f"Updated {updated_count} profiles in {TS_DATA_FILE} (EIA period: {period})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
