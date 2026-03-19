---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-19
priority: normal
project: SPREAD
scope: Phase 2 — 시드 카탈로그 탭 + 이미지 저장소 탭 전환
---

# ORDER_20260319 — 에디터 워크스테이션 Phase 2: 시드 카탈로그 + 탭 구조

**[2026-03-19 16:16 KST] iMac/쌍아 → iMac/막내**

## 배경

어드민 에디터 우측 사이드바를 탭 구조로 전환하고, 에피소드 카탈로그(42건)를 참조할 수 있는 시드 카탈로그 탭을 추가한다.

## 참조

- 어드민 에디터: `monkos_AI/portal/public/admin/blog-edit.html`
- 에피소드 카탈로그: `monkos-ops/ops/reports/REPORT_20260317_에피소드카탈로그_v1.md`
- CMS API: `monkos_AI/portal/lib/cms/`

---

## Task 1: 우측 사이드바 탭 구조 전환

현재 이미지 저장소만 있는 우측 사이드바를 **탭 구조**로 변경.

```html
<div class="sidebar-tabs">
  <button class="tab active" data-tab="images">이미지</button>
  <button class="tab" data-tab="seeds">시드</button>
  <!-- Phase 3에서 [리서치] 탭 추가 예정 -->
</div>
<div class="tab-content" id="tab-images">
  <!-- 기존 이미지 저장소 그대로 -->
</div>
<div class="tab-content" id="tab-seeds" style="display:none">
  <!-- 시드 카탈로그 -->
</div>
```

- 기존 이미지 저장소 기능은 100% 유지
- 탭 전환 시 부드러운 전환 (display toggle)
- 이미지 탭의 `max-height` 조절 가능하게 (접기/펼치기)

---

## Task 2: 에피소드 카탈로그 데이터 시딩

에피소드 42건을 JSON으로 정리하여 어드민에서 로드.

**방식 A (권장)**: 정적 JSON 파일로 어드민에 내장
```
monkos_AI/portal/public/admin/data/episode_catalog.json
```

**방식 B (대안)**: Firestore `episode_catalog` 컬렉션

카탈로그 원본에서 추출할 필드:

```json
[
  {
    "id": "EP-001",
    "title": "포트 79 차단 → CF Pages + Cloud Run 서비스 분할",
    "category": "ARCH",
    "period": "2026-01-08 ~ 2026-01-18",
    "summary": "ISP의 비표준 포트 차단으로 자체 서버 운영 불가 → 이원 구조 전환",
    "insight": "인프라 제약이 아키텍처를 결정한다",
    "blogScore": 4,
    "researchScore": 4,
    "used": false
  }
]
```

`used` 필드: 이미 블로그로 작성된 에피소드 표시 (향후 어드민에서 토글)

---

## Task 3: 시드 카탈로그 UI

```
┌─ [시드] 탭 ─────────────────┐
│ 🔍 검색 [___________] [전체▾]│  ← 카테고리 필터 드롭다운
│                              │
│ ★5 EP-004 DEBUG              │  ← 블로그 적합도 순 정렬
│   배포 통제 부재→카메라 충돌    │
│   💡 권한이 열려있을수록 규율   │  ← 인사이트 미리보기
│                              │
│ ★5 EP-021 PRODUCT            │
│   크롭 v1→v2 FaceMesh 해부학  │
│   💡 해부학적 앵커가 정밀도 결정│
│                              │
│ ★4 EP-001 ARCH               │
│   포트 79 차단→서비스 분할     │
│   💡 인프라 제약이 아키텍처 결정│
│                              │
│ ... (스크롤)                  │
└──────────────────────────────┘
```

**기능**:
- 블로그 적합도 ★ 내림차순 기본 정렬
- 카테고리 필터: 전체 / ARCH / DEBUG / GOV / PRODUCT / TEAM / BIZ
- 키워드 검색: 제목 + 요약 + 인사이트 대상
- 에피소드 클릭 시 상세 팝업 (전체 정보 표시)
- `[글감으로 사용]` 버튼 → 에디터 제목에 자동 삽입 (선택적)

**스타일**: 기존 이미지 저장소와 동일한 다크 테마. 카테고리별 라벨 색상 구분.

---

## 완료 조건

- [ ] 우측 사이드바 탭 구조 전환 (이미지 / 시드)
- [ ] 에피소드 42건 JSON 시딩
- [ ] 시드 카탈로그 검색 + 필터 + 정렬 동작
- [ ] 에피소드 클릭 시 상세 팝업
- [ ] 기존 이미지 저장소 기능 100% 유지
- [ ] dev 배포 후 확인

## ⚠️ 준수 조항

- 에피소드 내용은 내부용 — 외부 노출 금지 (어드민 전용)
- 기존 이미지 업로드/삽입 기능 훼손 금지
- prod 배포 하지 않는다 (dev까지만)
