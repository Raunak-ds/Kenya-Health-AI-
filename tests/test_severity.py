from PIL import Image
import numpy as np
from ml.inference.severity import estimate_severity

def test_severity_returns_range():
    a=np.zeros((224,224,3),dtype=np.uint8); a[:]=[30,160,40]
    r=estimate_severity(Image.fromarray(a))
    assert 0 <= r['affected_percent'] <= 100
