#!/usr/bin/env python3
"""Generate reproducible participant randomization tables for ICNS studies."""

from __future__ import annotations

import argparse
import csv
import random
from pathlib import Path

STUDY_CONFIG = {
    "study1": {"n": 136, "conditions": ["s1_interactive_ai", "s1_control"], "block": 4},
    "study2": {"n": 252, "conditions": ["s2_interactive_ai", "s2_static_ai", "s2_control"], "block": 6},
    "study3": {"n": 234, "conditions": ["s3_interactive_ai", "s3_control"], "block": 4},
    "study4": {"n": 210, "conditions": ["s4_correction", "s4_control"], "block": 6},
}


def build_assignments(study_id: str, seed: int) -> list[tuple[str, str]]:
    cfg = STUDY_CONFIG[study_id]
    n = cfg["n"]
    conditions = cfg["conditions"]
    block = cfg["block"]

    if n % block != 0:
        raise ValueError(f"Total N ({n}) must be divisible by block size ({block})")

    rng = random.Random(seed)
    participants = [f"S{study_id[-1]}-P{i:04d}" for i in range(1, n + 1)]

    per_block = block // len(conditions)
    block_template = []
    for cond in conditions:
        block_template.extend([cond] * per_block)

    assignments = []
    for i in range(0, n, block):
        block_rows = block_template.copy()
        rng.shuffle(block_rows)
        for j, cond in enumerate(block_rows):
            assignments.append((participants[i + j], cond))

    return assignments


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--study", choices=STUDY_CONFIG.keys(), required=True)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--out", type=Path, default=Path("outputs/randomization.csv"))
    args = parser.parse_args()

    rows = build_assignments(args.study, args.seed)
    args.out.parent.mkdir(parents=True, exist_ok=True)

    with args.out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["participant_id", "condition_id"])
        writer.writerows(rows)

    print(f"Saved {len(rows)} assignments to {args.out}")


if __name__ == "__main__":
    main()
