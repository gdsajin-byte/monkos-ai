---
type: order
date: 2026-11-03
from: iMac/쌍아
to: iMac/쌍아-막내2
subject: 결제 표면 ③ 업셀 문구 정합 + 의상 기본값 성인/아기 분기 + 아기 기본 프롬프트 정장 폴백 버그 수정, dev까지
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — ③ 문구 정합 + 아기 의상 기본값

**[2026-11-03 04:17 KST]** iMac/쌍아 → iMac/쌍아-막내2

출처: 작가님 2026-11-03 04:16 iMac 쌍아 세션 사람 턴 "모두진행해" — [최종안](../../proposals/PROPOSAL_20261102_iMac쌍아_IDPHOTO_결제표면_후속_최종안.md) §1·§2·§5·§5-1 전부(헤드샷 포함) 진행 승인. 범위 승인 = 본 문서 §2~§3(구현·dev 검증·보고). **prod·엣지 배포는 작가님 '배포 승인' 별도.**
근거: 최종안 §1③·§5·§5-1, [용아 검토](../../reports/2026-11/REVIEW_20261102_iMac용아_IDPHOTO_결제표면_후속_최종안.md) 위험 3.
⚠️ 기존 `worktree-makne2-kr-hairtop`(05689f06)은 작가님 결정 대기 — **건드리지 말고** origin/main 기준 새 브랜치·새 워크트리에서 한다.

## 2. 할 일
1. **업셀 문구** `lib/cms/specs-i18n.js:181` `t1Desc1` "AI 리터칭 — 내 얼굴 그대로, 더 단정하게" → "내 얼굴 그대로 — 표정·의상만 규격에 맞게" 6언어(ko/ja/en/es/id/vi). 같은 취지 다른 키가 있으면 목록 보고(바꾸지 말고).
2. **의상 기본칩 라벨 — 성인/아기 분기**: `public/components/attire-picker/attire-presets.json:4-12` `default_option` — 성인 "단정한 정장(기본)", 아기 "지금 옷 그대로"(현행). `attire-picker.js:422-426` 0번 칩이 `age==='baby'`로 라벨 선택. es 라벨 누락 보충. `attire-picker.js:30` 아기 안내 문구는 유지(프리셋 recolor와 일치).
3. **프롬프트 버그**: `lib/idphoto-generate.js:162` — `attireDesc` 없을 때 나이 무관 성인 정장 폴백. **age가 baby면 `:120`의 "Keep current clothing as-is…" 원복 문구로 분기**. 성인 동작 불변. 다른 생성 경로(T1 `server.js` isT1Path 등)에 같은 폴백이 있는지 grep 후 동일 적용 여부 보고(적용은 같은 함수 안이면 하고, 다른 파일이면 보고만).
4. 단위 테스트: 성인·아기 × attireDesc 유무 4케이스 프롬프트 스냅샷.
5. **검증(dev)**: 피커 성인·아기 탭 0번 칩 라벨 캡처(390·1440, ko·en). 아기 기본값 프롬프트 로그 1건(생성 실호출은 무료 경로 또는 단위 테스트로 대체 가능 — 유료 결제 금지). specs-i18n 변경은 엣지 재배포 대상 — prod 판정표 명기.

## 3. 산출물
- 코드: specs-i18n.js, attire-presets.json, attire-picker.js, idphoto-generate.js, 테스트.
- COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261103_iMac쌍아-막내2_IDPHOTO_업셀문구_의상기본값.md`.
- 세션 로그 `2026-11-03_iMac_쌍아-막내2.md`.

## ⚠️ 준수 조항

- 헌법 4조 1항: 키·토큰·비밀번호 생성·추측·출력 금지. 새 시크릿 없음. 패키지 설치 금지.
- **결제 제출 금지**: 위젯 표시·카드사 선택·인증창 진입(닫기)까지. 카드 정보 입력·승인 조작 금지(ch1 7조). 고객 사진 금지.
- dev 배포는 `deploy.sh dev`만. dev는 다른 막내도 쓴다 — 배포 직전 `gcloud run revisions list`로 최신 rev 확인, COMPLETION에 어느 커밋 위에 배포했는지 기록.
- 헌법 3조 1·2항: `date` 실측 헤더, 세션 로그 append-only, COMPLETION + 원격 SHA 대조. PF_IDPHOTO 1행.
- 새 작업 브랜치(origin/main 기준)에서 커밋·푸시. 병합은 쌍아.
- 헌법 1조 3항: 아기 사진 옷 유지가 원칙(원복 문구). 병행: 막내3=payments·config, 막내4=specs-funnel·headshot — 건드리지 않는다.

## 5. 완료 기준
- [ ] t1Desc1 6언어
- [ ] 기본칩 성인/아기 분기 + es 보충
- [ ] 아기 정장 폴백 버그 수정 + 타 경로 보고 + 4케이스 테스트
- [ ] dev 캡처, 브랜치 푸시·SHA 대조·COMPLETION

## 6. 커밋 메시지
```
[fix] 업셀 문구 정합 + 의상 기본값 성인/아기 분기·아기 정장 폴백 수정 (PF_IDPHOTO)
```
