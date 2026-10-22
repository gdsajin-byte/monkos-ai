---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: 평문 시크릿 2차 SM 전환 — 포털 의심 이름 9(원장 181) + GEMINI_API_KEY 3서비스(원장 182)
status: 발행
portfolio: PF_SECURITY
---

# ORDER — 평문 시크릿 2차 SM 전환

> 출처: 작가님 2026-10-22 21:45 (iMac 쌍아 세션 사람 턴) "네가지 권고안 모두 처리해" — 쌍아 21:42·21:43 권고 일괄 승인.
> 선례: `ORDER_20261022_iMac쌍아_막내_SECURITY_포털env평문시크릿_SM전환.md` + COMPLETION(막내3, 1차 4종 — 같은 절차·같은 deploy.sh 패턴 `SM_MIGRATE_KEYS`/`--remove-env-vars`). 근거: `briefings/BRIEFING_LOCAL_20261022.md` (181)(182).

## 1. 대상
- (181) `monkos-portal` prod 평문 env 중 시크릿 의심 이름 9개 — 이름 목록은 BRIEFING_LOCAL (181) 행. **먼저 각 이름이 진짜 시크릿인지 분류**(SECRET_INVENTORY 대조 — 공개 ID·URL 등 비시크릿이면 대상 제외하고 사유 기재).
- (182) `GEMINI_API_KEY` 평문: idphoto-kr · idphoto-jp · studio.

## 2. 절차 (1차와 동일)
1. 분류표(시크릿/비시크릿·근거) → 2. SM 존재 확인(`secret check`), **미등재는 생성하지 말고 중단 보고** — 등재는 작가님 무노출 1줄(1차 선례 명령 형식) → 3. 값 일치 해시 Y/N만(값·해시 미기록) → 4. 각 deploy.sh 수정 → 5. dev 배포·검증(describe는 valueFrom 유무만) → 6. **prod는 서비스별 판정표를 쌍아에 보내고 대기** → 7. SECRET_INVENTORY 갱신.

## 3. 범위
**허용**: 각 서비스 deploy.sh 수정 · dev 배포 · SECRET_INVENTORY 갱신.
**금지**: 시크릿 생성·로테이션 · 값 출력 · 승인 없는 prod.

## 4. 판정
분류표 · SM 존재표 · dev describe(대상 전부 valueFrom) · 서비스별 기능 스모크 1회 · prod 승인 요청 판정표.

## 5. 반환
COMPLETION + 브랜치·SHA(원격 대조). 원장 (181)(182) resolve는 prod 반영 후.
