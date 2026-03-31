import torch
import torch.nn as nn
import torchvision.models as models


class MURADenseNet(nn.Module):
    def __init__(self, num_classes=1):
        super(MURADenseNet, self).__init__()

        # Load DenseNet121 backbone
        self.model = models.densenet121(pretrained=False)

        # Replace classifier for binary classification
        num_features = self.model.classifier.in_features
        self.model.classifier = nn.Linear(num_features, num_classes)

    def forward(self, x):
        return self.model(x)
