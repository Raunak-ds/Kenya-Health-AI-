from PIL import Image
import numpy as np
from ml.preprocessing.quality import assess_image_quality

def test_low_resolution_rejected():
    img=Image.fromarray(np.full((64,64,3),120,dtype=np.uint8))
    assert not assess_image_quality(img).usable
