#!/usr/bin/env python3
"""
Seed Supabase market cache tables from local Finance parquet cache files.

Usage:
  /home/franciscosantos/Finance/.venv/bin/python scripts/seed_market_cache_from_finance.py --tickers SPY
"""

from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List

import pandas as pd
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
        env[key.strip()] = value.strip()
    return env


def chunked(items: List[dict], size: int) -> Iterable[List[dict]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


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


def build_quote_row(ticker: str, df: pd.DataFrame, fetched_at: str) -> dict:
    latest = df.iloc[-1]
    close = float(latest["Close"]) if "Close" in df.columns else 0.0
    open_ = float(latest["Open"]) if "Open" in df.columns else close
    change = close - open_
    change_pct = (change / open_ * 100.0) if open_ != 0 else 0.0

    return {
        "ticker": ticker,
        "name": ticker,
        "price": close,
        "change": change,
        "change_percent": change_pct,
        "market_cap_text": "N/A",
        "source": "finance_parquet",
        "fetched_at": fetched_at,
    }


def build_history_rows(ticker: str, df: pd.DataFrame, fetched_at: str) -> List[dict]:
    rows: List[dict] = []
    for ts, row in df.iterrows():
        close = row.get("Close")
        if close is None or (isinstance(close, float) and math.isnan(close)):
            continue
        date_str = pd.Timestamp(ts).date().isoformat()
        rows.append(
            {
                "ticker": ticker,
                "date": date_str,
                "close": float(close),
                "source": "finance_parquet",
                "fetched_at": fetched_at,
            }
        )
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed market cache tables from Finance parquet cache.")
    parser.add_argument(
        "--tickers",
        default="SPY",
        help="Comma-separated tickers (default: SPY)",
    )
    parser.add_argument(
        "--finance-cache-dir",
        default="/home/franciscosantos/Finance/data_cache",
        help="Path to Finance data_cache directory",
    )
    parser.add_argument(
        "--env-file",
        default=".env.local",
        help="Path to env file containing Supabase vars (default: .env.local)",
    )
    parser.add_argument(
        "--history-limit",
        type=int,
        default=600,
        help="Number of most recent rows to upload per ticker (default: 600)",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=500,
        help="Upsert batch size for historical rows (default: 500)",
    )
    args = parser.parse_args()

    env = load_env_file(Path(args.env_file))
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_role = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not supabase_url:
        raise RuntimeError(f"NEXT_PUBLIC_SUPABASE_URL is missing in {args.env_file}")
    if not service_role:
        raise RuntimeError(f"SUPABASE_SERVICE_ROLE_KEY is missing in {args.env_file}")

    tickers = [t.strip().upper() for t in args.tickers.split(",") if t.strip()]
    if not tickers:
        raise RuntimeError("No tickers provided.")

    cache_dir = Path(args.finance_cache_dir)
    fetched_at = datetime.now(timezone.utc).isoformat()

    for ticker in tickers:
        parquet_path = cache_dir / f"stock_data_{ticker}.parquet"
        if not parquet_path.exists():
            print(f"[skip] {ticker}: missing file {parquet_path}")
            continue

        df = pd.read_parquet(parquet_path)
        if df.empty:
            print(f"[skip] {ticker}: empty parquet")
            continue

        if args.history_limit > 0:
            df = df.tail(args.history_limit)

        quote_row = build_quote_row(ticker, df, fetched_at)
        history_rows = build_history_rows(ticker, df, fetched_at)

        post_upsert(
            base_url=supabase_url,
            service_role_key=service_role,
            table="market_quotes",
            on_conflict="ticker",
            rows=[quote_row],
        )

        for batch in chunked(history_rows, args.chunk_size):
            post_upsert(
                base_url=supabase_url,
                service_role_key=service_role,
                table="market_price_daily",
                on_conflict="ticker,date",
                rows=batch,
            )

        print(f"[ok] {ticker}: quote upserted, historical rows upserted={len(history_rows)}")


if __name__ == "__main__":
    main()

