---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
status: 완료
---

# [지시서] 어드민 대시보드 — 내부 도구 탭 추가

> **[2026-03-18 16:21 KST] iMac/쌍아 → iMac/막내**
> 어드민 대시보드에 IMAGE PRO + Studio 바로가기 추가.

---

## 현재 상태

어드민 대시보드 (`/admin/index.html`)에 5개 카드:
- Blog, FAQ, Gallery, Board, Settings

내부 도구(IMAGE PRO, Studio)에 대한 링크 없음.

---

## 작업

### admin/index.html 수정

기존 5개 카드 그리드 아래 또는 별도 섹션으로 **내부 도구** 카드 2개 추가:

#### 1. IMAGE PRO
- 라벨: `IMAGE PRO`
- 설명: `이미지 편집 도구`
- 링크: `https://image.monkos.ai` (새 탭)
- 아이콘/배지: 외부 링크 표시 (↗)

#### 2. Studio (내부)
- 라벨: `Studio`
- 설명: `AI 증명사진 내부 생성 도구`
- 링크: Cloud Run dev URL (현재: `https://monkos-studio-dev-4jeplpqpua-uc.a.run.app/`) → 새 탭
- 아이콘/배지: `INTERNAL` 또는 `DEV` 뱃지

### 레이아웃

기존 카드 5개와 동일한 그리드 스타일 사용. 섹션 구분:

```
── 콘텐츠 관리 ──
Blog | FAQ | Gallery | Board | Settings

── 내부 도구 ──
IMAGE PRO | Studio
```

섹션 헤더 텍스트로 구분하면 충분.

### 스타일

- 기존 카드 CSS 그대로 재사용
- 외부 링크 카드에 `target="_blank"` + `rel="noopener"`
- 내부 도구 카드에 미묘한 시각 구분 (예: 테두리 색상 변경 또는 배지)

---

## 주의 사항

- ⚠️ 기존 5개 카드 수정 금지
- ⚠️ 인증 로직 변경 금지 — 기존 Google 로그인 그대로 유지
- Studio URL은 하드코딩 OK (내부 전용, 나중에 서브도메인 전환 시 변경)

---

## 완료 보고

커밋 해시 + dev 확인.
형식: `✅❌💡⏳📁🔀`
