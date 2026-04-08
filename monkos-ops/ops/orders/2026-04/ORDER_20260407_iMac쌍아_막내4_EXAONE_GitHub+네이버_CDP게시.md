---
type: ORDER
date: 2026-04-07
from: iMac/쌍아 → to: iMac/막내4
status: 대기
priority: P1
pf: PF_SPREAD
ref: PROPOSAL_20260407_iMac민아_EXAONE_콘텐츠패키지.md
cdp_port: 9224
---

# 지시서: EXAONE GitHub Issue + 네이버 블로그 — CDP로 게시

> **SPREAD 첫 순환 파일럿. CDP 포트 9224 사용.**
> GitHub Issue 1건 + 네이버 블로그 요약 1건을 CDP로 직접 게시.

---

## 1. GitHub Issue

### 콘텐츠
민아 제안서 참조: `monkos-ops/ops/proposals/PROPOSAL_20260407_iMac민아_EXAONE_콘텐츠패키지.md`

- **레포**: gdsajin-byte/monkos-ai
- **제목**: "On-Device AI with LG EXAONE 3.5 — USB Deployment Guide"
- **라벨**: tech, guide
- **본문**: 영어로 작성. EXAONE 3.5 + llamafile 조합의 기술 가이드
  - 모델 선택 근거 (벤치마크 비교표)
  - llamafile 설정 방법
  - 시스템 프롬프트 설계
  - 성능 측정 결과
- gh CLI 또는 CDP로 게시

### gh CLI 방식 (우선)
```bash
gh issue create --repo gdsajin-byte/monkos-ai \
  --title "On-Device AI with LG EXAONE 3.5 — USB Deployment Guide" \
  --label "tech,guide" \
  --body "본문..."
```

## 2. 네이버 블로그

### 사전 준비
```bash
# CDP 디버그 크롬 시작 (포트 9224)
scripts/tools/cdp_setup.sh start 9224
```

### 콘텐츠
- 한국어 블로그 본문의 **요약 버전** (800~1000자)
- 네이버 블로그 에디터에 CDP로 직접 입력

### 게시 절차
```python
import sys; sys.path.insert(0, 'scripts/tools')
from cdp_utils import CDP

async with CDP(port=9224) as cdp:
    await cdp.navigate("https://blog.naver.com/...")
    # 에디터 접근 + 텍스트 입력 + 발행
```

> 네이버 로그인 세션이 필요. 없으면 작가님에게 로그인 요청.

## 3. 산출물

- GitHub Issue 1건 (URL)
- 네이버 블로그 1건 (URL 또는 CDP 실패 로그)
- CDP 실행 로그 (어디서 막혔는지 기록)
- 완료 보고 (✅❌💡⏳📁🔀 형식)

## ⚠️ 준수 조항

- 헌법 4조 3항: 내부 기밀 외부 노출 금지
- 헌법 4조 4항: 미출시/미확정 표현 금지
- **CDP 포트 9224 전용**
- 막히는 구간 상세 기록

## 완료 기준

1. GitHub Issue 1건 게시
2. 네이버 블로그 1건 게시 (또는 실패 사유 보고)
3. CDP 실행 성공/실패 로그
4. 완료 보고
