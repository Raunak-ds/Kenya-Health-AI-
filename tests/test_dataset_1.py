from pathlib import Path
from PIL import Image
from ml.data.dataset import load_imagefolder

def test_dataset_loading(tmp_path: Path):
    for c in ['a','b']:
        d=tmp_path/c; d.mkdir(); Image.new('RGB',(32,32)).save(d/'x.jpg')
    ds=load_imagefolder(tmp_path)
    assert len(ds)==2 and ds.classes==['a','b']
