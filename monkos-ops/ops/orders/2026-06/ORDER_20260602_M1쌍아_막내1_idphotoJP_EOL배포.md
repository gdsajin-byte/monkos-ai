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

## 0. ⚠️ 긴급 갱신 (13:24 쌍아 실측) — 이미 잘못 배포된 정황

- **jp rev 00116(2026-06-02 13:19:52 KST 배포)이 헬스에서 `service: "monkos-idphoto-kr"` 반환** → jp service에 **kr 코드가 올라간 배포 사고 의심.**
- 근거: 로컬 jp `server.js`는 정상(`service: 'monkos-idphoto-jp'`, 일본규격 마커 16). 13:10엔 jp 헬스가 `monkos-idphoto-jp`였으나 13:19 배포 후 `monkos-idphoto-kr`로 바뀜. 도메인 매핑은 정상(jp→monkos-idphoto-jp).
- **영향**: 일본 사용자가 한국 규격/언어를 받을 수 있음 = 실서비스 장애.

### 원인 (쌍아 규명 — 13:30)
- jp `deploy.sh`가 빌드 전 작업 디렉토리를 jp로 **고정(`cd "$SCRIPT_DIR"`)하지 않음** (46줄 `SCRIPT_DIR` 정의만, 93줄 `gcloud builds submit` 전 cd 없음). → `builds submit`이 **실행 위치의 소스**를 빌드. **kr 위치에서 jp deploy.sh 실행 시 kr server.js가 jp 이미지에 들어감.**
- jp `Dockerfile` 1–2줄도 kr 주석 잔재(kr 복사본). 이미지명은 jp이나 내용이 kr.

### 복구 (배포보다 우선)
1. **반드시 `monkos_AI/idphoto-jp/` 디렉토리로 cd 후** `./deploy.sh prod` 재실행 (jp 소스 빌드 보장).
2. **검증**: jp 헬스가 `service: "monkos-idphoto-jp"` + 일본규격 + Live 2.5 반환 확인.
3. **(근본·재발방지)** `deploy.sh` 빌드 전 `cd "$SCRIPT_DIR"` 추가 — ⚠️ **deploy.sh 수정은 작가님 승인 후**(헌법 4조 1항).

> ⚠️ **롤백 금지**: 직전 jp rev `00115`(5/22)는 **Live 2.0(EOL)** → 단순 롤백은 EOL 회귀. **올바른 jp 재배포가 정답** (2.5 전환분 `8e5b890e`도 함께 반영).

---

## 1. 목표
idphoto-jp prod를 **2.5 전환 코드로 배포**해 Live 2.0 EOL 노출 제거. kr과 동일·검증된 전환. **+ §0 배포 사고 복구.**

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
