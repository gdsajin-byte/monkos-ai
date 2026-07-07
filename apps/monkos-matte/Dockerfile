# MONKOS matte — Cloud Run CPU (onnx 백엔드)
# 모델(972MB)은 이미지에 굽지 않고 GCS 볼륨 마운트로 공급 (deploy.sh --add-volume)
FROM python:3.12-slim

LABEL maintainer="MONK.KR"
LABEL description="MONKOS matte — BiRefNet 배경제거 + 배경색 합성"

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY matte_server.py ./

ENV MATTE_BACKEND=onnx
ENV MATTE_ONNX_PATH=/models/birefnet/BiRefNet-portrait.onnx

CMD ["python", "matte_server.py"]
