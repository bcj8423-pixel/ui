#!/usr/bin/env python3
"""Lightweight validation for ICNS experiment setup artifacts."""

from __future__ import annotations

import json
from pathlib import Path

REQUIRED_FILES = [
    Path("docs/experiment_setup.md"),
    Path("configs/studies.yaml"),
    Path("configs/instruments.json"),
    Path("configs/event_schema.json"),
    Path("scripts/generate_randomization.py"),
]


def main() -> None:
    missing = [str(p) for p in REQUIRED_FILES if not p.exists()]
    if missing:
        raise SystemExit(f"Missing required files: {missing}")

    for json_file in [Path("configs/instruments.json"), Path("configs/event_schema.json")]:
        with json_file.open("r", encoding="utf-8") as f:
            json.load(f)

    print("All required files exist and JSON files are valid.")


if __name__ == "__main__":
    main()
