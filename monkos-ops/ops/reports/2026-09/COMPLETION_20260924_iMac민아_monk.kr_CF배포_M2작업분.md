---
type: completion
date: 2026-09-24
device: iMac
agent: 민아
status: 마감
portfolio: PF_KKU
subject: monk.kr CF Pages 프로덕션 배포 — M2 쌍아 09-19 CTA 전환 7파일 + 09-23 길찾기 버튼
---

# COMPLETION — monk.kr CF Pages 배포 (M2 작업분 일괄)

**[2026-09-24 12:27 KST]** iMac/민아 → 작가님

## 경위
- M2/쌍아 09-19 메뉴 CTA 전환 7파일(8b165506, 톡톡 상담 → 네이버 예약 `place/1454242520/booking`) + 09-23 오시는 길 길찾기 버튼(5f342730)이 푸시만 되고 미배포(CF Pages 자동빌드 OFF, M2 wrangler 미인증). 쌍아 로그 2회 "작가님 승인 대기".
- 09-24 12:25 작가님 "배포 승인한다 진행해" → 민아 집행 [예외](프로덕션 표면, ch1 2조 5항).

## 실행
- 사전: CWD=루트, `functions/` 실제 디렉토리, `MONK_kr/functions` 없음, MONK_kr 미커밋 0, wrangler 4.66.0 OAuth 인증 확인.
- `npx wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main --commit-dirty=true` → 8파일 업로드(313 기존), Functions 번들 포함, 배포 URL `https://6599345c.monk-kr.pages.dev`.

## 라이브 검증 (2회 히트, 2차로 판정 — live-verify.md)
| URL | booking | 길찾기 | talk | 판정 |
|---|---|---|---|---|
| /monk_studio/monk_studio | 3 | 2 | 1 | 로컬(3·2·1) 일치 |
| /monk_studio/family/family | 3 | – | 3 | 반영 |
| /monk_studio/id_photo/id_photo | 2 | – | 1 | 반영 |
| /monk_studio/id_photo/{standard,deluxe,premium} | 2 | – | 0 | 반영 |
| /monk_studio/profile/profile | 4 | – | 2 | 반영 |

- 함정 기록: `/monk_studio/monk_studio.html`은 CF 클린 URL로 **308** → `.html` 없는 경로로 판정해야 함. 첫 판정에서 308 본문 0B를 "미반영"으로 읽을 뻔함(0건≠부재 — 응답 코드 대조군으로 배제). `/monk_studio/`는 다른 문서(루트 인덱스 폴백 29,559B)라 판정 URL 아님.

## 산출
- 변경 파일 0(배포만). 세션 로그 `2026-09-24_iMac_민아.md` [예외] 기록.

✅ monk.kr 프로덕션 배포 — 8파일, 7페이지 라이브 반영 실측
✅ 09-19 CTA 전환 + 09-23 길찾기 버튼 닷새 만에 라이브
💡 CF 클린 URL(.html→308)이 라이브 판정의 함정 — live-verify 사례 추가 감
⏳ 쌍아 사후 추인 대상(민아 [예외] 집행)
📁 본 COMPLETION · 세션 로그
🔀 커밋 후 mk-push
