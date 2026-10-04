from pathlib import Path
import base64, io, torch, numpy as np
from PIL import Image
from ml.models.factory import build_model
from ml.preprocessing.transforms import eval_transform
from ml.preprocessing.quality import assess_image_quality
from ml.inference.severity import estimate_severity
from ml.inference.gradcam import gradcam_overlay
from ml.evaluation.calibration import softmax

class Predictor:
    def __init__(self, model_path):
        self.path=Path(model_path); self.ready=self.path.exists(); self.device=torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        if not self.ready: return
        c=torch.load(self.path,map_location='cpu',weights_only=False); self.ckpt=c; self.classes=c['classes']; self.threshold=float(c.get('confidence_threshold',0.7)); self.temp=float(c.get('temperature',1.0))
        self.model=build_model(c['model_name'],len(self.classes),pretrained=False); self.model.load_state_dict(c['state_dict']); self.model.to(self.device).eval(); self.tf=eval_transform(c['image_size'])
    def predict(self, image: Image.Image, crop=None):
        q=assess_image_quality(image)
        if not q.usable: return {"status":"invalid_image","message":"Please upload a clearer image of the affected leaf.","quality":q.__dict__}
        if not self.ready: return {"status":"model_missing","message":"Model not trained yet. Run python scripts/train.py first.","quality":q.__dict__}
        x=self.tf(image).unsqueeze(0).to(self.device)
        with torch.no_grad(): logits=self.model(x).cpu().numpy()/self.temp
        probs=softmax(logits)[0]
        if crop:
            crop=crop.lower(); allowed=np.array([c.startswith(crop+'_') for c in self.classes]); probs=np.where(allowed,probs,0); probs=probs/(probs.sum()+1e-12)
        idx=int(probs.argmax()); conf=float(probs[idx]); label=self.classes[idx]
        entropy=float(-(probs*np.log(np.clip(probs,1e-9,1))).sum()/np.log(len(probs)))
        if conf < self.threshold or entropy > 0.78:
            return {"status":"uncertain","message":"Unable to confidently identify this condition.","confidence":round(conf,4),"entropy":round(entropy,4),"threshold":self.threshold,"quality":q.__dict__,"top3":self._top3(probs)}
        severity=estimate_severity(image) if not label.endswith('_healthy') else {"affected_percent":0.0,"category":"Healthy","method":"Not applicable"}
        try:
            cam=gradcam_overlay(self.model,self.ckpt['model_name'],x,image,idx); b=io.BytesIO(); cam.save(b,format='JPEG',quality=85); cam64='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
        except Exception: cam64=None
        return {"status":"ok","label":label,"confidence":round(conf,4),"entropy":round(entropy,4),"threshold":self.threshold,"severity":severity,"quality":q.__dict__,"top3":self._top3(probs),"gradcam":cam64}
    def _top3(self,probs):
        ids=np.argsort(probs)[::-1][:3]; return [{"label":self.classes[int(i)],"probability":round(float(probs[i]),4)} for i in ids]
