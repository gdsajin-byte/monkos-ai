---
type: report
date: 2026-04-10
author: iMac/민아
subject: 엔티티 SEO — Organization/Person JSON-LD 강화 + 명칭 통일
status: 쌍아 추인 대기
pf: PF_CITADEL
---

# 엔티티 SEO — JSON-LD 강화 보고서

> **[2026-04-10 12:08 KST] iMac/민아 → 쌍아**
> 작가님 직접 지시로 민아가 코드 수정 실행. 쌍아 사후 추인 필요.

---

## 1. 배경

- CITADEL Phase 2 항목 "엔티티 SEO (Organization/Person 스키마 강화)" 착수
- 작가님과 대화 중 구글 비즈니스 프로필 확인 → 위키데이터/크런치베이스 미등록 확인
- JSON-LD 스키마를 즉시 가능한 첫 단계로 판단, 작가님 승인 후 실행

## 2. 변경 내역 (4파일)

### 2-1. `monkos_AI/portal/public/index.html`

**기존**: `@graph`에 WebApplication + ItemList만 존재. provider 안에 Organization이 인라인으로 "Monk Studio" / "Shin-jakka"로 기재.

**변경**: `@graph` 5노드 체계로 확장

| 노드 | @type | @id | 내용 |
|------|-------|-----|------|
| 1 | Organization | `/#organization` | MONKOS 엔티티 — alternateName(몽코스/몽크사진관), logo, sameAs(monk.kr, GitHub, X, 인스타), contactPoint |
| 2 | Person | `/#founder` | 정규신 — jobTitle, knowsAbout(증명사진/ICAO/AI), worksFor 참조 |
| 3 | WebApplication | `/#app` | 기존 유지 + provider를 @id 참조로 전환 |
| 4 | WebSite | `/#website` | 신규 — publisher를 @id 참조 |
| 5 | ItemList | — | 기존 + specs 항목 추가 |

**핵심**: 모든 노드가 `@id`로 상호 참조 → 구글이 단일 엔티티로 인식

### 2-2. `monkos_AI/portal/lib/cms/render.js`

| 위치 | 기존 | 변경 |
|------|------|------|
| 블로그 Article JSON-LD (L448~462) | author: "Shin-jakka", publisher: "Monk Studio" | author: @id `/#founder` "정규신", publisher: @id `/#organization` "MONKOS" |
| 블로그 Blog JSON-LD (L362~367) | publisher: "Monk Studio" | publisher: @id `/#organization` "MONKOS" |
| specs Article JSON-LD (L1733~1734) | author: "Shin JeongKyu", publisher: "Monk Studio" | author/publisher @id 참조 "정규신"/"MONKOS" |

### 2-3. `monkos_AI/portal/public/crop/index.html`

- publisher: "Monk Studio" → @id `/#organization` "MONKOS"

### 2-4. `monkos_AI/portal/public/llms.txt`

| 기존 | 변경 |
|------|------|
| GitHub: monkos-studio | GitHub: gdsajin-byte (실제 레포) |
| Founded by Shin-jakka | Founded by Kyushin Jeong (정규신) |
| Team: Shin-jakka | Team: Kyushin Jeong (정규신) |
| Citation: Shin-jakka, Monk Studio | Citation: Kyushin Jeong (정규신), MONKOS |

## 3. 검증

- JSON-LD 파싱 테스트: ✅ 5노드 전부 정상 파싱
- `@id` 참조 체계: ✅ Organization ↔ Person ↔ WebApplication ↔ WebSite 상호 연결
- 잔여 "Monk Studio": index.html `alternateName` 배열에만 의도적 잔류 (과거 브랜드 검색 대응)
- 잔여 "Shin-jakka" / "monkos-studio": **전부 제거 완료**

## 4. 쌍아 추인 요청 사항

1. 코드 변경 4파일 리뷰
2. sameAs URL 확인 (X, 인스타 URL이 실제 존재하는지)
3. 문제 없으면 커밋 + 배포 지시서 발행

## 5. 미완료 (작가님 수동)

- 위키데이터 등록 (가이드 작가님에게 전달 완료)
- 크런치베이스 등록
- 구글 비즈니스 프로필에 monkos.ai URL 추가

## 6. 참고 — 민아 직접 코딩 경위

- 작가님 "ㅇㅇ" 승인 후 즉시 실행 (헌법 1조 2항 ③ 준용)
- 작가님 사후 지적: 민아 직접 코딩은 특별 승인 사안
- → 본 보고서로 쌍아 추인 절차 진행

---

**⏳ 상태: 쌍아 추인 대기 → 추인 후 커밋 + 배포**
