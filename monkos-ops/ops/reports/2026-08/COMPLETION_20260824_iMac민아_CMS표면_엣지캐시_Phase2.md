---
type: completion
date: 2026-08-24
device: iMac
agent: 민아
subject: "Phase 2 — CMS 표면(blog·home·faq·pricing·guide·gallery) 엣지 캐시"
status: 완료
portfolio: PF_PORTAL
---

# COMPLETION — Phase 2: CMS 표면 엣지 캐시

**[2026-08-24 15:50 KST]** iMac/민아 → 작가님

> 근거: 작가님 지시 "p2 진행" (경로③). 스코프 정본: REPORT_20260824(§4 Phase 2)

## ✅ 설계 판단 — SSG 대신 엣지 캐시+SWR

스코프 원안(발행 훅 재빌드 SSG) 대신 **엣지 캐시(TTL 10분) + stale-while-revalidate** 채택:
- Firestore CMS 특성상 SSG는 빌드 서버·발행 트리거 체인 신설 필요 — 캐시는 코드 ~80줄로 동일 효과
- 정본 = 오리진 SSR **단일 유지** (헌법 3조 4항 정합 — 산출물 이원화 없음)
- 발행 반영 ≤ 10분. 오리진 다운 시 스테일 서빙 = 가용성 방어 부수 효과

## 📁 변경

`portal/edge/worker.mjs` — CMS 캐시 레이어 추가:
- 대상: home(3언어)·blog 리스트/포스트(3언어)·faq·pricing·guide·gallery
- **제외**: board(고객 글쓰기 실시간성)·headshot(유료 퍼널) — 오리진 직결 유지
- 캐시 키: 경로 + blog 실사용 파라미터(cat·page·lang)만 — utm은 키 제외(파편화 방지, 실측 확인)
- **Set-Cookie 제거 후 저장** (세션 유출 차단 — 히트 응답에 쿠키 부재 실측)
- 히트 시 지역 재작성 + page_view 엣지 계측 / 미스 시 오리진이 직접 계측 (중복 없음)

## ✅ 검증

1. 전 대상 표면 miss→hit 사이클 실측 (blog·home ko/ja/en·faq·pricing·guide·gallery·블로그 포스트)
2. TTFB: /blog 1.08s(SSR) → **0.46~0.53s**(히트)
3. Set-Cookie 히트 응답 부재 / board·headshot은 Set-Cookie 존재(=미캐시) 확인
4. ?cat 키 분리·utm 키 통합 실측
5. page_view 착지 (Cloud Run 로그 204, 06:45Z)
6. 지역 재작성 정상 (`__REGION__='kr'`)

## 💡 트러블슈팅 기록

- 저장본에 `Cache-Control: no-store`를 넣으면 **Cache API가 저장 자체를 거부** → 저장본은 public/max-age, 클라이언트 응답만 no-store로 분리 해결
- 배포 직후 콜로별 워커 버전 전파 스큐로 일시 miss 혼재 — 수 분 내 자연 해소 (실측)

## ⏳ 잔여

- CF 캐시는 **콜로별 독립** — 트래픽 적은 콜로는 첫 방문자가 miss (전역 대비 자연 현상)
- 발행 즉시 반영이 필요해지면: admin 저장 훅 → CF 캐시 퍼지 API (cache_purge 스코프 토큰 필요) — 별건
- Phase 2 스코프 종결. 남은 축: GSC D+3/D+7 색인 체크(08-27·08-31), 쌍아 사후 추인
