#!/usr/bin/env python3
import sys
import re
from pathlib import Path as _Path
_ROOT = _Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path: sys.path.insert(0, str(_ROOT))
from pathlib import Path
from datasets import load_dataset
from tqdm import tqdm
import json
import hashlib
from ml.data.classes import SELECTED_CLASSES

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "plantvillage_selected"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print("Downloading PlantVillage from Hugging Face dataset geraldmc/plantvillage-full (CC0-1.0 dataset card).")
    ds = load_dataset("geraldmc/plantvillage-full", revision="v0.1.0", split="train")
    metadata = []
    seen_hashes = set()
    kept = duplicates = 0
    for row in tqdm(ds, desc="Filtering selected crop classes"):
        source_label = row["class_label"]
        if source_label not in SELECTED_CLASSES:
            continue
        label = SELECTED_CLASSES[source_label]
        split = row.get("split", "train")
        # Preserve upstream leaf-grouped test holdout; training rows are later split into train/val by leaf_id.
        img = row["image"].convert("RGB")
        import io
        buf = io.BytesIO(); img.save(buf, format="JPEG", quality=95); raw = buf.getvalue()
        digest = sha256_bytes(raw)
        if digest in seen_hashes:
            duplicates += 1
            continue
        seen_hashes.add(digest)
        leaf_id = str(row.get("leaf_id", digest[:16]))
        dest = OUT / "raw" / label
        dest.mkdir(parents=True, exist_ok=True)
        safe_leaf_id = re.sub(r'[<>:"/\\|?*]', '_', leaf_id)
        fn = f"{safe_leaf_id}_{digest[:10]}.jpg"
        path = dest / fn
        path.write_bytes(raw)
        metadata.append({"path": str(path.relative_to(OUT)), "label": label, "source_label": source_label,
                         "source_split": split, "leaf_id": leaf_id, "sha256": digest})
        kept += 1
    (OUT / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Saved {kept} unique selected images; skipped {duplicates} exact duplicates.")
    print("Next: python scripts/prepare_dataset.py")

if __name__ == "__main__":
    main()
