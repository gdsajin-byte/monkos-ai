---
type: completion
date: 2026-07-07
device: M1
agent: 민아
portfolio: PF_SPECS, PF_CROP
status: 완료
---

# COMPLETION — 크롭 정밀도: IDPASS 이식 + 비전 검수 (ORDER_20260707_M1쌍아_민아)

**[2026-07-07 19:25 KST]** M1/민아 → 작가님·쌍아

## 최종 검증 (카나리 11호, 최난도 케이스 = 상반신 와이드샷)

```
[Fit]   face=33mm top=2.9mm btm=9.1mm eye=43.0% judge=pass/pass vision=good
[Matte] fit 확정 매팅 완료 via=runpod 0.426s — 크롭=fit (FaceMesh 재실행 없음, WYSIWYG)
[완료]  트랙=birefnet — 원본 픽셀 보존, 사후 체크리스트 전항목 ✓
```

## Task별 결과

| Task | 산출물 | 상태 |
|------|--------|------|
| 1. Gemini 프리체크 재정의 | 측정성 검증(§6-1)+규정 8항목 단일 호출, faceBox **비율(0~1)** 정본, 부적합 차단 UX | ✅ |
| 2. 규격 DB 수치 통합 | headHeightMin/Max 428건(countries.jsonl 155·텍스트 267·기본 6) + 명시 faceTarget 8건 | ✅ |
| 3. 비전 검수+가이드 | `/api/idphoto/fit`+`fit-spec`(기하 전용), 규격 안착 시어터, 비전=심미 대행(실행형 보정) | ✅ |
| 4. 사후 체크리스트 | 정본 판정표(spec-judge.js) 수치 5항 + 규정 8항, blocked 시 다운로드 게이트 | ✅ |
| 5. kr-passport 파일럿 | 카나리 8~11호 4회 반복 교정 → 셀카·와이드·상반신 전 유형 통과 | ✅ |

## 파일럿 반복에서 잡은 결함 (원인→처방)

1. 가이드 오배치 → Gemini faceBox 픽셀 좌표 불신뢰 → **비율 정본화**
2. 얼굴 짜부 → 이미지 자체 리사이즈 접근 오류 → **월드 강체+카메라 줌** ("사진이 우선")
3. 시작 뷰 빈 구석 → 로드 즉시 contain 카메라
4. 전문가 소견 모순(헤어 닿음+올려라) → 헤어 보호 3겹 + **실행형 보정**(허용 하한까지 얼굴 양보 — "설명이 아니라 실행")
5. 상반신 사일런트 미스 → **FaceMesh 입력 정규화**(얼굴 280px)+해부학 검증+재시도+정직한 포기
6. 턱·정수리 이탈 → **정본 랜드마크 규칙**(눈=홍채 중심, 턱=윤곽 최대 Y) 이식
7. 분석 정지 화면 → 스캔 라인+단계 텍스트 연출

## 정본 이식 내역 (재해석 금지 원칙)

- faceTarget 결정식(명시값→clamp[fMin+1,fMax−1]), 눈 앵커 42/43% 분기, 헤어 8%+4.4%+하단 12% 루프 (CropEngine.swift)
- 판정표 전량: 스위트존 20%·EYE·TOP·BTM·CENTER·blocked (SpecData.swift:735-767 → spec-judge.js)
- 랜드마크: 동공 우선·턱=윤곽 최대 Y (P3-12)

## 준수 조항 확인

- 규정 8항목 유지·사후 이동(무삭제) ✅ / deploy.sh 경유 ✅ / kr-passport 카나리 한정 ✅ / BiRefNet·RunPod 체인 무변 ✅
- 비전 검수 전 티어 적용(현행), 비용 건당 ₩수십 — 유료 한정 전환은 퍼널 설계와 함께 결정

## 배포·검증 궤적

crop-engine rev 00005→00007, portal prod 00418→00425 (dev 선검증 체계), jest 101/101, 커밋 3493b5d4~bb75ooo98 계열.

## 잔여 (본 지시서 밖)

- ORDER_SPECS_배경제거엔진교체의 **트랙 B(모바일 UX 총체)** 미착수
- 428국 확산(MATTE_SLUGS) — kr-passport 정리 항목(레퍼런스 이미지·디자인 가시성) 후
- 조명 정규화(§6-1)·퍼널 티어 설계(쌍아) 대기
