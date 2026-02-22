# 지시서: prep.js 챗봇 껍데기 제거

> [2026-02-22 17:20 KST] iMac/쌍아 → 막내1

## 역할 선언
> **너는 "막내1호"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 헌법 제7조 (응답 규칙): 계획 제시 → 승인 → 실행 (이 지시서가 승인)
- 법률 제2장 (코딩 규칙): 미사용 코드 정리

## 배경
prep.js에 `toggleChat()`/`sendChat()` + prep.html에 챗봇 UI(#chat-fab, #chat-panel)가 있으나 API 미연결 상태. 준비실 코치 연동은 별도 이터레이션이므로 현재는 껍데기 제거.

## 작업

### 1. prep.html — 챗봇 HTML 제거

**파일**: `monkos_AI/idphoto-kr/public/prep.html`

제거 대상 (grep으로 확인):
- `id="chat-fab"` 버튼 (L112 부근)
- `id="chat-panel"` 전체 블록 (L120~L150 부근, `toggleChat`/`sendChat` onclick 포함)

### 2. prep.js — 챗봇 함수 제거

**파일**: `monkos_AI/idphoto-kr/public/prep.js`

제거 대상:
- `toggleChat()` 함수 정의 (L603~L608 부근)
- `sendChat()` 함수 정의 (L610~ 부근)
- window 할당에서 `toggleChat, sendChat` 제거 (L598)
- `// ─── 챗봇 UI (껍데기 — API 미연결) ───` 주석 블록

### 3. 검증
- prep.html + prep.js에서 `chat` grep → 0건 확인 (CSS 클래스명 제외)

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `보고 대기` (S3에서 일괄 배포) |
| 산출물 | `prep.html`, `prep.js` |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 (S3에서 일괄 커밋) |
