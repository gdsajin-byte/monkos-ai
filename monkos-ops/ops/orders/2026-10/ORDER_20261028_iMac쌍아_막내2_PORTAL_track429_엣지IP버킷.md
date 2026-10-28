---
type: order
date: 2026-10-28
from: iMac/쌍아
to: iMac/막내2
subject: /api/track 429 664건 — CF 엣지 IP로 레이트리밋 버킷이 묶이는지 원인 확정·수정
status: 대기
portfolio: PF_PORTAL
---

# ORDER — /api/track 429 원인 확정·수정

**[2026-10-28 18:22 KST]** iMac/쌍아 → iMac/막내2

출처: 작가님 18:21 사람 턴 "두건 모두 처리해"(쌍아 보고의 부수 발견 2건).

## 1. 사실 (쌍아 실측, 10-28 00:00~18:20 KST 포털 로그)
- `/api/track` 429 = 664건. 02:41~02:51 KST에 **CF 이그레스 IP 3개**(172.69.223.1 · 172.71.144.7 · 172.71.172.6)에서 각 ~200건, referer monkos.ai. 08시대에도 CF 대역(104.23.* 등)에서 소량.
- `server.js:126 checkRateLimit`은 `resolveEdgeClient(req).ip`가 있으면 실클라이언트 IP, 없으면 XFF 최우측(=CF 이그레스)으로 버킷을 잡는다. 로그 remoteIp가 CF IP라는 것은 **엣지 신뢰 판정이 이 요청들에서 실패했거나 엣지가 헤더를 안 붙였을 가능성**을 뜻한다(미확정).
- 버킷 한도 track=60/분.

## 2. 할 일
1. 원인 확정: `lib/shared/edge-trust.js` 판정 조건 · `edge/worker.mjs`가 `/api/track`에 X-Monkos-* 헤더를 붙이는지 · 02:41 구간이 한 사람의 폭주(봇·무한 루프)인지 여러 사용자인지(같은 시각 UA·경로·세션 분포). 양성 대조군 1회(헤더가 정상 해석되는 다른 API 요청).
2. 수정: 원인이 신뢰 판정·헤더 누락이면 그것을 고친다. 한 클라이언트 폭주라면 클라이언트 쪽 전송 로직(재전송 루프 등)을 고친다. 한도 상향만으로 덮지 않는다.
3. 06:30~07:03 KST 맥 한 대 15초 간격 track 요청이 iMac 헤드리스 브리핑(launchd 06:30)인지 대조 — 우리 자동화면 추적 제외 처리 방안 1줄 제안(구현은 보고 후).

## 3. ⚠️ 준수
- 헌법 3조 1항 `date` 실측 · 4조 1항 비밀값 생성·추측 금지(EDGE_TRUST_KEY 값 열람 금지, 존재·주입 여부만).
- **prod 배포 금지** — dev 검증까지. prod는 쌍아가 작가님 승인 후.
- 엣지(worker) 변경 시 `edge/deploy.sh` 경로 규칙(references.md §배포) 준수, 이것도 배포는 보고 후.
- 동기화 `git merge origin/main`, 푸시는 작업 브랜치까지. 병합은 쌍아.
- 완료: COMPLETION 보고서 · 세션 로그 · PF_PORTAL 히스토리(`scripts/pf.sh`).

## 4. 완료 기준
- [ ] 원인 1줄 + 근거(로그 행·코드 행)
- [ ] 수정 커밋(작업 브랜치) + dev 검증(같은 조건 재현 시 429 미발생, 대조군)
- [ ] COMPLETION_20261028_iMac막내2_track429.md

## 5. 커밋
`[fix] /api/track 429 — {원인 요약}`
