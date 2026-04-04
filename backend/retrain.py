import sys
import pickle
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import pandas as pd
import cv2
import numpy as np
import os

import mura_pipeline
sys.modules['mura_pipeline.model'] = mura_pipeline
from mura_pipeline import MURADenseNet


# ── 1. Dataset ──────────────────────────────────────────
class FeedbackDataset(Dataset):
    def __init__(self, csv_path):
        self.df = pd.read_csv(csv_path)

        # Remove rows where image file doesn't exist
        self.df = self.df[self.df["image_path"].apply(os.path.exists)]
        print(f"Valid images found: {len(self.df)}")

        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]

        img = cv2.imread(row["image_path"])
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))
        img = self.transform(img)

        label = 1.0 if row["correct_label"] == "Fracture Detected" else 0.0
        label = torch.tensor([label], dtype=torch.float32)

        return img, label


# ── 2. Load existing model ───────────────────────────────
print("Loading existing model...")
model = MURADenseNet()

with open("saved_models/mura_model.pkl", "rb") as f:
    loaded = pickle.load(f)

if isinstance(loaded, dict):
    model.load_state_dict(loaded, strict=False)
elif hasattr(loaded, "state_dict"):
    model.load_state_dict(loaded.state_dict(), strict=False)

print("Model loaded successfully.")


# ── 3. Load feedback dataset ─────────────────────────────
dataset = FeedbackDataset("feedback_dataset.csv")

if len(dataset) == 0:
    print("❌ No valid images found. Retraining cancelled.")
    sys.exit()

loader = DataLoader(dataset, batch_size=4, shuffle=True)


# ── 4. Fine-tune setup ───────────────────────────────────
model.train()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-5)
criterion = nn.BCEWithLogitsLoss()


# ── 5. Training loop ─────────────────────────────────────
EPOCHS = 5

print("Starting fine-tuning...")
for epoch in range(EPOCHS):
    total_loss = 0
    for images, labels in loader:
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    print(f"Epoch {epoch+1}/{EPOCHS} — Loss: {total_loss:.4f}")


# ── 6. Save new model ────────────────────────────────────
os.makedirs("saved_models", exist_ok=True)
torch.save(model.state_dict(), "saved_models/mura_model_v2.pkl")
print("✅ Fine-tuned model saved as saved_models/mura_model_v2.pkl")