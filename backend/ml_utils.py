import sys
import pickle
import torch
import cv2
import numpy as np
import base64
import os

import mura_pipeline
sys.modules['mura_pipeline.model'] = mura_pipeline
from mura_pipeline import MURADenseNet
from gradcam_utils import GradCAM, apply_colormap_on_image

_model = None
_grad_cam = None

def init_model(model_path="saved_models/mura_model.pkl"):
    global _model, _grad_cam
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {os.path.abspath(model_path)}")
        
    print(f"Loading Core ML models from {model_path}...")
    _model = MURADenseNet()
    
    try:
        with open(model_path, 'rb') as f:
            loaded_obj = pickle.load(f)
            
        print(f"Successfully unpicked model object of type: {type(loaded_obj)}")
        
        if isinstance(loaded_obj, dict):
            _model.load_state_dict(loaded_obj, strict=False)
        elif hasattr(loaded_obj, 'state_dict'):
            _model.load_state_dict(loaded_obj.state_dict(), strict=False)
        else:
            raise ValueError("Loaded object is neither a state_dict nor has a state_dict method.")
            
        print("Model weights successfully loaded into memory!")
    except Exception as e:
        print(f"CRITICAL ERROR LOADING MODEL: {str(e)}")
        raise e
    
    _model.eval()
    
    # specific target layer for DenseNet architecture
    target_layer = _model.model.features.denseblock4.denselayer16.conv2
    _grad_cam = GradCAM(_model, target_layer)
    print("MURA Model and Grad-CAM initialized!")

def predict_image(image_bytes):
    # decodes image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Invalid image file.")
        
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    
    # Preprocess
    img_resized = cv2.resize(img_rgb, (224, 224))
    img_normalized = img_resized.astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_tensor = (img_normalized - mean) / std
    
    # NCHW
    img_tensor = np.transpose(img_tensor, (2, 0, 1))
    tensor = torch.tensor(img_tensor).unsqueeze(0)
    tensor.requires_grad_(True)
    
    # Heatmap & Inference
    cam, prob = _grad_cam.generate(tensor)
    
    heatmap_vis = apply_colormap_on_image(img_resized, cam)
    
    # encode to base64
    _, buffer = cv2.imencode('.png', cv2.cvtColor(heatmap_vis, cv2.COLOR_RGB2BGR))
    base64_heatmap = base64.b64encode(buffer).decode('utf-8')
    
    diagnosis = "Fracture Detected" if prob > 0.50 else "Normal"
    risk_score = int(prob * 100)
    
    if risk_score >= 75:
        risk_level = "High"
    elif risk_score >= 50:
        risk_level = "Moderate"
    else:
        risk_level = "Low"
    
    return {
        "probability": float(prob),
        "diagnosis": diagnosis,
        "heatmap_base64": f"data:image/png;base64,{base64_heatmap}",
        "risk_score": risk_score,
        "risk_level": risk_level
    }
