import time
import torch
import numpy as np


def run_epoch(model, loader, criterion, device, optimizer=None):
    train = optimizer is not None
    model.train(train)
    total_loss=0.0; ys=[]; preds=[]; logits_all=[]
    for x,y in loader:
        x,y=x.to(device),y.to(device)
        if train: optimizer.zero_grad(set_to_none=True)
        logits=model(x); loss=criterion(logits,y)
        if train:
            loss.backward(); optimizer.step()
        total_loss += loss.item()*x.size(0)
        ys.extend(y.detach().cpu().tolist()); preds.extend(logits.argmax(1).detach().cpu().tolist()); logits_all.append(logits.detach().cpu())
    return total_loss/max(1,len(loader.dataset)), np.array(ys), np.array(preds), torch.cat(logits_all).numpy() if logits_all else np.empty((0,0))


def benchmark_inference(model, loader, device, batches=20):
    model.eval(); timings=[]
    with torch.no_grad():
        for i,(x,_) in enumerate(loader):
            if i>=batches: break
            x=x.to(device)
            if device.type=="cuda": torch.cuda.synchronize()
            t=time.perf_counter(); _=model(x)
            if device.type=="cuda": torch.cuda.synchronize()
            timings.append((time.perf_counter()-t)/x.size(0)*1000)
    return float(np.mean(timings)) if timings else None
