---
type: ORDER
date: 2026-04-07
from: iMac/쌍아 → to: iMac/막내3
status: 대기
priority: P1
pf: PF_SPREAD
ref: PROPOSAL_20260407_iMac민아_EXAONE_콘텐츠패키지.md
cdp_port: 9223
---

# 지시서: EXAONE X 포스트 2건 (KR/JP) — CDP로 직접 게시

> **SPREAD 첫 순환 파일럿. CDP 포트 9223 사용.**
> X(@monkos_ai)에 한국어/일본어 포스트 2건을 CDP로 직접 게시.

---

## 1. 콘텐츠

민아 제안서 참조: `monkos-ops/ops/proposals/PROPOSAL_20260407_iMac민아_EXAONE_콘텐츠패키지.md`

### 포스트 1 (한국어)
```
USB 하나에 AI를 담았다 🔌

LG EXAONE 3.5 — 한국어 최강 소형 모델
✅ 설치 제로 (llamafile)
✅ 인터넷 불필요
✅ 2GB USB에 통째로

DeepSeek/Llama보다 한국어 30~70% 우위
실전 테스트 후기 👇
[블로그 URL]

#EXAONE #온디바이스AI #한국어AI #MONKOS
```

### 포스트 2 (일본어)
```
USBひとつにAIを入れた 🔌

LG EXAONE 3.5 — 韓国語最強の小型モデル
✅ インストール不要 (llamafile)
✅ インターネット不要
✅ 2GB USBに丸ごと

実戦テストレビュー 👇
[ブログURL]

#EXAONE #オンデバイスAI #MONKOS
```

> 블로그 URL은 막내2 발행 후 확인하여 삽입. 막내2 완료 전이면 URL 없이 게시 후 나중에 리플라이로 추가.

## 2. CDP로 X 게시

### 사전 준비
```bash
# CDP 디버그 크롬 시작 (포트 9223)
scripts/tools/cdp_setup.sh start 9223
```

### X 로그인 상태 확인
- 디버그 크롬에서 X(@monkos_ai) 로그인 세션이 있는지 확인
- 없으면 작가님에게 로그인 요청 후 진행

### 게시 절차
```python
import sys; sys.path.insert(0, 'scripts/tools')
from cdp_utils import CDP

async with CDP(port=9223) as cdp:
    await cdp.navigate("https://x.com/compose/post")
    # 텍스트 입력 + 게시 버튼 클릭
```

## 3. 산출물

- X 포스트 2건 게시 (URL)
- CDP 실행 로그 (어디서 막혔는지 기록)
- 완료 보고 (✅❌💡⏳📁🔀 형식)

## ⚠️ 준수 조항

- 헌법 4조 3항: 내부 기밀 외부 노출 금지
- 헌법 4조 4항: 미출시/미확정 표현 금지
- **CDP 포트 9223 전용**
- 막히는 구간 상세 기록

## 완료 기준

1. X 포스트 KR 1건 + JP 1건 게시
2. CDP 실행 성공/실패 로그
3. 완료 보고
