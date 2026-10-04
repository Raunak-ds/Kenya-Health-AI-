#!/usr/bin/env python3
import sys
from pathlib import Path as _Path
_ROOT = _Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path: sys.path.insert(0, str(_ROOT))
from pathlib import Path
import json, time, torch, yaml, numpy as np
from torch.utils.data import DataLoader
from torch import nn
import matplotlib.pyplot as plt
from ml.data.dataset import load_imagefolder
from ml.preprocessing.transforms import eval_transform
from ml.models.factory import build_model
from ml.training.train_utils import run_epoch, benchmark_inference
from ml.evaluation.metrics import classification_metrics
from ml.evaluation.calibration import softmax

ROOT=Path(__file__).resolve().parents[1]; CFG=yaml.safe_load((ROOT/'config.yaml').read_text()); A=ROOT/CFG['paths']['artifacts']; D=ROOT/CFG['paths']['dataset']

def main():
    ckpt=torch.load(A/'best_model.pt',map_location='cpu',weights_only=False)
    ds=load_imagefolder(D/'test',eval_transform(ckpt['image_size']))
    if ds.classes!=ckpt['classes']: raise RuntimeError('Test class map differs from trained model')
    dev=torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model=build_model(ckpt['model_name'],len(ckpt['classes']),pretrained=False); model.load_state_dict(ckpt['state_dict']); model.to(dev)
    loader=DataLoader(ds,batch_size=CFG['project']['batch_size'],shuffle=False,num_workers=CFG['project']['num_workers'])
    loss,y,pred,logits=run_epoch(model,loader,nn.CrossEntropyLoss(),dev)
    probs=softmax(logits/ckpt.get('temperature',1.0)); conf=probs.max(1); accepted=conf>=ckpt['confidence_threshold']
    metrics=classification_metrics(y,pred,ckpt['classes']); metrics['test_loss']=loss; metrics['coverage_at_threshold']=float(accepted.mean())
    metrics['accepted_accuracy']=float((pred[accepted]==y[accepted]).mean()) if accepted.any() else None
    metrics['inference_ms_per_image']=benchmark_inference(model,loader,dev)
    (A/'test_metrics.json').write_text(json.dumps(metrics,indent=2))
    cm=np.array(metrics['confusion_matrix']); fig,ax=plt.subplots(figsize=(10,8)); im=ax.imshow(cm); ax.set_xticks(range(len(ds.classes)),labels=ds.classes,rotation=90); ax.set_yticks(range(len(ds.classes)),labels=ds.classes); ax.set_xlabel('Predicted'); ax.set_ylabel('True'); fig.colorbar(im); fig.tight_layout(); fig.savefig(A/'confusion_matrix.png',dpi=160); plt.close(fig)
    sel=json.loads((A/'model_selection.json').read_text()); hist=sel['final_history']; fig,ax=plt.subplots(); ax.plot([h['epoch'] for h in hist],[h['val_accuracy'] for h in hist],label='val accuracy'); ax.plot([h['epoch'] for h in hist],[h['val_macro_recall'] for h in hist],label='val macro recall'); ax.set_xlabel('Epoch'); ax.legend(); fig.tight_layout(); fig.savefig(A/'training_curves.png',dpi=160); plt.close(fig)
    print(json.dumps({k:v for k,v in metrics.items() if k not in ('per_class','confusion_matrix')},indent=2))

if __name__=='__main__': main()
