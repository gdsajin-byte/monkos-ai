---
type: order
date: 2026-04-14
from: iMac/쌍아
to: iMac/막내(any)
subject: monkos-portal 배포 전 사전 점검 — d6d9fed hreflang+301 변경분
priority: P0
deadline: 2026-04-14 20:00 KST
---

# monkos-portal 배포 전 사전 점검

> **[2026-04-14 19:06 KST] iMac/쌍아 → iMac/막내**
> **마감: 오늘 내 — 점검 통과 후 배포 승인 진행**

---

## 0. 배경

커밋 `d6d9fed` (hreflang 조건부 생성 + blogRedirects 3건) 배포 전 사전 점검.
변경 파일 2개: `render.js`, `server.js`.

---

## 1. 점검 항목

### 1-1. render.js — hreflang 조건부 생성 회귀 테스트

> **리스크**: Firestore 병렬 조회 3건 추가 → 응답 지연 / 에러 시 hreflang 전체 누락

| # | 시나리오 | 검증 방법 | 기대 결과 |
|---|---------|---------|---------|
| A | **KO만 존재하는 글** | `curl -s localhost:{PORT}/blog/{ko-only-slug} \| grep hreflang` | `hreflang="ko"` + `x-default`만. ja/en **없어야 함** |
| B | **KO+JA+EN 3개국어 글** | `curl -s localhost:{PORT}/blog/{trilingual-slug} \| grep hreflang` | ko, ja, en, x-default **모두 존재** |
| C | **JA 경로 직접 접근** | `curl -s localhost:{PORT}/ja/blog/{slug} \| grep hreflang` | 해당 글에 존재하는 언어만 출력 |
| D | **존재하지 않는 글** | `curl -sI localhost:{PORT}/blog/nonexistent-slug-xyz` | 404 반환 (기존과 동일) |
| E | **published=false 글** | D1에서 임시로 unpublish 가능하면 → hreflang에서 해당 언어 제외 확인 | 해당 언어 hreflang 미출력 |

### 1-2. server.js — 301 리다이렉트 신규 3건

| # | 원본 URL | 기대 Location | 검증 |
|---|---------|-------------|------|
| 1 | `/en/blog/vol17-vs` | `/en/blog/korea-vs-japan-interview-attire-whats-the-difference` | `curl -sI` → 301 + Location 일치 |
| 2 | `/en/blog/vol18-ai-vs` | `/en/blog/ai-photo-id-can-a-selfie-really-become-an-official-photo` | 동일 |
| 3 | `/ja/blog/vol24-20-ai-monkosai` | `/ja/blog/20-year-photographer-ai-id-photo-monkos-ai-birth` | 동일 |

**추가**: 리다이렉트 대상(신규 슬러그)이 실제로 200 OK 반환하는지 확인.

### 1-3. 기존 기능 회귀 점검

| # | 기능 | 검증 방법 | 기대 |
|---|------|---------|------|
| R1 | 블로그 메인 `/blog` | `curl -sI` | 200 OK |
| R2 | 블로그 목록 페이지 | 페이지 로드 정상 | 글 목록 출력 |
| R3 | 기존 301 리다이렉트 (이전 10건 중 2~3건 샘플) | `curl -sI /blog/vol23-qa-5` 등 | 301 + 올바른 Location |
| R4 | 메인 페이지 `/` | `curl -sI` | 200 OK |
| R5 | 서비스 페이지 `/idphoto` | `curl -sI` | 200 OK |
| R6 | 어드민 `/admin` | `curl -sI` | 200 OK 또는 정상 리다이렉트 |

### 1-4. 성능 점검

| # | 항목 | 검증 |
|---|------|------|
| P1 | 블로그 글 응답 시간 | `curl -sI -w '%{time_total}\n' localhost:{PORT}/blog/{slug}` — 기존 대비 +100ms 이내 |
| P2 | hreflang Firestore 조회 부하 | 3건 Promise.all 병렬 — 총 추가 ~5~15ms 예상. 500ms 이상이면 ⚠️ 보고 |

---

## 2. 점검 환경

- **로컬 서버** 기동: `cd monkos_AI/portal && npm start` (또는 기존 로컬 인스턴스)
- **ADC** 인증 상태 확인 (Firestore 접근 필요)
- prod 직접 테스트 ❌ — 로컬에서만

---

## 3. 산출물

| # | 파일 |
|---|------|
| 1 | `monkos-ops/ops/reports/2026-04/REPORT_20260414_iMac막내_포탈배포전_사전점검.md` |

---

## 4. 보고 형식

```
✅/❌ 1-1 hreflang 시나리오 A/B/C/D/E — 결과
✅/❌ 1-2 301 리다이렉트 3건 — 결과
✅/❌ 1-3 회귀 R1~R6 — 결과
✅/❌ 1-4 성능 P1~P2 — 수치
💡 발견 사항 (있으면)
📁 보고서 경로
🔀 배포 가부 판정: GO / NO-GO
```

**NO-GO 시**: 원인 + 수정 방안까지 보고. 배포 보류.
**GO 시**: 작가님 배포 최종 승인 → `./deploy.sh prod` 실행.

---

## ⚠️ 준수 조항

- 법률 ch5 2조: 배포는 deploy.sh 경유 (본 건은 점검만 — 배포 ❌)
- prod 환경 접근/수정 일체 금지
- .env 수정 금지

---

**끝.**
