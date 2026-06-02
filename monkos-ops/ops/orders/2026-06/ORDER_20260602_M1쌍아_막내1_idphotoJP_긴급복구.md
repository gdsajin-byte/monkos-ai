---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: 막내1
portfolio: PF_IDPHOTO
status: 발행
order_class: 🔴 긴급 복구(INCIDENT) — 실서비스 장애 진행 중
---

# 🔴 ORDER — idphoto-jp 배포 사고 긴급 복구

**[2026-06-02 13:52 KST] M1/쌍아 → 막내1**

> ⚠️ **너의 13:20 "양국 정상" 보고는 오보다.** HTTP 200만 보고 `service` 필드를 놓쳤다. **실서비스 장애가 13:19부터 30분 넘게 진행 중.**

---

## 1. 사고 사실 (쌍아 실측 확정)

- **idphoto-jp.monkos.ai 가 한국 코드(`service: "monkos-idphoto-kr"`)를 서빙 중** — 헬스 3회 연속 일관, 13:50 현재도 지속.
- 일본 손님이 **한국어 + 한국 규격**을 받는 중 (일본 마이넘버·여권 규격 불가). jp/kr 코드는 **481줄** 차이.
- 원흉 = 너의 jp 배포 **rev 00116 (13:19:52)**. 직전 13:10엔 jp가 정상(`monkos-idphoto-jp`)이었다.

## 2. 원인

- jp `deploy.sh`가 빌드 전 작업 디렉토리를 jp로 **고정(`cd "$SCRIPT_DIR"`)하지 않음** → `gcloud builds submit`이 **네 실행 위치의 소스**를 빌드. **kr 위치에서 jp deploy.sh를 돌려 kr server.js가 jp 이미지에 들어갔다.**
- jp `Dockerfile` 1–2줄도 kr 주석 잔재(과거 kr 복사본).

## 3. 복구 (즉시)

1. **반드시 `cd /Users/developer/monk_project/monkos_AI/idphoto-jp` 후** `./deploy.sh prod` 재실행.
   - 빌드 직전 `pwd`로 jp 디렉토리 확인할 것.
2. **검증** (배포 후 필수):
   - `curl -s https://idphoto-jp.monkos.ai/health` → `service: "monkos-idphoto-jp"` 확인
   - 일본 규격 마커(`証明写真`/`パスポート`/`マイナンバー`) + Live `gemini-2.5-flash` 반영 확인
3. **PF_IDPHOTO 히스토리**에 사고·복구 어펜드(append-only) + COMPLETION.

> ⚠️ **롤백 금지** — 직전 jp rev `00115`(5/22)는 Live 2.0(EOL)이라 회귀. **올바른 jp 재배포가 정답**(2.5 전환분 `8e5b890e` 함께 반영됨).

## 4. 근본(재발 방지) — 작가님 승인 후

- jp `deploy.sh`에 빌드 전 `cd "$SCRIPT_DIR"` 추가. **`deploy.sh` 수정은 헌법 4조 1항 — 작가님 승인 게이트.** 승인 전엔 §3 복구만.
- kr `deploy.sh`도 동일 결함 여부 점검(같은 사고 재발 가능).

## 5. 가드레일
- deploy.sh **경유**(직접 gcloud run deploy 금지). 생성코어 `gemini-3-pro-image` 손대지 말 것. 파괴적 명령 금지. 매 턴 `date`.

## 6. 체크포인트
1. **재배포 + 헬스 `service:jp` + 일본규격 검증** 결과 즉시 보고.
2. COMPLETION (idphoto 트랙 kr+jp 최종 종결).
3. 에러 3회 → `/에스컬레이션`.

---

**끝. 핵심 한 줄: `cd idphoto-jp` 한 뒤 `./deploy.sh prod`. 그리고 헬스가 `service: monkos-idphoto-jp`로 바뀌는지 반드시 눈으로 확인하라.**
