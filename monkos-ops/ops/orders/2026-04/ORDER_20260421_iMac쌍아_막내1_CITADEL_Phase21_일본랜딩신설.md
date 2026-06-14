---
type: ORDER
date: 2026-04-21
from: iMac/쌍아
to: iMac/막내1
priority: HIGH
deadline: 2026-04-22 12:00 KST
ref_proposal: PROPOSAL_20260421_민아_CITADEL_Phase2_색인누수차단+일본타깃정밀화.md
portfolio: PF_CITADEL
---

# 지시서 — PF_CITADEL Phase 2.1: 일본 코어 키워드 랜딩 신설

**[2026-04-21 16:32 KST] iMac/쌍아 → iMac/막내1**

> 민아 제안서 §4 Phase 2.1 기반 환급. 정합성 검토 선행.

---

## 0. 정합성 검토 (실행 전 필수)

**아래 3건을 먼저 확인하고, 결과를 보고한 뒤 실행에 들어갈 것.**

| # | 검토 항목 | 확인 방법 |
|---|----------|----------|
| 1 | idphoto-jp SPA 라우팅 구조 파악 — 개별 규격 페이지가 물리적으로 존재하는가, 동적 생성인가 | `monkos_AI/idphoto-jp/server.js` 라우트 테이블 확인 |
| 2 | 현재 sitemap 5개 URL이 정확히 무엇인가 — 막내3 Phase 2.0 결과물 확인 | `curl https://idphoto-jp.monkos.ai/sitemap.xml` |
| 3 | 일본 규격 데이터가 어디에 있는가 — specs-data.json 또는 Firestore | 소스 코드 내 specs 관련 파일 탐색 |

---

## 1. 임무

일본 코어 키워드에 매칭되는 **L1 랜딩 페이지**를 idphoto-jp에 신설하여 GSC 노출 대상을 확보하라.

---

## 2. 타깃 키워드 + 랜딩 매핑

| 키워드 | 검색 의도 | 신설 URL | 비고 |
|--------|----------|---------|------|
| `就活写真` | 취활 증명사진 | `/jp/guide/shukatsu` | 취활 전용 가이드 |
| `証明写真 アプリ` | 증명사진 앱 비교 | `/jp/guide/app` | 경쟁사 비교 + MONKOS CTA |
| `パスポート写真 アプリ` | 여권사진 앱 | `/jp/specs/passport` | 여권 규격 상세 + 촬영 CTA |
| `証明写真 AI` | AI 증명사진 | `/jp/guide/ai` | AI 기술 설명 + 체험 CTA |
| `運転免許 写真` | 운전면허 사진 | `/jp/specs/drivers-license` | 운전면허 규격 + 촬영 CTA |

> 정합성 검토 결과에 따라 URL 패턴·구현 방식 조정 가능.

---

## 3. 페이지 요건

각 랜딩 페이지 필수 요소:
- **title 태그**: 키워드 포함 (예: `就活写真をAIで | MONKOS`)
- **meta description**: 일본어 150자 이내
- **H1**: 키워드 1회 포함
- **본문**: 300자 이상 일본어 콘텐츠 (규격 정보 + MONKOS 차별점 + CTA)
- **CTA 버튼**: "今すぐ撮影する" → idphoto-jp 촬영 페이지 링크
- **hreflang**: ja 정확히 설정
- **JSON-LD**: FAQ 또는 HowTo 스키마
- **sitemap 등록**: 신설 페이지 전부 sitemap.xml에 추가

---

## 4. 완료 기준

| 항목 | 완료 조건 |
|------|----------|
| 페이지 | 최소 5개 URL 신설 + 200 응답 확인 |
| sitemap | sitemap.xml에 신규 URL 전수 포함 (5→10+) |
| GSC | sitemap 재제출 + 신규 URL 5건 개별 색인 요청 |
| 배포 | deploy.sh 경유 prod 배포 |

---

## 5. 금지·준수

- deploy.sh 경유 배포 (직접 gcloud 금지)
- 기존 페이지·라우트 파손 금지
- 헌법 3조 1항: 매 턴 `date`
- PF_CITADEL 히스토리 append

---

## 6. 산출물

| # | 산출물 | 경로 |
|---|--------|------|
| 1 | 정합성 검토 결과 (선보고) | 보고서 내 포함 |
| 2 | 신설 페이지 목록 + URL + 상태 | 보고서 내 포함 |
| 3 | 완료 보고 | 세션 로그 어펜드 |

**지시서 종료.**
