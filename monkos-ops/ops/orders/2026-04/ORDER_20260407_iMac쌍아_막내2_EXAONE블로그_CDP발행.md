---
type: ORDER
date: 2026-04-07
from: iMac/쌍아 → to: iMac/막내2
status: 대기
priority: P1
pf: PF_SPREAD
ref: PROPOSAL_20260407_iMac민아_EXAONE_콘텐츠패키지.md
cdp_port: 9222
---

# 지시서: EXAONE 블로그 본문 작성 + CDP로 어드민 발행

> **SPREAD 첫 순환 파일럿. CDP 포트 9222 사용.**
> 민아 제안서의 콘텐츠 시드 기반으로 블로그 본문 작성 → monkos.ai 어드민 에디터에 CDP로 직접 입력 → 발행.

---

## 1. 콘텐츠 작성

민아 제안서 참조: `monkos-ops/ops/proposals/PROPOSAL_20260407_iMac민아_EXAONE_콘텐츠패키지.md`

### 제목
**"USB 하나에 AI를 담았다 — LG EXAONE 3.5 한국어 최강 소형 모델 실전 후기"**

### 본문 골격 (2000자+)
1. 훅 — "설치 없이, 인터넷 없이, USB 꽂으면 AI가 대답한다"
2. EXAONE 소개 — LG AI Research, 2.4B, KoMT 7.24
3. llamafile이란 — Mozilla, 단일 실행파일, 크로스플랫폼
4. 실전 테스트 — 사업 제안서 10K 토큰 주입 → Q&A 응답
5. vs ChatGPT/Gemini — 온디바이스 장점 (보안, 오프라인, 무료)
6. 활용 시나리오 — 소상공인 현장, 교육, 보안 환경
7. 결론 — "2GB USB가 비서가 되는 시대"

### 톤
- 기술 블로그 + 실사용 후기 톤
- MONKOS AI가 직접 테스트한 실증 데이터 기반
- 외부 공개용 — 내부 호칭(쌍아/민아/막내) 절대 미노출

## 2. CDP로 어드민 발행

### 사전 준비
```bash
# CDP 디버그 크롬 시작 (포트 9222)
scripts/tools/cdp_setup.sh start 9222
```

### 발행 절차
```python
import sys; sys.path.insert(0, 'scripts/tools')
from cdp_utils import CDP, MonkosEditor

async with MonkosEditor(port=9222) as ed:
    await ed.navigate("https://monkos.ai/admin/blog-edit.html")
    await ed.set_title("USB 하나에 AI를 담았다 — LG EXAONE 3.5 한국어 최강 소형 모델 실전 후기")
    await ed.editor_set_markdown("## 본문 내용...")
    # 카테고리, 태그 설정
    # 발행 버튼 클릭
```

### 발행 후 확인
- monkos.ai/blog 에서 글이 보이는지 확인
- 일본어 자동번역이 트리거되는지 확인 (/ja/blog)

## 3. 산출물

- 블로그 글 1건 (monkos.ai 발행)
- CDP 실행 로그 (어떤 단계에서 막혔는지 기록)
- 완료 보고 (✅❌💡⏳📁🔀 형식)

## ⚠️ 준수 조항

- 헌법 4조 3항: 내부 기밀 외부 노출 금지
- 헌법 4조 4항: 미출시/미확정 표현 금지
- **CDP 포트 9222 전용** — 다른 포트 사용 금지 (동시 테스트)
- CDP에서 막히는 구간이 있으면 **어디서 왜 막혔는지** 상세 기록

## 완료 기준

1. 블로그 글 monkos.ai 발행
2. CDP 실행 성공/실패 로그
3. 완료 보고
