#!/usr/bin/env python3
"""vision-matte 2단계 판정 도구 (ORDER_20261022 2단계 §4 S·§5 마스크·§6 품질).

계약만 쓴다 — 서버 내부를 건드리지 않고 /api/matte(자체형)·/runsync(RunPod)에 같은 요청을 보낸다.
알파 복원: 같은 원본을 흰(#FFFFFF)·검정(#000000) 배경으로 두 번 합성하면
  C_w - C_b = (1 - a) * 255  →  a = 1 - (C_w - C_b) / 255   (JPEG q95 잡음 ±1/255 수준)
그래서 두 엔진의 알파를 같은 좌표에서 비교할 수 있다.

사용:
  quality  --out DIR --img name=path ... [--vision URL] [--runpod URL]
           vision 시크릿 = env VISION_MATTE_SECRET, RunPod 키 = env RUNPOD_KEY (값은 출력하지 않는다)
  bench    --vision URL --img path [--n 10] [--conc 3]
결과 이미지는 커밋하지 않는다(.gitignore). 고객 사진 금지.
"""
import argparse, base64, io, json, os, statistics, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image, ImageFilter

BAND_PX = 8


def post(url, body, headers, timeout=120):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', **headers}, method='POST')
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read()), time.time() - t0
    except urllib.error.HTTPError as e:
        try:
            data = json.loads(e.read())
        except Exception:
            data = {}
        return e.code, data, time.time() - t0


def call(engine, url, img_b64, bg):
    """→ (PIL RGB, meta, 왕복초)"""
    if engine == 'runpod':
        key = os.environ.get('RUNPOD_KEY', '')
        if not key:
            sys.exit('❌ qa_compare: RUNPOD_KEY 비어 있음')
        code, data, dt = post(url.rstrip('/') + '/runsync', {'input': {'image': img_b64, 'bgColor': bg}}, {'Authorization': f'Bearer {key}'})
        body = data.get('output') or {}
        if code != 200 or data.get('status') != 'COMPLETED' or not body.get('success'):
            sys.exit(f'❌ qa_compare: runpod 실패 code={code} status={data.get("status")} err={body.get("error") or data.get("error")}')
    else:
        sec = os.environ.get('VISION_MATTE_SECRET', '')
        code, body, dt = post(url.rstrip('/') + '/api/matte', {'image': img_b64, 'bgColor': bg}, {'X-Matte-Secret': sec} if sec else {})
        if code != 200 or not body.get('success'):
            sys.exit(f'❌ qa_compare: vision 실패 code={code} body={str(body)[:200]}')
    im = Image.open(io.BytesIO(base64.b64decode(body['image']))).convert('RGB')
    return im, body.get('meta', {}), dt


def alpha_of(white, black):
    w = np.asarray(white, dtype=np.float32)
    b = np.asarray(black, dtype=np.float32)
    return np.clip(1 - (w - b).mean(axis=2) / 255.0, 0, 1)


def band_mask(ref_alpha):
    """참조 알파 0.5 경계 ±BAND_PX 띠 (trimap unknown 영역)."""
    binm = Image.fromarray(((ref_alpha >= 0.5) * 255).astype(np.uint8))
    k = 2 * BAND_PX + 1
    dil = np.asarray(binm.filter(ImageFilter.MaxFilter(k))) > 0
    ero = np.asarray(binm.filter(ImageFilter.MinFilter(k))) > 0
    return dil & ~ero


def to_alpha_img(a):
    return Image.fromarray((a * 255).round().astype(np.uint8), 'L')


def cmd_quality(args):
    os.makedirs(args.out, exist_ok=True)
    engines = [(n, u) for n, u in (('vision', args.vision), ('runpod', args.runpod)) if u]
    rows = []
    for spec in args.img:
        name, path = spec.split('=', 1)
        raw = open(path, 'rb').read()
        src = Image.open(io.BytesIO(raw)).convert('RGB')
        b64 = base64.b64encode(raw).decode()
        alphas, row = {}, {'name': name, 'src': path, 'input': list(src.size)}
        for eng, url in engines:
            w, meta, dtw = call(eng, url, b64, '#FFFFFF')
            k, _, dtb = call(eng, url, b64, '#000000')
            if w.size != src.size:
                sys.exit(f'❌ qa_compare: {eng} 출력 크기 {w.size} ≠ 입력 {src.size} — 좌표 비교 불가')
            a = alpha_of(w, k)
            alphas[eng] = a
            w.save(f'{args.out}/{name}_{eng}_white.jpg', quality=92)
            to_alpha_img(a).save(f'{args.out}/{name}_{eng}_alpha.png')
            soft = float(((a > 0.02) & (a < 0.98)).mean())
            row[eng] = {'maskSize': meta.get('maskSize'), 'elapsedSec': meta.get('elapsedSec'),
                        'rtt_white': round(dtw, 2), 'rtt_black': round(dtb, 2), 'soft_px_ratio': round(soft, 4)}
        if 'vision' in alphas and 'runpod' in alphas:
            band = band_mask(alphas['runpod'])
            d = np.abs(alphas['vision'] - alphas['runpod'])
            row['band_px'] = int(band.sum())
            row['band_SAD_k'] = round(float(d[band].sum()) / 1000, 2)   # 관례 단위: /1000
            row['band_MAE'] = round(float(d[band].mean()), 4)
            row['full_MAE'] = round(float(d.mean()), 4)
            diff = Image.fromarray((np.clip(d * 4, 0, 1) * 255).astype(np.uint8), 'L').convert('RGB')
            tiles = [src, Image.open(f'{args.out}/{name}_vision_white.jpg'), Image.open(f'{args.out}/{name}_runpod_white.jpg'), diff]
        else:
            tiles = [src, Image.open(f'{args.out}/{name}_vision_white.jpg'), to_alpha_img(alphas['vision']).convert('RGB')]
        th = 600
        tiles = [t.resize((round(t.width * th / t.height), th)) for t in tiles]
        sheet = Image.new('RGB', (sum(t.width for t in tiles), th), 'gray')
        x = 0
        for t in tiles:
            sheet.paste(t, (x, 0)); x += t.width
        sheet.save(f'{args.out}/{name}_sheet.jpg', quality=90)
        rows.append(row)
        print(json.dumps(row, ensure_ascii=False))
    json.dump(rows, open(f'{args.out}/quality.json', 'w'), ensure_ascii=False, indent=1)
    print(f'✅ qa_compare quality: {len(rows)}장 → {args.out}/quality.json · *_sheet.jpg (원본|vision|runpod|차이×4)')


def cmd_bench(args):
    raw = open(args.img[0], 'rb').read()
    b64 = base64.b64encode(raw).decode()
    size = Image.open(io.BytesIO(raw)).size
    sec = os.environ.get('VISION_MATTE_SECRET', '')
    hdr = {'X-Matte-Secret': sec} if sec else {}
    url = args.vision.rstrip('/') + '/api/matte'
    seq = []
    for _ in range(args.n):
        code, body, dt = post(url, {'image': b64, 'bgColor': '#FFFFFF'}, hdr)
        if code != 200:
            sys.exit(f'❌ bench: 순차 code={code}')
        seq.append((dt, body['meta']['elapsedSec'], body['meta'].get('maskSize')))
    rtts = sorted(s[0] for s in seq)
    p = lambda q: rtts[min(len(rtts) - 1, int(round(q * (len(rtts) - 1))))]
    print(json.dumps({'input': size, 'n': args.n, 'rtt_p50': round(statistics.median(rtts), 2), 'rtt_p90': round(p(0.9), 2),
                      'infer_p50': round(statistics.median(s[1] for s in seq), 2), 'maskSize': seq[0][2]}))
    with ThreadPoolExecutor(args.conc) as ex:
        res = list(ex.map(lambda _: post(url, {'image': b64, 'bgColor': '#FFFFFF'}, hdr), range(args.conc)))
    codes = [r[0] for r in res]
    bad = [c for c in codes if c not in (200, 503)]
    print(json.dumps({'concurrent': args.conc, 'codes': codes, 'rtts': [round(r[2], 2) for r in res], 'non_200_503': bad}))
    if bad:
        sys.exit('❌ bench: 동시 요청 중 200/503 외 응답')
    print('✅ bench 완료')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['quality', 'bench'])
    ap.add_argument('--img', action='append', required=True)
    ap.add_argument('--out')
    ap.add_argument('--vision')
    ap.add_argument('--runpod')
    ap.add_argument('--n', type=int, default=10)
    ap.add_argument('--conc', type=int, default=3)
    a = ap.parse_args()
    cmd_quality(a) if a.cmd == 'quality' else cmd_bench(a)
