---
type: order
date: 2026-06-17
from: iMac/쌍아
to: iMac/막내
portfolio: PF_SECURITY
status: 대기
---

# 지시서 — 보안 노출 표면 4건 선행 보강

> **[2026-06-17 11:51 KST] iMac/쌍아 → iMac/막내**
> 인크루트 B2B 연동(PF_PARTNER) 전 필수 선행 보강. 외부 파트너에게 내부 구조가 노출되면 안 된다.

## 배경

6/16 M1/쌍아 세션에서 인크루트 보안 프레임워크 설계 중 현행 노출 표면 4건을 식별. 파트너 연동 전에 반드시 막아야 하는 항목들이다.

## 태스크

### Task 1 — `/health` 엔드포인트 모델명·내부 구조 노출 제거

**대상 파일 3개:**

**idphoto-kr** (`monkos_AI/idphoto-kr/server.js:499~510`):
```js
// 현행: 모델명, 인증 방식, 엔진 상태 전부 노출
imagen: GEMINI_API_KEY ? 'active (API Key)' : 'NO API KEY',
preCheck: 'active (gemini-2.5-flash)',
geminiLive: 'ready (ADC)',
auth: 'Hybrid (ADC + API Key)',
```

**idphoto-jp** (`monkos_AI/idphoto-jp/server.js:546~`): 동일 패턴

**portal** (`monkos_AI/portal/server.js:81~83`):
```js
// 현행: chatbot 모델명 노출
chatbot: 'gemini-2.5-flash'
```

**수정**: `/health`는 `{ status: 'healthy', service: '서비스명', timestamp }` 3필드만 반환. 모델명·인증 방식·엔진 상태 전부 제거.

### Task 2 — `err.message` 직통 반환 제거

**대상**: 3개 서비스 전체의 `res.status(500).json({ error: err.message })` 패턴

- idphoto-kr: 6곳 (server.js:530, 542, 641, 682, 699, 716)
- idphoto-jp: 6곳 (server.js:577, 589, 688, 705, 722, 763)
- portal: 1곳 (server.js:97)

**수정**: 외부 응답에는 일반 에러 메시지만 반환. 상세는 서버 로그에만.

```js
// Before
res.status(500).json({ error: err.message });

// After
log(`[API] 에러: ${err.message}`, 'ERROR');
res.status(500).json({ error: '처리 중 오류가 발생했습니다' });
```

- idphoto-jp는 일본어: `{ error: '処理中にエラーが発生しました' }`
- 에러 코드를 넣고 싶으면 `{ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }` 형태 가능

### Task 3 — `/api/info` styles 키 노출 검토

**idphoto-kr** (`server.js:513~518`):
```js
styles: Object.keys(STYLE_PROMPTS),
```
프롬프트 내용은 아니지만 스타일 키 목록이 노출된다. 파트너가 볼 필요 없는 내부 구조.

**수정**: `styles` 필드 제거. `/api/info`가 외부 필요 없으면 엔드포인트 자체 제거 검토. 내부 디버깅용이면 admin 인증 뒤에 배치.

### Task 4 — portal 관리자 API 프롬프트 반환 확인

**portal 코드**에서 admin API가 프롬프트를 응답에 포함하는지 확인. 6/16 세션에서 식별된 건이다.

- `monkos_AI/portal/` 전체에서 `prompt`를 응답에 포함하는 엔드포인트 검색
- 발견 시 프롬프트 필드 제거 (로그에만 기록)

## ⚠️ 준수 조항

- 배포: `deploy.sh` 경유 (ch5 2조). 3개 서비스 각각 배포 필요
- 기능 변경 아님 — 응답 필드 제거만. 기존 클라이언트 동작에 영향 없는지 확인
  - `/health`는 웹민아 E2E 순찰에서 200 체크만 하므로 필드 축소 무관
  - `err.message` 제거는 프론트엔드 에러 핸들링 확인 필요 (에러 메시지를 사용자에게 직접 보여주는 곳이 있는지)
- 시크릿 생성/추측 금지 (헌법 4조 1항)

## 완료 기준

- [ ] `/health` 3개 서비스 — 모델명·인증 방식 노출 0건
- [ ] `err.message` 직통 반환 — 13곳 전부 일반 메시지로 교체
- [ ] `/api/info` styles 키 — 제거 또는 인증 뒤 배치
- [ ] admin 프롬프트 반환 — 확인 후 제거
- [ ] 3개 서비스 배포 (`deploy.sh` 경유)
- [ ] 배포 후 `/health` 실측 확인
