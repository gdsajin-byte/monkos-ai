---
type: proposal
from: iMac/쌍아
to: 작가님
date: 2026-03-18
project: studio
status: 검토대기
---

# [기안서] MONKOS Studio v2 — T2I→I2I 통합 SPA

> **[2026-03-18 17:36 KST] iMac/쌍아 → 작가님**
> 내부 스튜디오 앱을 데스크탑 중심 싱글 페이지로 전면 재설계.
> T2I(Before 생성) + I2I(AI 보정) + 퍼널 복원 + 아카이브 자동 적립.

---

## 1. 배경 및 목적

### 현재 (Studio v1)
- 파일 업로드 → I2I(photo.js) → Before/After 비교 컷
- 퍼널 생략 (의상/헤어/배경 하드코딩 default)
- 페이지 전환 방식 (app → result)
- Before 원본 = 실제 사진 필요

### 문제
- Before 원본 수급 한계 → 대량 샘플 생산 불가
- 퍼널 옵션 없음 → 프롬프트 세밀화 실험 불가
- 페이지 전환 → 반복 작업 비효율

### 목표
- T2I로 Before를 무한 생성 → I2I로 After 생산 → 실서비스 동일 조건의 B/A 대량 생산
- 프롬프트/옵션 조합별 결과 비교 → 프롬프트 세밀화 R&D
- 데스크탑 한 페이지에서 전체 워크플로우 완결
- 마케팅 콘텐츠 자동 적립

---

## 2. 아키텍처

### 파이프라인

```
[T2I 엔진]                    [I2I 엔진 (기존 photo.js)]
Imagen / Nano Banana           Imagen I2I + 프롬프트 빌더 v5
     │                              │
     ▼                              ▼
 Before 이미지 생성            Before → After AI 보정
     │                              │
     └──── 중앙 워크스페이스 ────────┘
                  │
                  ▼
           아카이브 자동 적립 (GCS)
```

### T2I Before 생성
- **엔진**: Imagen 3 (IMAGE PRO와 동일)
- **프롬프트**: 증명사진 촬영 조건 시뮬레이션
  - "한국 여성 20대, 정면, 어깨까지, 자연광, 일반 배경, 스마트폰 셀카 느낌"
  - 성별/연령/인종/조명/배경 조합으로 다양한 Before 생성
- **입력 모드 2가지**:
  - A) T2I 프롬프트 → 새 얼굴 생성
  - B) 파일 업로드 → 기존 사진 사용 (v1 기능 유지)

### I2I After 생성
- **기존 photo.js 정본 그대로** — 수정 금지
- 퍼널 옵션(의상/헤어/배경) → 프롬프트 빌더 v5 → Imagen I2I
- **실서비스와 100% 동일한 파이프라인**

---

## 3. UI 레이아웃 (데스크탑 SPA)

```
┌──────────────────────────────────────────────────────────────┐
│  MONKOS Studio v2                                 INTERNAL  │
├──────────┬────────────────────────────┬───────────────────────┤
│ SIDEBAR  │     WORKSPACE             │    ARCHIVE            │
│ (260px)  │     (1fr)                  │    (280px)            │
│          │                            │                       │
│ ▼ 입력모드│  ┌────────┬────────┐       │ ┌───────────────────┐ │
│ ○ T2I생성│  │ BEFORE │ AFTER  │       │ │ #005 passport F   │ │
│ ○ 파일업로드│ │        │        │       │ │ suit-navy 17:23   │ │
│          │  │        │        │       │ │ [B|A 썸네일]      │ │
│ ▼ T2I설정│  │        │        │       │ ├───────────────────┤ │
│ 성별/연령│  └────────┴────────┘       │ │ #004 id M         │ │
│ 인종/조명│                            │ │ casual 17:15      │ │
│ [Before  │  진행 상태 / 수치 피드백    │ │ [B|A 썸네일]      │ │
│  생성]   │                            │ ├───────────────────┤ │
│──────────│  [다시] [After↓] [B/A↓]    │ │ ...               │ │
│ ▼ 규격   │                            │ │                   │ │
│ ○여권○반명함                          │ │                   │ │
│          │                            │ │                   │ │
│ ▼ 성별   │                            │ │                   │ │
│ ▼ 연령   │                            │ │                   │ │
│ ▼ 의상   │                            │ │                   │ │
│  그대로/변경                          │ │                   │ │
│  캐주얼/정장▸│                         │ │                   │ │
│ ▼ 헤어   │                            │ │                   │ │
│ ▼ 배경   │                            │ │                   │ │
│          │                            │ │                   │ │
│ [After   │                            │ │                   │ │
│  생성]   │                            │ │                   │ │
└──────────┴────────────────────────────┴───────────────────────┘
```

### 사이드바 (260px)

**상단 — 입력 모드 + T2I 설정**
- 입력 모드 토글: T2I 생성 / 파일 업로드
- T2I 프롬프트 설정: 성별, 연령, 인종, 조명, 배경 느낌
- [Before 생성] 버튼 → 중앙 BEFORE에 표시

**하단 — I2I 퍼널 (idphoto-kr prep.js 복원)**
- 규격 (여권/반명함)
- 성별 (여/남) — T2I 설정과 연동
- 연령 (성인/청소년/아동/유아) — T2I 설정과 연동
- 의상 (그대로/의상변경/캐주얼/정장 + 컬러 세부)
- 헤어 (그대로/깔끔정리/올림머리)
- 배경 (흰/회/파/베이지)
- [After 생성] 버튼 → 중앙 AFTER에 표시

### 중앙 워크스페이스 (1fr)

- Before | After 나란히 (50/50)
- Before 아래: T2I 프롬프트 표시 (또는 파일명)
- After 아래: 적용된 옵션 요약
- 하단: [다시하기] [After 다운로드] [비교 컷 다운로드]

### 우측 아카이브 (280px)

- 생성할 때마다 자동 카드 추가
- 카드: B/A 썸네일(작게) + 메타 (규격, 성별, 의상, 시각)
- 클릭 시 워크스페이스에 로드
- 스크롤 가능

---

## 4. 아카이브 스토리지

### GCS 경로
```
gs://monkos-studio/
├── before/
│   └── STUDIO_B_{seq}_{gender}_{age}_{timestamp}.jpg
├── after/
│   └── STUDIO_A_{seq}_{format}_{gender}_{age}_{clothing}_{hair}_{timestamp}.jpg
└── compare/
    └── STUDIO_BA_{seq}_{format}_{timestamp}.jpg
```

### 메타데이터
각 이미지에 GCS 메타데이터 또는 Firestore `studio_archive` 컬렉션:
```json
{
  "seq": 5,
  "before": "gs://monkos-studio/before/STUDIO_B_005_f_adult_20260318173600.jpg",
  "after": "gs://monkos-studio/after/STUDIO_A_005_passport_f_adult_suit-navy_tidy_20260318173612.jpg",
  "compare": "gs://monkos-studio/compare/STUDIO_BA_005_passport_20260318173612.jpg",
  "options": {
    "format": "passport",
    "gender": "f",
    "age": "adult",
    "clothing": "suit",
    "clothingColor": "navy",
    "hair": "tidy",
    "bgColor": "white"
  },
  "t2iPrompt": "Korean woman, 20s, front-facing, shoulders visible, natural light, casual background",
  "inputMode": "t2i",
  "createdAt": "2026-03-18T17:36:00+09:00"
}
```

---

## 5. 구현 단계 (Phase 분할)

### Phase A: SPA 레이아웃 + 퍼널 복원
- 3컬럼 SPA 레이아웃 (HTML+CSS)
- 좌측 사이드바에 idphoto-kr prep.js 퍼널 이식
- 파일 업로드 → I2I → Before/After 한 페이지
- result.js 하드코딩 제거 → 사이드바 선택값 전달
- **기존 v1 기능의 SPA 전환**

### Phase B: T2I Before 생성
- server.js에 `/api/t2i` 엔드포인트 추가
- Imagen T2I 호출 (IMAGE PRO의 t2i.js 참조)
- T2I 프롬프트 프리셋 + 커스텀 입력
- 입력 모드 토글 (T2I / 파일 업로드)

### Phase C: 아카이브 시스템
- GCS 저장 (before/after/compare 각각)
- Firestore `studio_archive` 컬렉션
- 우측 아카이브 패널 — 히스토리 로드 + 클릭 재현
- 파일명 스키마 적용

### Phase D: 프롬프트 R&D 기능 (후속)
- 프롬프트 에디터 (photo.js 빌더 오버라이드)
- A/B 비교 (같은 Before에 다른 옵션 → 나란히)
- 배치 생성 (옵션 조합 자동 순회)

---

## 6. 참조 코드

| 기능 | 참조 소스 | 용도 |
|------|----------|------|
| 퍼널 UI | `idphoto-kr/public/prep.html`, `prep.js` | 의상/헤어/배경 선택 UI |
| I2I 파이프라인 | `idphoto-kr/lib/photo.js` | AI 보정 정본 (수정 금지) |
| T2I 엔진 | `monkos_AI/image-pro/` (IMAGE PRO) | T2I 호출 패턴 참조 |
| 아카이브 | `portal/lib/cms/` | GCS/Firestore CRUD 패턴 |
| SPA 레이아웃 | `portal/public/css/portal.css` | 3컬럼 그리드 패턴 |

---

## 7. 제약 조건

- ⚠️ **photo.js 수정 금지** — I2I 파이프라인은 정본. 프롬프트 오버라이드는 Phase D
- ⚠️ **idphoto-kr 원본 수정 금지** — studio/ 독립 폴더만 수정
- ⚠️ **내부 전용** — robots.txt Disallow, 인증 불필요하지만 외부 노출 차단
- 헌법 제4조: API 키 하드코딩 금지

---

## 8. 결정 필요 사항 (작가님)

1. **Phase A부터 착수할지, A+B 동시에 갈지** — A만 하면 퍼널 복원 SPA. B까지 가면 T2I 포함.
2. **T2I 엔진 선택** — Imagen 3? Nano Banana? 둘 다?
3. **아카이브 스토리지** — GCS 단독 vs GCS+Firestore (검색/필터 필요 시 Firestore)
4. **Phase D 프롬프트 에디터 범위** — photo.js 빌더 직접 오버라이드 허용 여부

---

> **쌍아 의견**: Phase A→B→C 순서 권장. A에서 SPA 뼈대가 잡혀야 B(T2I)와 C(아카이브)를 붙일 수 있음. Phase D는 A~C 안정화 후.
