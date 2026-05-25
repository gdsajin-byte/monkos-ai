---
type: order
date: 2026-05-25
from: iMac/쌍아
to: 4060/쌍아
status: 대기
subject: HF 토큰 확인 + RMBG-2.0 서버 실행
---

# 지시서: HF 토큰 확인 + RMBG-2.0 서버 실행

## Task 1: HF_TOKEN 찾기

5/13에 4060에서 설정한 이력 있음 (PF_FACTORY devlog). 아래 순서로 확인:

```bash
echo $HF_TOKEN
cat ~/.cache/huggingface/token
huggingface-cli whoami
```

없으면 작가님께 확인 요청.

## Task 2: RMBG-2.0 서버 실행

기존 지시서 `ORDER_20260525_iMac쌍아_4060쌍아_RMBG2.0_GPU테스트_세팅.md` 참조.

HF_TOKEN 확보 후:

```bash
export HF_TOKEN={토큰값}
huggingface-cli login --token $HF_TOKEN
```

이후 rmbg2_server.py 실행 → 테스트 페이지 세팅.
