import torch
import torch.nn.functional as F
import numpy as np
import cv2

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Hook the target layer
        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_full_backward_hook(self.save_gradient)

    def save_activation(self, module, input, output):
        self.activations = output

    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate(self, input_tensor):
        self.model.zero_grad()
        output = self.model(input_tensor)
        
        # Since it's binary classification, the output is a single logit.
        score = output[0, 0]
            
        score.backward(retain_graph=True)
        
        gradients = self.gradients.data.cpu().numpy()[0]
        activations = self.activations.data.cpu().numpy()[0]
        
        # Global average pooling over the gradients
        weights = np.mean(gradients, axis=(1, 2))
        
        # Compute the weighted sum of activations
        cam = np.zeros(activations.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]
            
        # ReLU on CAM to keep only features that have a positive influence
        cam = np.maximum(cam, 0)
        
        # Normalize the CAM
        cam = cv2.resize(cam, (input_tensor.shape[3], input_tensor.shape[2]))
        cam = cam - np.min(cam)
        cam = cam / (np.max(cam) + 1e-8)
        
        # Return probability (sigmoid) and cam
        prob = torch.sigmoid(output).item()
        return cam, prob

def apply_colormap_on_image(org_im, activation, colormap_name=cv2.COLORMAP_JET):
    # org_im should be un-normalized rgb [0, 255]
    heatmap = cv2.applyColorMap(np.uint8(255 * activation), colormap_name)
    heatmap = np.float32(heatmap) / 255
    org_im = np.float32(org_im) / 255
    cam_result = heatmap + org_im
    cam_result = cam_result / np.max(cam_result)
    return np.uint8(255 * cam_result)
