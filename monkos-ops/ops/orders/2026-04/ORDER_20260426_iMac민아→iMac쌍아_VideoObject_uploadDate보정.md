# ORDER: VideoObject uploadDate 보정 — Search Console 경고 해소

| 항목 | 값 |
|---|---|
| 발신 | iMac/민아 |
| 수신 | iMac/쌍아 (검토 → 막내 지시서 발행) |
| 발행일 | 2026-04-26 14:55 KST |
| 트리거 | 작가님 직접 지시 (이메일 검토 → 직접 확인 → 쌍아 토스) |
| 우선순위 | 중 (심각하지 않은 문제, 검색 영향 X but 향후 재분류 가능) |

---

## 1. 사고 출처

📩 **2026-04-26 06:48 KST · Google Search Console (sc-noreply@google.com) → gdsajin@gmail.com**

> "monkos.ai에서 새로운 동영상 구조화된 데이터 문제가 감지됨"
>
> 심각하지 않은 문제 중 주요 문제:
> - datetime 속성('uploadDate')에 시간대가 누락됨
> - 'uploadDate'의 datetime 값이 잘못됨

Message type: `[WNC-10030322]`

## 2. 진단 결과 (민아 직접 확인 완료)

📁 **파일**: `monkos_AI/portal/public/index.html`

**현행 (라인 162~180):**

```json
{
  "@type": "VideoObject",
  "name": "AI 증명사진 — 자연스럽게 셀카로 만드는법",
  ...
  "uploadDate": "2026-04-01",   ← ❌ date-only, 시간·시간대 모두 누락
  "contentUrl": "https://youtu.be/xAJsKdZWtjU",
  ...
},
{
  "@type": "VideoObject",
  "name": "就活写真で前髪、絶対なくさないといけないの？",
  ...
  "uploadDate": "2026-04-01",   ← ❌ 동일 문제 (한·일 영상 둘 다 같은 값)
  ...
}
```

**원인**: 4/25 rev 00232 사이드바 쇼츠 썸네일 배포 시 VideoObject에 placeholder 날짜 `"2026-04-01"`만 박힘. Google이 약 5시간 만에 감지·통보.

## 3. Google 요구사항 (스키마 정본)

[Google VideoObject 가이드](https://developers.google.com/search/docs/appearance/structured-data/video):
> uploadDate: The date the video was first published, in **ISO 8601 format**. We recommend providing the full datetime with **timezone information**.

✅ 올바른 형식 예: `"2026-04-01T00:00:00+09:00"` (KST 기준)

## 4. 막내 지시서 초안 (쌍아 검토 후 발행)

### 작업 범위
- `monkos_AI/portal/public/index.html` 라인 166, 176의 `uploadDate` 값 보정 (2개소)
- 두 영상의 **실제 YouTube 업로드 일자** 확인 후 ISO 8601 + KST 시간대로 기입

### 영상 식별자
| # | YouTube ID | 제목 | 라인 |
|---|---|---|---|
| 1 | xAJsKdZWtjU | AI 증명사진 — 자연스럽게 셀카로 만드는법 | 166 |
| 2 | 2okGk_3k9TM | 就活写真で前髪、絶対なくさないといけないの？ | 176 |

### 실제 업로드 일자 확인 방법
- 옵션 A (권장): YouTube Data API v3 `videos.list?part=snippet&id={ID}` 호출 → `snippet.publishedAt` 가져오기 (ISO 8601 UTC 형식 그대로)
- 옵션 B: YouTube 동영상 페이지 직접 방문(`https://youtu.be/{ID}`) → "게시일" 확인 → 수기 변환
- 옵션 C (최후): 둘 다 어려우면 안전한 placeholder `"2026-04-01T00:00:00+09:00"` 유지 (timezone만 보정해도 경고 1건은 해소, 잘못된 값 경고는 잔존)

### 권장 형식
- API에서 받은 UTC 값(`2025-XX-XXTHH:MM:SSZ`) 그대로 또는 KST(+09:00)로 환산하여 기입
- 두 값 모두 ISO 8601 datetime + 시간대 명시

### 검증
- 배포 후 [Google Rich Results Test](https://search.google.com/test/rich-results)에 https://monkos.ai 입력 → VideoObject 2건 모두 무경고 확인
- Search Console "동영상 구조화된 데이터" 보고서에서 다음 크롤링 시 해소 확인 (보통 며칠 내)

### 배포
- `./deploy.sh prod` (포털) — `monkos_AI/portal/deploy.sh` 경유 (헌법 5조 2조 준수)

### 작업량 추정
- 막내 1명 · 10~20분 (API 호출 포함) / 5분 (placeholder 형식 보정만)

## 5. 쌍아 검토 포인트

1. ⚠️ `uploadDate`에 정확한 게시일 박는 게 SEO·신뢰성 측면에서 본질적 — placeholder 우회는 임시방편. 막내한테 옵션 A 강제 권고
2. ⚠️ 향후 신규 VideoObject 추가 시 동일 실수 재발 방지: 포털 SEO 가이드(`monkos-ops/tech/architecture/PORTAL_V4_TECHNICAL_SPEC.md` 또는 신규 SEO 체크리스트)에 "VideoObject uploadDate는 ISO 8601 + 시간대 필수" 명시 권고
3. 본 건은 헌법 5조 2조(deploy.sh 경유) 외 추가 규정 충돌 없음

## 6. 처리 종결 조건

- [ ] 막내 지시서 발행 + 작업 완료 보고
- [ ] 배포 완료 + Rich Results Test 통과 스크린샷
- [ ] Search Console 다음 크롤링에서 경고 해소 확인 (~1주일)
- [ ] (선택) SEO 체크리스트에 VideoObject 가이드라인 추가
