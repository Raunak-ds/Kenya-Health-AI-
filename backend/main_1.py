from pathlib import Path
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from backend.recommendations import get_recommendations
from ml.inference.predictor import Predictor

ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT/'artifacts/best_model.pt'
predictor=Predictor(MODEL)
app=FastAPI(title='Crop Health AI',version='1.0.0')
app.mount('/static',StaticFiles(directory=ROOT/'frontend'),name='static')

@app.get('/')
def root(): return FileResponse(ROOT/'frontend/index.html')

@app.get('/analyze')
def analyze_page(): return FileResponse(ROOT/'frontend/analyze.html')

@app.get('/health')
def health(): return {'status':'ok','model_ready':predictor.ready}

@app.post('/api/analyze')
async def analyze(file: UploadFile=File(...), crop: str|None=Form(None), lang: str=Form('en')):
    if file.content_type not in {'image/jpeg','image/png','image/webp'}:
        raise HTTPException(415,'Unsupported image format. Use JPEG, PNG, or WebP.')
    data=await file.read()
    if len(data)>10*1024*1024: raise HTTPException(413,'Image too large (max 10 MB).')
    try: image=Image.open(io.BytesIO(data)).convert('RGB')
    except (UnidentifiedImageError,OSError): raise HTTPException(400,'Invalid image file.')
    result=predictor.predict(image,crop=crop)
    if result.get('status')=='ok': result['recommendations']=get_recommendations(result['label'],lang)
    return result
