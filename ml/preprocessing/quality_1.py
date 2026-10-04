from dataclasses import dataclass
import cv2
import numpy as np
from PIL import Image

@dataclass
class QualityResult:
    usable: bool
    reason: str
    blur_score: float
    brightness: float
    vegetation_fraction: float


def assess_image_quality(image: Image.Image, min_size=128, blur_threshold=45.0, dark_threshold=35.0) -> QualityResult:
    rgb = np.array(image.convert("RGB"))
    h, w = rgb.shape[:2]
    if min(h, w) < min_size:
        return QualityResult(False, "Image resolution is too low.", 0.0, float(rgb.mean()), 0.0)

    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    # Broad vegetation proxy; intentionally permissive for yellow/brown diseased tissue.
    mask = ((hsv[:, :, 0] >= 20) & (hsv[:, :, 0] <= 100) & (hsv[:, :, 1] >= 35) & (hsv[:, :, 2] >= 30))
    vegetation_fraction = float(mask.mean())

    if brightness < dark_threshold:
        return QualityResult(False, "Image is too dark.", blur_score, brightness, vegetation_fraction)
    if blur_score < blur_threshold:
        return QualityResult(False, "Image is too blurry.", blur_score, brightness, vegetation_fraction)
    if vegetation_fraction < 0.03:
        return QualityResult(False, "Image does not appear to contain enough visible plant tissue.", blur_score, brightness, vegetation_fraction)
    return QualityResult(True, "ok", blur_score, brightness, vegetation_fraction)
