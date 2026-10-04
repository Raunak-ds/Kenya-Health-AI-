import cv2
import numpy as np
from PIL import Image

# Project-defined heuristic, not clinically/agronomically validated.
SEVERITY_BANDS = [(10, "Mild"), (25, "Moderate"), (100, "Severe")]

def estimate_severity(image: Image.Image):
    rgb = np.array(image.convert("RGB"))
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = cv2.split(hsv)
    leaf = (s > 35) & (v > 30)
    if leaf.sum() == 0:
        return {"affected_percent": 0.0, "category": "Unknown", "method": "HSV heuristic"}
    healthy_green = leaf & (h >= 30) & (h <= 95) & (s > 45) & (v > 45)
    affected = leaf & (~healthy_green)
    pct = float(100.0 * affected.sum() / max(1, leaf.sum()))
    category = next(label for cutoff, label in SEVERITY_BANDS if pct <= cutoff)
    return {
        "affected_percent": round(pct, 1),
        "category": category,
        "method": "Project-defined HSV leaf/lesion proxy; not severity-label validated",
    }
