# RunPod Serverless 큐 워커 — matte_server의 매팅 코어 재사용
# 입력: {"input": {"image": b64, "bgColor": "#RRGGBB"}} → 출력: {"success", "image", "meta"}
import time

import runpod

# matte_server import 시점에 모델 로드 (__main__ 가드로 서버는 미기동)
from matte_server import BACKEND, DEVICE, matte_composite, parse_hex


def handler(job):
    t0 = time.time()
    inp = job.get('input') or {}
    image_b64 = inp.get('image')
    if not image_b64:
        return {'success': False, 'error': 'image(base64) 필수'}
    bg = parse_hex(inp.get('bgColor'))
    try:
        out_b64, size = matte_composite(image_b64, bg)
    except Exception as e:
        return {'success': False, 'error': f'매팅 실패: {e}'}
    return {
        'success': True,
        'image': out_b64,
        'meta': {'elapsedSec': round(time.time() - t0, 3), 'device': DEVICE,
                 'backend': BACKEND, 'size': f'{size[0]}x{size[1]}'},
    }


runpod.serverless.start({'handler': handler})
