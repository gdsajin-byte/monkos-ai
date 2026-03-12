---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내1
subject: 서버 자동크롭 제거 — /api/download API 변경
priority: P0
category: 백엔드
---

# 지시서: 서버 자동크롭 제거 — /api/download API 변경

> **[2026-03-12 14:23 KST]** iMac/쌍아 → iMac/막내1

---

## 배경

크롭앱(crop.html)이 클라이언트에서 FaceMesh + Canvas로 정밀 크롭을 수행하므로, 서버의 Gemini 얼굴감지 + Sharp 자동크롭이 불필요해졌습니다. `/api/download`에서 크롭 로직을 제거하고 보정 원본(노크롭)을 그대로 반환합니다.

## 작업 대상

| 파일 | 경로 |
|------|------|
| server.js | `monkos_AI/idphoto-kr/server.js` (664-707행) |
| gcs-save.js | `monkos_AI/idphoto-kr/gcs-save.js` (90-135행) |

## 변경 사항

### 1. server.js `/api/download` (664-707행)

**제거:**
- `detectFace(buffer)` 호출 (688-691행의 Promise.all에서 분리)
- `cropToSpec(buffer, format, faceBox)` 호출 (694행)
- 응답의 `cropped` 필드에서 크롭된 버퍼 대신 원본 버퍼 반환

**변경 후 로직:**
```javascript
app.post('/api/download', async (req, res) => {
  try {
    const { userId, gcsPath, format } = req.body;
    if (!userId) return res.status(400).json({ error: '로그인 필요' });
    if (!gcsPath) return res.status(400).json({ error: 'gcsPath 필요' });

    if (!gcsPath.startsWith(`service/idphoto/kr/${userId}/`)) {
      return res.status(403).json({ error: '접근 권한 없음' });
    }

    // 크레딧 차감 (70c)
    const creditResult = await useCredits(userId, 'download');
    if (!creditResult.success) {
      return res.status(402).json({
        error: creditResult.error,
        credits: creditResult.credits ?? 0,
      });
    }

    // GCS에서 보정 원본 다운로드 + Signed URL 병렬 발급
    const [buffer, originalUrl] = await Promise.all([
      downloadFromGCS(gcsPath),
      getSignedUrl(gcsPath),
    ]);

    log(`[Download] ${userId} → ${gcsPath} (노크롭 원본)`);
    res.json({
      success: true,
      image: `data:image/png;base64,${buffer.toString('base64')}`,
      originalUrl,
      credits: creditResult.credits,
      format: format || 'passport',
    });
  } catch (err) {
    log(`[API][download] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});
```

**핵심 변경점:**
- `detectFace()` 호출 삭제
- `cropToSpec()` 호출 삭제
- 응답 키: `cropped` → `image` (노크롭 원본임을 명확히)
- `format` 그대로 반환 (클라이언트에서 크롭앱에 전달용)

### 2. gcs-save.js `cropToSpec()` (90-135행)

- **즉시 삭제하지 않음** — 주석 처리 + `@deprecated` 표기
- 1주 검증 후 완전 제거 예정

```javascript
/**
 * @deprecated 2026-03-12 — 크롭앱(crop.html)으로 이관. 1주 후 제거 예정.
 * 서버 자동 크롭 → 정밀 크롭 (faceBox 기반)
 */
// export async function cropToSpec(...) { ... }
```

### 3. server.js import 정리

- `cropToSpec` import 제거 (gcs-save.js에서)
- `detectFace` import — 다운로드 엔드포인트에서만 사용했다면 제거. 다른 곳에서 사용 중이면 유지.

## ⚠️ 준수 조항

- **헌법 6조 (인프라 보호)**: `.env`, API 키 절대 수정 금지
- **헌법 8조 (파괴적 명령 금지)**: gcs-save.js 함수는 주석 처리만. 삭제 금지
- **법률 2장 (코딩 규칙)**: 기존 에러 핸들링 패턴 유지

## 검증

- `curl -X POST /api/download` → 응답에 `image` (노크롭 base64) 확인
- `cropped` 키가 응답에 없음 확인
- 크레딧 차감 정상 동작 확인
- 기존 `/api/idgen` 등 다른 엔드포인트 영향 없음 확인

## 완료 조건

- [x] `/api/download` 응답이 노크롭 원본 반환
- [x] `cropToSpec()` 주석 처리
- [x] `detectFace()` 다운로드에서 제거
- [x] 다른 엔드포인트 영향 없음

---

**— 지시서 끝 —**
