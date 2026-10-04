import numpy as np
from scipy.optimize import minimize_scalar

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z); return e / e.sum(axis=1, keepdims=True)

def fit_temperature(logits, y):
    logits=np.asarray(logits); y=np.asarray(y)
    def nll(t):
        p=softmax(logits/max(t,1e-3)); return -np.log(np.clip(p[np.arange(len(y)),y],1e-9,1)).mean()
    return float(minimize_scalar(nll,bounds=(0.5,5.0),method="bounded").x)

def choose_confidence_threshold(probs, y, target_recall=0.90, max_fpr=0.10, fallback=0.70):
    probs=np.asarray(probs); y=np.asarray(y); pred=probs.argmax(1); conf=probs.max(1)
    best=None
    for t in np.linspace(0.50,0.99,100):
        accepted=conf>=t
        if accepted.sum()<max(20, int(.1*len(y))): continue
        correct=(pred==y)
        recall=correct[accepted].mean()
        fp=((pred!=y)&accepted).sum(); negatives=(pred!=y).sum(); fpr=fp/max(1,negatives)
        coverage=accepted.mean()
        if recall>=target_recall and fpr<=max_fpr:
            score=coverage
            if best is None or score>best[0]: best=(score,float(t),float(recall),float(fpr))
    if best: return {"threshold":best[1],"accepted_accuracy":best[2],"false_accept_rate":best[3],"coverage":best[0]}
    return {"threshold":fallback,"accepted_accuracy":None,"false_accept_rate":None,"coverage":None}
