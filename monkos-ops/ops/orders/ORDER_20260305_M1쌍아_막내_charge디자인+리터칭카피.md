---
type: ORDER
date: 2026-03-05
from: M1/쌍아
to: 막내(any)
scope: charge.html 디자인 갱신 + "생성"→"리터칭" 카피 전수 치환 + "가입"→"첫 로그인" 치환
prerequisite: v3 과금체계 전환 커밋+push 완료 후 진행
---

# 지시서: charge.html 디자인 갱신 + 리터칭 카피 치환

> **[2026-03-05 09:20 KST] M1/쌍아 → 막내**

---

## 배경

- v3 과금체계 전환 완료 (Phase A/B/C). charge.html 기능은 정상
- 작가님+철창이가 charge.html 디자인 시안 확정 (캡쳐 기준)
- 용어 확정: "생성" → "리터칭" (유저 노출 텍스트), "가입" → "첫 로그인"
- 코드 내부(변수명, API type, 로그) `generate`는 유지

---

## Phase A: charge.html 디자인 갱신

### A-0. 유지 사항
- **헤더**: 기존 MONKOS AI 증명사진 헤더 그대로 유지 (step-label = "크레딧 충전")
- **JS 로직**: CHARGE_OPTIONS, KRW_PER_CREDIT, 스테퍼, buyCreditsKR 호출 — 전부 유지
- **Toss 결제 흐름**: 변경 없음

### A-1. "현재 잔액" 카드 제거
- 파일: `idphoto-kr/public/charge.html` L73-79
- 잔액은 헤더 Cr 뱃지에 이미 표시됨 → 본문 잔액 카드 제거

### A-2. 가격 산수 바 추가
- "현재 잔액" 자리에 필 뱃지 스타일 가격 산수 바 삽입
- 내용: `1장 = 리터칭 10c + 다운로드 70c = 80c`
- 디자인: 각 항목을 둥근 필/칩으로 표시 (index.html `.price-chip` 참조)
- 가운데 정렬, 상단 여백 20px

### A-3. 상품 카드 레이아웃 변경
현재 라디오+인라인 텍스트 → **와이드 카드 (좌=크레딧, 우=가격 블록)** 으로 변경.

**카드 구조 (각 상품):**
```
┌─────────────────────────────────────────────┐
│                                             │
│  70c  +10c              ┌────────────────┐  │
│  총 80c                 │  ₩11,600       │  │
│                         │  ₩9,900        │  │
│                         └────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

**좌측 (크레딧 정보):**
- 크레딧 수: `font-size: 1.5rem; font-weight: 800; color: #f8fafc`
- 보너스: `color: #34d399; font-size: 0.85rem; font-weight: 600` (같은 줄, 크레딧 옆)
- "총 Nc": `color: #8892a8; font-size: 0.78rem` (아래 줄)

**우측 (가격 블록):**
- 둥근 사각형 블록 (border-radius: 12px, padding: 12px 16px)
- 일반 상품: `background: linear-gradient(135deg, rgba(167,139,250,0.3), rgba(129,140,248,0.2))`
- BEST 상품 (500c): `background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.15))`
- 취소선 가격: `text-decoration: line-through; color: #666; font-size: 0.78rem`
- 실가격: `color: #f8fafc; font-weight: 700; font-size: 1.1rem`

**섹션 구분:**
- 첫 번째 카드(70c) 위에 "1장 완성" 레이블: `font-size: 0.75rem; color: #a78bfa; font-weight: 600; margin-bottom: 8px`
- 두 번째 카드(100c) 위에 "패키지" 레이블: `font-size: 0.78rem; color: #8892a8; margin: 20px 0 8px`

**뱃지:**
- 70c 카드: 없음 (이미 "1장 완성" 섹션 레이블로 구분)
- 500c 카드: "★ BEST" 뱃지 (position: absolute, top: -8px, right: 12px, 골드 배경)

**선택 인터랙션:**
- 카드 탭 → 해당 카드 테두리 강조 (border-color: #a78bfa / BEST는 #f59e0b)
- 스테퍼 탭 → 카드 선택 해제 (기존 로직 유지)
- 내부적으로 radio input 유지 (hidden, 기능용)

### A-4. 스테퍼 디자인 미세 조정
- 현재 디자인 큰 틀 유지
- "── 또는 소액 충전 ──" 구분선 유지
- 스테퍼 높이/패딩을 카드와 일관성 있게 조정

### A-5. 결제 버튼 + 돌아가기
- "토스페이먼츠로 결제" 버튼 유지 (현재 디자인 그대로)
- "돌아가기" 버튼 유지

### A-6. 푸터 부착
- index.html 푸터 동일 구조 삽입
- 위치: 결제 버튼 + 돌아가기 아래
- HTML:
```html
<footer translate="no" style="text-align:center; padding:40px 0 20px; color:#8892a8; font-size:0.8rem;">
  <p style="margin-bottom:8px;">
    <a href="/privacy.html" style="color:#a78bfa; text-decoration:none;">Privacy Policy</a> &nbsp;|&nbsp;
    <a href="/terms.html" style="color:#a78bfa; text-decoration:none;">Terms of Service</a> &nbsp;|&nbsp;
    <a href="/refund.html" style="color:#a78bfa; text-decoration:none;">Refund Policy</a>
  </p>
  <p>&copy; 2026 <a href="https://monkos.ai" style="color:#a78bfa; text-decoration:none;">MONKOS.AI</a> &mdash; Evolution of Creative Intelligence</p>
</footer>
```

---

## Phase B: "생성" → "리터칭" 카피 치환

> **원칙: 유저에게 보이는 텍스트만 변경. 코드 내부(변수, API type, 로그)는 `generate` 유지.**

### B-1. idphoto-kr/public/charge.html
| 위치 | 현재 | 변경 |
|------|------|------|
| L78 (A-2에서 재작성) | `생성 10c` | `리터칭 10c` |

### B-2. idphoto-kr/public/index.html
| 위치 | 현재 | 변경 |
|------|------|------|
| L703 | `가입 시 10c 무료` | `첫 로그인 10c 무료` |
| L755 | `생성 즉시<br>고화질 저장` | `리터칭 즉시<br>고화질 저장` |
| L765 | `<span class="price-chip">생성 10c</span>` | `<span class="price-chip">리터칭 10c</span>` |
| L792 | `가입 즉시 10c 지급` | `첫 로그인 10c 증정` |
| L793 | `AI 생성 1회 무료 체험` | `리터칭 1회 무료 체험` |

### B-3. idphoto-kr/public/shared.js
| 위치 | 현재 | 변경 |
|------|------|------|
| L106 | `'생성에 크레딧이 필요합니다'` | `'리터칭에 크레딧이 필요합니다'` |
| L109 | `'사진을 생성하려면 10 크레딧이 필요합니다.'` | `'리터칭에 10 크레딧이 필요합니다.'` |

### B-4. idphoto-kr/public/config.js
| 위치 | 현재 | 변경 |
|------|------|------|
| L60 | `step3: 'Step 3: AI 생성'` | `step3: 'Step 3: AI 리터칭'` |
| L65 | `generating: '증명사진 생성 중...'` | `generating: '증명사진 리터칭 중...'` |
| L67 | `genLoading: '생성 중...'` | `genLoading: '리터칭 중...'` |
| L70 | `genFail: '생성 실패'` | `genFail: '리터칭 실패'` |

### B-5. idphoto-kr/public/result.html
| 위치 | 현재 | 변경 |
|------|------|------|
| L194 | `이 사진으로 생성 <span...>(10c)</span>` | `이 사진으로 리터칭 <span...>(10c)</span>` |

### B-6. idphoto-kr/public/result.js
| 위치 | 현재 | 변경 |
|------|------|------|
| L189 | `→ 생성 시작` | `→ 리터칭 시작` |
| L277 | `'생성 실패'` | `'리터칭 실패'` |

### B-7. portal/public/credits.html
| 위치 | 현재 | 변경 |
|------|------|------|
| L175 | `생성 10c + 다운로드 70c = 80c` | `리터칭 10c + 다운로드 70c = 80c` |
| L177 | `신규 가입 시 10c 무료 지급 (AI 생성 1회 체험)` | `첫 로그인 10c 증정 (리터칭 1회 체험)` |

---

## Phase C: 제외 사항 (이번 스코프 아님)

| 항목 | 사유 |
|------|------|
| 히어로 디자인 (index.html) | 다음 단계. 배경+타이포 별도 작업 |
| 헤더 변경 | 기존 MONKOS AI 증명사진 헤더 유지 |
| modules/charge.js (모달) | 기능 정상, 모달 디자인은 별도 |
| privacy.html / refund.html | 법률 문서, 별도 검토 후 진행 |
| terms.html 법률 문구 | "AI 증명사진 생성" 등 법률적 표현은 별도 |
| _legacy_spa/ | 삭제 예정, 터치 안 함 |
| 코드 변수/함수명 | `generate`, `confirmAndGenerate` 등 내부 식별자 유지 |
| 로그 메시지 | 내부 운영용, 유저 미노출 |

---

## 검증 (완료 조건)

1. charge.html 와이드 카드 렌더링 + 선택 → 결제 동작 확인
2. charge.html 푸터 표시 확인
3. 전수 grep 잔존 확인:
   - `생성 10c` → 0건 (charge.html, index.html, credits.html)
   - `가입 시 10c\|가입 즉시` → 0건 (index.html, credits.html)
   - `생성에 크레딧\|생성하려면` → 0건 (shared.js)
   - `AI 생성.*체험` → 0건
4. config.js TX 문자열 4건 변경 확인 (step3, generating, genLoading, genFail)
5. result.html "이 사진으로 리터칭" 버튼 텍스트 확인
6. 랜딩 "패키지 할인 보기 →" → charge.html 정상 진입 확인

---

## 수정 파일 목록 (예상 7건)

| # | 파일 | Phase |
|---|------|-------|
| 1 | `idphoto-kr/public/charge.html` | A (디자인) + B-1 |
| 2 | `idphoto-kr/public/index.html` | B-2 |
| 3 | `idphoto-kr/public/shared.js` | B-3 |
| 4 | `idphoto-kr/public/config.js` | B-4 |
| 5 | `idphoto-kr/public/result.html` | B-5 |
| 6 | `idphoto-kr/public/result.js` | B-6 |
| 7 | `portal/public/credits.html` | B-7 |
