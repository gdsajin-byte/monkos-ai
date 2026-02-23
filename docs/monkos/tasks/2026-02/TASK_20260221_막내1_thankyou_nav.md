# 지시서: thankyou 페이지 네비게이션 수정

```
[2026-02-21 18:05 KST] iMac/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식
> - **병렬 작업 중**: 막내2가 result.html, result.js를 동시 수정 중
> - **네 수정 범위**: `thankyou.html`, `thankyou.js`

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | thankyou 네비게이션 수정 |
| **수정 파일** | `MONK_kr/ai_lab/photolab/thankyou.html`, `thankyou.js` |
| **브랜치** | `develop` |
| **긴급도** | 보통 |

## ⚠️ 준수 조항

- **법률 제2장**: monk.js Store/Pipe 패턴 유지
- **법률 제7장 1조**: 마무리 절차 필수 (커밋 → push → 완료 보고)

## ⚠️ 파일 충돌 방지

- `result.*` 수정 금지 (막내2 담당)
- `shared.js`, `app.css`, `prep.*`, `camera.*`, `config.js`, `monk.js` 수정 금지

---

## 배경

thankyou(수령처) 페이지의 네비게이션이 부자연스러움. ✕ 버튼이 prep으로 가고, 하단 메인이 index로 가야 자연스러운 흐름.

---

## 작업 내역

### TASK 1: ✕ 버튼 → 이전 페이지(result.html)로 이동

현재 (`thankyou.html` 111행):
```html
<button class="ty-close-btn" onclick="navigateTo('prep.html')">✕</button>
```

변경:
```html
<button class="ty-close-btn" onclick="navigateTo('result.html')">✕</button>
```

### TASK 2: 하단 메인 버튼 → index.html로 이동 확인

현재 (`thankyou.html` 169행):
```html
<button onclick="navigateTo('index.html')">🏠 메인</button>
```

이미 index.html로 가고 있음. **변경 불필요 — 확인만.**

---

## 금지 사항

- `result.*` 수정 금지
- `shared.js`, `app.css`, `prep.*` 수정 금지
- API 호출 추가/변경 금지

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | `develop` 브랜치에 커밋 | **필수** |
| 2 | `git push origin develop` | **필수** |
| 3 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |
| 4 | `main` 머지 + 배포 | **금지** — 작가님 별도 지시 시에만 |

### 커밋 메시지 형식

```
[fix] thankyou ✕ 버튼 네비게이션 → result.html로 변경

지시서: TASK_20260221_막내1_thankyou_nav.md
```

---

## 완료 조건

1. ✕ 버튼 클릭 시 result.html로 이동
2. 하단 메인 버튼이 index.html로 이동 (기존 유지 확인)
3. develop 커밋 + push 완료
4. 완료 보고 발신
