"""Fetch latest US state residential electricity prices from the official EIA API v2.

Usage:
    1. Register for a free API key at https://www.eia.gov/opendata/register.php
    2. Set EIA_API_KEY in your shell or .env file.
    3. Run:
         python scripts/fetch_eia_rates.py
    4. Review the output JSON in scripts/eia_latest_residential_rates.json and
       update src/data/usStatesEnergy.ts accordingly.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

EIA_RETAIL_SALES_ENDPOINT = "https://api.eia.gov/v2/electricity/retail-sales/data/"
OUTPUT_FILE = Path(__file__).resolve().parent / "eia_latest_residential_rates.json"

US_STATES_AND_DC = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA",
    "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY",
    "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX",
    "UT", "VT", "VA", "WA", "WV", "WI", "WY",
}


def load_api_key() -> str:
    """Read EIA_API_KEY from environment or project .env file."""
    env_key = os.getenv("EIA_API_KEY", "").strip()
    if env_key:
        return env_key

    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            k, v = stripped.split("=", 1)
            if k.strip() == "EIA_API_KEY":
                return v.strip().strip('"').strip("'")

    return ""


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

    with urllib.request.urlopen(req, timeout=30) as resp:
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


def main() -> int:
    api_key = load_api_key()
    if not api_key:
        print(
            "Error: EIA_API_KEY not found. Register free at https://www.eia.gov/opendata/register.php",
            file=sys.stderr,
        )
        return 1

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
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
