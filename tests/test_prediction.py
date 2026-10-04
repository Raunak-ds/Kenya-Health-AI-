from pathlib import Path
import torch
from ml.models.factory import build_model
from ml.inference.predictor import Predictor

def test_model_loading(tmp_path: Path):
    m=build_model('mobilenet_v3_small',2,pretrained=False)
    p=tmp_path/'m.pt'
    torch.save({'model_name':'mobilenet_v3_small','state_dict':m.state_dict(),'classes':['maize_healthy','tomato_healthy'],'image_size':224,'temperature':1.0,'confidence_threshold':.7},p)
    pred=Predictor(p)
    assert pred.ready and len(pred.classes)==2
