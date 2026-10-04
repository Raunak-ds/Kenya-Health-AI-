#!/usr/bin/env python3
import sys
from pathlib import Path as _Path
_ROOT = _Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path: sys.path.insert(0, str(_ROOT))
from pathlib import Path
import json, random, shutil
from collections import defaultdict, Counter

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "data" / "plantvillage_selected"
SEED = 42


def main():
    meta_path = BASE / "metadata.json"
    if not meta_path.exists():
        from scripts.download_dataset import main as download
        download()
    rows = json.loads(meta_path.read_text())
    rng = random.Random(SEED)
    # Critical leakage protection: split by physical leaf_id where available, never by image alone.
    by_label_leaf = defaultdict(lambda: defaultdict(list))
    test_rows = []
    for r in rows:
        if r["source_split"] == "test":
            test_rows.append(r)
        else:
            by_label_leaf[r["label"]][r["leaf_id"]].append(r)
    train_rows, val_rows = [], []
    for label, groups in by_label_leaf.items():
        leaf_ids = list(groups); rng.shuffle(leaf_ids)
        n_val = max(1, round(0.15 * len(leaf_ids)))
        val_ids = set(leaf_ids[:n_val])
        for leaf_id, items in groups.items():
            (val_rows if leaf_id in val_ids else train_rows).extend(items)
    for split, split_rows in [("train", train_rows), ("val", val_rows), ("test", test_rows)]:
        split_dir = BASE / split
        if split_dir.exists(): shutil.rmtree(split_dir)
        for r in split_rows:
            src = BASE / r["path"]
            dst = split_dir / r["label"] / src.name
            dst.parent.mkdir(parents=True, exist_ok=True)
            try: dst.hardlink_to(src)
            except OSError: shutil.copy2(src, dst)
    summary = {s: dict(Counter(r["label"] for r in rs)) for s, rs in [("train",train_rows),("val",val_rows),("test",test_rows)]}
    (BASE / "split_summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
    print("Prepared leakage-aware train/val/test folders.")

if __name__ == "__main__": main()
