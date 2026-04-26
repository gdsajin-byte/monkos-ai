---
type: ORDER
date: 2026-04-26
from: iMac/쌍아
to: iMac/막내3
status: 대기
priority: B
ref: iMac민아 워크트리 진단 (compassionate-lamport) ORDER_20260426_iMac민아→iMac쌍아_VideoObject_uploadDate보정.md
---

# VideoObject uploadDate 보정 — Search Console 경고 해소

> **트리거**: Google Search Console 4/26 06:48 경고 — "monkos.ai에서 새로운 동영상 구조화된 데이터 문제가 감지됨"
> **원인**: 4/25 사이드바 쇼츠 배포 시 VideoObject에 placeholder 날짜 `"2026-04-01"` 기입 (시간대 누락 + 값 부정확)

## 작업

### 1. YouTube 실제 업로드일 확인

YouTube Data API v3 또는 직접 확인:

| # | YouTube ID | 제목 | 라인 |
|---|-----------|------|------|
| 1 | xAJsKdZWtjU | AI 증명사진 — 자연스럽게 셀카로 만드는법 | 166 |
| 2 | 2okGk_3k9TM | 就活写真で前髪、絶対なくさないといけないの？ | 176 |

```bash
# API로 확인 (권장)
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=xAJsKdZWtjU,2okGk_3k9TM&key=${YOUTUBE_API_KEY}" | jq '.items[].snippet.publishedAt'
```

API 키가 없으면 YouTube 페이지에서 직접 게시일 확인 후 ISO 8601 변환.

### 2. index.html 수정

**파일**: `monkos_AI/portal/public/index.html`

라인 166, 176의 `uploadDate` 값을 실제 업로드일로 교체:

```
AS-IS:  "uploadDate": "2026-04-01"
TO-BE:  "uploadDate": "2025-XX-XXTXX:XX:XX+09:00"  ← 실제 값
```

형식: ISO 8601 datetime + 시간대 필수 (KST = `+09:00`, UTC = `Z`)

### 3. 배포

```bash
cd monkos_AI/portal && ./deploy.sh prod
```

### 4. 검증

- [Google Rich Results Test](https://search.google.com/test/rich-results)에 `https://monkos.ai` 입력
- VideoObject 2건 모두 무경고 확인

## ⚠️ 준수 조항

- 법률 5장 2조: deploy.sh 경유 배포
- 수정 대상은 index.html의 uploadDate 값 2개소만 — 다른 스키마 건드리지 말 것
