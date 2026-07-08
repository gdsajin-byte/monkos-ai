---
type: order
date: 2026-07-08
device: iMac
agent: 쌍아
target: 막내
portfolio: PF_SPECS
priority: P0
status: 대기
---

# 지시서: 좌표계 일원화 — normalizeImage 입구 정규화

**[2026-07-08 16:39 KST]** iMac/쌍아 → 막내

## 배경

사진이 서버를 돌아다니면서 단계마다 방향이 달라져서, 고칠 때마다 다른 데가 깨진다.
아이폰 세로 사진(EXIF orientation=6)은 파일은 가로인데 표시만 세로 — sharp로 `.rotate()` 안 하면 FaceMesh에 90° 누운 얼굴이 전달된다.

**해법**: 입구에서 1회 정규화하고, 이후 전 단계가 같은 버퍼를 쓴다.

## Task 1 — normalizeImage 함수 작성

`portal/server.js` 최상위에 추가:

```javascript
async function normalizeImage(rawBase64) {
  const { default: sharp } = await import('sharp');
  const raw = Buffer.from(rawBase64.includes(',') ? rawBase64.split(',')[1] : rawBase64, 'base64');
  const buf = await sharp(raw)
    .rotate()
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
  const { width, height } = await sharp(buf).metadata();
  return { buf, b64: buf.toString('base64'), width, height, rawBase64 };
}
```

- `.rotate()`: EXIF 회전 적용 + 메타 스트립
- `.resize(2048)`: OOM 방지 (현행 10MB 원본 왕복 제거)
- `.jpeg(90)`: 포맷 통일 (HEIC/PNG → JPEG)
- `rawBase64`: GCS 원본 저장용 보존

## Task 2 — precheck 적용

`/api/idphoto/precheck` 진입부:

1. `const norm = await normalizeImage(body.image);`
2. Gemini에 `norm.b64` 전송 (`mimeType: 'image/jpeg'`)
3. 기존 `base64Data` 변수를 `norm.b64`로 교체
4. 오늘 추가했던 리사이즈/회전 코드(rawBuf, rotatedBuf 등) 전부 제거 — normalize가 대체

## Task 3 — fit 적용

`/api/idphoto/fit` 진입부:

1. `const norm = await normalizeImage(body.image);`
2. `const buf = norm.buf;` (기존 `rawFitBuf` → `sharp().rotate()` 2줄 제거)
3. `const { width: W, height: H } = { width: norm.width, height: norm.height };`
4. 이하 로직(buildRough, crop-engine 호출, 비전 검수)은 변경 없음 — buf가 이미 정규화됨

## Task 4 — generate/matte 적용

`/api/idphoto/generate` 내 matteFitPipeline / matteSpecPipeline:

1. fitFrame 재단 시 사용하는 이미지 버퍼를 `normalizeImage(body.image).buf`로 교체
2. 현행: `Buffer.from(stripDataUri(image), 'base64')` → 미회전 원본 → 누운 출고
3. 변경: `norm.buf` → 회전 완료 → 정립 출고

**주의**: normalizeImage를 요청당 여러 번 호출하면 중복 처리. generate 진입부에서 1회 호출 후 변수로 전달할 것.

## Task 5 — 해부학 검증 잣대 교체

fit 엔드포인트의 해부학 밴드 검증 (line ~340 부근):

**현행** (Gemini faceBox 기준 — 2px 미달로 정상 사진 차단):
```javascript
const eyeOk = cand.lines.eyeY >= fbPx.y + fbPx.h * 0.08 && cand.lines.eyeY <= fbPx.y + fbPx.h * 0.72;
const chinOk = cand.lines.chinY >= fbPx.y + fbPx.h * 0.55 && cand.lines.chinY <= fbPx.y + fbPx.h * 1.45;
ok = eyeOk && chinOk;
```

**변경** (FaceMesh 내부 정합):
```javascript
// FaceMesh 자체 정합으로 사일런트 미스 판정 — Gemini faceBox는 러프 크롭 산정에만 사용
const faceH = cand.lines.chinY - cand.lines.crownY;
const eyeChinRatio = (cand.lines.chinY - cand.lines.eyeY) / (faceH || 1);
ok = faceH > 30 && eyeChinRatio > 0.35 && eyeChinRatio < 0.70;
```

## 검증

각 Task 완료 후 즉시 배포·테스트:

| 케이스 | 사진 | 기대 |
|--------|------|------|
| 아이폰 셀카 (EXIF=6) | 작가님 테스트 사진 | precheck 통과 → fit 측정 → **정립** 출고 |
| 데스크톱 (EXIF 없음) | 기존 통과 사진 | 현행과 동일 (회귀 없음) |
| 상반신 와이드 | 카우치 사진 | precheck 통과 → fit 측정 or FIT_SANITY 차단 |

## ⚠️ 준수 조항

- deploy.sh 경유 배포 (ch5 2조)
- `.env`, `secrets/` 수정 금지 (헌법 4조 1항)
- 범위 밖 작업 금지 — 퍼널 개편, 가격 변경 등은 별도 지시서
- HEIC 파일: sharp가 디코드 못 할 수 있음. try/catch로 감싸서 실패 시 원본 base64 폴백 + 로그
- 민아 검토 리포트 참조: `ops/reports/2026-07/REPORT_20260708_iMac민아_00428검증_EXIF회전결함.md`
