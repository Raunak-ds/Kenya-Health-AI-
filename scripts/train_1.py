#!/usr/bin/env python3
import sys
from pathlib import Path as _Path
_ROOT = _Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path: sys.path.insert(0, str(_ROOT))
from pathlib import Path
import json, random, yaml, torch, numpy as np
from torch.utils.data import DataLoader
from torch import nn
from ml.data.dataset import load_imagefolder
from ml.preprocessing.transforms import train_transform, eval_transform
from ml.models.factory import build_model
from ml.training.train_utils import run_epoch, benchmark_inference
from ml.evaluation.metrics import classification_metrics
from ml.evaluation.calibration import fit_temperature, softmax, choose_confidence_threshold

ROOT=Path(__file__).resolve().parents[1]
CFG=yaml.safe_load((ROOT/'config.yaml').read_text())
P=CFG['project']; D=ROOT/CFG['paths']['dataset']; A=ROOT/CFG['paths']['artifacts']; A.mkdir(exist_ok=True)

def ensure_data():
    if not (D/'train').exists():
        from scripts.prepare_dataset import main
        main()

def device():
    return torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def main():
    ensure_data(); random.seed(P['seed']); np.random.seed(P['seed']); torch.manual_seed(P['seed'])
    tr=load_imagefolder(D/'train', train_transform(P['image_size']))
    va=load_imagefolder(D/'val', eval_transform(P['image_size']))
    if tr.class_to_idx != va.class_to_idx: raise RuntimeError('Class mapping mismatch')
    classes=tr.classes; dev=device()
    train_loader=DataLoader(tr,batch_size=P['batch_size'],shuffle=True,num_workers=P['num_workers'])
    val_loader=DataLoader(va,batch_size=P['batch_size'],shuffle=False,num_workers=P['num_workers'])
    experiments=[]; best=None
    for name in P['selected_models']:
        model=build_model(name,len(classes),pretrained=True).to(dev)
        opt=torch.optim.AdamW(model.parameters(),lr=P['learning_rate'],weight_decay=P['weight_decay'])
        criterion=nn.CrossEntropyLoss(label_smoothing=0.05)
        history=[]
        for epoch in range(P['comparison_epochs']):
            tl,*_=run_epoch(model,train_loader,criterion,dev,opt)
            vl,vy,vp,vlog=run_epoch(model,val_loader,criterion,dev)
            m=classification_metrics(vy,vp,classes)
            history.append({'epoch':epoch+1,'train_loss':tl,'val_loss':vl,'val_accuracy':m['accuracy'],'val_macro_recall':m['macro_recall_sensitivity']})
            print(name,history[-1])
        score=history[-1]['val_macro_recall']
        experiments.append({'model':name,'history':history,'selection_score_macro_recall':score})
        if best is None or score>best[0]: best=(score,name)
    winner=best[1]; print('Selected model:',winner)
    model=build_model(winner,len(classes),pretrained=True).to(dev)
    opt=torch.optim.AdamW(model.parameters(),lr=P['learning_rate'],weight_decay=P['weight_decay'])
    criterion=nn.CrossEntropyLoss(label_smoothing=0.05)
    final_history=[]; best_state=None; best_recall=-1; stale=0
    for epoch in range(P['final_epochs']):
        tl,*_=run_epoch(model,train_loader,criterion,dev,opt)
        vl,vy,vp,vlog=run_epoch(model,val_loader,criterion,dev)
        m=classification_metrics(vy,vp,classes); r=m['macro_recall_sensitivity']
        final_history.append({'epoch':epoch+1,'train_loss':tl,'val_loss':vl,'val_accuracy':m['accuracy'],'val_macro_recall':r})
        print('final',final_history[-1])
        if r>best_recall:
            best_recall=r; stale=0; best_state={k:v.detach().cpu() for k,v in model.state_dict().items()}
        else: stale+=1
        if stale>=P['early_stopping_patience']: break
    model.load_state_dict(best_state); model.to(dev)
    _,vy,vp,vlog=run_epoch(model,val_loader,criterion,dev)
    temp=fit_temperature(vlog,vy) if P['temperature_scaling'] else 1.0
    probs=softmax(vlog/temp)
    threshold=choose_confidence_threshold(probs,vy,P['target_recall'],P['max_false_positive_rate'],P['confidence_threshold_fallback'])
    ckpt={'model_name':winner,'state_dict':best_state,'classes':classes,'image_size':P['image_size'],'temperature':temp,'confidence_threshold':threshold['threshold']}
    torch.save(ckpt,A/'best_model.pt')
    (A/'model_selection.json').write_text(json.dumps({'experiments':experiments,'selected':winner,'final_history':final_history},indent=2))
    (A/'calibration.json').write_text(json.dumps({'temperature':temp,**threshold},indent=2))
    print('Saved',A/'best_model.pt')
    print('Run: python scripts/evaluate.py')

if __name__=='__main__': main()
