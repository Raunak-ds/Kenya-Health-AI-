import numpy as np
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, accuracy_score

def classification_metrics(y_true, y_pred, labels):
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(labels))))
    p, r, f1, support = precision_recall_fscore_support(y_true, y_pred, labels=list(range(len(labels))), zero_division=0)
    per_class = {}
    for i, name in enumerate(labels):
        tp = cm[i,i]; fn = cm[i,:].sum()-tp; fp = cm[:,i].sum()-tp; tn = cm.sum()-tp-fn-fp
        specificity = tn / max(1, tn+fp)
        fpr = fp / max(1, fp+tn)
        fnr = fn / max(1, fn+tp)
        per_class[name] = {"precision":float(p[i]),"recall_sensitivity":float(r[i]),"specificity":float(specificity),
                           "f1":float(f1[i]),"fpr":float(fpr),"fnr":float(fnr),"support":int(support[i])}
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_precision": float(np.mean(p)), "macro_recall_sensitivity": float(np.mean(r)),
        "macro_specificity": float(np.mean([v["specificity"] for v in per_class.values()])),
        "macro_f1": float(np.mean(f1)), "confusion_matrix": cm.tolist(), "per_class": per_class,
    }
