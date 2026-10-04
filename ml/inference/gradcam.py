import cv2, torch
import numpy as np
from PIL import Image

def _target_layer(model, name):
    if name=='resnet18': return model.layer4[-1]
    if name=='efficientnet_b0': return model.features[-1]
    return model.features[-1]

def gradcam_overlay(model, model_name, tensor, original: Image.Image, class_idx: int):
    acts=[]; grads=[]; layer=_target_layer(model,model_name)
    h1=layer.register_forward_hook(lambda m,i,o: acts.append(o))
    h2=layer.register_full_backward_hook(lambda m,gi,go: grads.append(go[0]))
    model.zero_grad(set_to_none=True); logits=model(tensor); logits[0,class_idx].backward()
    h1.remove(); h2.remove()
    a=acts[0].detach()[0]; g=grads[0].detach()[0]
    w=g.mean(dim=(1,2)); cam=(w[:,None,None]*a).sum(0).relu().cpu().numpy()
    cam=(cam-cam.min())/(cam.max()-cam.min()+1e-8)
    rgb=np.array(original.convert('RGB')); cam=cv2.resize(cam,(rgb.shape[1],rgb.shape[0]))
    heat=cv2.applyColorMap(np.uint8(255*cam),cv2.COLORMAP_JET); heat=cv2.cvtColor(heat,cv2.COLOR_BGR2RGB)
    overlay=np.uint8(np.clip(0.6*rgb+0.4*heat,0,255)); return Image.fromarray(overlay)
