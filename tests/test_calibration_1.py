import numpy as np
from ml.evaluation.calibration import choose_confidence_threshold

def test_threshold_in_range():
    p=np.array([[.95,.05],[.1,.9],[.6,.4],[.2,.8]])
    y=np.array([0,1,0,1])
    r=choose_confidence_threshold(p,y,target_recall=.5,max_fpr=.5,fallback=.7)
    assert .5 <= r['threshold'] <= .99
