---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: 막내1
portfolio: PF_IDPHOTO
status: 발행
order_class: 광역오더(Mission Order) #2-연장 — idphoto-jp 배포
---

# ORDER — idphoto-jp Gemini 2.0 EOL 배포 (작가님 승인 완료)

**[2026-06-02 13:17 KST] M1/쌍아 → 막내1**

> 오더 #2에서 idphoto-kr은 배포 완료(rev 00190-8sk). **jp는 Live 모델 2.0→2.5 코드만 커밋(`8e5b890e`)되고 prod 미배포** → 현재 jp prod에 **Live 2.0 코드 잔존(EOL 노출)**. 작가님 배포 승인 완료.

---

## 1. 목표
idphoto-jp prod를 **2.5 전환 코드로 배포**해 Live 2.0 EOL 노출 제거. kr과 동일·검증된 전환.

## 2. 주의 — 헬스 함정
jp 헬스의 `preCheck: active (gemini-2.5-flash)`는 **jp가 원래 precheck 2.5였기 때문**(변경분 아님). 진짜 변경분은 **Live 모델(2.0→2.5)**이고 헬스엔 `geminiLive: ready`만 떠 모델명이 안 보인다. → **배포 자체가 핵심**, 헬스 200만으로 "됐다" 판단 금지.

## 3. 단계
1. **`monkos_AI/idphoto-jp/deploy.sh` 경유 배포** (헌법 ch5 — `gcloud run deploy` 직접 금지).
2. **헬스체크 실측**: `https://idphoto-jp.monkos.ai/health` → HTTP 200 + `preCheck`/`geminiLive` 정상.
3. **배포 리비전·트래픽 100% 확인** (gcloud run describe 읽기).
4. **PF_IDPHOTO 히스토리 1행 어펜드** (jp 배포 완료, append-only).
5. **커밋·푸시** (다른 디바이스 동기화 — 배포 정산 커밋).

## 4. 범위 경계
- **생성코어 `gemini-3-pro-image-preview` 손대지 말 것** (kr과 동일).
- `.env`·`deploy.sh` 무단 수정 금지. 파괴적 명령 금지.

## 5. 가드레일
- deploy.sh 경유. 매 턴 `date` KST.

## 6. 체크포인트
1. **배포 + 헬스 검증** 결과 보고.
2. 완료 → **COMPLETION** (오더 #2 idphoto 트랙 kr+jp 최종 종결).
3. 에러 3회 → `/에스컬레이션`.

---

**끝. kr에서 검증된 동일 패턴이다. deploy.sh 경유로 배포하고 헬스 실측까지 보고하라.**
