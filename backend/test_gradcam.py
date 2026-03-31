import sys
import pickle
import torch
import traceback
import cv2
import numpy as np

import mura_pipeline
sys.modules['mura_pipeline.model'] = mura_pipeline
from mura_pipeline import MURADenseNet
from gradcam_utils import GradCAM

try:
    print("Initializing MURADenseNet...")
    model = MURADenseNet()
    
    print("Loading weights...")
    with open("saved_models/mura_model.pkl", 'rb') as f:
        loaded_obj = pickle.load(f)
        
    if isinstance(loaded_obj, dict):
        model.load_state_dict(loaded_obj, strict=False)
    elif hasattr(loaded_obj, 'state_dict'):
        model.load_state_dict(loaded_obj.state_dict(), strict=False)
        
    model.eval()
    
    # Identify target layer for torchvision.models.densenet121
    # Usually the last denseblock or last norm in features
    target_layer = model.model.features.denseblock4.denselayer16.conv2
    
    grad_cam = GradCAM(model, target_layer)
    
    # Dummy input
    dummy_input = torch.randn(1, 3, 224, 224)
    # Require gradients for Grad-CAM
    dummy_input.requires_grad_(True)
    
    print("Generating Grad-CAM...")
    cam, prob = grad_cam.generate(dummy_input)
    
    print(f"Grad-CAM generated successfully! CAM shape: {cam.shape}, Prob: {prob:.4f}")
    
except Exception as e:
    traceback.print_exc()
