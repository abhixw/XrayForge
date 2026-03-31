import sys
import pickle
import torch
import traceback

import mura_pipeline
sys.modules['mura_pipeline.model'] = mura_pipeline
from mura_pipeline import MURADenseNet

try:
    print("Initializing MURADenseNet...")
    model = MURADenseNet()
    
    print("Loading weights using pickle...")
    with open("saved_models/mura_model.pkl", 'rb') as f:
        loaded_obj = pickle.load(f)
        
    print(f"Loaded obj type: {type(loaded_obj)}")
    
    if isinstance(loaded_obj, dict):
        model.load_state_dict(loaded_obj, strict=False)
    elif hasattr(loaded_obj, 'state_dict'):
        model.load_state_dict(loaded_obj.state_dict(), strict=False)
        
    model.eval()
    print("Model successfully loaded and set to eval mode!")
    
    dummy_input = torch.randn(1, 3, 224, 224)
    output = model(dummy_input)
    print("Dummy inference successful. Output shape:", output.shape)
except Exception as e:
    traceback.print_exc()
