---
type: order
date: 2026-04-09
from: iMac/쌍아
to: iMac/막내2
status: 대기
priority: P1
pf: PF_SPREAD
---

# 지시서 — EXAONE 블로그 콘텐츠 CDP 발행

> **[2026-04-09 11:51 KST]** iMac/쌍아 → iMac/막내2

## 역할 선언
> **너는 "막내2호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `iMac/막내2 → 작가님` 형식

---

## 미션

CDP(포트 9223)로 monkos.ai 어드민 블로그 에디터에 접속하여 EXAONE 콘텐츠를 발행한다.
**브라우저가 화면에서 움직이는 모습이 녹화 중이므로, 에디터 조작을 시각적으로 수행할 것.**

## CDP 포트

**9223** (고정). Python CDP 유틸 사용:

```python
import sys; sys.path.insert(0, 'scripts/tools')
from cdp_utils import CDP, MonkosEditor
```

## 콘텐츠

### 제목
```
USB 하나에 AI를 담았다 — LG EXAONE 3.5 한국어 최강 소형 모델 실전 후기
```

### 본문 (마크다운)
```markdown
## 설치 제로, USB 하나로 AI 챗봇

MONKOS가 LG AI Research의 EXAONE 3.5 (2.4B)를 온디바이스로 구동하는 데 성공했습니다.

llamafile 엔진 위에 EXAONE을 올려, USB 하나에 AI 챗봇 전체를 담았습니다. 인터넷 없이, 설치 없이, 꽂으면 바로 대화가 시작됩니다.

## 왜 EXAONE인가

2.4B 파라미터 경량 모델 중 한국어 성능 1위 (KoMT 7.24). DeepSeek, Llama 등 경쟁 모델에서 빈번한 한영 혼합 현상이 EXAONE에서는 발생하지 않습니다.

## 실측 성능

| 환경 | 속도 |
|------|------|
| iMac (Intel CPU) | ~1 tok/s |
| RTX 4060 (GPU) | 30~50 tok/s |
| USB (Windows PC) | 5~15 tok/s |

## 소상공인에게 의미하는 것

"나보다 내 가게를 더 잘 아는 챗봇" — 사장님의 전문 지식을 학습한 AI가 24시간 고객 응대. 클라우드 비용 제로, 데이터 유출 걱정 제로.

이것이 MONKOS가 추구하는 [1-4] 소상공인 맞춤 AI 챗봇의 실체입니다.
```

### 카테고리
`tech`

### 태그
`EXAONE, llamafile, 온디바이스, AI챗봇, LG AI Research, USB`

## 발행 절차

1. CDP로 어드민 에디터 접속: `https://monkos.ai/admin/blog-edit.html`
2. MonkosEditor로 제목 입력
3. 마크다운 본문 입력
4. 카테고리/태그 설정
5. 발행 버튼 클릭
6. 발행된 블로그 페이지로 이동하여 스크린샷 확인

```python
async with MonkosEditor(port=9223) as ed:
    await ed.navigate("https://monkos.ai/admin/blog-edit.html")
    # 에디터 로드 대기
    await ed.set_title("USB 하나에 AI를 담았다 — LG EXAONE 3.5 한국어 최강 소형 모델 실전 후기")
    await ed.editor_set_markdown(본문)
    # 카테고리/태그 설정 후 발행
```

에디터 DOM 구조가 다르면 CDP 직접 조작으로 전환:
```python
async with CDP(port=9223) as cdp:
    await cdp.navigate("https://monkos.ai/admin/blog-edit.html")
    await cdp.fill("#title", 제목)
    await cdp.click_element("button.publish")
```

## 산출물

발행 완료 URL + 스크린샷

## 엔드라인
| 항목 | 내용 |
|------|------|
| 포트폴리오 | PF_SPREAD |
| 마무리 | 보고 대기 |
| 산출물 | 발행 URL + 스크린샷 |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |

## ⚠️ 준수 조항
- CDP 브라우저 제어 규칙 준수. 포트 **9223** 고정
- 헌법 4조 3항: 내부 기밀 보호 — 에이전트 호칭 노출 금지
- 헌법 4조 4항: 미출시 기능 언급 금지 (블로그 본문 내)
