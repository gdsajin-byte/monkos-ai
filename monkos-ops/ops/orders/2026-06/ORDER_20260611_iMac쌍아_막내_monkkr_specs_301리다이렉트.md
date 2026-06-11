---
type: order
date: 2026-06-11
from: iMac/쌍아
to: iMac/막내
portfolio: PF_CITADEL
status: 대기
---

# 지시서 — monk.kr/specs → monkos.ai/specs 301 리다이렉트

**[2026-06-11 17:15 KST] iMac/쌍아 → iMac/막내**

---

## 배경

민아 재검증에서 monk.kr/specs가 monkos.ai/specs와 동일 콘텐츠를 self-canonical로 서빙 중 발견. monkos.ai가 정본(GSC 등록, indexed 확인)이므로 monk.kr 측은 301로 정본에 신호를 몰아준다.

---

## ⚠️ 준수 조항

- ch5: monk.kr 배포는 CF Pages. deploy-cf 절차 경유.
- 기존 `_redirects` 파일 형식 유지 (CF Pages 리다이렉트 규격)

---

## Task: _redirects에 specs 301 추가

파일: `MONK_kr/_redirects`

현재 내용:
```
/ai_lab/photolab/*  https://idphoto-kr.monkos.ai/:splat  301
```

추가할 행:
```
/specs              https://monkos.ai/specs               301
/specs/*            https://monkos.ai/specs/:splat         301
/ja/specs           https://monkos.ai/ja/specs             301
/ja/specs/*         https://monkos.ai/ja/specs/:splat      301
/en/specs           https://monkos.ai/en/specs             301
/en/specs/*         https://monkos.ai/en/specs/:splat      301
```

3언어(KR/JA/EN) × 목록+상세 = 6행. CF Pages `_redirects`는 위→아래 순서로 매칭하므로 와일드카드(`/*`) 전에 정확 매칭을 먼저 배치.

## 배포 + 검증

1. CF Pages 배포 (deploy-cf 절차)
2. 검증:
   - `curl -sI https://monk.kr/specs` → 301 Location: https://monkos.ai/specs
   - `curl -sI https://monk.kr/specs/korea-passport` → 301 Location: https://monkos.ai/specs/korea-passport
   - `curl -sI https://monk.kr/ja/specs` → 301 Location: https://monkos.ai/ja/specs

---

## 산출물

1. `MONK_kr/_redirects` 수정
2. CF Pages 배포 완료
3. 세션 로그 어펜드
4. 완료 보고: ✅❌💡⏳📁🔀 형식
