---
type: order
date: 2026-07-12
device: iMac
agent: 쌍아
recipient: 막내
portfolio: PF_SPECS
status: 대기
---

# 지시서: specs T1 의상 선택 UI (텍스트형 Phase 1)

**[2026-07-12 12:13 KST]** iMac/쌍아 → 막내

---

## 목적

specs 파일럿(monkos.ai/specs/kr-passport 등) T1 유료 플로우에 **의상 선택 UI**를 추가한다.
기존 idphoto-kr `prep.js`의 의상 아코디언 패턴을 portal specs에 이식하되, 서버는 이미 `body.attireDesc`를 받아 `buildT1Prompt(attireDesc)`로 처리하므로 **클라이언트만 구현**한다.

---

## ⚠️ 준수 조항

- 헌법 1조 3항: 정체성 보존 최우선
- ch2: 순수 JS, Tailwind, 한국어 UI
- ch5 2조: 배포는 deploy.sh 경유
- ch7: 범위 밖 작업 금지. 서버 수정 불필요 (attireDesc 수신 이미 구현됨)

---

## 범위

### 구현할 것

1. **의상 선택 컴포넌트** — T1 결제 직전 단계에 삽입
   - 위치: specs v2 결제 플로우 내, 유료 선택 시 생성 전에 표시
   - 노출 조건: `gateMode !== 'free'` (T1 유료 경로일 때만)

2. **선택지 구조** (idphoto-kr 패턴 준용)

   ```
   의상 선택:
   ├─ 그대로 (default) — 현재 의상 유지, 보정만
   ├─ 정장 (suit)
   │   ├─ 수트 컬러: 네이비 / 차콜 / 블랙 / 라이트그레이
   │   ├─ 셔츠 컬러: 화이트 / 연블루 / 연핑크 / 연베이지
   │   └─ 넥타이: 노타이 / 네이비 / 와인 / 블랙 (+ 민무늬/스트라이프)
   ├─ 블라우스 (blouse, 여성) — 화이트 / 크림 / 연블루
   └─ 캐주얼 (casual) — 니트류 컬러 선택
   ```

3. **attireDesc 생성 로직** — 선택값 → 영문 프롬프트 텍스트 조합
   - idphoto-kr `buildPromptV5` §6-3 [OUTFIT] 패턴과 동일한 구문 생성
   - 예시: 정장 차콜 + 셔츠 화이트 + 타이 네이비 스트라이프
     → `"Dress this person in a charcoal formal business suit with a white collared dress shirt and a striped navy tie."`
   - "그대로" 선택 시 `attireDesc = null` (서버 기본값 네이비 수트 적용되지 않도록 별도 처리 필요 — 아래 참조)

4. **"그대로" 처리**
   - 현재 서버: `attireDesc || null` → null이면 기본 네이비 수트 프롬프트 적용
   - "그대로" 선택 시: `attireDesc = "Keep current clothing as-is. Only ensure it looks neat and tidy."` 전송
   - 이렇게 하면 서버 수정 없이 의도 전달됨

5. **API 호출 시 body에 포함**
   - 기존 생성 fetch 호출의 body에 `attireDesc: 조합된텍스트` 추가
   - T0 무료 경로에서는 전송하지 않음 (무시됨, 하지만 깔끔하게 제외)

6. **성별 연동**
   - specs v2 페이지 데이터에 성별 정보가 없으면: "정장" 하나로 통합 (남녀 공용 프롬프트)
   - 성별이 있으면: 남성=정장/셔츠/넥타이, 여성=정장/블라우스 분기

### 구현하지 않을 것

- 서버 코드 수정 (이미 attireDesc 수신 처리 완료)
- 이미지 썸네일/프리뷰 (Phase 2 — 스타일러 PF 트랙)
- 헤어/배경 선택 (별도 지시서)
- Firestore 스키마 (민아 트랙에서 별도 설계 중)

---

## UI 디자인 방향

- **최소 인터랙션**: 카드형 1차 선택(그대로/정장/블라우스/캐주얼) → 선택 시 서브옵션 펼침
- specs v2 기존 디자인 톤 유지 (다크 테마, 라운드 카드, 라벨 최소)
- 모바일 퍼스트: 1열 카드 → 서브옵션 2열 그리드 (컬러칩 방식)
- 비활성 상태 요약: "네이비 정장 · 화이트 셔츠 · 노타이" 한 줄 표시

---

## 참조 파일

| 파일 | 용도 |
|------|------|
| `monkos_AI/idphoto-kr/public/prep.js` | 의상 선택 UI 원본 (renderClothingBody, renderSuitSuboption) |
| `monkos_AI/idphoto-kr/public/config.js` | 옵션 목록 / 컬러 맵 |
| `monkos_AI/idphoto-kr/server.js:274` | buildPromptV5 [OUTFIT] 섹션 — 프롬프트 조합 로직 |
| `monkos_AI/portal/server.js:769` | attireDesc 수신 → buildT1Prompt 호출 |
| `monkos_AI/portal/lib/idphoto-generate.js:136` | buildT1Prompt — [OUTFIT] 삽입 위치 |
| `monkos_AI/portal/public/js/headshot.js` | specs v2 결제 플로우 참조 (삽입 위치 파악용) |

---

## 검증 기준

1. [ ] 의상 "그대로" 선택 → 생성 결과에서 원래 옷 유지 (프롬프트 "Keep current clothing" 확인)
2. [ ] 정장 네이비 + 화이트 셔츠 + 노타이 → 생성 결과 정합
3. [ ] 정장 차콜 + 연블루 셔츠 + 와인 타이 스트라이프 → 조합 정합
4. [ ] 모바일 (375px) 레이아웃 정상, 스크롤 과다 없음
5. [ ] T0 무료 경로에서는 의상 선택 UI 미노출
6. [ ] 서버 로그에 `t1-attire` 트랙 정상 기록

---

## 산출물

- specs v2 의상 선택 UI 컴포넌트 (JS + CSS)
- dev 배포 후 실 생성 E2E 스크린샷 3종 (그대로 / 정장 / 캐주얼)
- COMPLETION 보고서

---

**배포**: dev 검증 후 작가님 확인 → prod deploy.sh
