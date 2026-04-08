#!/usr/bin/env python3
"""
Batch-upsert multi-ticker daily model signals into Supabase `market_signals`.

Expected CSV columns:
  ticker,signal_date,direction,prob_side,prediction_horizon

Optional CSV columns:
  source,model_version_id,retrain_id,metadata

Examples:
  python scripts/upsert_market_signals.py --csv data/signals.csv
  python scripts/upsert_market_signals.py --csv data/signals.csv --tickers SPY,AAPL,NVDA
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import requests


def load_env_file(path: Path) -> Dict[str, str]:
    env: Dict[str, str] = {}
    if not path.exists():
        return env

    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def chunked(items: List[dict], size: int) -> Iterable[List[dict]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def normalize_direction(raw: str) -> Optional[str]:
    value = raw.strip().lower()
    if value in {"bullish", "buy", "long", "in"}:
        return "bullish"
    if value in {"bearish", "sell", "short"}:
        return "bearish"
    if value in {"neutral", "hold", "flat", "out"}:
        return "neutral"
    return None


def normalize_prob_side(raw: str) -> Optional[float]:
    if raw is None:
        return None
    text = raw.strip()
    if not text:
        return None
    try:
        value = float(text)
    except ValueError:
        return None

    if value > 1.0 and value <= 100.0:
        value = value / 100.0
    if value < 0 or value > 1:
        return None
    return value


def normalize_horizon(raw: str) -> Optional[int]:
    if raw is None:
        return None
    text = raw.strip()
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def normalize_date(raw: str) -> Optional[str]:
    text = (raw or "").strip()
    if len(text) >= 10:
        candidate = text[:10]
        if candidate.count("-") == 2:
            return candidate
    return None


def parse_metadata(raw: str) -> Optional[dict]:
    text = (raw or "").strip()
    if not text:
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if isinstance(data, dict):
        return data
    return None


def post_upsert(
    *,
    base_url: str,
    service_role_key: str,
    table: str,
    on_conflict: str,
    rows: List[dict],
) -> None:
    if not rows:
        return

    url = f"{base_url}/rest/v1/{table}?on_conflict={on_conflict}"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    response = requests.post(url, headers=headers, data=json.dumps(rows), timeout=30)
    if response.status_code >= 300:
        raise RuntimeError(
            f"Upsert failed for table={table}, status={response.status_code}, body={response.text[:600]}"
        )


def build_rows(csv_path: Path, source_default: str, tickers: Optional[set[str]]) -> List[dict]:
    rows: List[dict] = []

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for i, record in enumerate(reader, start=2):
            ticker = (record.get("ticker") or "").strip().upper()
            if not ticker:
                continue
            if tickers and ticker not in tickers:
                continue

            signal_date = normalize_date(record.get("signal_date") or "")
            direction = normalize_direction(record.get("direction") or "")

            if not signal_date or not direction:
                print(f"[skip] row {i}: invalid signal_date or direction")
                continue

            row = {
                "ticker": ticker,
                "signal_date": signal_date,
                "direction": direction,
                "prob_side": normalize_prob_side(record.get("prob_side") or ""),
                "prediction_horizon": normalize_horizon(record.get("prediction_horizon") or ""),
                "source": (record.get("source") or "").strip() or source_default,
                "model_version_id": (record.get("model_version_id") or "").strip() or None,
                "retrain_id": (record.get("retrain_id") or "").strip() or None,
                "metadata": parse_metadata(record.get("metadata") or ""),
            }
            rows.append(row)

    return rows


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Batch-upsert multi-ticker model signals into Supabase market_signals."
    )
    parser.add_argument("--csv", required=True, help="CSV file with signal rows.")
    parser.add_argument(
        "--env-file",
        default=".env.local",
        help="Path to env file containing Supabase vars (default: .env.local)",
    )
    parser.add_argument(
        "--tickers",
        default="",
        help="Optional comma-separated ticker filter.",
    )
    parser.add_argument(
        "--source",
        default="model_batch",
        help="Default source value if CSV row omits `source`.",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=500,
        help="Rows per upsert batch (default: 500).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate/parse rows but do not write to Supabase.",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise RuntimeError(f"CSV file not found: {csv_path}")

    env = load_env_file(Path(args.env_file))
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_role = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not supabase_url:
        raise RuntimeError(f"NEXT_PUBLIC_SUPABASE_URL is missing in {args.env_file}")
    if not service_role:
        raise RuntimeError(f"SUPABASE_SERVICE_ROLE_KEY is missing in {args.env_file}")

    ticker_filter = {
        t.strip().upper() for t in args.tickers.split(",") if t.strip()
    } or None

    rows = build_rows(csv_path, source_default=args.source, tickers=ticker_filter)
    if not rows:
        raise RuntimeError("No valid rows to upsert.")

    print(f"[info] parsed rows={len(rows)}")
    if args.dry_run:
        print("[dry-run] no writes performed")
        return

    uploaded = 0
    for batch in chunked(rows, max(1, args.chunk_size)):
        post_upsert(
            base_url=supabase_url,
            service_role_key=service_role,
            table="market_signals",
            on_conflict="ticker,signal_date",
            rows=batch,
        )
        uploaded += len(batch)

    print(f"[ok] upserted rows={uploaded} into market_signals")


if __name__ == "__main__":
    main()
