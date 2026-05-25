import os
os.environ['HF_TOKEN'] = os.environ.get('HF_TOKEN', '')
from transformers import AutoModelForImageSegmentation
print('RMBG-2.0 모델 다운로드 시작...')
m = AutoModelForImageSegmentation.from_pretrained('briaai/RMBG-2.0', trust_remote_code=True)
print('다운로드 완료')
