---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내2
portfolio: PF_SPECS
status: 대기
priority: P1
prerequisite: V1 소각 완료
---

# 지시서: usa-headshot CTA 전환 + cn-resume 레코드 분리

**[2026-07-19 12:48 KST]** iMac/쌍아 → 막내2

## 배경

V1 소각으로 428슬러그 V2 통일 완료. 잔여 데이터 작업 2건:

1. **usa-headshot**: 규격 안착 크롭 비적용 상품 (프로필·링크드인 헤드샷). 퍼널 대신 기존 헤드샷 서비스(나노 프로) 연결 CTA로 전환 (작가님 7/19 04:35 확정)
2. **cn-resume**: 404 상태. size가 "1寸(25×35mm)/2寸(35×49mm)" 복수 규격 → 파싱 불가 → 레코드 분리 후 각각 V2 편입 필요

- 민아 기획서: `PROPOSAL_20260719_민아_V1완전제거_유색국정합_전수조사.md` (A2·A3)

## ⚠️ 준수 조항

- deploy.sh 경유 배포 필수
- jest 녹색 필수
- usa-headshot: 기존 SEO 자산(URL·메타) 유지. 페이지 삭제 금지.
- cn-resume: 분리 후 양쪽 모두 isEngineCompatibleSpec 통과 확인

## 작업

### Task 1. usa-headshot — 퍼널 → 헤드샷 서비스 CTA 전환

**현행**: `/specs/headshot/usa` 라이브 200, V2 퍼널 시도 시 규격 부재로 크롭 불가

**목표**: 퍼널 섹션을 제거하고, 기존 헤드샷 서비스로 연결하는 CTA로 교체

구현:
1. `countries.jsonl`의 usa-headshot 레코드에 플래그 추가 (예: `"funnel": false` 또는 `"redirect": "/headshot"`)
2. `specsDetailV2Fragment` 또는 `isEngineCompatibleSpec`에서 해당 슬러그를 퍼널 비활성 처리
3. 페이지 본문에 CTA 삽입:
   - 문구: "AI 프로필 사진을 바로 만들어보세요" (4언어)
   - 링크: `/headshot` (기존 나노 프로 헤드샷 서비스)
4. 규격 정보(400px+·단색 배경·권장 사이즈)는 텍스트로 유지
5. SEO 메타(title·description·canonical) 유지 — URL 변경 없음

### Task 2. cn-resume — 복수 규격 레코드 분리

**현행**: cn-resume 단일 레코드, size="1寸(25×35mm)/2寸(35×49mm)" → 파싱 실패 → 404

**목표**: 2개 레코드로 분리하여 각각 V2 퍼널 동작

1. `countries.jsonl`에서 cn-resume를 2개로 분리:
   - `cn-resume-1cun` — size: "25 × 35 mm", 1寸 증명사진
   - `cn-resume-2cun` — size: "35 × 49 mm", 2寸 증명사진
2. 기타 필드(background, details, faqs 등)는 원본 복제
3. URL 라우팅: `/specs/resume/cn` → 허브 페이지 또는 기본값(1寸)으로 서빙. 양쪽 개별 URL도 접근 가능하게.
4. 원본 cn-resume 슬러그 → 301 리다이렉트 또는 허브 처리
5. `isEngineCompatibleSpec` 통과 확인 (size 파싱 성공 + 비율 1.0 이상)
6. sitemap 반영

### Task 3. 테스트 + 배포

```bash
npm test
./deploy.sh
```

### Task 4. 라이브 검증

- `/specs/headshot/usa` → 퍼널 없음, CTA 표시, 클릭 시 `/headshot` 이동
- cn-resume 분리 URL → V2 퍼널 동작, 사진 업로드 가능
- 기존 kr-passport 등 무영향 확인

## 완료 조건

1. jest 녹색
2. 배포 성공
3. Task 4 라이브 검증 통과
4. 민아 검증 게이트: 배포 후 인계

## 커밋

```
[feat] usa-headshot CTA 전환 + cn-resume 1寸/2寸 레코드 분리 — 퍼널 정합
```
