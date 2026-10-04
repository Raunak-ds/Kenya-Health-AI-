from ml.models.factory import build_model

def test_model_output_shape():
    import torch
    m=build_model('mobilenet_v3_small',11,pretrained=False)
    y=m(torch.randn(1,3,224,224))
    assert tuple(y.shape)==(1,11)
