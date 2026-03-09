---
type: REPORT
date: 2026-03-04
from: M1/막내1
to: M1/쌍아
scope: 챗봇 시스템 전체 흐름 정밀 검수 + Gemini 2.0 전수조사
---

# 보고서: 챗봇 시스템 검수 + Gemini 2.0 전수조사

> **[2026-03-04 04:30 KST] M1/막내1 → M1/쌍아**

---

## A. 챗봇 흐름 검수 결과

### A-1. 채널 설정 정합성

| # | 채널 | TTL | history | temp | maxTokens | stateless | 판정 | 비고 |
|---|------|-----|---------|------|-----------|-----------|------|------|
| 1 | web | 30분 | 20 | 0.7 | 300 | ✗ | ✅ 적합 | Firestore 복원 지원 |
| 2 | telegram | 60분 | 20 | 0.5 | 500 | ✗ | ✅ 적합 | CS 특성상 긴 TTL 적절 |
| 3 | prep | 30분 | 20 | 0.6 | 400 | ✗ | ⚠️ 주의 | RAG(CS지식)가 촬영코치에 주입됨 (아래 A-3) |
| 4 | coaching | - | - | 0.3 | 50 | ✓ | ✅ 적합 | "15자 이내 1문장" 용도, 50토큰 충분 |
| 5 | qc | - | - | 0.2 | 300 | ✓ | ✅ 적합 | JSON 응답, responseMimeType 설정됨 |
| 6 | kakao | 30분 | 20 | 0.7 | 300 | ✗ | ⚠️ 주의 | web과 동일 historyMap 공유 (접두어로 구분되나 설계상 분리 권장) |

### A-2. 시스템 프롬프트 정합성 (검수항목 #2)

| # | 프롬프트 | 검수항목 | 결과 | 비고 |
|---|----------|----------|------|------|
| 1 | SYSTEM_PROMPT | 서비스 URL | ✅ | idphoto-jp/kr 모두 정확 |
| 2 | SYSTEM_PROMPT | 크레딧 시스템 | ❌ **불일치** | 아래 상세 |
| 3 | SYSTEM_PROMPT | 결제수단 | ✅ | Toss(한국)/Lemon Squeezy(글로벌) |
| 4 | SYSTEM_PROMPT | 법적 페이지 URL | ✅ | terms/privacy/refund 정확 |
| 5 | SYSTEM_PROMPT | 기술명 비공개 | ✅ | Gemini/Imagen 언급 금지 명시 |
| 6 | CS_SYSTEM_PROMPT | 환불 정책 | ✅ | 7일/미사용 조건 정확 |
| 7 | CS_SYSTEM_PROMPT | 크레딧 가격 | ❌ **동일 불일치** | SYSTEM_PROMPT와 동일 문제 |
| 8 | PREP_SYSTEM_PROMPT | 역할/스타일 | ✅ | 촬영 준비 코치 적합 |
| 9 | COACHING_INSTRUCTIONS | 체크리스트 | ✅ | id_photo(5항목), resume(4항목) |
| 10 | QC instruction | 판정 기준 | ✅ | FAIL 조건 7개, face_box 포함 |

#### ❌ 크레딧 가격 불일치 (심각도: HIGH)

**프롬프트 기재:**
```
100c/₩13,050（10%OFF）
```

**TOSS_AMOUNT_CREDITS 매핑 (config.js:89):**
```js
13050: 90,   // ← 90크레딧
14500: 100,  // ← 100크레딧
```

챗봇이 "₩13,050으로 100크레딧"이라 안내하지만, 실제 결제 시 90크레딧만 지급됨.
다른 티어(10c/300c/500c)는 정확히 일치.

**영향**: CS 민원, 환불 분쟁 가능성. 프롬프트 수정 또는 매핑 수정 필요.

### A-3. RAG 검색 로직 (검수항목 #3)

| 항목 | 현황 | 판정 |
|------|------|------|
| 데이터 소스 | Firestore `cs_knowledge` | ✅ |
| 캐시 TTL | 10분 | ✅ 적절 |
| 스코어링 | keyword(+10) + title_word(+5) + content_word(+2) | ⚠️ |
| 반환 | score>0, 상위 3건 | ✅ |

**소견:**
- BM25가 아닌 단순 키워드 매칭. 현재 cs_knowledge 규모에서는 실용적이나, 문서 증가 시 정밀도 저하 가능.
- **prep 채널에도 CS 지식 RAG가 주입됨** (chat-engine.js:211-218). stateful 경로에서 채널 구분 없이 RAG가 호출되어 촬영 준비 코치에 CS/환불 지식이 혼입될 수 있음. 기능상 치명적이진 않으나 응답 품질에 영향.

### A-4. 텔레그램 CS봇 (검수항목 #4)

| 항목 | 현황 | 판정 |
|------|------|------|
| /start 웰컴 | 3개국어 (KR/JP/EN) | ✅ |
| deprecated bonus_ 딥링크 | 안내 후 거절 | ✅ |
| 일반 텍스트 → Gemini CS | chatWithMonkos('telegram') 경유 | ✅ |
| 오류 시 fallback | `'すみません、少々お待ちください。'` | ⚠️ 일본어만 |
| CS 대화 로깅 | Firestore cs_conversations | ✅ |
| CS 대화 trim | **없음** (messages 무한 append) | ⚠️ |

**이슈:**
1. fallback 메시지가 일본어만 — 한국어/영어 사용자에게 부자연스러움
2. cs_conversations의 messages 배열이 trim 없이 무한 축적 → 장기적으로 Firestore 문서 크기 제한(1MB) 도달 가능

### A-5. 텔레그램 이벤트봇 (검수항목 #5)

| 항목 | 현황 | 판정 |
|------|------|------|
| GATE_ 딥링크 | userId↔telegramId 매핑 → 채널 가입 CTA | ✅ |
| MISSION_ 딥링크 | 미션 대기 모드 → 이미지 수신 | ✅ |
| 동의서 체크 | snsConsentSigned 미서명 시 거절 | ✅ |
| 이미지 수신 | fileId 저장 + users/telegram_links 업데이트 | ✅ |
| 일반 텍스트 | CS봇 안내로 리다이렉트 | ✅ |
| 에러 처리 | 200 OK 반환 (웹훅 규격 준수) | ✅ |

**소견:** 기능적으로 정상. GATE/MISSION 코드 흐름, Firestore 연동 정합성 확인.

### A-6. 팀봇 (검수항목 #6)

| 항목 | 현황 | 판정 |
|------|------|------|
| /report | Firestore team_reports 저장 + 확인 | ✅ |
| /status | portal/idphoto-kr/idphoto-jp 헬스체크 | ✅ |
| /help | 도움말 출력 | ✅ |
| 알림 API | x-team-secret 인증 + TEAM_CHAT_ID 전송 | ✅ |
| 일반 메시지 | 무시 (그룹 대화 비간섭) | ✅ |

**소견:** 정상. 개선 사항 없음.

### A-7. 카카오 챗봇 (검수항목 #7)

| 항목 | 현황 | 판정 |
|------|------|------|
| utterance 추출 | userRequest.utterance | ✅ |
| chatWithMonkos 호출 | 'kakao' 채널, kakao_{userId} | ✅ |
| 응답 포맷 | version 2.0 + simpleText | ✅ |
| 텍스트 제한 | 1000자 trim | ✅ |
| 에러 처리 | 친절한 한국어 에러 메시지 | ✅ |

**소견:** 카카오 스킬 응답 포맷 정합성 확인. 시스템 프롬프트에 한국어 강제(`[중요] 반드시 한국어로만 응답하세요`) 적용됨.

### A-8. 코칭/QC (검수항목 #8)

| 항목 | 현황 | 판정 |
|------|------|------|
| handleWebChat | web 채널 → chatWithMonkos | ✅ |
| handleCoaching | image + buildCoachingPrompt → coaching 채널 | ✅ |
| READY_KEYWORDS 체크 | '좋아요','완벽','촬영하세요' 등 8개 | ✅ |
| handleQC | original+generated → qc 채널 → JSON parse | ✅ |
| QC 파싱 실패 | identity:'ERROR' + raw 텍스트 반환 | ✅ |
| buildCoachingPrompt | 9필드 동적 빌드 (style/purpose/gender/age/clothing/...) | ✅ |
| buildQCInstruction | gender/age 동적, face_box/face_ratio 포함 | ✅ |

**소견:** 정상. 프롬프트 빌더 → 모델 호출 → 응답 파싱 전체 경로 정합.

---

## B. 시스템 프롬프트 현행화 점검 (요약)

| # | 프롬프트 | 이슈 | 심각도 |
|---|----------|------|--------|
| 1 | SYSTEM_PROMPT | 100c/₩13,050 가격 불일치 (실제 90c) | 🔴 HIGH |
| 2 | CS_SYSTEM_PROMPT | 동일 가격 불일치 | 🔴 HIGH |
| 3 | SYSTEM_PROMPT | Telegram CS bot fallback 일본어 단일 | 🟡 LOW |
| 4 | 전체 | 기술명 비공개 규칙 일관 적용됨 | ✅ |
| 5 | 전체 | 서비스 URL 정확 | ✅ |
| 6 | QC | v5 face_box/face_ratio/head_top_margin 반영됨 | ✅ |

---

## C. Gemini 2.0 사용처 전수 목록

### C-1. 프로덕션 코드 (마이그레이션 필수)

| # | 파일:라인 | 모델ID | 용도 | 인증방식 | 전환난이도 | 권장 후속모델 |
|---|-----------|--------|------|----------|-----------|-------------|
| 1 | `functions/api/analyze.js:40` | gemini-2.0-flash | Image Pro 이미지 분석 (Vision) | CF Pages, API Key | DROP-IN | gemini-2.5-flash |
| 2 | `functions/api/translate.js:39` | gemini-2.0-flash | Image Pro 번역 | CF Pages, API Key | DROP-IN | gemini-2.5-flash |
| 3 | `apps/photo-coach/server.js:141` | gemini-2.0-flash-live-preview-04-09 | 실시간 코칭 Live (로컬 dev) | Vertex AI ADC | 테스트필요 | 후속 Live 모델 확인 필요 |
| 4 | `apps/photo-coach/server.js:223` | gemini-2.0-flash | QC 비교 (로컬 dev) | API Key | DROP-IN | gemini-2.5-flash |
| 5 | `monkos_AI/idphoto-jp/server.js:282` | gemini-2.0-flash-live-preview-04-09 | 실시간 코칭 Live (JP prod) | Vertex AI ADC | 테스트필요 | 후속 Live 모델 확인 필요 |
| 6 | `monkos_AI/idphoto-jp/server.js:352` | gemini-2.0-flash (폴백) | QC 폴백 (JP prod) | Vertex AI ADC | DROP-IN | gemini-2.5-flash |
| 7 | `monkos_AI/idphoto-kr/server.js:457` | gemini-2.0-flash-live-preview-04-09 | 실시간 코칭 Live (KR prod) | Vertex AI ADC | 테스트필요 | 후속 Live 모델 확인 필요 |
| 8 | `monkos_AI/idphoto-kr/server.js:557` | gemini-2.0-flash | 사전분석 PreCheck (KR prod) | Vertex AI ADC | DROP-IN | gemini-2.5-flash |
| 9 | `monkos_AI/idphoto-kr/server.js:802` | gemini-2.0-flash | QC 검증 (KR prod) | Vertex AI ADC | DROP-IN | gemini-2.5-flash |
| 10 | `monkos_AI/portal/lib/chat-engine.js:184` | gemini-2.0-flash | 챗봇 stateless (coaching/qc) | Vertex AI ADC | DROP-IN | gemini-2.5-flash |
| 11 | `monkos_AI/portal/lib/chat-engine.js:228` | gemini-2.0-flash | 챗봇 stateful (web/tg/prep/kakao) | Vertex AI ADC | DROP-IN | gemini-2.5-flash |
| 12 | `apps/MonkosChat/functions/index.js:30` | gemini-2.0-flash-001 | MonkosChat (Firebase Functions) | Vertex AI | DROP-IN | gemini-2.5-flash |
| 13 | `apps/monk_imagen4/backend/server.js:346` | gemini-2.0-flash | Image Pro 분석 (Express) | API Key | DROP-IN | gemini-2.5-flash |
| 14 | `apps/monk_imagen4/backend/server.js:432` | gemini-2.0-flash | Image Pro 번역 (Express) | API Key | DROP-IN | gemini-2.5-flash |

### C-2. monk.kr 정적 사이트 (레거시)

| # | 파일:라인 | 모델ID | 용도 | 비고 |
|---|-----------|--------|------|------|
| 15 | `MONK_kr/index.html:402` | gemini-2.0-flash-exp | 메인 페이지 분석 | 클라이언트 사이드, API Key 직접 사용 |
| 16 | `MONK_kr/ai_lab/ai_lab.html:371` | gemini-2.0-flash-exp | AI Lab 분석 | 클라이언트 사이드, API Key 직접 사용 |

### C-3. 데모/아카이브 (참고)

| # | 파일 | 모델ID | 비고 |
|---|------|--------|------|
| 17 | `apps/monk-cam/demo/presentation_server.js:74` | gemini-2.0-flash-live-preview-04-09 | 데모 서버 |
| 18 | `monkos-ops/tech/archive/functions_cf/` | gemini-2.0-flash (다수) | 아카이브 (비활성) |
| 19 | `docs/archives/scripts-legacy/*.py` | gemini-2.0-flash-exp (다수) | 레거시 스크립트 |

### C-4. 이미 전환 완료된 파일

| 파일 | 기존 | 현재 | 비고 |
|------|------|------|------|
| `monkos_AI/idphoto-jp/server.js` (I2I) | - | gemini-3-pro-image-preview | Imagen I2I 생성 |
| `monkos_AI/idphoto-kr/server.js` (I2I) | - | gemini-3-pro-image-preview | Imagen I2I 생성 |
| `monkos_AI/idphoto-jp/server.js` (QC 1차) | - | gemini-3-flash-preview | QC 우선 모델 (2.0 폴백) |
| `monkos_AI/idphoto-jp/server.js` (PreCheck) | - | gemini-3-flash-preview | 사전분석 (QC_MODELS 경유) |
| `MONK_kr/ai_lab/photolab/engine/server.js` | - | gemini-2.5-flash | 코칭/사전분석/QC 전부 |
| `apps/photo-coach/server.js` (Imagen) | - | gemini-3-pro-image-preview | Imagen I2I |

### C-5. 마이그레이션 난이도 분류

#### DROP-IN (11건) — 모델명 교체만으로 전환 가능
- #1, #2, #4, #6, #8, #9, #10, #11, #12, #13, #14
- `gemini-2.0-flash` → `gemini-2.5-flash` 문자열 치환
- REST API URL 사용처: URL 내 모델명도 함께 변경

#### 테스트필요 (3건) — Live API 모델 전환, 호환성 검증 필수
- #3, #5, #7: `gemini-2.0-flash-live-preview-04-09`
- Live API(`bidiGenerateContent`)는 특수 모델만 지원
- 후속 Live 모델 ID 확인 필요 (Google 공식 문서 참조)
- KR/JP 프로덕션 코칭에 직접 영향 — 충분한 테스트 후 전환

#### 레거시 (5건) — 우선순위 낮음
- #15, #16: monk.kr 정적 사이트 (Phase 2에서 정리 예정)
- #17~19: 데모/아카이브 (비활성)

---

## D. 종합 소견

### 발견 이슈 우선순위

| 순위 | 이슈 | 심각도 | 위치 | 조치 |
|------|------|--------|------|------|
| 1 | **크레딧 가격 불일치** (100c/₩13,050 vs 실제 90c) | 🔴 HIGH | prompts.js:34, config.js:89 | 프롬프트 수정 or 매핑 수정 필요 |
| 2 | **Gemini 2.0 중단 대비** (6/1 마감) | 🔴 HIGH | 14개 프로덕션 파일 | DROP-IN 11건 + Live 3건 순차 전환 |
| 3 | CS 대화 trim 없음 | 🟡 MED | chat-engine.js:91-109 | messages.slice(-40) 적용 권장 |
| 4 | prep 채널 RAG 혼입 | 🟡 LOW | chat-engine.js:211 | 채널별 RAG on/off 분기 추가 |
| 5 | TG CS fallback 일본어 단일 | 🟡 LOW | telegram.js:47 | 다국어 fallback 또는 제거 |
| 6 | kakao/web historyMap 공유 | 🟡 LOW | chat-engine.js:163 | 현재 접두어로 안전하나 분리 권장 |

### 챗봇 시스템 전체 평가
- 8개 검수항목 중 **6개 정상**, **2개 이슈 발견** (가격 불일치, RAG 혼입)
- 아키텍처는 CHANNEL_CONFIG 기반 통합 구조로 잘 설계됨
- 모듈화 상태 양호 (chat-engine/prompts/rag/telegram/kakao/coaching 분리)

### Gemini 2.0 전환 전략 제안
1. **즉시 가능 (DROP-IN 11건)**: gemini-2.5-flash 일괄 치환 → 스테이징 테스트 → 프로덕션 배포
2. **Live 모델 3건**: Google 후속 Live 모델 ID 확인 후 별도 테스트 사이클
3. **monk.kr 레거시 2건**: Phase 2 일정에 맞춰 정리
4. **아카이브/데모**: 비활성이므로 급하지 않으나 문서 정리 차원에서 표기 갱신

---

**이상 보고 완료.**
